import type { AuditEvent } from "@/lib/agentguard/types";

export function GuardDecisionBadge({ event }: { event: AuditEvent }) {
  const tone = event.result === "CANCELLED" ? "cancelled" : event.result === "FAILED" ? "failed" : event.decision.toLowerCase();
  const label =
    event.result === "CANCELLED"
      ? "Cancelled"
      : event.result === "FAILED"
        ? "Failed"
        : event.decision === "ALLOW"
          ? "Auto-allowed"
          : event.decision === "DENY"
            ? "Policy blocked"
            : event.result === "PENDING"
              ? "Awaiting you"
              : event.humanDecision === "APPROVED"
                ? "Human approved"
                : "Human denied";
  return <span className={`decision-badge ${tone}`}>{label}</span>;
}
