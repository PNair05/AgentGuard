import { ArrowIcon, BotIcon, CheckIcon, LockIcon, ShieldIcon, UserIcon } from "@/components/icons";
import type { WebMCPStatus } from "@/hooks/useWebMCPTools";

const humanize = (name: string) => name.replaceAll("_", " ");

export function HowItWorks({
  status,
  registeredNames
}: {
  status: WebMCPStatus;
  registeredNames: string[];
}) {
  return (
    <main className="subpage page-shell how-page">
      <header className="subpage-header">
        <div><span className="hero-kicker dark"><ShieldIcon /> The execution contract</span><h1>WebMCP gives agents hands.<br/><em>AgentGuard sets the reach.</em></h1><p>A developer-integrated policy layer wraps each consequential tool before application code can perform its side effect.</p></div>
      </header>

      <section className="flow-card" aria-label="AgentGuard execution flow">
        <div className="flow-node"><span><BotIcon /></span><small>01</small><strong>Browser agent</strong><p>Discovers a concise, structured WebMCP tool.</p></div>
        <ArrowIcon className="flow-arrow"/>
        <div className="flow-node"><span><ShieldIcon /></span><small>02</small><strong>Guarded tool</strong><p>Validates input and derives trusted action metadata.</p></div>
        <ArrowIcon className="flow-arrow"/>
        <div className="flow-node featured"><span><LockIcon /></span><small>03</small><strong>Policy engine</strong><p>Deterministically returns allow, ask, or deny.</p></div>
        <ArrowIcon className="flow-arrow"/>
        <div className="flow-node"><span><UserIcon /></span><small>04</small><strong>Human + app</strong><p>Approval resumes the exact action; otherwise nothing runs.</p></div>
      </section>

      <div className="how-grid">
        <section className="tool-surface-card">
          <div className="tool-surface-heading"><div><span className={status === "ready" ? "status-dot ready" : "status-dot"}/><span>Live tool surface</span></div><strong>{registeredNames.length} active</strong></div>
          <p>Capabilities change with application state. Add a cart item and checkout tools appear; finish an order and cancellation appears.</p>
          <div className="tool-chips">
            {registeredNames.length > 0 ? registeredNames.map((name) => <span key={name}><CheckIcon /> {humanize(name)}</span>) : <span className="muted-chip"><LockIcon /> Enable WebMCP to inspect registered tools</span>}
          </div>
        </section>

        <section className="decision-map">
          <div className="decision-row allow"><strong>ALLOW</strong><span>Execute immediately</span><small>Reads, low-risk changes, bounded spend</small></div>
          <div className="decision-row ask"><strong>ASK</strong><span>Pause for the human</span><small>Scoped one-time approval via Promise</small></div>
          <div className="decision-row deny"><strong>DENY</strong><span>Return actionable recovery</span><small>No hidden side effect, stable reason codes</small></div>
        </section>
      </div>

      <section className="trust-model">
        <div><span className="section-kicker">Precise security claim</span><h2>A policy firewall websites choose to integrate.</h2><p>AgentGuard is not a browser security boundary and cannot intercept arbitrary tools on unrelated websites. It protects users when a site developer intentionally routes sensitive WebMCP execution through the guard.</p></div>
        <ul><li><CheckIcon /><span><strong>Deterministic enforcement</strong>Policy is code, not a prompt the model may ignore.</span></li><li><CheckIcon /><span><strong>Trusted data derivation</strong>Prices and profile values come from application state.</span></li><li><CheckIcon /><span><strong>Cancellation-aware</strong>Aborted approvals clean up before side effects run.</span></li><li><CheckIcon /><span><strong>Self-only exposure</strong>Headers retain WebMCP’s same-origin permissions default.</span></li></ul>
      </section>

      <section className="docs-strip"><div><strong>Built against the current imperative API</strong><span>document.modelContext · structured schemas · AbortSignal lifecycles · toolchange-ready state</span></div><a href="https://developer.chrome.com/docs/ai/webmcp/imperative-api" target="_blank" rel="noreferrer">Read the WebMCP docs <ArrowIcon /></a></section>
    </main>
  );
}
