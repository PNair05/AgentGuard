import type { ApprovalResolution, GuardAction } from "./types";

export interface RemoteApprovalCreateRequest {
  id: string;
  token: string;
  fingerprint: string;
  action: GuardAction;
  reasons: string[];
  expiresAt: number;
}

export interface RemoteApprovalCreateResponse {
  deliveryStatus: "sent" | "preview";
  approvalUrl: string;
  message: string;
}

export interface RemoteApprovalView {
  id: string;
  fingerprint: string;
  action: GuardAction;
  reasons: string[];
  status: "pending" | "approved" | "denied" | "expired";
  expiresAt: number;
  resolvedAt?: number;
}

export interface RemoteApprovalTransport {
  create(request: RemoteApprovalCreateRequest): Promise<RemoteApprovalCreateResponse>;
  get(id: string, token: string): Promise<RemoteApprovalView>;
}

export const browserRemoteApprovalTransport: RemoteApprovalTransport = {
  async create(request) {
    const response = await fetch("/api/approvals", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request)
    });
    if (!response.ok) throw new Error("Remote approval delivery could not be prepared.");
    return response.json() as Promise<RemoteApprovalCreateResponse>;
  },
  async get(id, token) {
    const response = await fetch(`/api/approvals/${encodeURIComponent(id)}?token=${encodeURIComponent(token)}`, {
      cache: "no-store"
    });
    if (!response.ok) throw new Error("Remote approval status is unavailable.");
    return response.json() as Promise<RemoteApprovalView>;
  }
};

export const remoteStatusToResolution = (
  status: RemoteApprovalView["status"]
): ApprovalResolution | null => {
  if (status === "approved") return "approved";
  if (status === "denied") return "denied";
  if (status === "expired") return "expired";
  return null;
};
