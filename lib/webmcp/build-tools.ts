import { guardedWebMCPTool, ToolInputError } from "@/lib/agentguard/guarded-tool";
import type {
  AgentPolicy,
  AuditEvent,
  GuardAction,
  GuardDecision
} from "@/lib/agentguard/types";
import { PRODUCT_BY_ID, PRODUCTS, searchProducts } from "@/lib/store/catalog";
import { cartFingerprint, getCartDetails } from "@/lib/store/selectors";
import type { AppSnapshot, Order } from "@/lib/store/types";
import {
  ADD_TO_CART_SCHEMA,
  cancelOrderSchema,
  EMPTY_SCHEMA,
  GET_PRODUCT_SCHEMA,
  GUARD_ACTIVITY_SCHEMA,
  POLICY_SUMMARY_SCHEMA,
  SEARCH_PRODUCTS_SCHEMA,
  SHARE_PROFILE_SCHEMA
} from "./tool-schemas";
import type { WebMCPToolDefinition } from "./types";

export interface AgentGuardToolRuntime {
  getPolicy: () => AgentPolicy;
  getSnapshot: () => AppSnapshot;
  getAudits: () => AuditEvent[];
  requestApproval: (
    decision: GuardDecision,
    signal?: AbortSignal
  ) => Promise<"approved" | "denied" | "cancelled">;
  appendAudit: (event: AuditEvent) => void;
  updateAudit: (id: string, patch: Partial<AuditEvent>) => void;
  addToCart: (productId: string, quantity?: number) => void;
  createOrder: () => Order;
  activateSubscription: () => void;
  cancelOrder: (orderId: string) => Order;
  markAccountDeleted: () => void;
}

