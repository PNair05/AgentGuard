import { createActionFingerprint } from "./fingerprint";
import { evaluateAction } from "./policy-engine";
import { REASON_CODES } from "./reason-codes";
import type {
  AgentPolicy,
  ApprovalResolution,
  AuditEvent,
  GuardAction,
  GuardContext,
  GuardDecision,
  GuardedBlockedResult,
  VerificationResult
} from "./types";

export interface GuardedToolDependencies {
  getPolicy: () => AgentPolicy;
  getContext: () => GuardContext;
  requestApproval: (
    decision: GuardDecision,
    fingerprint: string,
    signal?: AbortSignal
  ) => Promise<ApprovalResolution>;
  appendAudit: (event: AuditEvent) => void;
  updateAudit: (id: string, patch: Partial<AuditEvent>) => void;
}

export interface GuardedToolConfig<TInput, TResult> {
  toolName: string;
  validate?: (input: unknown) => TInput;
  classify: (input: TInput) => GuardAction;
  getCurrentAction?: (input: TInput) => GuardAction;
  execute: (input: TInput, signal?: AbortSignal) => Promise<TResult> | TResult;
  verify?: (
    input: TInput,
    result: TResult
  ) => Promise<VerificationResult | boolean> | VerificationResult | boolean;
}

export class ToolInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ToolInputError";
  }
}

const deniedSuggestion = (decision: GuardDecision) => {
  if (decision.reasonCodes.includes(REASON_CODES.HARD_SPEND_LIMIT)) {
    return "Choose an alternative costing no more than the user's hard purchase limit.";
  }
  if (decision.reasonCodes.includes(REASON_CODES.DATA_FIELD_BLOCKED)) {
    return "Remove blocked profile fields and retry with allowed fields only.";
  }
  return "Continue without this action or choose a lower-impact alternative.";
};

const blocked = (
  decision: GuardDecision,
  options?: {
    status?: GuardedBlockedResult["status"];
    codes?: string[];
    message?: string;
    suggestion?: string;
  }
): GuardedBlockedResult => ({
  status: options?.status ?? "blocked",
  decision: decision.decision === "ALLOW" ? "DENY" : decision.decision,
  reasonCodes: options?.codes ?? decision.reasonCodes,
  message: options?.message ?? decision.reasons.join(" "),
  recoverable: true,
  suggestion: options?.suggestion ?? deniedSuggestion(decision)
});

const makeAudit = (decision: GuardDecision, fingerprint: string): AuditEvent => ({
  id: crypto.randomUUID(),
  timestamp: Date.now(),
  toolName: decision.action.toolName,
  actionType: decision.action.type,
  label: decision.action.label,
  decision: decision.decision,
  reasonCodes: decision.reasonCodes,
  reasons: decision.reasons,
  approvalChannel: decision.approvalChannel,
  result: "PENDING",
  executionStatus: "NOT_STARTED",
  verificationStatus: "NOT_RUN",
  fingerprint,
  amount: decision.action.amount
});

