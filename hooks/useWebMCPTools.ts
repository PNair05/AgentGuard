"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAgentGuardStore } from "@/lib/store/app-context";
import { buildWebMCPTools, type AgentGuardToolRuntime } from "@/lib/webmcp/build-tools";
import type { WebMCPToolDefinition } from "@/lib/webmcp/types";

export type WebMCPStatus = "checking" | "ready" | "unavailable" | "error";

export function useWebMCPTools() {
  const store = useAgentGuardStore();
  const storeRef = useRef(store);
  storeRef.current = store;
  const [status, setStatus] = useState<WebMCPStatus>("checking");
  const [registeredNames, setRegisteredNames] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const cancellableOrderIds = store.snapshot.orders
    .filter((order) => order.status === "confirmed")
    .map((order) => order.id);
  const capabilityKey = [
    store.snapshot.cart.length > 0 ? "cart" : "empty",
    store.snapshot.subscriptionActive ? "plus" : "no-plus",
    store.snapshot.accountDeleted ? "deleted" : "active",
    ...cancellableOrderIds
  ].join("|");

  const runtime = useMemo<AgentGuardToolRuntime>(
    () => ({
      getPolicy: () => storeRef.current.getPolicy(),
      getSnapshot: () => storeRef.current.getSnapshot(),
      getAudits: () => storeRef.current.getAudits(),
      requestApproval: (decision, signal) => storeRef.current.requestApproval(decision, signal),
      appendAudit: (event) => storeRef.current.appendAudit(event),
      updateAudit: (id, patch) => storeRef.current.updateAudit(id, patch),
      addToCart: (productId, quantity) => storeRef.current.addToCart(productId, quantity),
      createOrder: () => storeRef.current.createOrder(),
      activateSubscription: () => storeRef.current.activateSubscription(),
      cancelOrder: (orderId) => storeRef.current.cancelOrder(orderId),
      markAccountDeleted: () => storeRef.current.markAccountDeleted()
    }),
    []
  );

  useEffect(() => {
    if (!document.modelContext) {
      setStatus("unavailable");
      setRegisteredNames([]);
      return;
    }

    const controller = new AbortController();
    let alive = true;
    const [cartState, plusState, accountState, ...orderIds] = capabilityKey.split("|");
    const tools = buildWebMCPTools(runtime, {
      hasCart: cartState === "cart",
      subscriptionActive: plusState === "plus",
      accountDeleted: accountState === "deleted",
      cancellableOrderIds: orderIds.filter(Boolean)
    });

    void Promise.all(
      tools.map((tool: WebMCPToolDefinition) =>
        document.modelContext?.registerTool(tool, { signal: controller.signal })
      )
    )
      .then(() => {
        if (!alive) return;
        setRegisteredNames(tools.map((tool) => tool.name));
        setStatus("ready");
        setError(null);
      })
      .catch((registrationError: unknown) => {
        if (!alive || controller.signal.aborted) return;
        setStatus("error");
        setError(
          registrationError instanceof Error
            ? registrationError.message
            : "WebMCP tool registration failed."
        );
      });

    return () => {
      alive = false;
      controller.abort();
    };
  }, [capabilityKey, runtime]);

  return { status, registeredNames, error };
}
