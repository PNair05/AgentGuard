"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode
} from "react";
import { ApprovalBroker } from "@/lib/agentguard/approval-broker";
import { DEFAULT_POLICY } from "@/lib/agentguard/default-policy";
import type {
  AgentPolicy,
  ApprovalResolution,
  AuditEvent,
  GuardDecision,
  PendingApproval
} from "@/lib/agentguard/types";
import { PRODUCT_BY_ID } from "./catalog";
import { getCartDetails } from "./selectors";
import type { AppSnapshot, Order } from "./types";

const POLICY_KEY = "agentguard.policy.v1";
const AUDIT_KEY = "agentguard.audit.v1";

const INITIAL_APP_STATE: AppSnapshot = {
  cart: [],
  orders: [],
  subscriptionActive: false,
  sessionSpent: 0,
  accountDeleted: false
};

interface AgentGuardContextValue {
  policy: AgentPolicy;
  snapshot: AppSnapshot;
  audits: AuditEvent[];
  pendingApproval: PendingApproval | null;
  getPolicy: () => AgentPolicy;
  getSnapshot: () => AppSnapshot;
  getAudits: () => AuditEvent[];
  updatePolicy: (patch: Partial<AgentPolicy>) => void;
  updateDataRule: (field: string, value: AgentPolicy["dataRules"][string]) => void;
  resetPolicy: () => void;
  addToCart: (productId: string, quantity?: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  createOrder: () => Order;
  activateSubscription: () => void;
  cancelOrder: (orderId: string) => Order;
  markAccountDeleted: () => void;
  requestApproval: (decision: GuardDecision, fingerprint: string, signal?: AbortSignal) => Promise<ApprovalResolution>;
  respondToApproval: (id: string, approved: boolean) => void;
  appendAudit: (event: AuditEvent) => void;
  updateAudit: (id: string, patch: Partial<AuditEvent>) => void;
  clearAudits: () => void;
}

const AgentGuardContext = createContext<AgentGuardContextValue | null>(null);

function isDecision(value: unknown): value is AgentPolicy["dataRules"][string] {
  return value === "ALLOW" || value === "REQUIRE_APPROVAL" || value === "DENY";
}

function isApprovalChannel(value: unknown): value is AgentPolicy["remoteApprovalChannel"] {
  return value === "browser" || value === "sms";
}

function loadPolicy(): AgentPolicy {
  try {
    const parsed = JSON.parse(localStorage.getItem(POLICY_KEY) ?? "null") as Partial<AgentPolicy> | null;
    if (!parsed) return DEFAULT_POLICY;
    const dataRules = { ...DEFAULT_POLICY.dataRules };
    Object.entries(parsed.dataRules ?? {}).forEach(([field, value]) => {
      if (isDecision(value)) dataRules[field] = value;
    });
    return {
      autonomousPurchaseLimit:
        typeof parsed.autonomousPurchaseLimit === "number"
          ? parsed.autonomousPurchaseLimit
          : DEFAULT_POLICY.autonomousPurchaseLimit,
      hardPurchaseLimit:
        typeof parsed.hardPurchaseLimit === "number"
          ? parsed.hardPurchaseLimit
          : DEFAULT_POLICY.hardPurchaseLimit,
      sessionSpendLimit:
        typeof parsed.sessionSpendLimit === "number"
          ? parsed.sessionSpendLimit
          : DEFAULT_POLICY.sessionSpendLimit,
      requireApprovalForRecurring:
        typeof parsed.requireApprovalForRecurring === "boolean"
          ? parsed.requireApprovalForRecurring
          : DEFAULT_POLICY.requireApprovalForRecurring,
      requireApprovalForNonRefundable:
        typeof parsed.requireApprovalForNonRefundable === "boolean"
          ? parsed.requireApprovalForNonRefundable
          : DEFAULT_POLICY.requireApprovalForNonRefundable,
      requireApprovalForDestructive:
        typeof parsed.requireApprovalForDestructive === "boolean"
          ? parsed.requireApprovalForDestructive
          : DEFAULT_POLICY.requireApprovalForDestructive,
      remoteApprovalChannel: isApprovalChannel(parsed.remoteApprovalChannel)
        ? parsed.remoteApprovalChannel
        : DEFAULT_POLICY.remoteApprovalChannel,
      dataRules
    };
  } catch {
    return DEFAULT_POLICY;
  }
}

function loadAudits(): AuditEvent[] {
  try {
    const value = JSON.parse(localStorage.getItem(AUDIT_KEY) ?? "[]");
    return Array.isArray(value)
      ? (value as Partial<AuditEvent>[]).slice(0, 80).map((event) => ({
          ...event,
          executionStatus: event.executionStatus ?? (event.result === "EXECUTED" ? "SUCCESS" : "NOT_STARTED"),
          verificationStatus: event.verificationStatus ?? "NOT_RUN"
        } as AuditEvent))
      : [];
  } catch {
    return [];
  }
}

const getNoApproval = () => null;

export function AgentGuardProvider({ children }: { children: ReactNode }) {
  const [policy, setPolicy] = useState<AgentPolicy>(DEFAULT_POLICY);
  const [snapshot, setSnapshot] = useState<AppSnapshot>(INITIAL_APP_STATE);
  const [audits, setAudits] = useState<AuditEvent[]>([]);
  const policyRef = useRef(policy);
  const snapshotRef = useRef(snapshot);
  const auditsRef = useRef(audits);
  const brokerRef = useRef<ApprovalBroker | null>(null);
  if (!brokerRef.current) brokerRef.current = new ApprovalBroker();
  const broker = brokerRef.current;
  const pendingApproval = useSyncExternalStore(
    broker.subscribe,
    broker.getSnapshot,
    getNoApproval
  );

  useEffect(() => {
    const storedPolicy = loadPolicy();
    const storedAudits = loadAudits();
    policyRef.current = storedPolicy;
    auditsRef.current = storedAudits;
    setPolicy(storedPolicy);
    setAudits(storedAudits);
    return () => broker.cancelAll();
  }, [broker]);

  const mutateSnapshot = useCallback((recipe: (current: AppSnapshot) => AppSnapshot) => {
    const next = recipe(snapshotRef.current);
    snapshotRef.current = next;
    setSnapshot(next);
    return next;
  }, []);

  const persistPolicy = useCallback((next: AgentPolicy) => {
    policyRef.current = next;
    setPolicy(next);
    localStorage.setItem(POLICY_KEY, JSON.stringify(next));
  }, []);

  const updatePolicy = useCallback(
    (patch: Partial<AgentPolicy>) => {
      const next = { ...policyRef.current, ...patch };
      next.autonomousPurchaseLimit = Math.max(0, Math.min(next.autonomousPurchaseLimit, next.hardPurchaseLimit));
      next.hardPurchaseLimit = Math.max(next.autonomousPurchaseLimit, next.hardPurchaseLimit);
      next.sessionSpendLimit = Math.max(0, next.sessionSpendLimit);
      persistPolicy(next);
    },
    [persistPolicy]
  );

  const updateDataRule = useCallback(
    (field: string, value: AgentPolicy["dataRules"][string]) => {
      persistPolicy({
        ...policyRef.current,
        dataRules: { ...policyRef.current.dataRules, [field]: value }
      });
    },
    [persistPolicy]
  );

  const resetPolicy = useCallback(() => persistPolicy(DEFAULT_POLICY), [persistPolicy]);

  const writeAudits = useCallback((next: AuditEvent[]) => {
    const trimmed = next.slice(0, 80);
    auditsRef.current = trimmed;
    setAudits(trimmed);
    localStorage.setItem(AUDIT_KEY, JSON.stringify(trimmed));
  }, []);

  const appendAudit = useCallback(
    (event: AuditEvent) => writeAudits([event, ...auditsRef.current]),
    [writeAudits]
  );

  const updateAudit = useCallback(
    (id: string, patch: Partial<AuditEvent>) => {
      writeAudits(auditsRef.current.map((event) => (event.id === id ? { ...event, ...patch } : event)));
    },
    [writeAudits]
  );

  const clearAudits = useCallback(() => writeAudits([]), [writeAudits]);

  const addToCart = useCallback(
    (productId: string, quantity = 1) => {
      if (!PRODUCT_BY_ID.has(productId)) throw new Error("Product not found.");
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 5) {
        throw new Error("Quantity must be between 1 and 5.");
      }
      mutateSnapshot((current) => {
        const existing = current.cart.find((item) => item.productId === productId);
        const cart = existing
          ? current.cart.map((item) =>
              item.productId === productId
                ? { ...item, quantity: Math.min(5, item.quantity + quantity) }
                : item
            )
          : [...current.cart, { productId, quantity }];
        return { ...current, cart };
      });
    },
    [mutateSnapshot]
  );

