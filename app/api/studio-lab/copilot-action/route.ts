import { NextRequest, NextResponse } from "next/server";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Lane = {
  id: string;
  title: string;
};

type BoardTask = {
  id: string;
  title: string;
  area: string;
  severity: string;
  lane: string;
  plain_explanation: string;
  evidence: string;
  source: string;
  updated_at?: string;
};

type State = {
  version: number;
  lanes: Lane[];
  overrides: Record<string, { lane?: string; note?: string; updated_at?: string }>;
  customTasks: BoardTask[];
  archivedTasks: Record<string, BoardTask>;
};

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
};

type Memory = {
  version: number;
  messages: ChatMessage[];
  lessons: string[];
  updated_at: string;
};

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "reports", "copilot");
const REPORT_FILE = path.join(DATA_DIR, "launch-auditor.json");
const STATE_FILE = path.join(DATA_DIR, "kanban-state.json");
const MEMORY_FILE = path.join(DATA_DIR, "copilot-chat-memory.json");

const DEFAULT_LANES: Lane[] = [
  { id: "urgent", title: "Urgente antes do lançamento" },
  { id: "doing", title: "Já está sendo resolvido" },
  { id: "wait", title: "Pode esperar" },
  { id: "review", title: "Verificar" },
  { id: "validated", title: "Concluído e ativado" },
];

function ensureDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function readJson<T>(file: string, fallback: T): T {
  try {
    if (!existsSync(file)) return fallback;
    return JSON.parse(readFileSync(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function writeJson(file: string, data: unknown) {
  ensureDir();
  writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

function now() {
  return new Date().toISOString();
}

function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60) || `item-${Date.now()}`;
}

function defaultState(): State {
  return {
    version: 1,
    lanes: DEFAULT_LANES,
    overrides: {},
    customTasks: [],
    archivedTasks: {},
  };
}

function readState(): State {
  const state = readJson<State>(STATE_FILE, defaultState());
  const lanes = Array.isArray(state.lanes) && state.lanes.length ? state.lanes : DEFAULT_LANES;
  return {
    version: 1,
    lanes,
    overrides: state.overrides || {},
    customTasks: Array.isArray(state.customTasks) ? state.customTasks : [],
    archivedTasks: state.archivedTasks || {},
  };
}

function saveState(state: State) {
  writeJson(STATE_FILE, state);
}

function defaultMemory(): Memory {
  return {
    version: 1,
    messages: [
      {
        role: "assistant",
        content:
          "Oi, Luma. Agora eu tenho memória e posso operar o Kanban. Pode pedir para criar categoria, criar card, mover tarefa, verificar tarefa e guardar aprendizados.",
        created_at: now(),
      },
    ],
    lessons: [],
    updated_at: now(),
  };
}

function readMemory(): Memory {
  const memory = readJson<Memory>(MEMORY_FILE, defaultMemory());
  return {
    version: 1,
    messages: Array.isArray(memory.messages) ? memory.messages.slice(-120) : [],
    lessons: Array.isArray(memory.lessons) ? memory.lessons.slice(-80) : [],
    updated_at: memory.updated_at || now(),
  };
}

function saveMemory(memory: Memory) {
  memory.messages = memory.messages.slice(-120);
  memory.lessons = memory.lessons.slice(-80);
  memory.updated_at = now();
  writeJson(MEMORY_FILE, memory);
}

function textify(value: any): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function laneFromTask(task: any): string {
  const status = String(task?.status || "").toLowerCase();
  const severity = String(task?.severity || task?.gravidade || "").toLowerCase();

  if (status.includes("valid") || status.includes("done") || status.includes("conclu") || status.includes("ativ")) return "validated";
  if (status.includes("review") || status.includes("verific")) return "review";
  if (status.includes("doing") || status.includes("andamento") || status.includes("resolv")) return "doing";
  if (severity.includes("alta") || severity.includes("high") || severity.includes("crit")) return "urgent";
  return "wait";
}

function normalizeTask(task: any, index: number): BoardTask {
  const id = String(task?.id || slugify(`${task?.title || "tarefa"}-${index}`));
  const title = String(task?.title || task?.titulo || `Tarefa ${index + 1}`);
  const area = String(task?.area || task?.category || task?.categoria || "Sistema");
  const severity = String(task?.severity || task?.gravidade || "media");
  const plain =
    task?.plain_explanation ||
    task?.plainExplanation ||
    task?.explanation ||
    task?.explicacao ||
    task?.description ||
    "O Copiloto encontrou esse ponto como algo que precisa de atenção.";
  const evidence = task?.evidence || task?.proof || task?.prova || task?.details || task?.raw || "";

  return {
    id,
    title,
    area,
    severity,
    lane: laneFromTask(task),
    plain_explanation: textify(plain),
    evidence: textify(evidence),
    source: "Relatório do Copiloto",
    updated_at: now(),
  };
}

function readReport(): any {
  return readJson<any>(REPORT_FILE, {
    ok: false,
    name: "Sualuma Launch Auditor",
    score: 0,
    summary: "Ainda não encontrei relatório do Launch Auditor.",
    tasks: [],
    sections: [],
    generated_at: null,
  });
}

function getReportTasks(): BoardTask[] {
  const report = readReport();
  const tasks = Array.isArray(report.tasks) ? report.tasks : [];
  return tasks.map((task: any, index: number) => normalizeTask(task, index));
}

function buildBoard() {
  const state = readState();
  const report = readReport();
  const reportTasks = getReportTasks();

  for (const task of reportTasks) {
    state.archivedTasks[task.id] = task;
  }

  const customTasks = state.customTasks || [];
  const byId = new Map<string, BoardTask>();

  for (const task of reportTasks) byId.set(task.id, task);
  for (const task of customTasks) byId.set(task.id, { ...task, source: task.source || "Criado pelo chat" });

  for (const [id, override] of Object.entries(state.overrides || {})) {
    const current = byId.get(id) || state.archivedTasks[id];
    if (current) {
      byId.set(id, {
        ...current,
        lane: override.lane || current.lane,
        updated_at: override.updated_at || current.updated_at,
      });
    }
  }

  const tasks = Array.from(byId.values());
  saveState(state);

  return {
    ok: true,
    report: {
      name: report.name || "Sualuma Launch Auditor",
      generated_at: report.generated_at || null,
      score: report.score ?? 0,
      summary: report.summary || "Sistema em auditoria.",
      counts: report.counts || {},
      sections: report.sections || [],
    },
    lanes: state.lanes,
    tasks,
    memory: readMemory(),
  };
}

function tokens(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter((t) => t.length >= 3 && !["para", "como", "uma", "das", "dos", "que", "com", "sem", "por", "pra"].includes(t));
}

function findTask(message: string, tasks: BoardTask[]) {
  const normalized = message.toLowerCase();
  for (const task of tasks) {
    if (normalized.includes(task.id.toLowerCase())) return task;
  }

  const q = tokens(message);
  let best: { task: BoardTask; score: number } | null = null;

  for (const task of tasks) {
    const haystack = `${task.title} ${task.area} ${task.plain_explanation} ${task.evidence}`
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    let score = 0;
    for (const token of q) {
      if (haystack.includes(token)) score += 1;
    }

    if (!best || score > best.score) best = { task, score };
  }

  return best && best.score > 0 ? best.task : null;
}

function detectLane(message: string): string | null {
  const m = message.toLowerCase();

  if (m.includes("conclu") || m.includes("ativad") || m.includes("resolvido") || m.includes("finalizado")) return "validated";
  if (m.includes("verificar") || m.includes("verifica") || m.includes("revisar") || m.includes("check")) return "review";
  if (m.includes("andamento") || m.includes("fazendo") || m.includes("sendo resolvido") || m.includes("resolvendo")) return "doing";
  if (m.includes("pode esperar") || m.includes("esperar") || m.includes("depois") || m.includes("não urgente") || m.includes("nao urgente")) return "wait";
  if (m.includes("urgente") || m.includes("prioridade") || m.includes("grave") || m.includes("crítico") || m.includes("critico")) return "urgent";

  return null;
}

function extractQuoted(message: string) {
  const quoted = message.match(/["“”']([^"“”']+)["“”']/);
  if (quoted?.[1]) return quoted[1].trim();
  return null;
}

function extractCategoryName(message: string) {
  const quoted = extractQuoted(message);
  if (quoted) return quoted;

  const match = message.match(/(?:categoria|coluna)\s+(?:nova\s+)?(?:chamada|chamado|de|do|da)?\s*([^.!?\n]+)/i);
  if (match?.[1]) {
    return match[1]
      .replace(/^(uma|um|a|o)\s+/i, "")
      .trim()
      .slice(0, 80);
  }

  return null;
}

function extractTaskTitle(message: string) {
  const quoted = extractQuoted(message);
  if (quoted) return quoted;

  const match = message.match(/(?:cria|criar|adicione|adiciona)\s+(?:uma\s+|um\s+)?(?:tarefa|card)\s*(?:chamada|chamado|sobre|de|:)?\s*([^.!?\n]+)/i);
  if (match?.[1]) return match[1].trim().slice(0, 120);

  return null;
}

function areaFromText(message: string) {
  const m = message.toLowerCase();
  if (m.includes("segurança") || m.includes("firewall") || m.includes("vulnerab")) return "Segurança";
  if (m.includes("usuário") || m.includes("usuario") || m.includes("login") || m.includes("cadastro") || m.includes("email")) return "Usuários";
  if (m.includes("stripe") || m.includes("pagamento") || m.includes("checkout")) return "Pagamentos";
  if (m.includes("studio") || m.includes("painel")) return "Studio";
  if (m.includes("chat") || m.includes("ia") || m.includes("copiloto") || m.includes("mia")) return "IA";
  if (m.includes("dashboard")) return "Dashboard";
  if (m.includes("blog") || m.includes("marketing")) return "Marketing";
  return "Sistema";
}

function saveLearning(message: string, memory: Memory) {
  const m = message.toLowerCase();
  if (m.includes("não esqueça") || m.includes("nao esqueca") || m.includes("aprenda") || m.includes("aprende") || m.includes("lembra")) {
    const lesson = message.trim();
    if (lesson && !memory.lessons.includes(lesson)) memory.lessons.push(lesson);
  }
}

function summarizeBoard(board: ReturnType<typeof buildBoard>) {
  const urgent = board.tasks.filter((t) => t.lane === "urgent");
  const doing = board.tasks.filter((t) => t.lane === "doing");
  const wait = board.tasks.filter((t) => t.lane === "wait");
  const review = board.tasks.filter((t) => t.lane === "review");
  const validated = board.tasks.filter((t) => t.lane === "validated");

  const line = (title: string, list: BoardTask[]) => {
    if (!list.length) return `${title}: nenhuma tarefa.`;
    return `${title}:\n${list.map((t, i) => `${i + 1}. ${t.title} — Área: ${t.area} — Gravidade: ${t.severity}`).join("\n")}`;
  };

  return [
    `Organizei o Kanban pelo último relatório e pela memória do Copiloto.`,
    "",
    line("Urgente antes do lançamento", urgent),
    "",
    line("Já está sendo resolvido", doing),
    "",
    line("Pode esperar", wait),
    "",
    line("Verificar", review),
    "",
    line("Concluído e ativado", validated),
  ].join("\n");
}

function addAssistant(memory: Memory, content: string) {
  memory.messages.push({ role: "assistant", content, created_at: now() });
}

function addUser(memory: Memory, content: string) {
  memory.messages.push({ role: "user", content, created_at: now() });
}

async function handleMessage(message: string) {
  const state = readState();
  const memory = readMemory();
  const board = buildBoard();
  const m = message.toLowerCase();

  addUser(memory, message);
  saveLearning(message, memory);

  let answer = "";

  if ((m.includes("cria") || m.includes("criar") || m.includes("adiciona")) && (m.includes("categoria") || m.includes("coluna"))) {
    const name = extractCategoryName(message);
    if (!name) {
      answer = "Eu entendi que você quer criar uma categoria, mas não consegui identificar o nome. Exemplo: cria uma categoria chamada Urgente Jurídico.";
    } else {
      const id = slugify(name);
      if (!state.lanes.some((lane) => lane.id === id)) {
        state.lanes.push({ id, title: name });
        saveState(state);
      }
      answer = `Categoria criada no Kanban: ${name}. A partir de agora posso mover cards para ela.`;
    }
  } else if ((m.includes("cria") || m.includes("criar") || m.includes("adiciona")) && (m.includes("tarefa") || m.includes("card"))) {
    const title = extractTaskTitle(message);
    if (!title) {
      answer = "Eu entendi que você quer criar um card, mas não consegui identificar o título. Exemplo: cria uma tarefa chamada Corrigir confirmação de e-mail.";
    } else {
      const lane = detectLane(message) || "urgent";
      const task: BoardTask = {
        id: `custom-${slugify(title)}-${Date.now()}`,
        title,
        area: areaFromText(message),
        severity: lane === "urgent" ? "alta" : "media",
        lane,
        plain_explanation: "Tarefa criada manualmente pelo chat do Copiloto.",
        evidence: "Criada a partir de pedido da Luma no chat.",
        source: "Chat do Copiloto",
        updated_at: now(),
      };
      state.customTasks.push(task);
      state.archivedTasks[task.id] = task;
      saveState(state);
      answer = `Card criado no Kanban: ${title}. Coloquei na coluna ${state.lanes.find((l) => l.id === lane)?.title || lane}.`;
    }
  } else if (m.includes("verifica") || m.includes("verificar") || m.includes("validar") || m.includes("confere")) {
    const task = findTask(message, board.tasks);
    if (!task) {
      answer = "Eu entendi que você quer verificar uma tarefa, mas não consegui identificar qual card. Escreva algo como: verifica a tarefa do Stripe.";
    } else {
      const latestReportTasks = getReportTasks();
      const stillOpen = latestReportTasks.some((t) => t.id === task.id);

      if (task.source === "Chat do Copiloto" && !stillOpen) {
        state.overrides[task.id] = { lane: "review", note: "Tarefa manual precisa de prova humana ou auditoria específica.", updated_at: now() };
        answer =
          `Eu encontrei o card "${task.title}", mas ele foi criado manualmente no chat.\n\n` +
          `Ainda não tenho uma prova automática para validar esse tipo de tarefa. Deixei em "Verificar" para você conferir com calma.`;
      } else if (stillOpen) {
        state.overrides[task.id] = { lane: "doing", note: "Ainda aparece no último relatório.", updated_at: now() };
        answer =
          `Verifiquei o card "${task.title}".\n\n` +
          `Resultado: ainda não posso concluir.\n\n` +
          `Por quê? Esse problema continua aparecendo no último relatório do Copiloto.\n\n` +
          `O que ele significa em linguagem simples:\n${task.plain_explanation}\n\n` +
          `Prova encontrada:\n${task.evidence || "A tarefa ainda existe no relatório atual."}\n\n` +
          `Coloquei o card em "Já está sendo resolvido".`;
      } else {
        state.overrides[task.id] = { lane: "validated", note: "Não aparece mais no último relatório.", updated_at: now() };
        answer =
          `Verifiquei o card "${task.title}".\n\n` +
          `Resultado: parece resolvido.\n\n` +
          `Por quê? Esse problema não apareceu mais no último relatório do Copiloto.\n\n` +
          `Coloquei o card em "Concluído e ativado".`;
      }
      state.archivedTasks[task.id] = task;
      saveState(state);
    }
  } else if (m.includes("move") || m.includes("mover") || m.includes("coloca") || m.includes("manda") || m.includes("passa") || m.includes("troca")) {
    const task = findTask(message, board.tasks);
    const lane = detectLane(message);

    if (!task) {
      answer = "Eu entendi que você quer mover um card, mas não consegui identificar qual tarefa.";
    } else if (!lane) {
      answer = "Eu encontrei a tarefa, mas não consegui entender para qual coluna mover. Use: urgente, sendo resolvido, pode esperar, verificar ou concluído.";
    } else {
      state.overrides[task.id] = { lane, note: "Movido pelo chat do Copiloto.", updated_at: now() };
      state.archivedTasks[task.id] = task;
      saveState(state);
      answer = `Movi o card "${task.title}" para "${state.lanes.find((l) => l.id === lane)?.title || lane}".`;
    }
  } else if (m.includes("kanban") || m.includes("visual") || m.includes("categoriz")) {
    answer = summarizeBoard(board);
  } else if (m.includes("memória") || m.includes("memoria") || m.includes("lembra") || m.includes("aprendeu") || m.includes("aprendizado")) {
    const lessons = memory.lessons.length
      ? memory.lessons.map((lesson, index) => `${index + 1}. ${lesson}`).join("\n")
      : "Ainda não tenho aprendizados salvos além desta conversa.";
    answer = `Memória ativa do Copiloto:\n\n${lessons}\n\nEu também mantenho o histórico recente desta conversa para continuar o raciocínio sem recomeçar do zero.`;
  } else {
    const urgent = board.tasks.filter((t) => t.lane === "urgent").slice(0, 5);
    answer =
      `Resumo leigo do Copiloto:\n\n` +
      `Score atual: ${board.report.score}/100.\n` +
      `${board.report.summary}\n\n` +
      `O que eu olharia primeiro:\n\n` +
      (urgent.length
        ? urgent
            .map(
              (t, i) =>
                `${i + 1}. ${t.title}\nÁrea: ${t.area}\nGravidade: ${t.severity}\nExplicação: ${t.plain_explanation}\nProva: ${t.evidence || "Sem prova detalhada."}`
            )
            .join("\n\n")
        : "Não encontrei tarefas urgentes no momento.") +
      `\n\nVocê também pode me pedir: criar categoria, criar card, mover card, verificar card ou mostrar o Kanban categorizado.`;
  }

  const freshBoard = buildBoard();
  addAssistant(memory, answer);
  saveMemory(memory);

  return { answer, board: freshBoard, memory: readMemory() };
}

async function moveTask(taskId: string, lane: string) {
  const state = readState();
  const board = buildBoard();
  const task = board.tasks.find((t) => t.id === taskId) || state.archivedTasks[taskId];

  if (!task) {
    return { answer: "Não encontrei esse card para mover.", board, memory: readMemory() };
  }

  state.overrides[taskId] = { lane, note: "Movido por botão no Kanban.", updated_at: now() };
  state.archivedTasks[taskId] = task;
  saveState(state);

  const answer = `Movi "${task.title}" para "${state.lanes.find((l) => l.id === lane)?.title || lane}".`;
  const memory = readMemory();
  addAssistant(memory, answer);
  saveMemory(memory);

  return { answer, board: buildBoard(), memory: readMemory() };
}

async function verifyTask(taskId: string) {
  const state = readState();
  const board = buildBoard();
  const task = board.tasks.find((t) => t.id === taskId) || state.archivedTasks[taskId];

  if (!task) {
    return { answer: "Não encontrei esse card para verificar.", board, memory: readMemory() };
  }

  const latestReportTasks = getReportTasks();
  const stillOpen = latestReportTasks.some((t) => t.id === taskId);

  let answer = "";

  if (task.source === "Chat do Copiloto" && !stillOpen) {
    state.overrides[taskId] = { lane: "review", note: "Tarefa manual precisa de validação específica.", updated_at: now() };
    answer = `Esse card foi criado manualmente: "${task.title}". Ainda não tenho prova automática. Deixei em "Verificar".`;
  } else if (stillOpen) {
    state.overrides[taskId] = { lane: "doing", note: "Ainda aparece no último relatório.", updated_at: now() };
    answer = `Verifiquei "${task.title}". Ainda não está resolvido, porque continua aparecendo no relatório. Coloquei em "Já está sendo resolvido".`;
  } else {
    state.overrides[taskId] = { lane: "validated", note: "Não aparece mais no último relatório.", updated_at: now() };
    answer = `Verifiquei "${task.title}". Não aparece mais no relatório. Coloquei em "Concluído e ativado".`;
  }

  state.archivedTasks[taskId] = task;
  saveState(state);

  const memory = readMemory();
  addAssistant(memory, answer);
  saveMemory(memory);

  return { answer, board: buildBoard(), memory: readMemory() };
}

export async function GET() {
  try {
    return NextResponse.json(buildBoard(), { headers: { "cache-control": "no-store" } });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Erro ao carregar Copiloto." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    if (body.action === "moveTask") {
      return NextResponse.json(await moveTask(String(body.taskId || ""), String(body.lane || "doing")), {
        headers: { "cache-control": "no-store" },
      });
    }

    if (body.action === "verifyTask") {
      return NextResponse.json(await verifyTask(String(body.taskId || "")), {
        headers: { "cache-control": "no-store" },
      });
    }

    const message = String(body.message || "").trim();

    if (!message) {
      return NextResponse.json({ ok: false, error: "Mensagem vazia." }, { status: 400 });
    }

    const result = await handleMessage(message);
    return NextResponse.json({ ok: true, ...result }, { headers: { "cache-control": "no-store" } });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Erro no chat do Copiloto." }, { status: 500 });
  }
}
