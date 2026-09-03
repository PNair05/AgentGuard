"use client";

import { useEffect, useState } from "react";
import { CheckIcon, LockIcon, ShieldIcon, XIcon } from "@/components/icons";
import type { RemoteApprovalView } from "@/lib/agentguard/remote-approval";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function RemoteApprovalClient({
  requestId,
  token
}: {
  requestId: string;
  token: string;
}) {
  const [approval, setApproval] = useState<RemoteApprovalView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!requestId || !token) {
      setError("This approval link is incomplete.");
      setLoading(false);
      return;
    }
    void fetch(`/api/approvals/${encodeURIComponent(requestId)}?token=${encodeURIComponent(token)}`, {
      cache: "no-store"
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("This approval request is invalid or no longer available.");
        return response.json() as Promise<RemoteApprovalView>;
      })
      .then(setApproval)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Approval request unavailable."))
      .finally(() => setLoading(false));
  }, [requestId, token]);

  const respond = async (response: "approved" | "denied") => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await fetch(`/api/approvals/${encodeURIComponent(requestId)}/respond`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, response })
      });
      const updated = await result.json() as RemoteApprovalView;
      if (!result.ok && result.status !== 410) throw new Error("Your response could not be recorded.");
      setApproval(updated);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Your response could not be recorded.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="remote-approval-page">
      <section className="remote-approval-card">
        <span className="remote-brand"><span><ShieldIcon /></span> AgentGuard</span>
        {loading ? <div className="remote-state"><span className="remote-loader"/><h1>Loading secure request…</h1></div> : null}
        {!loading && error && !approval ? <div className="remote-state error"><LockIcon /><h1>Approval unavailable</h1><p>{error}</p></div> : null}
        {approval ? (
          <>
            <div className="remote-heading"><span>Your agent is requesting permission</span><h1>{approval.action.label}</h1></div>
            <div className="remote-consequence">
              <span>{approval.action.type.replaceAll("_", " ")}</span>
              {approval.action.amount !== undefined ? <strong>{currency.format(approval.action.amount)}</strong> : null}
              <p>{approval.action.recurring ? "Recurring payment" : approval.action.refundable === false ? "Non-refundable action" : "One-time action"}</p>
            </div>
            <div className="remote-reasons"><strong>Why approval is required</strong>{approval.reasons.map((reason) => <p key={reason}>{reason}</p>)}</div>
            <div className="fingerprint-row"><LockIcon /><span>Bound to fingerprint <code>{approval.fingerprint.slice(0, 12)}…</code></span></div>
            {approval.status === "pending" ? (
              <div className="remote-actions">
                <button disabled={submitting} className="button deny-button" onClick={() => void respond("denied")}><XIcon /> Deny</button>
                <button disabled={submitting} className="button approve-button" onClick={() => void respond("approved")}><CheckIcon /> Approve once</button>
              </div>
            ) : (
              <div className={`remote-complete ${approval.status}`}>
                {approval.status === "approved" ? <CheckIcon /> : <XIcon />}
                <div><strong>{approval.status === "approved" ? "Action approved" : approval.status === "denied" ? "Action denied" : "Request expired"}</strong><p>You can close this page. The agent session will receive this decision.</p></div>
              </div>
            )}
            {error ? <p className="remote-inline-error">{error}</p> : null}
            <p className="remote-expiry">Single use · Expires {new Date(approval.expiresAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</p>
          </>
        ) : null}
      </section>
    </main>
  );
}
