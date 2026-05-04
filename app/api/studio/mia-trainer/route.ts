import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_GOAL =
  "Audite o cérebro da Mia, verifique prompt, memória, skills, APIs, orquestração e diga o que precisa melhorar para ela funcionar como chefe dos agentes do Studio.";

function normalizeAnswer(data: any) {
  return (
    data?.answer ||
    data?.content ||
    data?.summary ||
    data?.message ||
    "O agente mia-trainer respondeu, mas não trouxe um texto principal."
  );
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    name: "Mia Trainer",
    description: "Agente focado em treinar, monitorar e melhorar o cérebro da Mia.",
    skill: "mia-trainer",
    blue_brain_url: process.env.BLUE_BRAIN_URL || "não configurado"
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const goal = String(body.goal || body.message || DEFAULT_GOAL).trim();

    const blueUrl = process.env.BLUE_BRAIN_URL;
    const brainKey = process.env.BRAIN_API_KEY;

    if (!blueUrl) {
      return NextResponse.json(
        { ok: false, error: "BLUE_BRAIN_URL não configurado no .env.local." },
        { status: 500 }
      );
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };

    if (brainKey) {
      headers["x-brain-key"] = brainKey;
      headers["x-api-key"] = brainKey;
      headers["Authorization"] = `Bearer ${brainKey}`;
    }

    const response = await fetch(`${blueUrl}/v1/panel/task`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        skill: "mia-trainer",
        goal,
        mode: "assist"
      }),
      cache: "no-store"
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "Falha ao chamar o Cérebro Azul.",
          status: response.status,
          details: data
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      agent: "mia-trainer",
      title: data?.title || "Treinador da Mia",
      answer: normalizeAnswer(data),
      data
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Erro desconhecido."
      },
      { status: 500 }
    );
  }
}
