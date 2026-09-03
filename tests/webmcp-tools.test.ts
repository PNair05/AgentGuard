import { describe, expect, it } from "vitest";
import { DEFAULT_POLICY } from "@/lib/agentguard/default-policy";
import { buildWebMCPTools, type AgentGuardToolRuntime } from "@/lib/webmcp/build-tools";
import type { AppSnapshot } from "@/lib/store/types";
import { PRODUCTS } from "@/lib/store/catalog";

const runtime = (snapshot: AppSnapshot): AgentGuardToolRuntime => ({
  getPolicy: () => DEFAULT_POLICY,
  getSnapshot: () => snapshot,
  getAudits: () => [],
  requestApproval: async () => "denied",
  appendAudit: () => undefined,
  updateAudit: () => undefined,
  addToCart: () => undefined,
  createOrder: () => { throw new Error("not used"); },
  activateSubscription: () => undefined,
  cancelOrder: () => { throw new Error("not used"); },
  markAccountDeleted: () => undefined
});

describe("dynamic WebMCP tool surface", () => {
  it("registers checkout only when the cart is non-empty", () => {
    const empty: AppSnapshot = { cart: [], orders: [], subscriptionActive: false, sessionSpent: 0, accountDeleted: false };
    const filled = { ...empty, cart: [{ productId: "headphones-x1", quantity: 1 }] };
    const baseNames = buildWebMCPTools(runtime(empty), { hasCart: false, subscriptionActive: false, accountDeleted: false, cancellableOrderIds: [] }).map(({ name }) => name);
    const cartNames = buildWebMCPTools(runtime(filled), { hasCart: true, subscriptionActive: false, accountDeleted: false, cancellableOrderIds: [] }).map(({ name }) => name);
    expect(baseNames).not.toContain("checkout_cart");
    expect(cartNames).toContain("view_cart");
    expect(cartNames).toContain("checkout_cart");
  });

  it("removes subscribe_plus once membership is active", () => {
    const snapshot: AppSnapshot = { cart: [], orders: [], subscriptionActive: true, sessionSpent: 0, accountDeleted: false };
    const names = buildWebMCPTools(runtime(snapshot), { hasCart: false, subscriptionActive: true, accountDeleted: false, cancellableOrderIds: [] }).map(({ name }) => name);
    expect(names).not.toContain("subscribe_plus");
  });

  it("exposes the three-tier NovaSound policy demo", () => {
    expect(PRODUCTS.filter((product) => product.name.startsWith("NovaSound")).map(({ name, price }) => ({ name, price })))
      .toEqual([
        { name: "NovaSound X1", price: 279 },
        { name: "NovaSound Mini", price: 39 },
        { name: "NovaSound Ultra", price: 729 }
      ]);
  });

  it("blocks unnecessary income supplied to the recommendation tool", async () => {
    const snapshot: AppSnapshot = { cart: [], orders: [], subscriptionActive: false, sessionSpent: 0, accountDeleted: false };
    const recommendationTool = buildWebMCPTools(runtime(snapshot), {
      hasCart: false,
      subscriptionActive: false,
      accountDeleted: false,
      cancellableOrderIds: []
    }).find((tool) => tool.name === "find_recommendations");

    const result = await recommendationTool?.execute(
      { category: "audio", budget: 300, income: 120000 },
      {}
    );
    expect(result).toMatchObject({
      status: "blocked",
      decision: "DENY",
      reasonCodes: ["TRUST_WARNING", "DATA_FIELD_BLOCKED"]
    });
  });
});
