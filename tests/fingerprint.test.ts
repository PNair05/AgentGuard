import { describe, expect, it } from "vitest";
import { createActionFingerprint } from "@/lib/agentguard/fingerprint";
import type { GuardAction } from "@/lib/agentguard/types";

const action: GuardAction = {
  type: "PURCHASE",
  toolName: "checkout_cart",
  label: "Purchase NovaSound X1",
  amount: 279,
  currency: "USD",
  resourceId: "cart:novasound-x1:1",
  arguments: { quantity: 1, productId: "headphones-x1" }
};

describe("action fingerprints", () => {
  it("are stable across object key order", async () => {
    const reordered: GuardAction = {
      ...action,
      arguments: { productId: "headphones-x1", quantity: 1 }
    };
    expect(await createActionFingerprint("user-1", action)).toBe(
      await createActionFingerprint("user-1", reordered)
    );
  });

  it("change when an approved action changes", async () => {
    expect(await createActionFingerprint("user-1", action)).not.toBe(
      await createActionFingerprint("user-1", { ...action, amount: 729 })
    );
  });
});
