import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

type TemplateUse = {
  slug: string;
  name: string;
  userId: string;
  status: "requested";
  createdAt: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const slug = String(body.slug || "").replace(/[^a-z0-9-]/g, "");
    const name = String(body.name || "");

    if (!slug || !name) {
      return NextResponse.json(
        { ok: false, error: "Template inválido." },
        { status: 400 }
      );
    }

    const dataDir = path.join(process.cwd(), "data");
    const filePath = path.join(dataDir, "flowmind-template-uses.json");

    await fs.mkdir(dataDir, { recursive: true });

    let current: TemplateUse[] = [];

    try {
      const raw = await fs.readFile(filePath, "utf8");
      current = JSON.parse(raw);
      if (!Array.isArray(current)) current = [];
    } catch {
      current = [];
    }

    const record: TemplateUse = {
      slug,
      name,
      userId: "demo-user",
      status: "requested",
      createdAt: new Date().toISOString(),
    };

    current.unshift(record);

    await fs.writeFile(filePath, JSON.stringify(current, null, 2));

    return NextResponse.json({
      ok: true,
      template: record,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: "Erro interno ao registrar template." },
      { status: 500 }
    );
  }
}
