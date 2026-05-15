import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AGENT_API_BASE = process.env.AGENT_API_URL || "http://localhost:3001";

async function handler(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const apiPath = path.join("/");
  const search = request.nextUrl.search;
  const url = `${AGENT_API_BASE}/api/${apiPath}${search}`;

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const sourceRes = await fetch(url, {
      method: request.method,
      headers,
      body: request.method !== "GET" && request.method !== "HEAD" ? await request.text() : undefined,
      cache: "no-store",
    });

    const body = await sourceRes.text();

    let parsed: unknown;
    try {
      parsed = JSON.parse(body);
    } catch {
      parsed = body;
    }

    return NextResponse.json(parsed, {
      status: sourceRes.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        source: "proxy-error",
        error: error instanceof Error ? error.message : "Erro ao conectar com backend de agentes",
        proxy: { apiPath, baseUrl: AGENT_API_BASE },
      },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
