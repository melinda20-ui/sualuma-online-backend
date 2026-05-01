import { NextRequest, NextResponse } from "next/server";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REPORT_DIR = path.join(process.cwd(), "reports", "copilot");
const REPORT_FILE = path.join(REPORT_DIR, "launch-auditor.json");
const STATE_FILE = path.join(REPORT_DIR, "kanban-state.json");
const MEMORY_FILE = path.join(REPORT_DIR, "copilot-chat-memory.json");

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

function norm(text: any) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function slugify(text: string) {
  return norm(text).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 90);
}

function areaFromText(text: string) {
  const t = norm(text);
  if (t.includes("stripe") || t.includes("checkout") || t.includes("pagamento") || t.includes("webhook")) return "Pagamentos";
  if (t.includes("usuario") || t.includes("login") || t.includes("cadastro") || t.includes("confirmacao") || t.includes("email")) return "Usuários";
  if (t.includes("ufw") || t.includes("firewall") || t.includes("vulnerabilidade") || t.includes("seguranca") || t.includes("audit")) return "Segurança";
  if (t.includes("studio") || t.includes("painel") || t.includes("dashboard")) return "Studio";
  if (t.includes("api") || t.includes("endpoint") || t.includes("rota")) return "APIs";
  if (t.includes("build") || t.includes("next")) return "Build";
  if (t.includes("git") || t.includes("codigo") || t.includes("alteracao")) return "Código";
  if (t.includes("ia") || t.includes("mia") || t.includes("chat") || t.includes("copiloto")) return "IA";
  return "Sistema";
}

function severity(value: any) {
  const s = norm(value);
  if (s.includes("alta") || s.includes("high") || s.includes("critical") || s.includes("critica")) return "alta";
  if (s.includes("baixa") || s.includes("low")) return "baixa";
  return "media";
}

function inferLane(task: any) {
  const raw = norm(`${task.laneId || ""} ${task.status || ""}`);

  if (raw.includes("validated") || raw.includes("concluido") || raw.includes("ativado")) return "validated";
  if (raw.includes("review") || raw.includes("verificar")) return "review";
  if (raw.includes("doing") || raw.includes("andamento") || raw.includes("execucao")) return "doing";
  if (raw.includes("wait") || raw.includes("esperar")) return "wait";
  if (raw.includes("urgent") || raw.includes("urgente")) return "urgent";

  return severity(task.severity) === "alta" ? "urgent" : "wait";
}

