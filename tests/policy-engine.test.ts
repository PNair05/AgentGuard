import { describe, expect, it } from "vitest";
import { DEFAULT_POLICY } from "@/lib/agentguard/default-policy";
import { evaluateAction } from "@/lib/agentguard/policy-engine";
import type { GuardAction } from "@/lib/agentguard/types";

const purchase = (amount: number, refundable = true): GuardAction => ({
  type: "ONE_TIME_PURCHASE",
  toolName: "checkout_cart",
  label: "Purchase cart",
  amount,
  currency: "USD",
  refundable
});

const evaluate = (action: GuardAction, sessionSpent = 0) =>
  evaluateAction(action, DEFAULT_POLICY, { sessionSpent });

describe("evaluateAction", () => {
  it("allows a $20 refundable purchase", () => {
    expect(evaluate(purchase(20)).decision).toBe("ALLOW");
  });

  it("requires approval for a $279 refundable purchase", () => {
    const result = evaluate(purchase(279));
    expect(result.decision).toBe("REQUIRE_APPROVAL");
    expect(result.reasonCodes).toContain("AUTO_LIMIT_EXCEEDED");
  });

  it("denies a $729 purchase above the hard limit", () => {
    const result = evaluate(purchase(729));
    expect(result.decision).toBe("DENY");
    expect(result.reasonCodes).toEqual(["HARD_SPEND_LIMIT"]);
  });

  it("requires approval for a low-price non-refundable purchase", () => {
    const result = evaluate(purchase(20, false));
    expect(result.decision).toBe("REQUIRE_APPROVAL");
    expect(result.reasonCodes).toContain("NON_REFUNDABLE");
  });

  it("requires approval for a recurring subscription", () => {
    expect(
      evaluate({
        type: "RECURRING_PURCHASE",
        toolName: "subscribe_plus",
        label: "Join Plus",
        amount: 9.99,
        recurring: true
      }).decision
    ).toBe("REQUIRE_APPROVAL");
  });

  it("requires approval to share email", () => {
    expect(
      evaluate({
        type: "DATA_DISCLOSURE",
        toolName: "share_profile",
        label: "Share email",
        dataFields: ["email"]
      }).decision
    ).toBe("REQUIRE_APPROVAL");
  });

  it("denies location sharing", () => {
    const result = evaluate({
      type: "DATA_DISCLOSURE",
      toolName: "share_profile",
      label: "Share location",
      dataFields: ["location"]
    });
    expect(result.decision).toBe("DENY");
    expect(result.reasonCodes).toEqual(["DATA_FIELD_BLOCKED"]);
  });

  it("requires approval for account deletion", () => {
    expect(
      evaluate({
        type: "DESTRUCTIVE_ACTION",
        toolName: "delete_account",
        label: "Delete account",
        destructive: true
      }).decision
    ).toBe("REQUIRE_APPROVAL");
  });

  it("enforces the session spending cap", () => {
    const result = evaluate(purchase(20), 340);
    expect(result.decision).toBe("REQUIRE_APPROVAL");
    expect(result.reasonCodes).toContain("SESSION_SPEND_LIMIT");
  });

  it("allows reads and low-risk mutations", () => {
    expect(evaluate({ type: "READ", toolName: "search_products", label: "Search" }).decision).toBe("ALLOW");
    expect(evaluate({ type: "LOW_RISK_MUTATION", toolName: "add_to_cart", label: "Add" }).decision).toBe("ALLOW");
  });
});
