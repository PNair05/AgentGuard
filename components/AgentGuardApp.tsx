"use client";

import { useState } from "react";
import { Header, type AppTab } from "@/components/navigation/Header";
import { Storefront } from "@/components/store/Storefront";
import { ActivityTimeline } from "@/components/guard/ActivityTimeline";
import { ApprovalModal } from "@/components/guard/ApprovalModal";
import { GuardrailsPanel } from "@/components/guard/GuardrailsPanel";
import { HowItWorks } from "@/components/guard/HowItWorks";
import { WebMCPStatus } from "@/components/guard/WebMCPStatus";
import { useWebMCPTools } from "@/hooks/useWebMCPTools";
import { AgentGuardProvider, useAgentGuardStore } from "@/lib/store/app-context";
import { getCartDetails } from "@/lib/store/selectors";

function Workspace() {
  const [activeTab, setActiveTab] = useState<AppTab>("store");
  const { snapshot, audits } = useAgentGuardStore();
  const webmcp = useWebMCPTools();
  const cart = getCartDetails(snapshot.cart);

  return (
    <div className="app-frame">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} status={webmcp.status} cartCount={cart.count} activityCount={audits.length}/>
      <WebMCPStatus status={webmcp.status} error={webmcp.error}/>
      {activeTab === "store" ? <Storefront onGuardrails={() => setActiveTab("guardrails")} onActivity={() => setActiveTab("activity")}/> : null}
      {activeTab === "guardrails" ? <GuardrailsPanel /> : null}
      {activeTab === "activity" ? <ActivityTimeline /> : null}
      {activeTab === "how" ? <HowItWorks status={webmcp.status} registeredNames={webmcp.registeredNames}/> : null}
      <footer className="site-footer page-shell"><div><strong>AgentGuard</strong><span>Let agents act—within bounds humans control.</span></div><p>All commerce, accounts, and profile data in this demo are fictional.</p></footer>
      <ApprovalModal />
    </div>
  );
}

export function AgentGuardApp() {
  return <AgentGuardProvider><Workspace /></AgentGuardProvider>;
}
