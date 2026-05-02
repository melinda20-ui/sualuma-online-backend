import { NextRequest, NextResponse } from "next/server";
import { getStudioDashboardData } from "@/lib/studio/studio-dashboard-store";

export const runtime = "nodejs";

type AnyRecord = Record<string, any>;

function cleanText(value: unknown) {
  return String(value || "").trim();
}

function taskIsPending(task: AnyRecord) {
  const status = String(task?.status || "").toLowerCase();
  return !["done", "feito", "completed", "concluido", "concluído", "finalizado"].includes(status);
}

function buildMiaReply(message: string, dashboard: AnyRecord) {
  const source = dashboard?.source || "unknown";
  const cards = Array.isArray(dashboard?.cards) ? dashboard.cards : [];
  const tasks = Array.isArray(dashboard?.tasks) ? dashboard.tasks : [];
  const events = Array.isArray(dashboard?.events) ? dashboard.events : [];

  const pendingTasks = tasks.filter(taskIsPending);

  const cardLines = cards
    .slice(0, 8)
    .map((card: AnyRecord) => `• ${card.title}: ${card.value || "sem valor"} — ${card.subtitle || "sem descrição"}`)
    .join("\n");

  const taskLines = pendingTasks
    .slice(0, 8)
    .map((task: AnyRecord) => `• [${task.priority || "média"}] ${task.title} — ${task.plain_explanation || task.area || "sem detalhe"}`)
    .join("\n");

  const eventLines = events
    .slice(0, 5)
    .map((event: AnyRecord) => `• ${event.title}: ${event.description || event.type || "sem detalhe"}`)
    .join("\n");

  const bancoOk = source === "database";

  return [
    "Luma, li o estado atual do Studio Luma.",
    "",
    bancoOk
      ? "✅ O banco de dados está conectado. O painel está lendo dados reais do Supabase/Postgres."
      : "⚠️ O painel ainda está em fallback. Ele funciona, mas não está lendo 100% do banco real.",
    "",
    "📌 Cards ativos:",
    cardLines || "• Nenhum card encontrado.",
    "",
    "🧩 Tarefas pendentes antes do lançamento:",
    taskLines || "• Nenhuma tarefa pendente encontrada.",
    "",
    "🕒 Eventos recentes:",
    eventLines || "• Nenhum evento recente encontrado.",
    "",
    "Minha leitura prática:",
    bancoOk
      ? "Você já tem a base do Studio conectada. Agora o próximo passo é fazer os botões e áreas visuais escreverem no banco, não só lerem."
      : "Antes do lançamento, precisamos tirar o painel do fallback e garantir leitura real do banco.",
    "",
    message
      ? `Pedido que eu analisei: "${message}"`
      : "Pode me perguntar o estado do Studio, tarefas, alertas, cards, lançamento, agentes ou banco."
  ].join("\n");
}

async function safeLog(payload: AnyRecord) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) return;

  try {
    await fetch(`${supabaseUrl}/rest/v1/mia_brain_usage_logs`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        id: `mia_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        status: "success",
        resource: "studio_dashboard",
        input: payload.message || "",
        output: payload.reply || "",
        metadata: {
          source: payload.source || "unknown",
          generatedAt: new Date().toISOString(),
        },
      }),
    });
  } catch (error: any) {
    console.warn("[Mia Brain] Log ignorado para não travar resposta:", error?.message || String(error));
  }
}

export async function GET() {
  const dashboard = await getStudioDashboardData();

  return NextResponse.json({
    ok: true,
    message: "Mia Brain conectada ao Studio Dashboard.",
    source: dashboard.source,
    dashboard,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const message = cleanText(body.message || body.prompt || body.content || body.text);

    const dashboard = await getStudioDashboardData();
    const reply = buildMiaReply(message, dashboard);

    await safeLog({
      message,
      reply,
      source: dashboard.source,
    });

    return NextResponse.json({
      ok: true,
      source: dashboard.source,
      message: "Mia Brain respondeu usando o estado atual do Studio Luma.",
      reply,
      answer: reply,
      dashboard: {
        cards: dashboard.cards,
        tasks: dashboard.tasks,
        events: dashboard.events,
        generatedAt: dashboard.generatedAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