export function guardTool<TInput, TResult>(
  config: GuardedToolConfig<TInput, TResult>,
  dependencies: GuardedToolDependencies
) {
  return async (rawInput: unknown, signal?: AbortSignal): Promise<TResult | GuardedBlockedResult> => {
    let input: TInput;
    try {
      input = config.validate ? config.validate(rawInput) : (rawInput as TInput);
    } catch (error) {
      return {
        status: "invalid_state",
        decision: "DENY",
        reasonCodes: [REASON_CODES.INVALID_STATE],
        message: error instanceof Error ? error.message : "Tool input is invalid.",
        recoverable: true,
        suggestion: "Correct the tool arguments and try again."
      };
    }

    let action: GuardAction;
    try {
      action = config.classify(input);
    } catch (error) {
      return {
        status: "invalid_state",
        decision: "DENY",
        reasonCodes: [REASON_CODES.INVALID_STATE],
        message: error instanceof Error ? error.message : "The action is not valid in the current state.",
        recoverable: true,
        suggestion: "Inspect the current application state before trying again."
      };
    }

    const context = dependencies.getContext();
    const guardDecision = evaluateAction(action, dependencies.getPolicy(), context);
    const fingerprint = await createActionFingerprint(context.userId, action);
    const audit = makeAudit(guardDecision, fingerprint);
    dependencies.appendAudit(audit);

    if (guardDecision.decision === "DENY") {
      dependencies.updateAudit(audit.id, { result: "BLOCKED" });
      return blocked(guardDecision);
    }

    if (signal?.aborted) {
      dependencies.updateAudit(audit.id, {
        result: "CANCELLED",
        reasonCodes: [...audit.reasonCodes, REASON_CODES.EXECUTION_CANCELLED]
      });
      return blocked(guardDecision, {
        status: "cancelled",
        codes: [REASON_CODES.EXECUTION_CANCELLED],
        message: "Tool execution was cancelled before the action ran.",
        suggestion: "Retry the action if it is still needed."
      });
    }

    if (guardDecision.decision.includes("REQUIRE_")) {
      const approval = await dependencies.requestApproval(guardDecision, fingerprint, signal);

      if (approval === "expired") {
        dependencies.updateAudit(audit.id, {
          result: "EXPIRED",
          reasonCodes: [...audit.reasonCodes, REASON_CODES.APPROVAL_TIMEOUT]
        });
        return blocked(guardDecision, {
          status: "expired",
          codes: [...guardDecision.reasonCodes, REASON_CODES.APPROVAL_TIMEOUT],
          message: "Human approval was not received before the request expired.",
          suggestion: "Retry the action to create a fresh approval request."
        });
      }

      if (approval === "cancelled" || signal?.aborted) {
        dependencies.updateAudit(audit.id, {
          result: "CANCELLED",
          reasonCodes: [...audit.reasonCodes, REASON_CODES.EXECUTION_CANCELLED]
        });
        return blocked(guardDecision, {
          status: "cancelled",
          codes: [REASON_CODES.EXECUTION_CANCELLED],
          message: "Approval was cancelled. No action was performed.",
          suggestion: "Retry the action if it is still needed."
        });
      }

      if (approval === "denied") {
        dependencies.updateAudit(audit.id, {
          result: "BLOCKED",
          humanDecision: "DENIED",
          reasonCodes: [...audit.reasonCodes, REASON_CODES.USER_DENIED]
        });
        return blocked(guardDecision, {
          codes: [...guardDecision.reasonCodes, REASON_CODES.USER_DENIED],
          message: "The user denied this specific action. No action was performed."
        });
      }

      dependencies.updateAudit(audit.id, { humanDecision: "APPROVED" });

      if (config.getCurrentAction) {
        let currentAction: GuardAction;
        try {
          currentAction = config.getCurrentAction(input);
        } catch {
          dependencies.updateAudit(audit.id, {
            result: "BLOCKED",
            reasonCodes: [...audit.reasonCodes, REASON_CODES.ACTION_CHANGED]
          });
          return blocked(guardDecision, {
            status: "invalid_state",
            codes: [REASON_CODES.ACTION_CHANGED],
            message: "The action changed while approval was pending. The one-time approval was invalidated.",
            suggestion: "Inspect the new state and request the action again."
          });
        }

        const currentFingerprint = await createActionFingerprint(context.userId, currentAction);
        if (currentFingerprint !== fingerprint) {
          dependencies.updateAudit(audit.id, {
            result: "BLOCKED",
            reasonCodes: [...audit.reasonCodes, REASON_CODES.ACTION_CHANGED]
          });
          return blocked(guardDecision, {
            status: "invalid_state",
            codes: [REASON_CODES.ACTION_CHANGED],
            message: "The action changed while approval was pending. The one-time approval was invalidated.",
            suggestion: "Inspect the new state and request the action again."
          });
        }
      }
    }

    if (signal?.aborted) {
      dependencies.updateAudit(audit.id, { result: "CANCELLED" });
      return blocked(guardDecision, {
        status: "cancelled",
        codes: [REASON_CODES.EXECUTION_CANCELLED],
        message: "Tool execution was cancelled. No action was performed."
      });
    }

    try {
      const result = await config.execute(input, signal);
      dependencies.updateAudit(audit.id, { executionStatus: "SUCCESS" });

      if (config.verify) {
        const verification = await config.verify(input, result);
        const normalized = typeof verification === "boolean"
          ? { success: verification, message: verification ? "Postcondition verified." : "Postcondition verification failed." }
          : verification;

        if (!normalized.success) {
          dependencies.updateAudit(audit.id, {
            result: "FAILED",
            verificationStatus: "FAILED",
            verificationMessage: normalized.message,
            reasonCodes: [...audit.reasonCodes, REASON_CODES.VERIFICATION_FAILED]
          });
          return blocked(guardDecision, {
            status: "verification_failed",
            codes: [REASON_CODES.VERIFICATION_FAILED],
            message: normalized.message,
            suggestion: "Inspect application state before retrying; the side effect may have occurred."
          });
        }

        dependencies.updateAudit(audit.id, {
          result: "EXECUTED",
          verificationStatus: "SUCCESS",
          verificationMessage: normalized.message,
          reasonCodes: [...audit.reasonCodes, REASON_CODES.VERIFICATION_SUCCESS]
        });
        return result;
      }

      dependencies.updateAudit(audit.id, { result: "EXECUTED" });
      return result;
    } catch (error) {
      const cancelled = signal?.aborted;
      dependencies.updateAudit(audit.id, {
        result: cancelled ? "CANCELLED" : "FAILED",
        executionStatus: cancelled ? "NOT_STARTED" : "FAILED"
      });
      return blocked(guardDecision, {
        status: cancelled ? "cancelled" : "failed",
        codes: [cancelled ? REASON_CODES.EXECUTION_CANCELLED : REASON_CODES.INVALID_STATE],
        message: cancelled
          ? "Tool execution was cancelled."
          : error instanceof Error
            ? error.message
            : "The action failed before completion.",
        suggestion: "Inspect the current application state before trying again."
      });
    }
  };
}

export const guardedWebMCPTool = guardTool;
