export type GuardActionType =
  | "READ"
  | "LOW_RISK_MUTATION"
  | "ONE_TIME_PURCHASE"
  | "RECURRING_PURCHASE"
  | "DATA_DISCLOSURE"
  | "DESTRUCTIVE_ACTION";

export type Decision = "ALLOW" | "REQUIRE_APPROVAL" | "DENY";
export type DataRule = Decision;

export interface GuardAction {
  type: GuardActionType;
  label: string;
  toolName: string;
  amount?: number;
  currency?: "USD";
  recurring?: boolean;
  refundable?: boolean;
  dataFields?: string[];
  destructive?: boolean;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}

export interface AgentPolicy {
  autonomousPurchaseLimit: number;
  hardPurchaseLimit: number;
  sessionSpendLimit: number;
  requireApprovalForRecurring: boolean;
  requireApprovalForNonRefundable: boolean;
  requireApprovalForDestructive: boolean;
  dataRules: Record<string, DataRule>;
}

export interface GuardContext {
  sessionSpent: number;
}

export interface GuardDecision {
  decision: Decision;
  reasonCodes: string[];
  reasons: string[];
  action: GuardAction;
}

export type HumanDecision = "APPROVED" | "DENIED";
export type AuditResult = "PENDING" | "EXECUTED" | "BLOCKED" | "CANCELLED" | "FAILED";

export interface AuditEvent {
  id: string;
  timestamp: number;
  toolName: string;
  actionType: GuardActionType;
  label: string;
  decision: Decision;
  reasonCodes: string[];
  reasons: string[];
  humanDecision?: HumanDecision;
  result: AuditResult;
  amount?: number;
}

export interface PendingApproval {
  id: string;
  action: GuardAction;
  decision: GuardDecision;
  createdAt: number;
  resolve: (decision: "approved" | "denied" | "cancelled") => void;
}

export interface GuardedBlockedResult {
  status: "blocked" | "cancelled" | "invalid_state" | "failed";
  decision: "DENY" | "REQUIRE_APPROVAL";
  reasonCodes: string[];
  message: string;
  recoverable: boolean;
  suggestion?: string;
}
