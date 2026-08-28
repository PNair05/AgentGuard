import type { AgentPolicy } from "./types";

export const DEFAULT_POLICY: AgentPolicy = {
  autonomousPurchaseLimit: 50,
  hardPurchaseLimit: 500,
  sessionSpendLimit: 350,
  requireApprovalForRecurring: true,
  requireApprovalForNonRefundable: true,
  requireApprovalForDestructive: true,
  dataRules: {
    email: "REQUIRE_APPROVAL",
    location: "DENY",
    phone: "DENY"
  }
};
