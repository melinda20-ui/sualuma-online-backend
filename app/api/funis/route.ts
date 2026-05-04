import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FunilStep = {
  delayDays: number;
  subject: string;
  html: string;
};

type Funil = {
  id: string;
  name: string;
  status: "rascunho" | "ativo";
  steps: FunilStep[];
  createdAt: string;
  updatedAt: string;
  source?: string;
};

const filePath = path.join(process.cwd(), "data", "funis.json");

async function readFunis(): Promise<Funil[]> {
  try {
    const file = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(file);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveFunis(funis: Funil[]) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(funis, null, 2), "utf8");
}

function normalizeSteps(rawSteps: any[]): FunilStep[] {
  const steps = Array.isArray(rawSteps) ? rawSteps : [];

  return steps
    .map((step: any) => ({
      delayDays: Number(step?.delayDays || 0),
      subject: String(step?.subject || "").trim(),
      html: String(step?.html || "").trim(),
    }))
    .filter((step) => step.subject || step.html);
}

export async function GET() {
  const funis = await readFunis();
  return NextResponse.json(funis);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const name = String(body?.name || "").trim();

    if (!name) {
      return NextResponse.json(
        { error: "Nome do funil é obrigatório." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const steps = normalizeSteps(body?.steps || []);

    if (steps.length === 0) {
      steps.push({
        delayDays: 0,
        subject: "Boas-vindas à Sualuma Online",
        html: "<p>Oi {{nome}}, seja bem-vindo(a) à Sualuma Online.</p>",
      });
    }

    const novoFunil: Funil = {
      id: body?.id ? String(body.id) : `${Date.now()}`,
      name,
      status: body?.status === "ativo" ? "ativo" : "rascunho",
      steps,
      createdAt: now,
      updatedAt: now,
      source: body?.source ? String(body.source) : undefined,
    };

    const funis = await readFunis();
    const existsIndex = funis.findIndex((item) => item.id === novoFunil.id);

    if (existsIndex >= 0) {
      novoFunil.createdAt = funis[existsIndex].createdAt || now;
      funis[existsIndex] = novoFunil;
    } else {
      funis.unshift(novoFunil);
    }

    await saveFunis(funis);

    return NextResponse.json(novoFunil, { status: existsIndex >= 0 ? 200 : 201 });
  } catch (error) {
    console.error("Erro ao salvar funil:", error);

    return NextResponse.json(
      { error: "Erro interno ao salvar funil." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    const id = String(body?.id || "").trim();
    const name = String(body?.name || "").trim();

    if (!id) {
      return NextResponse.json({ error: "ID do funil é obrigatório." }, { status: 400 });
    }

    if (!name) {
      return NextResponse.json({ error: "Nome do funil é obrigatório." }, { status: 400 });
    }

    const funis = await readFunis();
    const index = funis.findIndex((item) => item.id === id);

    if (index < 0) {
      return NextResponse.json({ error: "Funil não encontrado." }, { status: 404 });
    }

    const steps = normalizeSteps(body?.steps || []);

    if (steps.length === 0) {
      return NextResponse.json(
        { error: "O funil precisa ter pelo menos um e-mail." },
        { status: 400 }
      );
    }

    const updated: Funil = {
      ...funis[index],
      name,
      status: body?.status === "ativo" ? "ativo" : "rascunho",
      steps,
      updatedAt: new Date().toISOString(),
      source: body?.source ? String(body.source) : funis[index].source,
    };

    funis[index] = updated;
    await saveFunis(funis);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao editar funil:", error);

    return NextResponse.json(
      { error: "Erro interno ao editar funil." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = String(url.searchParams.get("id") || "").trim();

    if (!id) {
      return NextResponse.json({ error: "ID do funil é obrigatório." }, { status: 400 });
    }

    const funis = await readFunis();
    const next = funis.filter((item) => item.id !== id);

    if (next.length === funis.length) {
      return NextResponse.json({ error: "Funil não encontrado." }, { status: 404 });
    }

    await saveFunis(next);

    return NextResponse.json({ ok: true, deleted: id });
  } catch (error) {
    console.error("Erro ao excluir funil:", error);

    return NextResponse.json(
      { error: "Erro interno ao excluir funil." },
      { status: 500 }
    );
  }
}
