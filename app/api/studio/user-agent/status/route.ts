import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { buildLiveAgentReport } from "@/lib/sualuma/live-agent-report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROGRESS_FILE = path.join(process.cwd(), "data/user-access-agent/progress.json");

function readProgress() {
  try {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf8"));
  } catch {
    return {};
  }
}

function onlyUserTasks(tasks: any[]) {
  return tasks.filter((task) => {
    const text = String(`${task.title || ""} ${task.message || ""} ${task.link || ""}`).toLowerCase();
    return (
      text.includes("usuário") ||
      text.includes("usuario") ||
      text.includes("acesso") ||
      text.includes("plano") ||
      text.includes("dashboard") ||
      text.includes("prestador") ||
      text.includes("banco de dados")
    );
  });
}

export async function GET() {
  const report = buildLiveAgentReport();
  const userTasks = onlyUserTasks([
    ...(report.byAgent?.usuarios || []),
    ...(report.topPriorities || [])
  ]);

  return NextResponse.json({
    ok: true,
    updatedAt: new Date().toISOString(),
    name: "User Guard / Agente de Usuários",
    sourceOfTruth: {
      planos: "data/sualuma/official-plans.json",
      tarefas: "data/agent-tasks/tasks.json",
      kanban: "/studio/agentesadms"
    },
    progress: readProgress(),
    plans: report.plans,
    summary: report.summary,
    userTasks,
    rules: [
      "Os planos oficiais atuais são Free, Básico, Prime, Premium e Pro/IA Pro.",
      "Prime existe e deve ser considerado nas regras atuais.",
      "O Agente de Usuários deve ler o Kanban e as tarefas reais antes de responder.",
      "Quando uma tarefa for movida no Kanban, o status dela vira a fonte oficial."
    ]
  });
}
