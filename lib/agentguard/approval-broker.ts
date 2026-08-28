import type { GuardDecision, PendingApproval } from "./types";

export type ApprovalResolution = "approved" | "denied" | "cancelled";

export class ApprovalBroker {
  private pending: PendingApproval | null = null;
  private listeners = new Set<() => void>();

  getSnapshot = () => this.pending;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  request(decision: GuardDecision, signal?: AbortSignal): Promise<ApprovalResolution> {
    if (signal?.aborted) return Promise.resolve("cancelled");
    if (this.pending) return Promise.resolve("cancelled");

    return new Promise((resolve) => {
      const id = crypto.randomUUID();
      let settled = false;

      const settle = (result: ApprovalResolution) => {
        if (settled) return;
        settled = true;
        signal?.removeEventListener("abort", onAbort);
        if (this.pending?.id === id) {
          this.pending = null;
          this.emit();
        }
        resolve(result);
      };

      const onAbort = () => settle("cancelled");
      signal?.addEventListener("abort", onAbort, { once: true });

      this.pending = {
        id,
        action: decision.action,
        decision,
        createdAt: Date.now(),
        resolve: settle
      };
      this.emit();
    });
  }

  respond(id: string, approved: boolean) {
    if (this.pending?.id !== id) return false;
    this.pending.resolve(approved ? "approved" : "denied");
    return true;
  }

  cancelAll() {
    this.pending?.resolve("cancelled");
  }

  private emit() {
    this.listeners.forEach((listener) => listener());
  }
}
