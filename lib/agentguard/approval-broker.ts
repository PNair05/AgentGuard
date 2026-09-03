import {
  browserRemoteApprovalTransport,
  remoteStatusToResolution,
  type RemoteApprovalTransport
} from "./remote-approval";
import type {
  ApprovalResolution,
  GuardDecision,
  PendingApproval
} from "./types";

const FIVE_MINUTES = 5 * 60 * 1000;

export interface ApprovalBrokerOptions {
  timeoutMs?: number;
  pollIntervalMs?: number;
  remoteTransport?: RemoteApprovalTransport;
}

export class ApprovalBroker {
  private pending: PendingApproval | null = null;
  private listeners = new Set<() => void>();
  private readonly timeoutMs: number;
  private readonly pollIntervalMs: number;
  private readonly remoteTransport: RemoteApprovalTransport;

  constructor(options: ApprovalBrokerOptions = {}) {
    this.timeoutMs = options.timeoutMs ?? FIVE_MINUTES;
    this.pollIntervalMs = options.pollIntervalMs ?? 1_000;
    this.remoteTransport = options.remoteTransport ?? browserRemoteApprovalTransport;
  }

  getSnapshot = () => this.pending;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  request(
    decision: GuardDecision,
    fingerprint: string,
    signal?: AbortSignal
  ): Promise<ApprovalResolution> {
    if (signal?.aborted) return Promise.resolve("cancelled");
    if (this.pending) return Promise.resolve("cancelled");

    return new Promise((resolve) => {
      const id = crypto.randomUUID();
      const token = `${crypto.randomUUID()}${crypto.randomUUID()}`.replaceAll("-", "");
      const createdAt = Date.now();
      const expiresAt = createdAt + this.timeoutMs;
      const approvalChannel = decision.approvalChannel ?? "browser";
      let settled = false;
      let pollTimer: ReturnType<typeof setInterval> | undefined;

      const settle = (result: ApprovalResolution) => {
        if (settled) return;
        settled = true;
        clearTimeout(expiryTimer);
        if (pollTimer) clearInterval(pollTimer);
        signal?.removeEventListener("abort", onAbort);
        if (this.pending?.id === id) {
          this.pending = null;
          this.emit();
        }
        resolve(result);
      };

      const onAbort = () => settle("cancelled");
      const expiryTimer = setTimeout(() => settle("expired"), this.timeoutMs);
      signal?.addEventListener("abort", onAbort, { once: true });

      this.pending = {
        id,
        action: decision.action,
        decision,
        approvalChannel,
        fingerprint,
        createdAt,
        expiresAt,
        deliveryStatus: "preparing",
        resolve: settle
      };
      this.emit();

      if (approvalChannel === "sms" && typeof window !== "undefined") {
        void this.remoteTransport
          .create({ id, token, fingerprint, action: decision.action, reasons: decision.reasons, expiresAt })
          .then((delivery) => {
            if (this.pending?.id !== id || settled) return;
            this.pending = {
              ...this.pending,
              deliveryStatus: delivery.deliveryStatus,
              approvalUrl: delivery.approvalUrl,
              deliveryMessage: delivery.message
            };
            this.emit();

            pollTimer = setInterval(() => {
              void this.remoteTransport.get(id, token).then((remote) => {
                const resolution = remoteStatusToResolution(remote.status);
                if (resolution) settle(resolution);
              }).catch(() => undefined);
            }, this.pollIntervalMs);
          })
          .catch(() => {
            if (this.pending?.id !== id || settled) return;
            this.pending = {
              ...this.pending,
              deliveryStatus: "failed",
              deliveryMessage: "SMS delivery is unavailable. Use the secure browser fallback."
            };
            this.emit();
          });
      } else {
        this.pending = { ...this.pending, deliveryStatus: "preview" };
        this.emit();
      }
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
