import { REASON_CODES } from "./reason-codes";
import type { AgentPolicy, GuardAction, GuardContext, GuardDecision } from "./types";

const decision = (
  action: GuardAction,
  value: GuardDecision["decision"],
  reasonCodes: string[],
  reasons: string[]
): GuardDecision => ({ action, decision: value, reasonCodes, reasons });

const dollars = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

export function evaluateAction(
  action: GuardAction,
  policy: AgentPolicy,
  context: GuardContext
): GuardDecision {
  if (action.type === "READ") {
    return decision(action, "ALLOW", [REASON_CODES.READ_ONLY], ["Read-only actions are allowed."]);
  }

  if (action.type === "LOW_RISK_MUTATION") {
    return decision(
      action,
      "ALLOW",
      [REASON_CODES.LOW_RISK],
      ["This is a reversible, low-risk change."]
    );
  }

  if (action.type === "ONE_TIME_PURCHASE") {
    const amount = action.amount;
    if (typeof amount !== "number" || !Number.isFinite(amount) || amount < 0) {
      return decision(
        action,
        "DENY",
        [REASON_CODES.INVALID_STATE],
        ["The application could not determine a valid purchase amount."]
      );
    }

    if (amount > policy.hardPurchaseLimit) {
      return decision(
        action,
        "DENY",
        [REASON_CODES.HARD_SPEND_LIMIT],
        [
          `${dollars(amount)} exceeds your ${dollars(policy.hardPurchaseLimit)} hard purchase limit.`
        ]
      );
    }

    const reasonCodes: string[] = [];
    const reasons: string[] = [];

    if (context.sessionSpent + amount > policy.sessionSpendLimit) {
      reasonCodes.push(REASON_CODES.SESSION_SPEND_LIMIT);
      reasons.push(
        `This would take session spending above your ${dollars(policy.sessionSpendLimit)} cap.`
      );
    }

    if (action.refundable === false && policy.requireApprovalForNonRefundable) {
      reasonCodes.push(REASON_CODES.NON_REFUNDABLE);
      reasons.push("This purchase is non-refundable.");
    }

    if (amount > policy.autonomousPurchaseLimit) {
      reasonCodes.push(REASON_CODES.AUTO_LIMIT_EXCEEDED);
      reasons.push(
        `${dollars(amount)} exceeds your ${dollars(policy.autonomousPurchaseLimit)} autonomous purchase limit.`
      );
    }

    if (reasonCodes.length > 0) {
      return decision(action, "REQUIRE_APPROVAL", reasonCodes, reasons);
    }

    return decision(
      action,
      "ALLOW",
      [REASON_CODES.WITHIN_AUTO_LIMIT],
      [`${dollars(amount)} is within your autonomous purchase limit.`]
    );
  }

  if (action.type === "RECURRING_PURCHASE") {
    if (policy.requireApprovalForRecurring) {
      return decision(
        action,
        "REQUIRE_APPROVAL",
        [REASON_CODES.RECURRING_CHARGE],
        ["Your policy requires approval for every recurring charge."]
      );
    }

    return decision(
      action,
      "ALLOW",
      [REASON_CODES.WITHIN_AUTO_LIMIT],
      ["Your policy allows recurring charges."]
    );
  }

  if (action.type === "DATA_DISCLOSURE") {
    const fields = action.dataFields ?? [];
    if (fields.length === 0) {
      return decision(
        action,
        "DENY",
        [REASON_CODES.INVALID_STATE],
        ["No profile fields were requested."]
      );
    }

    const blockedFields = fields.filter((field) => policy.dataRules[field] === "DENY");
    if (blockedFields.length > 0) {
      return decision(
        action,
        "DENY",
        blockedFields.map(() => REASON_CODES.DATA_FIELD_BLOCKED),
        blockedFields.map((field) => `${field} sharing is blocked by your policy.`)
      );
    }

    const approvalFields = fields.filter(
      (field) => policy.dataRules[field] === "REQUIRE_APPROVAL" || !policy.dataRules[field]
    );
    if (approvalFields.length > 0) {
      return decision(
        action,
        "REQUIRE_APPROVAL",
        approvalFields.map(() => REASON_CODES.DATA_FIELD_REQUIRES_APPROVAL),
        approvalFields.map((field) => `${field} sharing requires your approval.`)
      );
    }

    return decision(
      action,
      "ALLOW",
      [REASON_CODES.DATA_FIELD_ALLOWED],
      ["The requested profile fields are allowed by your policy."]
    );
  }

  if (policy.requireApprovalForDestructive) {
    return decision(
      action,
      "REQUIRE_APPROVAL",
      [REASON_CODES.DESTRUCTIVE_ACTION],
      ["Your policy requires approval for destructive account actions."]
    );
  }

  return decision(
    action,
    "ALLOW",
    [REASON_CODES.LOW_RISK],
    ["Your policy allows this destructive action."]
  );
}
