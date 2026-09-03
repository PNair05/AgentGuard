import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import type { GuardAction } from "@/lib/agentguard/types";

export interface RemoteApprovalRecord {
  id: string;
  tokenHash: string;
  fingerprint: string;
  action: GuardAction;
  reasons: string[];
  status: "pending" | "approved" | "denied" | "expired";
  expiresAt: number;
  createdAt: number;
  resolvedAt?: number;
}

const globalState = globalThis as typeof globalThis & {
  __agentGuardApprovals?: Map<string, RemoteApprovalRecord>;
};

const approvals = globalState.__agentGuardApprovals ?? new Map<string, RemoteApprovalRecord>();
globalState.__agentGuardApprovals = approvals;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

const tokenMatches = (record: RemoteApprovalRecord, token: string) => {
  const candidate = Buffer.from(hashToken(token), "hex");
  const expected = Buffer.from(record.tokenHash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
};

const expireIfNeeded = (record: RemoteApprovalRecord) => {
  if (record.status === "pending" && record.expiresAt <= Date.now()) {
    record.status = "expired";
    record.resolvedAt = Date.now();
  }
  return record;
};

export function createRemoteApproval(input: {
  id: string;
  token: string;
  fingerprint: string;
  action: GuardAction;
  reasons: string[];
  expiresAt: number;
}) {
  const record: RemoteApprovalRecord = {
    id: input.id,
    tokenHash: hashToken(input.token),
    fingerprint: input.fingerprint,
    action: input.action,
    reasons: input.reasons,
    status: "pending",
    expiresAt: input.expiresAt,
    createdAt: Date.now()
  };
  approvals.set(record.id, record);
  return record;
}

export function getRemoteApproval(id: string, token: string) {
  const record = approvals.get(id);
  if (!record || !tokenMatches(record, token)) return null;
  return expireIfNeeded(record);
}

export function respondToRemoteApproval(
  id: string,
  token: string,
  response: "approved" | "denied"
) {
  const record = getRemoteApproval(id, token);
  if (!record || record.status !== "pending") return record;
  record.status = response;
  record.resolvedAt = Date.now();
  return record;
}

export function publicRemoteApproval(record: RemoteApprovalRecord) {
  return {
    id: record.id,
    fingerprint: record.fingerprint,
    action: record.action,
    reasons: record.reasons,
    status: record.status,
    expiresAt: record.expiresAt,
    resolvedAt: record.resolvedAt
  };
}
