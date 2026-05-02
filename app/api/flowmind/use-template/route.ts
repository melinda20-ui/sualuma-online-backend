import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { generateWorkspaceFromTemplate } from "../../../flowmind/lib/templateEngine";

type TemplateUse = {
  slug: string;
  name: string;
  userId: string;
  workspaceId: string;
  status: "activated";
  createdAt: string;
};

async function readJsonArray<T>(filePath: string): Promise<T[]> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const slug = String(body.slug || "").replace(/[^a-z0-9-]/g, "");
    const name = String(body.name || "");
    const userId = String(body.userId || "demo-user");

    if (!slug || !name) {
      return NextResponse.json(
        { ok: false, error: "Template inválido." },
        { status: 400 }
      );
    }

    const dataDir = path.join(process.cwd(), "data");
    const usesPath = path.join(dataDir, "flowmind-template-uses.json");
    const workspacesPath = path.join(dataDir, "flowmind-workspaces.json");

    await fs.mkdir(dataDir, { recursive: true });

    const workspace = generateWorkspaceFromTemplate({ slug, userId });

    const currentUses = await readJsonArray<TemplateUse>(usesPath);
    const currentWorkspaces = await readJsonArray(workspacesPath);

    const record: TemplateUse = {
      slug,
      name,
      userId,
      workspaceId: workspace.id,
      status: "activated",
      createdAt: new Date().toISOString(),
    };

    currentUses.unshift(record);
    currentWorkspaces.unshift(workspace);

    await fs.writeFile(usesPath, JSON.stringify(currentUses, null, 2));
    await fs.writeFile(workspacesPath, JSON.stringify(currentWorkspaces, null, 2));

    return NextResponse.json({
      ok: true,
      template: record,
      workspace,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Erro interno ao ativar template." },
      { status: 500 }
    );
  }
}
