import type { GuardAction } from "./types";

const stableValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, stableValue(child)])
    );
  }
  return value;
};

export const normalizedAction = (userId: string, action: GuardAction) =>
  JSON.stringify(
    stableValue({
      userId,
      toolName: action.toolName,
      actionType: action.type,
      amount: action.amount,
      currency: action.currency,
      recurring: action.recurring,
      refundable: action.refundable,
      reversible: action.reversible,
      changesExternalState: action.changesExternalState,
      sensitiveFields: action.sensitiveFields ? [...action.sensitiveFields].sort() : undefined,
      resourceId: action.resourceId,
      arguments: action.arguments,
      metadata: action.metadata
    })
  );

export async function createActionFingerprint(userId: string, action: GuardAction) {
  const bytes = new TextEncoder().encode(normalizedAction(userId, action));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