function normalizeTask(task: any) {
  const title = task.title || task.name || "Tarefa sem título";
  const text = `${title} ${task.area || ""} ${task.plain_explanation || ""} ${task.proof || ""}`;

  return {
    id: task.id || slugify(title),
    title,
    area: task.area || areaFromText(text),
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
}

function loadReportTasks() {
  const raw = readJson(REPORT_FILE, { tasks: [] });
  const report = raw.report || raw;
  const tasks = Array.isArray(report.tasks) ? report.tasks.map(normalizeTask) : [];
  return { report, tasks };
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

function loadMemory() {
  return readJson(MEMORY_FILE, {
    updated_at: new Date().toISOString(),
    learned: [
      "Continuar o raciocínio da última conversa.",
      "Operar o Kanban quando a Luma pedir.",
      "Responder de forma leiga, clara e direta."
    ],
    messages: []
  });
}

function saveMemory(memory: any) {
  memory.updated_at = new Date().toISOString();
  memory.messages = Array.isArray(memory.messages) ? memory.messages.slice(-80) : [];
  writeJson(MEMORY_FILE, memory);
}

function getTasks(state: any) {
  const { tasks } = loadReportTasks();

  const merged = tasks.map((task: any) => {
    const override = state.taskOverrides?.[task.id] || {};
    return normalizeTask({ ...task, ...override, id: task.id });
  });

  return [...merged, ...state.customTasks.map(normalizeTask)];
}

function laneFromMessage(state: any, message: string) {
  const m = norm(message);

  if (m.includes("urgente")) return "urgent";
  if (m.includes("andamento") || m.includes("resolvido") || m.includes("execucao") || m.includes("executando")) return "doing";
  if (m.includes("esperar") || m.includes("pode esperar") || m.includes("depois")) return "wait";
  if (m.includes("verificar") || m.includes("revisar") || m.includes("validar")) return "review";
  if (m.includes("concluido") || m.includes("ativado") || m.includes("finalizado") || m.includes("pronto")) return "validated";

  for (const lane of state.lanes) {
    if (m.includes(norm(lane.title))) return lane.id;
  }

  return "";
}

function findTasks(tasks: any[], message: string) {
  const m = norm(message);
  const words = m.split(/[^a-z0-9]+/).filter((w) => w.length >= 4);

  const scored = tasks.map((task) => {
    const blob = norm(`${task.title} ${task.area} ${task.plain_explanation} ${task.proof}`);
    let score = 0;

    if (m.includes(norm(task.title))) score += 20;
    if (m.includes(norm(task.area))) score += 8;

    for (const word of words) {
      if (blob.includes(word)) score += 2;
    }

    return { task, score };
  }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score);

  if (!scored.length) return [];

  const top = scored[0].score;
  return scored.filter((x) => x.score >= Math.max(2, top - 3)).map((x) => x.task);
}

function saveOverride(state: any, task: any, patch: any) {
  state.taskOverrides[task.id] = {
    ...(state.taskOverrides[task.id] || {}),
    ...patch
  };
}

function formatByLane(state: any, tasks: any[]) {
  return state.lanes.map((lane: any) => {
    const list = tasks.filter((t) => t.laneId === lane.id);

    if (!list.length) return `${lane.title}: nenhuma tarefa.`;

    return `${lane.title}:
${list.map((t, i) => `${i + 1}. ${t.title} — Área: ${t.area} — Gravidade: ${t.severity}`).join("\n")}`;
  }).join("\n\n");
}

function createLane(state: any, message: string) {
  const match = message.match(/(?:cria|criar|adicione|adiciona|nova|novo).{0,35}(?:categoria|coluna|lista).{0,25}(?:chamada|chamado|nome)?\s*["“']?([^"”'\n]+)["”']?/i);
  if (!match?.[1]) return "";

  const title = match[1].trim().replace(/[.!?]+$/, "");
  const id = slugify(title);

  if (!state.lanes.some((l: any) => l.id === id || norm(l.title) === norm(title))) {
    state.lanes.push({ id, title, subtitle: "Categoria criada pelo chat do Copiloto." });
  }

  state.activity.push({ at: new Date().toISOString(), type: "create-lane", title });
  saveState(state);

  return `Criei a categoria "${title}" no Kanban.`;
}

function createTask(state: any, message: string) {
  const match = message.match(/(?:cria|criar|adicione|adiciona|nova|novo).{0,35}(?:tarefa|card).{0,25}(?:chamada|chamado|nome)?\s*["“']?([^"”'\n]+)["”']?/i);
  if (!match?.[1]) return "";

  const title = match[1].trim().replace(/[.!?]+$/, "");
  const laneId = laneFromMessage(state, message) || "urgent";
  const area = areaFromText(message + " " + title);

  const task = normalizeTask({
    id: `custom-${slugify(title)}`,
    title,
    area,
    severity: laneId === "urgent" ? "alta" : "media",
    laneId,
    status: laneId,
    plain_explanation: "Tarefa criada pelo chat do Copiloto.",
    proof: "Criada manualmente por comando."
  });

  if (!state.customTasks.some((t: any) => t.id === task.id)) {
    state.customTasks.push(task);
  }

  state.activity.push({ at: new Date().toISOString(), type: "create-task", taskId: task.id });
  saveState(state);

  return `Criei a tarefa "${title}" na área ${area} e coloquei na coluna "${state.lanes.find((l: any) => l.id === laneId)?.title || laneId}".`;
}

function moveTask(state: any, tasks: any[], message: string) {
  const m = norm(message);
  const wantsMove = m.includes("move") || m.includes("mover") || m.includes("coloca") || m.includes("colocar") || m.includes("manda") || m.includes("joga");

  if (!wantsMove) return "";

  const laneId = laneFromMessage(state, message);
  if (!laneId) return "Entendi que você quer mover uma tarefa, mas não entendi para qual coluna.";

  const found = findTasks(tasks, message);

  if (!found.length) {
    return "Entendi a coluna, mas não encontrei a tarefa. Exemplo: “move a tarefa do Stripe para urgente”.";
  }

  if (found.length > 5) {
    return `Achei várias tarefas parecidas. Para não bagunçar o Kanban, escolha uma:

${found.slice(0, 8).map((t, i) => `${i + 1}. ${t.title} — Área: ${t.area}`).join("\n")}`;
  }

  for (const task of found) {
    saveOverride(state, task, { laneId, status: laneId });
  }

  state.activity.push({
    at: new Date().toISOString(),
    type: "move-task",
    laneId,
    tasks: found.map((t) => t.id)
  });

  saveState(state);

  return `Movi ${found.length} tarefa(s) para "${state.lanes.find((l: any) => l.id === laneId)?.title || laneId}":

${found.map((t, i) => `${i + 1}. ${t.title} — Área: ${t.area}`).join("\n")}`;
}

function organize(state: any, tasks: any[]) {
  for (const task of tasks) {
    const text = norm(`${task.title} ${task.area} ${task.plain_explanation}`);
    let laneId = "wait";

    if (
      task.severity === "alta" ||
      text.includes("usuario") ||
      text.includes("login") ||
      text.includes("cadastro") ||
      text.includes("confirmacao") ||
      text.includes("stripe") ||
      text.includes("webhook") ||
      text.includes("pagamento")
    ) {
      laneId = "urgent";
    }

    if (text.includes("ufw") || text.includes("npm audit") || text.includes("atualizacao")) {
      laneId = "wait";
    }

    saveOverride(state, task, { laneId, status: laneId });
  }

  state.activity.push({ at: new Date().toISOString(), type: "organize-launch" });
  saveState(state);

  return `Organizei o Kanban por prioridade de lançamento:

${formatByLane(state, getTasks(state))}`;
}

function answer(message: string) {
  const state = loadState();
  const memory = loadMemory();
  let tasks = getTasks(state);

  memory.messages.push({ role: "user", content: message, at: new Date().toISOString() });

  let response =
    createLane(state, message) ||
    createTask(state, message) ||
    moveTask(state, tasks, message);

  const m = norm(message);

  if (!response && (m.includes("organiza") || m.includes("categoriza") || m.includes("prioridade"))) {
    response = organize(state, tasks);
  }

  tasks = getTasks(loadState());

  if (!response && (m.includes("kanban") || m.includes("visual") || m.includes("tudo que precisa") || m.includes("antes de"))) {
    response = `Aqui está o Kanban organizado por prioridade:

${formatByLane(loadState(), tasks)}`;
  }

  if (!response) {
    const found = findTasks(tasks, message);

    if (found.length) {
      response = `Encontrei estas tarefas relacionadas:

${found.slice(0, 8).map((t, i) => `${i + 1}. ${t.title}
Área: ${t.area}
Gravidade: ${t.severity}
Coluna: ${loadState().lanes.find((l: any) => l.id === t.laneId)?.title || t.laneId}
Explicação: ${t.plain_explanation}`).join("\n\n")}`;
    } else {
      response = `Entendi, mas ainda não consegui transformar isso em ação segura.

Tente assim:
- cria uma categoria chamada Pós-lançamento
- cria uma tarefa chamada Corrigir confirmação de e-mail em Usuários
- move a tarefa do Stripe para urgente
- coloca segurança em pode esperar
- organiza tudo por prioridade antes do lançamento`;
    }
  }

  memory.messages.push({ role: "assistant", content: response, at: new Date().toISOString() });
  saveMemory(memory);

  return {
    ok: true,
    source: "copilot-operational-brain-no-exec",
    answer: response,
    lanes: loadState().lanes,
    tasks: getTasks(loadState()),
    memory
  };
}

export async function POST(req: NextRequest) {
  ensureDir();

  const body = await req.json().catch(() => ({}));
  const message = String(body.message || body.content || body.prompt || "").trim();

  if (!message) {
    return NextResponse.json({ ok: false, error: "Mensagem vazia." }, { status: 400 });
  }

  return NextResponse.json(answer(message), { headers: { "cache-control": "no-store" } });
}

export async function GET() {
  ensureDir();

  const state = loadState();
  const memory = loadMemory();

  return NextResponse.json({
    ok: true,
    source: "copilot-operational-brain-no-exec",
    lanes: state.lanes,
    tasks: getTasks(state),
    memory
  }, { headers: { "cache-control": "no-store" } });
}
