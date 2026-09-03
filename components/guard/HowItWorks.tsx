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
        <div><span className="hero-kicker dark"><ShieldIcon /> The execution contract</span><h1>WebMCP exposes the tools.<br/><em>AgentGuard governs their use.</em></h1><p>A developer-integrated trust, authorization, privacy, and audit layer wraps every consequential tool before application code can perform its side effect.</p></div>
      </header>

      <section className="flow-card" aria-label="AgentGuard execution flow">
        <div className="flow-node"><span><BotIcon /></span><small>01</small><strong>Browser agent</strong><p>Discovers a concise, structured WebMCP tool.</p></div>
        <ArrowIcon className="flow-arrow"/>
        <div className="flow-node"><span><ShieldIcon /></span><small>02</small><strong>Trust + privacy</strong><p>Validates input, flags suspicious metadata, and checks sensitive fields.</p></div>
        <ArrowIcon className="flow-arrow"/>
        <div className="flow-node featured"><span><LockIcon /></span><small>03</small><strong>Policy + approval</strong><p>Returns allow, remote approval, local approval, or deny.</p></div>
        <ArrowIcon className="flow-arrow"/>
        <div className="flow-node"><span><UserIcon /></span><small>04</small><strong>Execute + prove</strong><p>Runs the fingerprinted action, verifies state, and records the result.</p></div>
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
          <div className="decision-row ask"><strong>REMOTE</strong><span>Pause for SMS or browser</span><small>Single-use, five-minute, fingerprint-bound approval</small></div>
          <div className="decision-row local"><strong>LOCAL</strong><span>Keep the decision here</span><small>Destructive actions require an in-context human</small></div>
          <div className="decision-row deny"><strong>DENY</strong><span>Return actionable recovery</span><small>No hidden side effect, stable reason codes</small></div>
        </section>
      </div>

      <section className="trust-model">
        <div><span className="section-kicker">Precise security claim</span><h2>A policy firewall websites choose to integrate.</h2><p>AgentGuard is not a browser security boundary and cannot intercept arbitrary tools on unrelated websites. It protects users when a site developer intentionally routes sensitive WebMCP execution through the guard.</p></div>
        <ul><li><CheckIcon /><span><strong>Deterministic enforcement</strong>Policy is code, not a prompt the model may ignore.</span></li><li><CheckIcon /><span><strong>Trusted data derivation</strong>Prices and consequence metadata come from application state.</span></li><li><CheckIcon /><span><strong>Exact-action authorization</strong>SHA-256 fingerprints invalidate approval when parameters change.</span></li><li><CheckIcon /><span><strong>Postcondition verification</strong>Execution and intended state are recorded separately.</span></li><li><CheckIcon /><span><strong>Self-only exposure</strong>Headers retain WebMCP’s same-origin permissions default.</span></li></ul>
      </section>

      <section className="docs-strip"><div><strong>Built as a reusable guarded-tool contract</strong><span>guardTool() · structured consequences · trust checks · approval broker · verify() · audit</span></div><a href="https://developer.chrome.com/docs/ai/webmcp/imperative-api" target="_blank" rel="noreferrer">Read the WebMCP docs <ArrowIcon /></a></section>
    </main>
  );
}
