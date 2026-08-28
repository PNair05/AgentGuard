import { ActivityIcon, CartIcon, ShieldIcon, SlidersIcon, SparklesIcon } from "@/components/icons";
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
  activityCount
}: {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  status: WebMCPStatus;
  cartCount: number;
  activityCount: number;
}) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <button className="brand" onClick={() => setActiveTab("store")} aria-label="AgentGuard home">
          <span className="brand-mark"><ShieldIcon /></span>
          <span>
            <strong>AgentGuard</strong>
            <small>for GuardMart</small>
          </span>
        </button>

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
