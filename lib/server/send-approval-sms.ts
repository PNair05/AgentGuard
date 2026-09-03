import "server-only";

import type { GuardAction } from "@/lib/agentguard/types";

const money = (action: GuardAction) =>
  action.amount === undefined ? "" : `\nAmount: $${action.amount.toFixed(2)} ${action.currency ?? "USD"}`;

export async function sendApprovalSms(action: GuardAction, approvalUrl: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  const to = process.env.AGENTGUARD_APPROVAL_PHONE;

  if (!accountSid || !authToken || !from || !to) {
    return {
      deliveryStatus: "preview" as const,
      message: "Twilio is not configured. A secure SMS preview is available in the browser."
    };
  }

  const body = [
    "AgentGuard approval needed",
    "",
    action.label,
    money(action),
    "",
    "Approve or deny this exact action:",
    approvalUrl,
    "",
    "Expires in 5 minutes."
  ].join("\n");

  const form = new URLSearchParams({ To: to, From: from, Body: body });
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`,
    {
      method: "POST",
      headers: {
        authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "content-type": "application/x-www-form-urlencoded"
      },
      body: form
    }
  );

  if (!response.ok) {
    return {
      deliveryStatus: "preview" as const,
      message: "Twilio delivery failed. A secure browser fallback is available."
    };
  }

  return {
    deliveryStatus: "sent" as const,
    message: `Approval text sent to the configured phone ending in ${to.slice(-4)}.`
  };
}
