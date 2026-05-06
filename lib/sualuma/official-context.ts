import fs from "fs";
import path from "path";

function readJson<T>(relativePath: string, fallback: T): T {
  try {
    const file = path.join(process.cwd(), relativePath);
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function norm(value: unknown) {
  return String(value || "").toLowerCase().trim();
}

function getTasks() {
  const raw = readJson<any>("data/agent-tasks/tasks.json", []);
  return Array.isArray(raw) ? raw : Array.isArray(raw?.tasks) ? raw.tasks : [];
}

export function readOfficialSualumaContext() {
  const plans = readJson<any>("data/sualuma/official-plans.json", {
    officialPlans: [
      { id: "free", name: "Free" },
      { id: "basico", name: "Básico" },
      { id: "prime", name: "Prime" },
      { id: "premium", name: "Premium" },
      { id: "pro_ia_pro", name: "Pro / IA Pro" }
    ]
  });

  const tasks = getTasks();

  const summary = {
    total: tasks.length,
    emEspera: tasks.filter((t: any) => ["open", "waiting", "todo"].includes(norm(t.status))).length,
    emAndamento: tasks.filter((t: any) => ["doing", "in_progress"].includes(norm(t.status))).length,
    concluidas: tasks.filter((t: any) => ["done", "concluido", "concluído", "finalizado"].includes(norm(t.status))).length,
    arquivadas: tasks.filter((t: any) => norm(t.status) === "archived").length,
    urgentesAbertas: tasks.filter(
      (t: any) => norm(t.priority) === "urgent" && !["done", "archived"].includes(norm(t.status))
    ).length,
    altaPrioridadeAbertas: tasks.filter(
      (t: any) => ["urgent", "high"].includes(norm(t.priority)) && !["done", "archived"].includes(norm(t.status))
    ).length
  };

  return {
    updatedAt: new Date().toISOString(),
    sourceOfTruth: {
      planos: "data/sualuma/official-plans.json",
      tarefas: "data/agent-tasks/tasks.json"
    },
    planosOficiaisAtuais: plans,
    tarefasResumoAtual: summary,
    regraAtual: [
      "Os planos oficiais atuais são Free, Básico, Prime, Premium e Pro/IA Pro.",
      "Prime existe e deve ser considerado nas regras atuais.",
      "O painel de tarefas é a fonte viva do status operacional.",
      "Quando uma tarefa muda no Kanban, o agente deve considerar o novo status."
    ]
  };
}
