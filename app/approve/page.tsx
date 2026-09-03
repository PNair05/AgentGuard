import { RemoteApprovalClient } from "@/components/guard/RemoteApprovalClient";

export default async function ApprovalPage({
  searchParams
}: {
  searchParams: Promise<{ request?: string; token?: string }>;
}) {
  const { request, token } = await searchParams;
  return <RemoteApprovalClient requestId={request ?? ""} token={token ?? ""} />;
}
