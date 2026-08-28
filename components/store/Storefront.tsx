import { ArrowIcon, LockIcon, ShieldIcon, SparklesIcon } from "@/components/icons";
import { useAgentGuardStore } from "@/lib/store/app-context";
import { PRODUCTS } from "@/lib/store/catalog";
import { ProductCard } from "./ProductCard";
import { CartPanel } from "./CartPanel";

export function Storefront({
  onGuardrails,
  onActivity
}: {
  onGuardrails: () => void;
  onActivity: () => void;
}) {
  const { policy, snapshot, addToCart } = useAgentGuardStore();

  const copyPrompt = async () => {
    await navigator.clipboard?.writeText(
      "Find me the best noise-canceling headphones under $300, buy them, and sign me up for GuardMart Plus if it saves money."
    );
  };

  return (
    <main>
      <section className="store-hero page-shell">
        <div className="hero-copy">
          <span className="hero-kicker"><ShieldIcon /> Agent-safe shopping, visibly enforced</span>
          <h1>Let the agent shop.<br/><em>You set the boundary.</em></h1>
          <p>GuardMart is a fictional storefront powered by AgentGuard—a deterministic consent layer for high-impact WebMCP actions.</p>
          <div className="hero-actions">
            <button className="button light" onClick={onGuardrails}>Review my guardrails <ArrowIcon /></button>
            <button className="button ghost-light" onClick={() => void copyPrompt()}><SparklesIcon /> Copy demo prompt</button>
          </div>
        </div>
        <div className="hero-policy-card">
          <div className="hero-policy-top"><span>Current delegation</span><span className="live-badge"><i /> Enforced</span></div>
          <div className="hero-limit"><small>Agent can purchase autonomously</small><strong>≤ ${policy.autonomousPurchaseLimit}</strong></div>
          <div className="hero-rules">
            <div><span className="rule-symbol allow">✓</span><span>Routine cart changes</span><strong>Allow</strong></div>
            <div><span className="rule-symbol ask">?</span><span>Purchases ${policy.autonomousPurchaseLimit}–${policy.hardPurchaseLimit}</span><strong>Ask</strong></div>
            <div><span className="rule-symbol deny">×</span><span>Purchases over ${policy.hardPurchaseLimit}</span><strong>Block</strong></div>
          </div>
          <div className="hero-lock-note"><LockIcon /> These rules are never agent-editable.</div>
        </div>
      </section>

      {snapshot.accountDeleted ? (
        <section className="page-shell account-state-banner"><LockIcon /><div><strong>Demo account deleted</strong><p>The simulated destructive action completed. Refresh the page to start a fresh in-memory account.</p></div></section>
      ) : null}

      <section className="catalog-section page-shell">
        <div className="catalog-main">
          <div className="section-heading">
            <div><span className="section-kicker">Curated for the demo</span><h2>Useful things, meaningful stakes.</h2></div>
            <p>Prices and refund rules are deliberately varied so every AgentGuard decision is easy to see.</p>
          </div>
          <div className="product-grid">
            {PRODUCTS.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                inCart={snapshot.cart.some((item) => item.productId === product.id)}
                onAdd={() => addToCart(product.id)}
              />
            ))}
          </div>

          <article className="plus-card">
            <div className="plus-orb"><SparklesIcon /></div>
            <div className="plus-copy"><span className="section-kicker">GuardMart Plus</span><h2>{snapshot.subscriptionActive ? "Membership active" : "Routine perks. Recurring consequence."}</h2><p>{snapshot.subscriptionActive ? "Your fictional Plus membership is active and subscribe_plus has been removed from the tool surface." : "Free delivery and extended returns for $9.99/month. AgentGuard always asks before recurring charges."}</p></div>
            <div className="plus-price"><strong>$9.99</strong><span>/ month</span><small>{snapshot.subscriptionActive ? "Activated" : "Agent approval required"}</small></div>
          </article>
        </div>
        <CartPanel onViewActivity={onActivity} />
      </section>
    </main>
  );
}
