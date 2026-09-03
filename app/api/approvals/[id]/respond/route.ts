import { publicRemoteApproval, respondToRemoteApproval } from "@/lib/server/remote-approval-store";

export async function POST(request: Request, context: RouteContext<"/api/approvals/[id]/respond">) {
  const { id } = await context.params;
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ message: "Invalid response." }, { status: 400 });
  }
  const { token, response } = body as Record<string, unknown>;
  if (typeof token !== "string" || (response !== "approved" && response !== "denied")) {
    return Response.json({ message: "Invalid response." }, { status: 400 });
  }
  const record = respondToRemoteApproval(id, token, response);
  if (!record) return Response.json({ message: "Approval request not found." }, { status: 404 });
  if (record.status === "expired") {
    return Response.json(publicRemoteApproval(record), { status: 410 });
  }
  return Response.json(publicRemoteApproval(record));
}
