import { NextRequest, NextResponse } from "next/server";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REPORT_DIR = path.join(process.cwd(), "reports", "copilot");
const REPORT_FILE = path.join(REPORT_DIR, "launch-auditor.json");
const STATE_FILE = path.join(REPORT_DIR, "kanban-state.json");

const DEFAULT_LANES = [
  { id: "urgent", title: "Urgente", subtitle: "Precisa resolver antes de receber usuários." },
  { id: "doing", title: "Já está sendo resolvido", subtitle: "Em execução por você ou pela IA." },
  { id: "wait", title: "Pode esperar", subtitle: "Importante, mas não trava o lançamento." },
  { id: "review", title: "Verificar", subtitle: "Você mexeu e quer validação real." },
  { id: "validated", title: "Concluído e ativado", subtitle: "Confirmado pelo Copiloto." }
];

function ensureDir() {
  if (!existsSync(REPORT_DIR)) mkdirSync(REPORT_DIR, { recursive: true });
}

function readJson(file: string, fallback: any) {
  try {
    if (!existsSync(file)) return fallback;
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(file: string, data: any) {
  ensureDir();
  writeFileSync(file, JSON.stringify(data, null, 2));
}

function slugify(text: string) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 90);
}

function norm(text: any) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function severity(value: any) {
  const s = norm(value);
  if (s.includes("alta") || s.includes("high") || s.includes("critical") || s.includes("critica")) return "alta";
  if (s.includes("baixa") || s.includes("low")) return "baixa";
  return "media";
}

function inferArea(task: any) {
  const text = norm(`${task.title || ""} ${task.area || ""} ${task.plain_explanation || ""} ${task.proof || ""}`);

  if (text.includes("stripe") || text.includes("checkout") || text.includes("pagamento") || text.includes("webhook")) return "Pagamentos";
  if (text.includes("usuario") || text.includes("login") || text.includes("cadastro") || text.includes("confirmacao") || text.includes("email")) return "Usuários";
  if (text.includes("ufw") || text.includes("firewall") || text.includes("vulnerabilidade") || text.includes("audit") || text.includes("seguranca")) return "Segurança";
  if (text.includes("studio") || text.includes("dashboard") || text.includes("painel")) return "Studio";
  if (text.includes("api") || text.includes("endpoint") || text.includes("rota")) return "APIs";
  if (text.includes("build") || text.includes("next")) return "Build";
  if (text.includes("git") || text.includes("codigo") || text.includes("alteracoes")) return "Código";
  if (text.includes("ia") || text.includes("mia") || text.includes("chat") || text.includes("copiloto")) return "IA";

  return task.area || "Sistema";
}

function inferLane(task: any) {
  const raw = norm(`${task.laneId || ""} ${task.status || ""}`);

  if (raw.includes("validated") || raw.includes("concluido") || raw.includes("ativado") || raw.includes("done")) return "validated";
  if (raw.includes("review") || raw.includes("verificar")) return "review";
  if (raw.includes("doing") || raw.includes("andamento") || raw.includes("execucao")) return "doing";
  if (raw.includes("wait") || raw.includes("esperar")) return "wait";
  if (raw.includes("urgent") || raw.includes("urgente")) return "urgent";

  return severity(task.severity) === "alta" ? "urgent" : "wait";
}

function normalizeTask(task: any) {
  const title = task.title || task.name || "Tarefa sem título";
  const normalized = {
    id: task.id || slugify(title),
    title,
    area: task.area || "Sistema",
    severity: severity(task.severity),
    status: task.status || "todo",
    laneId: task.laneId || inferLane(task),
    plain_explanation:
      task.plain_explanation ||
      task.plainExplanation ||
      task.detail ||
      task.description ||
      "Sem explicação leiga ainda.",
    proof: task.proof || task.evidence || task.source || ""
  };

  normalized.area = inferArea(normalized);
  return normalized;
}

function loadReport() {
  const raw = readJson(REPORT_FILE, {
    name: "Sualuma Launch Auditor",
    generated_at: new Date().toISOString(),
    score: 0,
    summary: "Relatório ainda não foi gerado.",
    tasks: []
  });

  const report = raw.report || raw;
  const tasks = Array.isArray(report.tasks) ? report.tasks.map(normalizeTask) : [];

  return { ...report, tasks };
}

