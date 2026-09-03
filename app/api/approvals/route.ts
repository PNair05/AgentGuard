import type { GuardAction } from "@/lib/agentguard/types";
import { createRemoteApproval } from "@/lib/server/remote-approval-store";
import { sendApprovalSms } from "@/lib/server/send-approval-sms";

export const dynamic = "force-dynamic";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  if (!isRecord(body) || !isRecord(body.action)) {
    return Response.json({ message: "Invalid approval request." }, { status: 400 });
  }

  const { id, token, fingerprint, action, reasons, expiresAt } = body;
  const valid =
    typeof id === "string" && id.length <= 80 &&
    typeof token === "string" && token.length >= 32 && token.length <= 160 &&
    typeof fingerprint === "string" && /^[a-f0-9]{64}$/.test(fingerprint) &&
    Array.isArray(reasons) && reasons.every((reason) => typeof reason === "string") &&
    typeof expiresAt === "number" && expiresAt > Date.now() && expiresAt <= Date.now() + 6 * 60 * 1000 &&
    typeof action.toolName === "string" && typeof action.label === "string";

  if (!valid || JSON.stringify(body).length > 12_000) {
    return Response.json({ message: "Approval request failed validation." }, { status: 400 });
  }

  const configuredBase = process.env.AGENTGUARD_PUBLIC_URL?.replace(/\/$/, "");
  const baseUrl = configuredBase || new URL(request.url).origin;
  const approvalUrl = `${baseUrl}/approve?request=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}`;

  createRemoteApproval({
    id,
    token,
    fingerprint,
    action: action as unknown as GuardAction,
    reasons: reasons as string[],
    expiresAt
  });

  const delivery = await sendApprovalSms(action as unknown as GuardAction, approvalUrl);
  return Response.json({ ...delivery, approvalUrl });
}
