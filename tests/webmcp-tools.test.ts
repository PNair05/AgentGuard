import { describe, expect, it } from "vitest";
import { DEFAULT_POLICY } from "@/lib/agentguard/default-policy";
import { buildWebMCPTools, type AgentGuardToolRuntime } from "@/lib/webmcp/build-tools";
import type { AppSnapshot } from "@/lib/store/types";

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
});
