import { NextRequest, NextResponse } from "next/server";
import { generateWorkspaceFromTemplate } from "../../../flowmind/lib/templateEngine";
import { getFlowmindTenant } from "@/lib/flowmind-tenant-auth";
import { readTenantJson, writeTenantJson } from "@/lib/tenant/tenant-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TemplateUse = {
  slug: string;
  name: string;
  userId: string;
  workspaceId: string;
  status: "activated";
  createdAt: string;
};

type FlowWorkspaceRecord = {
  id?: string;
  userId?: string;
  [key: string]: unknown;
};

export async function POST(request: NextRequest) {
  try {
    const auth = await getFlowmindTenant();

    if (!auth.ok) {
      return auth.response;
    }

    const body = await request.json();
    const slug = String(body.slug || "").replace(/[^a-z0-9-]/g, "");
    const name = String(body.name || "");

    if (!slug || !name) {
      return NextResponse.json(
        { ok: false, error: "Template inválido." },
        { status: 400 }
      );
    }

    const workspace = generateWorkspaceFromTemplate({
      slug,
      userId: auth.user.id,
    });

    const currentUses = readTenantJson<TemplateUse[]>(
      auth.tenantId,
      "flowmind-template-uses",
      []
    );

    const currentWorkspaces = readTenantJson<FlowWorkspaceRecord[]>(
      auth.tenantId,
      "flowmind-workspaces",
      []
    );

    const record: TemplateUse = {
      slug,
      name,
      userId: auth.user.id,
      workspaceId: workspace.id,
      status: "activated",
      createdAt: new Date().toISOString(),
    };

    currentUses.unshift(record);
    currentWorkspaces.unshift(workspace);

    writeTenantJson(auth.tenantId, "flowmind-template-uses", currentUses);
    writeTenantJson(auth.tenantId, "flowmind-workspaces", currentWorkspaces);

    return NextResponse.json({
      ok: true,
      template: record,
      workspace,
    });
  } catch (error) {
    console.error("[flowmind/use-template] erro:", error);

    return NextResponse.json(
      { ok: false, error: "Erro interno ao ativar template." },
      { status: 500 }
    );
  }
}
