import type { AuditEvent } from "@/lib/agentguard/types";

export function GuardDecisionBadge({ event }: { event: AuditEvent }) {
  const tone = event.result === "CANCELLED" || event.result === "EXPIRED"
    ? "cancelled"
    : event.result === "FAILED"
      ? "failed"
      : event.decision.includes("REQUIRE_")
        ? "require_approval"
        : event.decision.toLowerCase();
  const label =
    event.result === "CANCELLED"
      ? "Cancelled"
      : event.result === "EXPIRED"
        ? "Approval expired"
      : event.result === "FAILED"
        ? "Failed"
        : event.decision === "ALLOW"
          ? "Auto-allowed"
          : event.decision === "DENY"
            ? "Policy blocked"
            : event.result === "PENDING"
              ? event.decision === "REQUIRE_REMOTE_APPROVAL" ? "Awaiting remote approval" : "Awaiting local approval"
              : event.humanDecision === "APPROVED"
                ? "Human approved"
                : "Human denied";
  return <span className={`decision-badge ${tone}`}>{label}</span>;
}