  const updateCartQuantity = useCallback(
    (productId: string, quantity: number) => {
      mutateSnapshot((current) => ({
        ...current,
        cart:
          quantity <= 0
            ? current.cart.filter((item) => item.productId !== productId)
            : current.cart.map((item) =>
                item.productId === productId
                  ? { ...item, quantity: Math.min(5, Math.max(1, quantity)) }
                  : item
              )
      }));
    },
    [mutateSnapshot]
  );

  const removeFromCart = useCallback(
    (productId: string) =>
      mutateSnapshot((current) => ({
        ...current,
        cart: current.cart.filter((item) => item.productId !== productId)
      })),
    [mutateSnapshot]
  );

  const clearCart = useCallback(
    () => mutateSnapshot((current) => ({ ...current, cart: [] })),
    [mutateSnapshot]
  );

  const createOrder = useCallback(() => {
    const current = snapshotRef.current;
    const details = getCartDetails(current.cart);
    if (details.items.length === 0) throw new Error("The cart is empty. Add an item before checkout.");
    const order: Order = {
      id: `GM-${Math.floor(100000 + Math.random() * 900000)}`,
      items: current.cart.map((item) => ({ ...item })),
      total: details.total,
      createdAt: Date.now(),
      status: "confirmed"
    };
    mutateSnapshot((state) => ({
      ...state,
      cart: [],
      orders: [order, ...state.orders],
      sessionSpent: state.sessionSpent + order.total
    }));
    return order;
  }, [mutateSnapshot]);

