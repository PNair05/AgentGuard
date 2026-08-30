import { ArrowIcon, LockIcon, SearchIcon, ShieldIcon, SparklesIcon } from "@/components/icons";
import { useAgentGuardStore } from "@/lib/store/app-context";
import { PRODUCTS, searchProducts } from "@/lib/store/catalog";
import { ProductCard } from "./ProductCard";
import { CartPanel } from "./CartPanel";
import { ProductArtwork } from "./ProductArtwork";

const CATEGORY_TILES = [
  { label: "Audio", query: "Audio", product: PRODUCTS[0] },
  { label: "Under $50", query: "under 50", product: PRODUCTS[1] },
  { label: "Travel", query: "Travel", product: PRODUCTS[2] },
  { label: "Learning", query: "Learning", product: PRODUCTS[3] },
  { label: "Workspace", query: "Workspace", product: PRODUCTS[4] }
];

export function Storefront({
  searchQuery,
  onSearchChange,
  onGuardrails,
  onActivity
}: {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onGuardrails: () => void;
  onActivity: () => void;
}) {
  const { policy, snapshot, addToCart } = useAgentGuardStore();
  const visibleProducts = searchProducts(searchQuery);

  const copyPrompt = async () => {
    await navigator.clipboard?.writeText(
      "Find me the best noise-canceling headphones under $300, buy them, and sign me up for GuardMart Plus if it saves money."
    );
  };

  return (
    <main>
      <section className="store-hero page-shell">
        <div className="hero-copy">
          <span className="hero-kicker"><ShieldIcon /> The GuardMart safety event</span>
          <h1>Big convenience.<br/><em>Built-in boundaries.</em></h1>
          <p>Shop this fictional storefront yourself—or delegate to an agent with clear, deterministic limits.</p>
          <div className="hero-actions">
            <button className="button light" onClick={onGuardrails}>Set your guardrails <ArrowIcon /></button>
            <button className="button ghost-light" onClick={() => void copyPrompt()}><SparklesIcon /> Copy agent prompt</button>
          </div>
        </div>
        <div className="hero-policy-card">
          <div className="hero-policy-top"><span>Your shopping guard</span><span className="live-badge"><i /> On</span></div>
          <div className="hero-limit"><small>Autonomous purchase limit</small><strong>up to ${policy.autonomousPurchaseLimit}</strong></div>
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

      <section className="category-section page-shell" aria-labelledby="category-heading">
        <div className="retail-heading"><h2 id="category-heading">Shop by category</h2><p>Explore demo products by the consequence they create.</p></div>
        <div className="category-row">
          <button className={!searchQuery ? "category-tile active" : "category-tile"} onClick={() => onSearchChange("")}>
            <span className="category-art category-all"><ShieldIcon /></span><strong>All finds</strong>
          </button>
          {CATEGORY_TILES.map(({ label, query, product }) => (
            <button key={label} className={searchQuery === query ? "category-tile active" : "category-tile"} onClick={() => onSearchChange(query)}>
              <span className={`category-art ${product.accent}`}><ProductArtwork visual={product.visual} /></span><strong>{label}</strong>
            </button>
          ))}
        </div>
      </section>

      <section className="deal-strip page-shell" aria-label="AgentGuard benefits">
        <button onClick={onGuardrails}><strong>${policy.autonomousPurchaseLimit}</strong><span>Shop autonomously<br/><small>with your current limit</small></span></button>
        <button onClick={onActivity}><strong>100%</strong><span>Decision visibility<br/><small>in your activity trail</small></span></button>
        <button onClick={onGuardrails}><strong>0</strong><span>Agent-editable rules<br/><small>humans stay in control</small></span></button>
      </section>

      <section className="catalog-section page-shell">
        <div className="catalog-main">
          <div className="section-heading">
            <div><span className="section-kicker">GuardMart favorites</span><h2>{searchQuery ? `Results for “${searchQuery}”` : "Trending finds for your demo"}</h2></div>
            <p>{visibleProducts.length} {visibleProducts.length === 1 ? "item" : "items"} · Prices and return rules vary to demonstrate real consent decisions.</p>
          </div>
          <div className="product-grid">
            {visibleProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                inCart={snapshot.cart.some((item) => item.productId === product.id)}
                onAdd={() => addToCart(product.id)}
              />
            ))}
          </div>

          {visibleProducts.length === 0 ? <div className="no-results"><SearchIcon /><h3>No matches yet</h3><p>Try “audio,” “travel,” or browse all of GuardMart.</p><button className="button dark" onClick={() => onSearchChange("")}>Show all products</button></div> : null}

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
