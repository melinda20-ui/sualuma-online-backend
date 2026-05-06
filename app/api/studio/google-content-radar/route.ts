import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const IDEAS_FILE = path.join(process.cwd(), "data", "content-ideas", "ideas.json");

function weightPriority(priority: string) {
  if (priority === "urgent") return 0;
  if (priority === "high") return 1;
  if (priority === "medium") return 2;
  return 3;
}

export async function GET() {
  const raw = JSON.parse(await fs.readFile(IDEAS_FILE, "utf8").catch(() => '{"ideas":[]}'));
  const ideas = Array.isArray(raw.ideas) ? raw.ideas : [];

  const radar = [...ideas]
    .filter((idea) => !["publicado", "pronto_para_publicar"].includes(String(idea.stage || "")))
    .sort((a, b) => {
      const p = weightPriority(String(a.priority || "medium")) - weightPriority(String(b.priority || "medium"));
      if (p !== 0) return p;
      return String(a.category || "").localeCompare(String(b.category || ""));
    })
    .slice(0, 10)
    .map((idea, index) => ({
      rank: index + 1,
      id: idea.id,
      title: idea.title,
      category: idea.category,
      priority: idea.priority,
      stage: idea.stage,
      suggestedAction:
        index === 0
          ? "Selecionar este tema para virar rascunho primeiro."
          : "Manter na fila editorial."
    }));

  return NextResponse.json({
    ok: true,
    updatedAt: new Date().toISOString(),
    sourceOfTruth: "/studio/ideias-conteudo",
    message: "Radar preparado para o futuro Agente Google/SEO olhar tendências e priorizar ideias.",
    radar
  });
}
