import { LockIcon, RotateIcon, ShieldIcon } from "@/components/icons";
import { useAgentGuardStore } from "@/lib/store/app-context";
import type { DataRule } from "@/lib/agentguard/types";

function MoneyControl({
  label,
  description,
  value,
  max,
  onChange
}: {
  label: string;
  description: string;
  value: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="money-control">
      <div className="control-label"><div><strong>{label}</strong><span>{description}</span></div><label><span>$</span><input type="number" min="0" max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} aria-label={label}/></label></div>
      <input className="range" type="range" min="0" max={max} step="10" value={value} onChange={(event) => onChange(Number(event.target.value))} aria-label={`${label} slider`}/>
      <div className="range-labels"><span>$0</span><span>${max.toLocaleString()}</span></div>
    </div>
  );
}

function AskToggle({
  title,
  description,
  checked,
  onChange
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="ask-row"><div><strong>{title}</strong><span>{description}</span></div><button role="switch" aria-checked={checked} className={checked ? "toggle on" : "toggle"} onClick={() => onChange(!checked)}><span /></button></div>
  );
}

const RULE_OPTIONS: { value: DataRule; label: string }[] = [
  { value: "ALLOW", label: "Allow" },
  { value: "REQUIRE_APPROVAL", label: "Ask me" },
  { value: "DENY", label: "Never" }
];

export function GuardrailsPanel() {
  const { policy, updatePolicy, updateDataRule, resetPolicy, snapshot } = useAgentGuardStore();
  return (
    <main className="subpage page-shell">
      <header className="subpage-header">
        <div><span className="hero-kicker dark"><ShieldIcon /> Human-owned policy</span><h1>Delegate the routine.<br/><em>Keep the consequential.</em></h1><p>These controls are evaluated in application code before any guarded WebMCP side effect can run.</p></div>
        <button className="button secondary" onClick={resetPolicy}><RotateIcon /> Reset demo policy</button>
      </header>

      <div className="guardrail-layout">
        <section className="settings-stack">
          <article className="settings-card">
            <div className="settings-card-heading"><span className="settings-number">01</span><div><h2>Money boundaries</h2><p>Define what the agent may purchase and when you take over.</p></div></div>
            <MoneyControl label="Autonomous spending" description="One-time purchases at or below this amount run automatically." value={policy.autonomousPurchaseLimit} max={500} onChange={(value) => updatePolicy({ autonomousPurchaseLimit: value })}/>
            <MoneyControl label="Hard purchase limit" description="Anything above this amount is blocked—approval cannot override it." value={policy.hardPurchaseLimit} max={1000} onChange={(value) => updatePolicy({ hardPurchaseLimit: value })}/>
            <MoneyControl label="Session spending cap" description="Ask before cumulative spend crosses this amount in one session." value={policy.sessionSpendLimit} max={1000} onChange={(value) => updatePolicy({ sessionSpendLimit: value })}/>
            <div className="current-session"><span>Spent this session</span><strong>${snapshot.sessionSpent.toFixed(2)}</strong></div>
          </article>

          <article className="settings-card">
            <div className="settings-card-heading"><span className="settings-number">02</span><div><h2>Consequence rules</h2><p>Make durable or irreversible actions pause for you.</p></div></div>
            <div className="ask-list">
              <AskToggle title="Recurring charges" description="Subscriptions and renewals always need a human decision." checked={policy.requireApprovalForRecurring} onChange={(value) => updatePolicy({ requireApprovalForRecurring: value })}/>
              <AskToggle title="Non-refundable purchases" description="Ask even when the price is below the autonomous limit." checked={policy.requireApprovalForNonRefundable} onChange={(value) => updatePolicy({ requireApprovalForNonRefundable: value })}/>
              <AskToggle title="Destructive actions" description="Account deletion and order cancellation require approval." checked={policy.requireApprovalForDestructive} onChange={(value) => updatePolicy({ requireApprovalForDestructive: value })}/>
            </div>
            <div className="approval-channel-setting">
              <div><strong>Remote approval channel</strong><span>Use SMS for purchases, subscriptions, and data requests—or keep approvals in this browser.</span></div>
              <div className="channel-options" role="group" aria-label="Remote approval channel">
                <button className={policy.remoteApprovalChannel === "sms" ? "active" : ""} onClick={() => updatePolicy({ remoteApprovalChannel: "sms" })}>SMS</button>
                <button className={policy.remoteApprovalChannel === "browser" ? "active" : ""} onClick={() => updatePolicy({ remoteApprovalChannel: "browser" })}>Browser</button>
              </div>
            </div>
          </article>

          <article className="settings-card">
            <div className="settings-card-heading"><span className="settings-number">03</span><div><h2>Personal data</h2><p>Choose a separate boundary for each supported profile field.</p></div></div>
            <div className="data-rules">
              {[{field:"email",detail:"Email address"},{field:"phone",detail:"Phone number"},{field:"precise_location",detail:"Precise location"},{field:"income",detail:"Income"}].map(({ field, detail }) => (
                <div className="data-row" key={field}><div><strong>{detail}</strong><span>Profile field: {field}</span></div><div className="segmented" role="group" aria-label={`${detail} sharing policy`}>{RULE_OPTIONS.map((option) => <button key={option.value} className={policy.dataRules[field] === option.value ? `active ${option.value.toLowerCase()}` : ""} onClick={() => updateDataRule(field, option.value)}>{option.label}</button>)}</div></div>
              ))}
            </div>
          </article>
        </section>

        <aside className="policy-summary-card">
          <span className="summary-shield"><ShieldIcon /></span>
          <span className="section-kicker">Live policy summary</span>
          <h2>Your agent has bounded authority.</h2>
          <p>AgentGuard evaluates these rules deterministically. The model cannot talk its way around them.</p>
          <div className="summary-ladder">
            <div className="summary-step allow"><span>Allow</span><strong>≤ ${policy.autonomousPurchaseLimit}</strong><small>Routine one-time spend</small></div>
            <div className="summary-step ask"><span>Remote</span><strong>${policy.autonomousPurchaseLimit}–${policy.hardPurchaseLimit}</strong><small>{policy.remoteApprovalChannel === "sms" ? "Single-use SMS approval" : "Single-use browser approval"}</small></div>
            <div className="summary-step deny"><span>Block</span><strong>&gt; ${policy.hardPurchaseLimit}</strong><small>No side effect</small></div>
          </div>
          <div className="human-only-note"><LockIcon /><div><strong>Human-only surface</strong><p>Destructive actions stay local. No WebMCP tool can read raw profile values or edit these controls.</p></div></div>
        </aside>
      </div>
    </main>
  );
}
