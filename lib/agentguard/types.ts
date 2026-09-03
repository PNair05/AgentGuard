export type GuardActionType =
  | "READ"
  | "REVERSIBLE_WRITE"
  | "COMMUNICATION"
  | "PURCHASE"
  | "SUBSCRIPTION"
  | "DATA_DISCLOSURE"
  | "DESTRUCTIVE";

export type Decision =
  | "ALLOW"
  | "REQUIRE_REMOTE_APPROVAL"
  | "REQUIRE_LOCAL_APPROVAL"
  | "DENY";

export type DataRule = "ALLOW" | "REQUIRE_APPROVAL" | "DENY";
export type ApprovalChannelName = "browser" | "sms";

export interface GuardAction {
  type: GuardActionType;
  label: string;
  toolName: string;
  amount?: number;
  currency?: "USD";
  recurring?: boolean;
  reversible?: boolean;
  refundable?: boolean;
  changesExternalState?: boolean;
  sensitiveFields?: string[];
  destructive?: boolean;
  resourceId?: string;
  arguments?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  trustWarnings?: string[];
}

export interface AgentPolicy {
  autonomousPurchaseLimit: number;
  hardPurchaseLimit: number;
  sessionSpendLimit: number;
  requireApprovalForRecurring: boolean;
  requireApprovalForNonRefundable: boolean;
  requireApprovalForDestructive: boolean;
  remoteApprovalChannel: ApprovalChannelName;
  dataRules: Record<string, DataRule>;
}

export interface GuardContext {
  userId: string;
  sessionSpent: number;
}

export interface GuardDecision {
  decision: Decision;
  reasonCodes: string[];
  reasons: string[];
  action: GuardAction;
  approvalChannel?: ApprovalChannelName;
}

export type HumanDecision = "APPROVED" | "DENIED";
export type AuditResult =
  | "PENDING"
  | "EXECUTED"
  | "BLOCKED"
  | "CANCELLED"
  | "EXPIRED"
  | "FAILED";
export type ExecutionStatus = "NOT_STARTED" | "SUCCESS" | "FAILED";
export type VerificationStatus = "NOT_RUN" | "SUCCESS" | "FAILED";
export type ApprovalResolution = "approved" | "denied" | "cancelled" | "expired";
export type ApprovalDeliveryStatus = "preparing" | "sent" | "preview" | "failed";

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
  approvalChannel?: ApprovalChannelName;
  result: AuditResult;
  executionStatus: ExecutionStatus;
  verificationStatus: VerificationStatus;
  verificationMessage?: string;
  fingerprint?: string;
  amount?: number;
}

export interface PendingApproval {
  id: string;
  action: GuardAction;
  decision: GuardDecision;
  approvalChannel: ApprovalChannelName;
  fingerprint: string;
  createdAt: number;
  expiresAt: number;
  deliveryStatus: ApprovalDeliveryStatus;
  approvalUrl?: string;
  deliveryMessage?: string;
  resolve: (decision: ApprovalResolution) => void;
}

export interface GuardedBlockedResult {
  status:
    | "blocked"
    | "cancelled"
    | "expired"
    | "invalid_state"
    | "verification_failed"
    | "failed";
  decision: Exclude<Decision, "ALLOW">;
  reasonCodes: string[];
  message: string;
  recoverable: boolean;
  suggestion?: string;
}

export interface VerificationResult {
  success: boolean;
  message: string;
}
