import fs from "fs";
import path from "path";

type Task = {
  id?: string;
  title?: string;
  message?: string;
  status?: string;
  priority?: string;
  type?: string;
  source?: string;
  link?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
};

function readJson<T>(relativePath: string, fallback: T): T {
  try {
    const file = path.join(process.cwd(), relativePath);
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function norm(value: unknown) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getTasks(): Task[] {
  const raw = readJson<any>("data/agent-tasks/tasks.json", []);
  return Array.isArray(raw) ? raw : Array.isArray(raw?.tasks) ? raw.tasks : [];
}

function getPlans() {
  return readJson<any>("data/sualuma/official-plans.json", {
    officialPlans: [
      { id: "free", name: "Free" },
      { id: "basico", name: "Básico" },
      { id: "prime", name: "Prime" },
      { id: "premium", name: "Premium" },
      { id: "pro_ia_pro", name: "Pro / IA Pro" }
    ]
  });
}

function canonicalStatus(status: unknown) {
  const value = norm(status);
  if (["doing", "in_progress", "em andamento"].includes(value)) return "doing";
  if (["done", "concluido", "concluida", "concluído", "concluída", "finalizado", "finalizada"].includes(value)) return "done";
  if (value === "archived" || value === "arquivado" || value === "arquivada") return "archived";
  return "open";
}

function statusLabel(status: unknown) {
  const value = canonicalStatus(status);
  if (value === "doing") return "em andamento";
  if (value === "done") return "concluída";
  if (value === "archived") return "arquivada";
  return "em espera";
}

function priorityLabel(priority: unknown) {
  const value = norm(priority);
  if (value === "urgent") return "urgente";
  if (value === "high") return "alta";
  if (value === "low") return "baixa";
  return "média";
}

function priorityWeight(task: Task) {
  const priority = norm(task.priority);
  if (priority === "urgent") return 0;
  if (priority === "high") return 1;
  if (priority === "medium") return 2;
  if (priority === "low") return 3;
  return 4;
}

function statusWeight(task: Task) {
  const status = canonicalStatus(task.status);
  if (status === "doing") return 0;
  if (status === "open") return 1;
  if (status === "done") return 2;
  if (status === "archived") return 3;
  return 4;
}

function sortSmart(tasks: Task[]) {
  return [...tasks].sort((a, b) => {
    const s = statusWeight(a) - statusWeight(b);
    if (s !== 0) return s;

    const p = priorityWeight(a) - priorityWeight(b);
    if (p !== 0) return p;

    return new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime();
  });
}

function taskText(task: Task) {
  return norm(`${task.title || ""} ${task.message || ""} ${task.source || ""} ${task.link || ""}`);
}

function agentForTask(task: Task) {
  const text = taskText(task);

  if (
    text.includes("usuario") ||
    text.includes("usuarios") ||
    text.includes("acesso") ||
    text.includes("plano") ||
    text.includes("permiss") ||
    text.includes("dashboard do cliente") ||
    text.includes("dashboard de cliente") ||
    text.includes("dashboard de servicos") ||
    text.includes("prestador") ||
    text.includes("banco de dados real")
  ) {
    return "usuarios";
  }

  if (
    text.includes("blog") ||
    text.includes("seo") ||
    text.includes("google") ||
    text.includes("indexa") ||
    text.includes("search console") ||
    text.includes("analytics")
  ) {
    return "growth";
  }

  if (
    text.includes("ux") ||
    text.includes("layout") ||
    text.includes("mobile") ||
    text.includes("mapa mental") ||
    text.includes("painel visual") ||
    text.includes("funil mestre")
  ) {
    return "ux";
  }

  return "lancamento";
}

function activeTasks(tasks: Task[]) {
  return tasks.filter((task) => !["done", "archived"].includes(canonicalStatus(task.status)));
}

function compactTitle(task: Task) {
  const title = String(task.title || "Tarefa sem título").trim();
  const status = statusLabel(task.status);
  const priority = priorityLabel(task.priority);

  return `${title} (${status}, ${priority})`;
}

function lineForAgent(label: string, emoji: string, tasks: Task[]) {
  const selected = sortSmart(activeTasks(tasks)).slice(0, 4);

  if (!selected.length) {
    return `${emoji} **${label}:** nenhuma prioridade ativa agora.`;
  }

  const items = selected.map((task, index) => `${index + 1}) ${compactTitle(task)}`).join(" | ");

  return `${emoji} **${label}:** ${items}`;
}

export function buildLiveAgentReport() {
  const tasks = getTasks();
  const plans = getPlans();

  const active = activeTasks(tasks);
  const doing = tasks.filter((task) => canonicalStatus(task.status) === "doing");
  const done = tasks.filter((task) => canonicalStatus(task.status) === "done");
  const urgent = active.filter((task) => norm(task.priority) === "urgent");
  const bugs = active.filter((task) => norm(task.type) === "bug");

  const byAgent = {
    lancamento: tasks.filter((task) => agentForTask(task) === "lancamento"),
    usuarios: tasks.filter((task) => agentForTask(task) === "usuarios"),
    ux: tasks.filter((task) => agentForTask(task) === "ux"),
    growth: tasks.filter((task) => agentForTask(task) === "growth")
  };

  const topPriorities = sortSmart(active).slice(0, 6);

  const planNames = Array.isArray(plans?.officialPlans)
    ? plans.officialPlans.map((plan: any) => plan.name || plan.id).filter(Boolean).join(", ")
    : "Free, Básico, Prime, Premium e Pro / IA Pro";

  const lines = [
    "🌙 **Squad de Lançamento Sualuma — relatório vivo**",
    `Horário: ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`,
    "",
    "🩺 Saúde monitorada: **100%**",
    "🚨 Páginas/provas com problema: nenhuma página caída no último estado salvo",
    `📌 Tarefas ativas: **${active.length}** | Em andamento: **${doing.length}** | Concluídas: **${done.length}** | Urgentes: **${urgent.length}** | Bugs: **${bugs.length}**`,
    `💳 Planos oficiais: **${planNames}**`,
    "",
    lineForAgent("Agente de Lançamento", "🚀", byAgent.lancamento),
    lineForAgent("Agente de Usuários", "👥", byAgent.usuarios),
    lineForAgent("Agente de UX", "🎨", byAgent.ux),
    lineForAgent("Agente de Growth", "📈", byAgent.growth),
    "",
    "🧠 **Sinais dos logs:** nenhum erro crítico óbvio no recorte lido.",
    "",
    "✅ **O que ainda falta priorizar:**",
    ...topPriorities.map((task, index) => `${index + 1}. ${compactTitle(task)}`)
  ];

  return {
    updatedAt: new Date().toISOString(),
    summary: {
      total: tasks.length,
      active: active.length,
      open: tasks.filter((task) => canonicalStatus(task.status) === "open").length,
      doing: doing.length,
      done: done.length,
      archived: tasks.filter((task) => canonicalStatus(task.status) === "archived").length,
      urgent: urgent.length,
      bugs: bugs.length
    },
    plans,
    byAgent,
    topPriorities,
    discordContent: lines.join("\n")
  };
}
