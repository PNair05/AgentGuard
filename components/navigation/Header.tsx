import { ActivityIcon, CartIcon, MapPinIcon, SearchIcon, ShieldIcon, SlidersIcon, SparklesIcon, UserIcon } from "@/components/icons";
import type { WebMCPStatus } from "@/hooks/useWebMCPTools";

export type AppTab = "store" | "guardrails" | "activity" | "how";

const NAV_ITEMS: { id: AppTab; label: string; icon: typeof CartIcon }[] = [
  { id: "store", label: "Store", icon: CartIcon },
  { id: "guardrails", label: "Guardrails", icon: SlidersIcon },
  { id: "activity", label: "Activity", icon: ActivityIcon },
  { id: "how", label: "How it works", icon: SparklesIcon }
];

export function Header({
  activeTab,
  setActiveTab,
  status,
  cartCount,
  activityCount,
  searchQuery,
  onSearchChange
}: {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  status: WebMCPStatus;
  cartCount: number;
  activityCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}) {
  return (
    <header className="site-header">
      <div className="utility-bar">
        <div className="utility-inner">
          <button className="location-button"><MapPinIcon /> GuardMart <strong>reference demo</strong></button>
          <div className="utility-links" aria-label="Utility navigation">
            <button onClick={() => setActiveTab("how")}>AgentGuard help</button>
            <button onClick={() => setActiveTab("activity")}>Session activity</button>
            <button onClick={() => setActiveTab("guardrails")}>Your guardrails</button>
          </div>
        </div>
      </div>
      <div className="header-inner">
        <button className="brand" onClick={() => setActiveTab("store")} aria-label="AgentGuard home">
          <span className="brand-mark"><ShieldIcon /></span>
          <span>
            <strong>AgentGuard</strong>
            <small>GuardMart reference store</small>
          </span>
        </button>

        <nav className="desktop-shop-nav" aria-label="Store navigation">
          <button onClick={() => setActiveTab("store")}>Categories</button>
          <button onClick={() => setActiveTab("store")}>Deals</button>
        </nav>

        <label className="site-search">
          <span className="sr-only">Search GuardMart</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            onFocus={() => setActiveTab("store")}
            placeholder="What can we help you find?"
          />
          <SearchIcon />
        </label>

        <div className="header-actions">
          <button className="account-button" onClick={() => setActiveTab("guardrails")}><UserIcon /><span>Account</span></button>
          <button className="header-cart-button" onClick={() => setActiveTab("store")} aria-label={`Cart with ${cartCount} items`}><CartIcon />{cartCount > 0 ? <em>{cartCount}</em> : null}</button>
        </div>

        <nav className="primary-nav" aria-label="Primary navigation">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={activeTab === id ? "nav-item active" : "nav-item"}
              onClick={() => setActiveTab(id)}
              aria-current={activeTab === id ? "page" : undefined}
            >
              <Icon />
              <span>{label}</span>
              {id === "store" && cartCount > 0 ? <em>{cartCount}</em> : null}
              {id === "activity" && activityCount > 0 ? <em>{Math.min(activityCount, 99)}</em> : null}
            </button>
          ))}
        </nav>

        <div className={`webmcp-pill ${status}`} title="WebMCP connection status">
          <span className="status-dot" />
          {status === "ready" ? "WebMCP live" : status === "checking" ? "Checking…" : "Setup needed"}
        </div>
      </div>
    </header>
  );
}
