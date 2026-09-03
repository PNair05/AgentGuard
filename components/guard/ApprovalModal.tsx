"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon, LockIcon, ShieldIcon, SparklesIcon, XIcon } from "@/components/icons";
import { useAgentGuardStore } from "@/lib/store/app-context";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function ApprovalModal() {
  const { pendingApproval, respondToApproval } = useAgentGuardStore();
  const [deletePhrase, setDeletePhrase] = useState("");
  const [now, setNow] = useState(Date.now());
  const denyRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!pendingApproval) return;
    setDeletePhrase("");
    document.body.classList.add("modal-open");
    const timer = window.setTimeout(() => denyRef.current?.focus(), 40);
    const ticker = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(ticker);
      document.body.classList.remove("modal-open");
    };
  }, [pendingApproval]);

  if (!pendingApproval) return null;
  const { id, action, decision } = pendingApproval;
  const isDelete = action.toolName === "delete_account";
  const canApprove = !isDelete || deletePhrase === "DELETE";
  const isRemote = pendingApproval.approvalChannel === "sms";
  const canUseBrowserFallback = !isRemote || pendingApproval.deliveryStatus === "preview" || pendingApproval.deliveryStatus === "failed";
  const secondsLeft = Math.max(0, Math.ceil((pendingApproval.expiresAt - now) / 1000));

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="approval-modal" role="dialog" aria-modal="true" aria-labelledby="approval-title" aria-describedby="approval-description">
        <div className="modal-accent" />
        <header className="approval-header">
          <span className="approval-icon"><ShieldIcon /></span>
          <div><span>{isRemote ? "Remote approval requested" : "Local approval required"}</span><h2 id="approval-title">{action.label}</h2></div>
        </header>

        <div className="consequence-card">
          {action.amount !== undefined ? <div className="consequence-primary"><strong>{currency.format(action.amount)}</strong><span>{action.recurring ? "monthly recurring charge" : "one-time charge"}</span></div> : null}
          {action.sensitiveFields?.length ? <div className="consequence-primary"><strong>{action.sensitiveFields.join(", ")}</strong><span>profile data fields</span></div> : null}
          {action.destructive ? <div className="consequence-primary destructive"><strong>Destructive action</strong><span>This changes or removes an existing resource.</span></div> : null}
          <div className="consequence-facts">
            {action.metadata?.merchant ? <span><small>Merchant</small><strong>{String(action.metadata.merchant)}</strong></span> : null}
            {action.refundable !== undefined ? <span><small>Refundability</small><strong>{action.refundable ? "Refundable" : "Non-refundable"}</strong></span> : null}
            {action.metadata?.cadence ? <span><small>Cadence</small><strong>{String(action.metadata.cadence)}</strong></span> : null}
            {action.metadata?.partner ? <span><small>Recipient</small><strong>{String(action.metadata.partner)}</strong></span> : null}
          </div>
        </div>

        <div className="why-card" id="approval-description"><span>Why you’re seeing this</span>{decision.reasons.map((reason) => <p key={reason}>{reason}</p>)}</div>

        {isRemote ? (
          <div className={`approval-channel-card ${pendingApproval.deliveryStatus}`}>
            <span><SparklesIcon /></span>
            <div>
              <strong>{pendingApproval.deliveryStatus === "sent" ? "Approval text sent" : pendingApproval.deliveryStatus === "preparing" ? "Preparing secure text…" : "SMS preview · browser fallback"}</strong>
              <p>{pendingApproval.deliveryMessage ?? "The exact action is available through a single-use approval link."}</p>
              {pendingApproval.approvalUrl ? <a href={pendingApproval.approvalUrl} target="_blank" rel="noreferrer">Open secure approval page</a> : null}
            </div>
          </div>
        ) : null}

        {isDelete ? <label className="delete-confirm"><span>Type <strong>DELETE</strong> to confirm this human decision.</span><input autoComplete="off" value={deletePhrase} onChange={(event) => setDeletePhrase(event.target.value)} placeholder="DELETE"/></label> : null}

        <div className="approval-scope"><LockIcon /><span>Fingerprint {pendingApproval.fingerprint.slice(0, 10)}… · single-use · expires in {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}</span></div>
        <footer className="modal-actions">
          <button ref={denyRef} className="button deny-button" onClick={() => respondToApproval(id, false)}><XIcon /> Deny</button>
          {canUseBrowserFallback ? <button className="button approve-button" disabled={!canApprove} onClick={() => respondToApproval(id, true)}><CheckIcon /> Approve once</button> : <a className="button approve-button" href={pendingApproval.approvalUrl} target="_blank" rel="noreferrer"><CheckIcon /> Review on phone</a>}
        </footer>
      </section>
    </div>
  );
}
