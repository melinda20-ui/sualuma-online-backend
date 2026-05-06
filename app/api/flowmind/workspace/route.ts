import { NextResponse } from "next/server";
import { getFlowmindTenant } from "@/lib/flowmind-tenant-auth";
import { readTenantJson } from "@/lib/tenant/tenant-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FlowWorkspaceRecord = {
  id?: string;
  userId?: string;
  [key: string]: unknown;
};

export async function GET() {
  const auth = await getFlowmindTenant();

  if (!auth.ok) {
    return auth.response;
  }

  const workspaces = readTenantJson<FlowWorkspaceRecord[]>(
    auth.tenantId,
    "flowmind-workspaces",
    []
  );

  const safeWorkspaces = Array.isArray(workspaces)
    ? workspaces.filter((workspace) => {
        return !workspace.userId || workspace.userId === auth.user.id;
      })
    : [];

  return NextResponse.json({
    ok: true,
    workspaces: safeWorkspaces,
  });
}
