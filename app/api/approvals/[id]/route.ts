import { getRemoteApproval, publicRemoteApproval } from "@/lib/server/remote-approval-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: RouteContext<"/api/approvals/[id]">) {
  const { id } = await context.params;
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const record = getRemoteApproval(id, token);
  if (!record) return Response.json({ message: "Approval request not found." }, { status: 404 });
  return Response.json(publicRemoteApproval(record));
}