function loadState() {
  const state = readJson(STATE_FILE, null);

  if (!state) {
    return {
      updated_at: new Date().toISOString(),
      lanes: DEFAULT_LANES,
      taskOverrides: {},
      customTasks: [],
      activity: []
    };
  }

  return {
    updated_at: state.updated_at || new Date().toISOString(),
    lanes: Array.isArray(state.lanes) && state.lanes.length ? state.lanes : DEFAULT_LANES,
    taskOverrides: state.taskOverrides || {},
    customTasks: Array.isArray(state.customTasks) ? state.customTasks : [],
    activity: Array.isArray(state.activity) ? state.activity : []
  };
}

function saveState(state: any) {
  state.updated_at = new Date().toISOString();
  writeJson(STATE_FILE, state);
}

function board() {
  const report = loadReport();
  const state = loadState();

  const reportTasks = report.tasks.map((task: any) => {
    const override = state.taskOverrides?.[task.id] || {};
    return normalizeTask({ ...task, ...override, id: task.id });
  });

  const customTasks = state.customTasks.map(normalizeTask);
  const tasks = [...reportTasks, ...customTasks];

  const counts = {
    total: tasks.length,
    open: tasks.filter((t) => t.laneId !== "validated").length,
    high: tasks.filter((t) => t.severity === "alta").length,
    medium: tasks.filter((t) => t.severity === "media").length,
    low: tasks.filter((t) => t.severity === "baixa").length,
    validated: tasks.filter((t) => t.laneId === "validated").length
  };

  return {
    ok: true,
    report: { ...report, counts },
    lanes: state.lanes,
    tasks,
    state
  };
}

export async function GET() {
  ensureDir();
  return NextResponse.json(board(), { headers: { "cache-control": "no-store" } });
}

export async function POST(req: NextRequest) {
  ensureDir();

  const body = await req.json().catch(() => ({}));
  const state = loadState();

  const action = body.action || body.type || "load";
  const taskId = body.taskId || body.id;
  const laneId = body.laneId || body.status;

  if ((action === "move" || action === "move-task" || action === "update-task") && taskId && laneId) {
    state.taskOverrides[taskId] = {
      ...(state.taskOverrides[taskId] || {}),
      laneId,
      status: laneId
    };

    state.activity.push({
      at: new Date().toISOString(),
      type: "move-task",
      taskId,
      laneId
    });

    saveState(state);
  }

  if ((action === "verify" || action === "verify-task") && taskId) {
    state.taskOverrides[taskId] = {
      ...(state.taskOverrides[taskId] || {}),
      laneId: "review",
      status: "review"
    };

    state.activity.push({
      at: new Date().toISOString(),
      type: "verify-task",
      taskId
    });

    saveState(state);
  }

  if ((action === "add-lane" || action === "create-lane") && body.title) {
    const title = String(body.title).trim();
    const id = body.id || slugify(title);

    if (!state.lanes.some((lane: any) => lane.id === id)) {
      state.lanes.push({
        id,
        title,
        subtitle: "Categoria criada pelo Copiloto."
      });
    }

    state.activity.push({
      at: new Date().toISOString(),
      type: "create-lane",
      title
    });

    saveState(state);
  }

  if ((action === "add-task" || action === "create-task") && body.title) {
    const task = normalizeTask({
      id: body.id || `custom-${slugify(body.title)}`,
      title: body.title,
      area: body.area || "Sistema",
      severity: body.severity || "media",
      laneId: body.laneId || "urgent",
      plain_explanation: body.description || "Tarefa criada pelo Copiloto.",
      proof: "Criada manualmente no Kanban."
    });

    if (!state.customTasks.some((t: any) => t.id === task.id)) {
      state.customTasks.push(task);
    }

    state.activity.push({
      at: new Date().toISOString(),
      type: "create-task",
      taskId: task.id
    });

    saveState(state);
  }

  return NextResponse.json(board(), { headers: { "cache-control": "no-store" } });
}
