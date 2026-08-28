import { ActivityIcon, LockIcon, TrashIcon } from "@/components/icons";
import { useAgentGuardStore } from "@/lib/store/app-context";
import { GuardDecisionBadge } from "./GuardDecisionBadge";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function ActivityTimeline() {
  const { audits, clearAudits } = useAgentGuardStore();
  return (
    <main className="subpage page-shell">
      <header className="subpage-header activity-header">
        <div><span className="hero-kicker dark"><ActivityIcon /> Explainable by default</span><h1>Every decision,<br/><em>accounted for.</em></h1><p>AgentGuard records the policy decision, reason, human response, and final outcome for each tool call.</p></div>
        {audits.length > 0 ? <button className="button secondary" onClick={clearAudits}><TrashIcon /> Clear activity</button> : null}
      </header>

      <section className="activity-card">
        <div className="activity-card-top"><div><span className="status-dot ready"/><strong>Live guard activity</strong></div><span>{audits.length} event{audits.length === 1 ? "" : "s"}</span></div>
        {audits.length === 0 ? (
          <div className="activity-empty"><span><ActivityIcon /></span><h2>No agent actions yet</h2><p>Add a product, then ask a WebMCP-capable browser agent to inspect policy or checkout. Decisions will appear here immediately.</p><div className="empty-example"><code>“What can you buy without asking me?”</code></div></div>
        ) : (
          <ol className="activity-list">
            {audits.map((event) => (
              <li key={event.id} className={`activity-event ${event.decision.toLowerCase()}`}>
                <div className="event-rail"><span>{event.decision === "ALLOW" ? "✓" : event.decision === "DENY" ? "×" : "?"}</span></div>
                <div className="event-main">
                  <div className="event-heading"><div><code>{event.toolName}</code><time>{new Date(event.timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" })}</time></div><GuardDecisionBadge event={event}/></div>
                  <h3>{event.label}</h3>
                  {event.amount !== undefined ? <strong className="event-amount">{currency.format(event.amount)}</strong> : null}
                  <div className="event-reasons">{event.reasons.map((reason) => <p key={reason}>{reason}</p>)}</div>
                  <div className="event-codes">{event.reasonCodes.map((code) => <span key={code}>{code}</span>)}</div>
                  <div className="event-outcome"><span>Result</span><strong>{event.result}</strong>{event.humanDecision ? <><i/><span>Human</span><strong>{event.humanDecision}</strong></> : null}</div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
      <div className="audit-footnote"><LockIcon /><p>Audit history is stored locally for this demo and limited to the 80 most recent events. No credentials or real personal data are recorded.</p></div>
    </main>
  );
}
