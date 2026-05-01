import { NextRequest, NextResponse } from "next/server";
import { getAdminAgents, patchAdminAgent, upsertAdminAgent } from "@/lib/studio/admin-agents-store";

export const runtime = "nodejs";

export async function GET() {
  const agents = await getAdminAgents();
  return NextResponse.json({ agents });
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";

    if (!id) {
      return NextResponse.json({ error: "ID do agente não enviado." }, { status: 400 });
    }

    const allowedPatch = {
      name: typeof body.name === "string" ? body.name : undefined,
      role: typeof body.role === "string" ? body.role : undefined,
      status: ["online", "busy", "offline"].includes(body.status) ? body.status : undefined,
      skills: Array.isArray(body.skills) ? body.skills.filter((item: unknown) => typeof item === "string") : undefined,
      systemPrompt: typeof body.systemPrompt === "string" ? body.systemPrompt : undefined,
      behaviorRules: Array.isArray(body.behaviorRules)
        ? body.behaviorRules.filter((item: unknown) => typeof item === "string")
        : undefined,
      installed: typeof body.installed === "boolean" ? body.installed : undefined,
      isAdminAgent: typeof body.isAdminAgent === "boolean" ? body.isAdminAgent : undefined,
      route: typeof body.route === "string" ? body.route : undefined,
    };

    const updated = await patchAdminAgent(id, allowedPatch);

    return NextResponse.json({ agent: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao atualizar agente." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json({ error: "Nome do agente é obrigatório." }, { status: 400 });
    }

    const agent = await upsertAdminAgent({
      id: typeof body.id === "string" ? body.id : undefined,
      name: body.name,
      role: typeof body.role === "string" ? body.role : "Agente administrativo",
      initials: typeof body.initials === "string" ? body.initials : undefined,
      color: typeof body.color === "string" ? body.color : undefined,
      bg: typeof body.bg === "string" ? body.bg : undefined,
      skills: Array.isArray(body.skills) ? body.skills.filter((item: unknown) => typeof item === "string") : [],
      systemPrompt: typeof body.systemPrompt === "string" ? body.systemPrompt : undefined,
      behaviorRules: Array.isArray(body.behaviorRules)
        ? body.behaviorRules.filter((item: unknown) => typeof item === "string")
        : [],
      source: "manual",
      isAdminAgent: true,
      installed: true,
      status: "online",
    });

    return NextResponse.json({ agent });
  } catch {
    return NextResponse.json({ error: "Erro ao criar agente." }, { status: 500 });
  }
}
