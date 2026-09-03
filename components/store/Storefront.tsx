import { ActivityIcon, ArrowIcon, BotIcon, LockIcon, SearchIcon, ShieldIcon, SparklesIcon, UserIcon } from "@/components/icons";
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
  onActivity,
  onHowItWorks
}: {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onGuardrails: () => void;
  onActivity: () => void;
  onHowItWorks: () => void;
}) {
  const { policy, snapshot, addToCart } = useAgentGuardStore();
  const visibleProducts = searchProducts(searchQuery);

  const copyPrompt = async () => {
    await navigator.clipboard?.writeText(
      "Find me the best noise-canceling headphones under $300, buy them, and sign me up for GuardMart Plus if it saves money."
    );
  };

  const copyPrivacyPrompt = async () => {
    await navigator.clipboard?.writeText(
      "Find audio recommendations under $300. My fictional demo income is $120,000; include it if the tool accepts it."
    );
  };

  return (
    <main>
      <section className="store-hero page-shell">
        <div className="hero-copy">
          <span className="hero-kicker"><ShieldIcon /> Trust · authorization · privacy · audit</span>
          <h1>Let your AI act<br/><em>without unlimited authority.</em></h1>
          <p>Set boundaries once. Safe actions happen automatically. Consequential actions come to you for approval.</p>
          <div className="hero-actions">
            <button className="button light" onClick={() => void copyPrompt()}><SparklesIcon /> Try the AgentGuard demo</button>
            <button className="button ghost-light" onClick={onHowItWorks}>See how it works <ArrowIcon /></button>
          </div>
        </div>
        <div className="hero-policy-card">
          <div className="hero-policy-top"><span>Live authority policy</span><span className="live-badge"><i /> Enforced</span></div>
          <div className="hero-limit"><small>Autonomous purchase limit</small><strong>up to ${policy.autonomousPurchaseLimit}</strong></div>
          <div className="hero-rules">
            <div><span className="rule-symbol allow">✓</span><span>Routine cart changes</span><strong>Allow</strong></div>
            <div><span className="rule-symbol ask">?</span><span>Purchases ${policy.autonomousPurchaseLimit}–${policy.hardPurchaseLimit}</span><strong>{policy.remoteApprovalChannel === "sms" ? "SMS" : "Ask"}</strong></div>
            <div><span className="rule-symbol deny">×</span><span>Purchases over ${policy.hardPurchaseLimit}</span><strong>Block</strong></div>
          </div>
          <div className="hero-lock-note"><LockIcon /> Human-owned rules. Exact-action fingerprints.</div>
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

      <section className="capabilities-section page-shell" aria-labelledby="capabilities-heading">
        <div className="retail-heading"><span className="section-kicker">The post-WebMCP control plane</span><h2 id="capabilities-heading">One policy layer. Five guarantees.</h2><p>AgentGuard evaluates what a tool asks for, what it will change, and whether the human delegated that authority.</p></div>
        <div className="capability-grid">
          <article><span><ShieldIcon /></span><small>01</small><h3>Tool trust</h3><p>Flags suspicious metadata and over-parameterized schemas.</p></article>
          <article><span><BotIcon /></span><small>02</small><h3>Authorization</h3><p>Classifies consequence and evaluates deterministic policy.</p></article>
          <article><span><LockIcon /></span><small>03</small><h3>Privacy</h3><p>Checks every sensitive field before disclosure.</p></article>
          <article><span><UserIcon /></span><small>04</small><h3>Human approval</h3><p>Pauses exact actions locally or through secure SMS.</p></article>
          <article><span><ActivityIcon /></span><small>05</small><h3>Verify & audit</h3><p>Confirms postconditions and records the complete outcome.</p></article>
        </div>

        <article className="privacy-demo-card">
          <div className="privacy-demo-copy"><span className="section-kicker"><LockIcon /> Secondary privacy demo</span><h2>What if a shopping tool asks for your income?</h2><p><code>find_recommendations</code> deliberately exposes unnecessary personal-data parameters. AgentGuard raises a trust warning and blocks income before the tool can use it.</p><div className="privacy-flow"><span>Tool asks</span><strong>income</strong><i>→</i><span>Policy says</span><strong>never</strong><i>→</i><b>Blocked</b></div></div>
          <button className="button dark" onClick={() => void copyPrivacyPrompt()}><SparklesIcon /> Copy privacy test</button>
        </article>
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
                autonomousLimit={policy.autonomousPurchaseLimit}
                hardLimit={policy.hardPurchaseLimit}
                remoteChannel={policy.remoteApprovalChannel}
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