  const activateSubscription = useCallback(() => {
    if (snapshotRef.current.subscriptionActive) throw new Error("GuardMart Plus is already active.");
    mutateSnapshot((current) => ({ ...current, subscriptionActive: true }));
  }, [mutateSnapshot]);

  const cancelOrder = useCallback(
    (orderId: string) => {
      const order = snapshotRef.current.orders.find(
        (candidate) => candidate.id === orderId && candidate.status === "confirmed"
      );
      if (!order) throw new Error("This order is not cancellable.");
      mutateSnapshot((current) => ({
        ...current,
        orders: current.orders.map((candidate) =>
          candidate.id === orderId ? { ...candidate, status: "cancelled" as const } : candidate
        ),
        sessionSpent: Math.max(0, current.sessionSpent - order.total)
      }));
      return { ...order, status: "cancelled" as const };
    },
    [mutateSnapshot]
  );

  const markAccountDeleted = useCallback(
    () => mutateSnapshot((current) => ({ ...current, accountDeleted: true })),
    [mutateSnapshot]
  );

  const value = useMemo<AgentGuardContextValue>(
    () => ({
      policy,
      snapshot,
      audits,
      pendingApproval,
      getPolicy: () => policyRef.current,
      getSnapshot: () => snapshotRef.current,
      getAudits: () => auditsRef.current,
      updatePolicy,
      updateDataRule,
      resetPolicy,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      clearCart,
      createOrder,
      activateSubscription,
      cancelOrder,
      markAccountDeleted,
      requestApproval: broker.request.bind(broker),
      respondToApproval: (id, approved) => {
        broker.respond(id, approved);
      },
      appendAudit,
      updateAudit,
      clearAudits
    }),
    [
      activateSubscription,
      addToCart,
      appendAudit,
      audits,
      broker,
      cancelOrder,
      clearAudits,
      clearCart,
      createOrder,
      markAccountDeleted,
      pendingApproval,
      policy,
      removeFromCart,
      resetPolicy,
      snapshot,
      updateAudit,
      updateCartQuantity,
      updateDataRule,
      updatePolicy
    ]
  );

  return <AgentGuardContext.Provider value={value}>{children}</AgentGuardContext.Provider>;
}

export function useAgentGuardStore() {
  const context = useContext(AgentGuardContext);
  if (!context) throw new Error("useAgentGuardStore must be used inside AgentGuardProvider.");
  return context;
}