export interface ToolCapabilities {
  hasCart: boolean;
  subscriptionActive: boolean;
  accountDeleted: boolean;
  cancellableOrderIds: string[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const objectInput = (value: unknown) => {
  if (value === undefined || value === null) return {};
  if (!isRecord(value)) throw new ToolInputError("Tool arguments must be a JSON object.");
  return value;
};

const stringField = (input: Record<string, unknown>, key: string, allowed?: string[]) => {
  const value = input[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new ToolInputError(`${key} must be a non-empty string.`);
  }
  if (allowed && !allowed.includes(value)) {
    throw new ToolInputError(`${key} is not one of the supported values.`);
  }
  return value;
};

const guarded = <TInput, TResult>(
  runtime: AgentGuardToolRuntime,
  config: Parameters<typeof guardedWebMCPTool<TInput, TResult>>[0]
) =>
  guardedWebMCPTool<TInput, TResult>(config, {
    getPolicy: runtime.getPolicy,
    getContext: () => ({ sessionSpent: runtime.getSnapshot().sessionSpent }),
    requestApproval: runtime.requestApproval,
    appendAudit: runtime.appendAudit,
    updateAudit: runtime.updateAudit
  });

const noInput = (input: unknown) => objectInput(input);

const checkoutAction = (state: AppSnapshot): GuardAction => {
  const cart = getCartDetails(state.cart);
  if (cart.items.length === 0) throw new ToolInputError("The cart is empty. Add an item before checkout.");
  const itemLabel =
    cart.items.length === 1
      ? cart.items[0].product.name
      : `${cart.count} GuardMart items`;
  return {
    type: "ONE_TIME_PURCHASE",
    toolName: "checkout_cart",
    label: `Purchase ${itemLabel}`,
    amount: cart.total,
    currency: "USD",
    refundable: cart.refundable,
    resourceId: cartFingerprint(state.cart),
    metadata: {
      merchant: "GuardMart",
      itemCount: cart.count,
      refundPolicy: cart.refundable ? "30-day returns" : "Contains a non-refundable item"
    }
  };
};

const recurringAction = (): GuardAction => ({
  type: "RECURRING_PURCHASE",
  toolName: "subscribe_plus",
  label: "Join GuardMart Plus",
  amount: 9.99,
  currency: "USD",
  recurring: true,
  refundable: false,
  resourceId: "guardmart-plus-monthly",
  metadata: { merchant: "GuardMart", cadence: "monthly", cancellation: "Cancel anytime" }
});

const shareAction = (partnerId: string, fields: string[]): GuardAction => ({
  type: "DATA_DISCLOSURE",
  toolName: "share_profile",
  label: `Share ${fields.join(" and ")} with ${partnerId.replace("-", " ")}`,
  dataFields: [...fields].sort(),
  resourceId: partnerId,
  metadata: { partner: partnerId }
});

const destructiveAction = (toolName: string, label: string, resourceId: string): GuardAction => ({
  type: "DESTRUCTIVE_ACTION",
  toolName,
  label,
  destructive: true,
  resourceId
});

export function buildWebMCPTools(
  runtime: AgentGuardToolRuntime,
  capabilities: ToolCapabilities
): WebMCPToolDefinition[] {
  const tools: WebMCPToolDefinition[] = [];

  const getPolicySummary = guarded<Record<string, unknown>, unknown>(runtime, {
    toolName: "get_policy_summary",
    validate: noInput,
    classify: () => ({
      type: "READ",
      toolName: "get_policy_summary",
      label: "Inspect agent guardrails"
    }),
    execute: () => {
      const policy = runtime.getPolicy();
      return {
        status: "ok",
        autonomousPurchaseLimit: policy.autonomousPurchaseLimit,
        hardPurchaseLimit: policy.hardPurchaseLimit,
        sessionSpendLimit: policy.sessionSpendLimit,
        recurringPurchases: policy.requireApprovalForRecurring ? "approval_required" : "allowed",
        nonRefundablePurchases: policy.requireApprovalForNonRefundable
          ? "approval_required"
          : "allowed",
        dataSharing: { ...policy.dataRules },
        destructiveActions: policy.requireApprovalForDestructive ? "approval_required" : "allowed",
        note: "These boundaries are human-managed and cannot be changed through WebMCP."
      };
    }
  });
  tools.push({
    name: "get_policy_summary",
    title: "Get policy summary",
    description: "Read the user's current AgentGuard boundaries. This tool cannot modify policy.",
    inputSchema: POLICY_SUMMARY_SCHEMA,
    annotations: { readOnlyHint: true, untrustedContentHint: false },
    execute: (input, { signal }) => getPolicySummary(input, signal)
  });

  const search = guarded<{ query: string; maxPrice?: number }, unknown>(runtime, {
    toolName: "search_products",
    validate: (raw) => {
      const input = objectInput(raw);
      const query = stringField(input, "query");
      const maxPrice = input.maxPrice;
      if (
        maxPrice !== undefined &&
        (typeof maxPrice !== "number" || !Number.isFinite(maxPrice) || maxPrice < 0 || maxPrice > 5000)
      ) {
        throw new ToolInputError("maxPrice must be a number from 0 to 5000.");
      }
      return { query, maxPrice: maxPrice as number | undefined };
    },
    classify: ({ query }) => ({
      type: "READ",
      toolName: "search_products",
      label: `Search GuardMart for “${query}”`
    }),
    execute: ({ query, maxPrice }) => ({
      status: "ok",
      products: searchProducts(query, maxPrice)
        .slice(0, 6)
        .map(({ id, name, price, rating, refundable }) => ({
          productId: id,
          name,
          price,
          currency: "USD",
          rating,
          refundable
        }))
    })
  });
  tools.push({
    name: "search_products",
    title: "Search products",
    description: "Find GuardMart products by need or keywords, with an optional maximum USD price.",
    inputSchema: SEARCH_PRODUCTS_SCHEMA,
    annotations: { readOnlyHint: true, untrustedContentHint: false },
    execute: (input, { signal }) => search(input, signal)
  });

  const getProduct = guarded<{ productId: string }, unknown>(runtime, {
    toolName: "get_product",
    validate: (raw) => {
      const input = objectInput(raw);
      return { productId: stringField(input, "productId", PRODUCTS.map(({ id }) => id)) };
    },
    classify: ({ productId }) => ({
      type: "READ",
      toolName: "get_product",
      label: `Inspect ${PRODUCT_BY_ID.get(productId)?.name ?? "product"}`,
      resourceId: productId
    }),
    execute: ({ productId }) => {
      const product = PRODUCT_BY_ID.get(productId);
      if (!product) throw new ToolInputError("Product not found.");
      return {
        status: "ok",
        product: {
          productId: product.id,
          name: product.name,
          description: product.description,
          category: product.category,
          price: product.price,
          currency: "USD",
          rating: product.rating,
          refundable: product.refundable,
          review: product.review,
          reviewTrust: "user_generated_untrusted"
        }
      };
    }
  });
  tools.push({
    name: "get_product",
    title: "Get product details",
    description: "Read concise details and one user-generated review for a known GuardMart product.",
    inputSchema: GET_PRODUCT_SCHEMA,
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    execute: (input, { signal }) => getProduct(input, signal)
  });

  const addToCart = guarded<{ productId: string; quantity: number }, unknown>(runtime, {
    toolName: "add_to_cart",
    validate: (raw) => {
      const input = objectInput(raw);
      const productId = stringField(input, "productId", PRODUCTS.map(({ id }) => id));
      const quantity = input.quantity ?? 1;
      if (!Number.isInteger(quantity) || (quantity as number) < 1 || (quantity as number) > 5) {
        throw new ToolInputError("quantity must be an integer from 1 to 5.");
      }
      return { productId, quantity: quantity as number };
    },
    classify: ({ productId, quantity }) => ({
      type: "LOW_RISK_MUTATION",
      toolName: "add_to_cart",
      label: `Add ${quantity} × ${PRODUCT_BY_ID.get(productId)?.name ?? "product"} to cart`,
      resourceId: productId
    }),
    execute: ({ productId, quantity }) => {
      runtime.addToCart(productId, quantity);
      const cart = getCartDetails(runtime.getSnapshot().cart);
      return {
        status: "completed",
        message: `${PRODUCT_BY_ID.get(productId)?.name} added to cart.`,
        cartItemCount: cart.count,
        cartTotal: cart.total,
        currency: "USD",
        next: "Use view_cart to review the application-calculated total before checkout."
      };
    }
  });
  tools.push({
    name: "add_to_cart",
    title: "Add to cart",
    description: "Add a known GuardMart product to the cart. Price is always derived from catalog state.",
    inputSchema: ADD_TO_CART_SCHEMA,
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute: (input, { signal }) => addToCart(input, signal)
  });

  const shareProfile = guarded<{ partnerId: string; fields: string[] }, unknown>(runtime, {
    toolName: "share_profile",
    validate: (raw) => {
      const input = objectInput(raw);
      const partnerId = stringField(input, "partnerId", ["travel-partner", "rewards-partner"]);
      if (!Array.isArray(input.fields) || input.fields.length === 0) {
        throw new ToolInputError("fields must contain at least one supported profile field.");
      }
      const fields = [...new Set(input.fields)];
      if (fields.some((field) => typeof field !== "string" || !["email", "location", "phone"].includes(field))) {
        throw new ToolInputError("fields may contain only email, location, or phone.");
      }
      return { partnerId, fields: fields as string[] };
    },
    classify: ({ partnerId, fields }) => shareAction(partnerId, fields),
    getCurrentAction: ({ partnerId, fields }) => shareAction(partnerId, fields),
    execute: ({ partnerId, fields }) => ({
      status: "completed",
      partnerId,
      sharedFields: fields,
      message: `Shared ${fields.join(", ")} from the protected app profile.`,
      valuesOmittedFromToolOutput: true
    })
  });
  tools.push({
    name: "share_profile",
    title: "Share profile fields",
    description: "Share selected profile fields with an approved fictional partner. Values come from app state.",
    inputSchema: SHARE_PROFILE_SCHEMA,
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute: (input, { signal }) => shareProfile(input, signal)
  });

  if (!capabilities.accountDeleted) {
    const deleteAccount = guarded<Record<string, unknown>, unknown>(runtime, {
      toolName: "delete_account",
      validate: noInput,
      classify: () => destructiveAction("delete_account", "Delete the GuardMart account", "demo-account"),
      getCurrentAction: () => {
        if (runtime.getSnapshot().accountDeleted) throw new ToolInputError("The account is already deleted.");
        return destructiveAction("delete_account", "Delete the GuardMart account", "demo-account");
      },
      execute: () => {
        runtime.markAccountDeleted();
        return {
          status: "completed",
          simulated: true,
          message: "The fictional GuardMart account was deleted."
        };
      }
    });
    tools.push({
      name: "delete_account",
      title: "Delete account",
      description: "Permanently delete the fictional GuardMart account. Always simulated and human-gated.",
      inputSchema: EMPTY_SCHEMA,
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: (input, { signal }) => deleteAccount(input, signal)
    });
  }

  const getActivity = guarded<{ limit: number }, unknown>(runtime, {
    toolName: "get_guard_activity",
    validate: (raw) => {
      const input = objectInput(raw);
      const limit = input.limit ?? 5;
      if (!Number.isInteger(limit) || (limit as number) < 1 || (limit as number) > 10) {
        throw new ToolInputError("limit must be an integer from 1 to 10.");
      }
      return { limit: limit as number };
    },
    classify: () => ({
      type: "READ",
      toolName: "get_guard_activity",
      label: "Inspect recent AgentGuard activity"
    }),
    execute: ({ limit }) => ({
      status: "ok",
      events: runtime
        .getAudits()
        .filter((event) => event.toolName !== "get_guard_activity" && event.result !== "PENDING")
        .slice(0, limit)
        .map(({ timestamp, toolName, decision, reasonCodes, humanDecision, result, amount }) => ({
          timestamp,
          toolName,
          decision,
          reasonCodes,
          humanDecision,
          result,
          amount
        }))
    })
  });
  tools.push({
    name: "get_guard_activity",
    title: "Get guard activity",
    description: "Read up to ten recent AgentGuard decisions to understand prior outcomes.",
    inputSchema: GUARD_ACTIVITY_SCHEMA,
    annotations: { readOnlyHint: true, untrustedContentHint: false },
    execute: (input, { signal }) => getActivity(input, signal)
  });

  if (capabilities.hasCart) {
    const viewCart = guarded<Record<string, unknown>, unknown>(runtime, {
      toolName: "view_cart",
      validate: noInput,
      classify: () => ({ type: "READ", toolName: "view_cart", label: "View the GuardMart cart" }),
      execute: () => {
        const cart = getCartDetails(runtime.getSnapshot().cart);
        if (cart.items.length === 0) {
          return {
            status: "invalid_state",
            message: "The cart is empty. Add an item before checkout."
          };
        }
        return {
          status: "ok",
          items: cart.items.map(({ product, quantity, lineTotal }) => ({
            productId: product.id,
            name: product.name,
            quantity,
            unitPrice: product.price,
            lineTotal,
            refundable: product.refundable
          })),
          total: cart.total,
          currency: "USD",
          allItemsRefundable: cart.refundable
        };
      }
    });
    tools.push({
      name: "view_cart",
      title: "View cart",
      description: "Read current cart lines and the total calculated by GuardMart application state.",
      inputSchema: EMPTY_SCHEMA,
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: (input, { signal }) => viewCart(input, signal)
    });

    const checkout = guarded<Record<string, unknown>, unknown>(runtime, {
      toolName: "checkout_cart",
      validate: noInput,
      classify: () => checkoutAction(runtime.getSnapshot()),
      getCurrentAction: () => checkoutAction(runtime.getSnapshot()),
      execute: () => {
        const order = runtime.createOrder();
        return {
          status: "completed",
          orderId: order.id,
          total: order.total,
          currency: "USD",
          message: "Simulated order created and cart cleared."
        };
      }
    });
    tools.push({
      name: "checkout_cart",
      title: "Checkout cart",
      description: "Purchase the current cart. GuardMart calculates the total; AgentGuard may allow, ask, or block.",
      inputSchema: EMPTY_SCHEMA,
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: (input, { signal }) => checkout(input, signal)
    });
  }

  if (!capabilities.subscriptionActive) {
    const subscribe = guarded<Record<string, unknown>, unknown>(runtime, {
      toolName: "subscribe_plus",
      validate: noInput,
      classify: recurringAction,
      getCurrentAction: () => {
        if (runtime.getSnapshot().subscriptionActive) {
          throw new ToolInputError("GuardMart Plus is already active.");
        }
        return recurringAction();
      },
      execute: () => {
        runtime.activateSubscription();
        return {
          status: "completed",
          membership: "GuardMart Plus",
          amount: 9.99,
          currency: "USD",
          cadence: "monthly",
          message: "Membership activated."
        };
      }
    });
    tools.push({
      name: "subscribe_plus",
      title: "Join GuardMart Plus",
      description: "Start the fictional $9.99 monthly GuardMart Plus membership.",
      inputSchema: EMPTY_SCHEMA,
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: (input, { signal }) => subscribe(input, signal)
    });
  }

  if (capabilities.cancellableOrderIds.length > 0) {
    const cancelOrder = guarded<{ orderId: string }, unknown>(runtime, {
      toolName: "cancel_order",
      validate: (raw) => {
        const input = objectInput(raw);
        return { orderId: stringField(input, "orderId", capabilities.cancellableOrderIds) };
      },
      classify: ({ orderId }) => destructiveAction("cancel_order", `Cancel order ${orderId}`, orderId),
      getCurrentAction: ({ orderId }) => {
        const current = runtime
          .getSnapshot()
          .orders.find((order) => order.id === orderId && order.status === "confirmed");
        if (!current) throw new ToolInputError("The order is no longer cancellable.");
        return destructiveAction("cancel_order", `Cancel order ${orderId}`, orderId);
      },
      execute: ({ orderId }) => {
        const order = runtime.cancelOrder(orderId);
        return {
          status: "completed",
          orderId: order.id,
          refundedAmount: order.total,
          currency: "USD",
          message: "Simulated order cancelled."
        };
      }
    });
    tools.push({
      name: "cancel_order",
      title: "Cancel order",
      description: "Cancel a currently cancellable GuardMart order. This destructive action is human-gated.",
      inputSchema: cancelOrderSchema(capabilities.cancellableOrderIds),
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: (input, { signal }) => cancelOrder(input, signal)
    });
  }

  return tools;
}
