import { NextResponse } from "next/server";
import { promises as fs } from "fs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const JSON_PATH = "/root/luma-os/reports/copilot/latest.json";
const TXT_PATH = "/root/luma-os/reports/copilot/latest.txt";

function safeFallbackFromText(text: string) {
  const alertMatch = text.match(/Alertas:\s*(\d+)/i) || text.match(/Total de alertas encontrados:\s*(\d+)/i);
  const alerts = alertMatch ? Number(alertMatch[1]) : 0;

  const criticalMatch = text.match(/Críticos:\s*(\d+)/i);
  const criticals = criticalMatch ? Number(criticalMatch[1]) : 0;

  const level = criticals > 0 ? "critical" : alerts > 0 ? "attention" : "ok";

  return {
    ok: true,
    source: "sualuma-copilot-text-fallback",
    generated_at: new Date().toISOString(),
    level,
    summary:
      level === "critical"
        ? "Atenção urgente: existem alertas críticos no relatório."
        : level === "attention"
          ? "Sistema online, mas com pontos de atenção."
          : "Sistema estável.",
    alerts,
    criticals,
    suggestions: [
      level === "ok"
        ? "✅ Sistema estável. Continue monitorando antes do lançamento."
        : "⚠️ Verifique o relatório completo do Copiloto.",
    ],
    checks: [],
    report_path: TXT_PATH,
  };
}

export async function GET() {
  try {
    const raw = await fs.readFile(JSON_PATH, "utf-8");
    const data = JSON.parse(raw);

    return NextResponse.json(
      {
        ok: true,
        ...data,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch {
    try {
      const text = await fs.readFile(TXT_PATH, "utf-8");
      return NextResponse.json(safeFallbackFromText(text), {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      });
    } catch {
      return NextResponse.json(
        {
          ok: false,
          source: "sualuma-copilot",
          level: "attention",
          summary: "Ainda não existe relatório do Copiloto. Rode tools/sualuma-copilot-local.sh.",
          alerts: 1,
          criticals: 0,
          suggestions: ["⚠️ Rode o Copiloto para gerar o primeiro relatório."],
          checks: [],
        },
        { status: 200 }
      );
    }
  }
}
