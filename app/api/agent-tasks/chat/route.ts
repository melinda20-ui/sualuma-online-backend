import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Task = {
  id?: string;
  title?: string;
  status?: string;
  workflowStatus?: string;
  priority?: string;
  message?: string;
  link?: string;
  source?: string;
  type?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
};

type DiagnosticCheck = {
  area?: string;
  title?: string;
  status?: string;
  description?: string;
  action?: string;
  meta?: Record<string, unknown>;
};

type UserDiagnostics = {
  ok?: boolean;
  updatedAt?: string;
  score?: number;
  totals?: {
    total?: number;
    ok?: number;
    warn?: number;
    critical?: number;
  };
  checks?: DiagnosticCheck[];
};

const TASKS_FILE = path.join(process.cwd(), "data", "agent-tasks", "tasks.json");

function normalizeText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function slugify(value: unknown) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function tokenize(value: string) {
  const stop = new Set([
    "que","como","para","com","sem","das","dos","uma","um","pra","por","hoje","agora",
    "isso","essa","esse","ele","ela","meu","minha","tem","ter","sao","são","tarefa","tarefas"
  ]);

  return [...new Set(
    normalizeText(value)
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length >= 3 && !stop.has(word))
  )];
}

function humanPriority(value: unknown) {
  const v = normalizeText(value);
  if (["high", "alta", "urgente", "critical", "critico", "crítico"].includes(v)) return "alta";
  if (["low", "baixa"].includes(v)) return "baixa";
  return "média";
}

function humanStatus(task: Task) {
  const workflow = normalizeText(task.workflowStatus);
  const status = normalizeText(task.status || "open");

  if (status === "done") return "concluída";
  if (status === "archived") return "arquivada";
  if (workflow === "in_progress") return "em andamento";
  return "aberta";
}

function normalizePriority(value: unknown) {
  const v = normalizeText(value);
  if (["high", "alta", "urgente", "critical", "critico", "crítico"].includes(v)) return "high";
  if (["low", "baixa"].includes(v)) return "low";
  return "medium";
}

function nowIso() {
  return new Date().toISOString();
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, data: unknown) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
}

async function readTaskFile() {
  const raw = await readJson<any>(TASKS_FILE, []);
  const tasks = Array.isArray(raw) ? raw : Array.isArray(raw?.tasks) ? raw.tasks : [];
  return { raw, tasks: Array.isArray(tasks) ? tasks : [] };
}

async function saveTaskFile(raw: any, tasks: Task[]) {
  const output = Array.isArray(raw)
    ? tasks
    : { ...(raw && typeof raw === "object" ? raw : {}), tasks };

  await writeJson(TASKS_FILE, output);
}

function isOpenTask(task: Task) {
  const status = normalizeText(task.status || "open");
  return !["done", "archived", "cancelled", "canceled"].includes(status);
}

function isUrgentTask(task: Task) {
  return isOpenTask(task) && normalizePriority(task.priority) === "high";
}

function isBugTask(task: Task) {
  const text = normalizeText(`${task.title} ${task.message}`);
  return /bug|erro|corrigir|falha|quebra|broken/.test(text);
}

function summarizeTasks(tasks: Task[]) {
  return {
    total: tasks.length,
    open: tasks.filter(isOpenTask).length,
    done: tasks.filter((task) => normalizeText(task.status) === "done").length,
    urgent: tasks.filter(isUrgentTask).length,
    bugs: tasks.filter(isBugTask).length
  };
}

function findTaskIndex(tasks: Task[], query: string) {
  const q = normalizeText(query);
  if (!q) return -1;

  const exact = tasks.findIndex(
    (task) =>
      normalizeText(task.title) === q ||
      normalizeText(task.id) === q
  );
  if (exact >= 0) return exact;

  const includes = tasks.findIndex((task) => {
    const title = normalizeText(task.title);
    const id = normalizeText(task.id);
    return title.includes(q) || q.includes(title) || id.includes(q);
  });
  if (includes >= 0) return includes;

  const qTokens = tokenize(q);
  let bestIndex = -1;
  let bestScore = 0;

  tasks.forEach((task, index) => {
    const text = normalizeText(`${task.title} ${task.message} ${task.id}`);
    let score = 0;

    for (const token of qTokens) {
      if (text.includes(token)) score += token.length >= 6 ? 3 : 2;
    }

    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  return bestScore > 0 ? bestIndex : -1;
}

async function upsertTaskEntry(entry: Task) {
  const { raw, tasks } = await readTaskFile();
  const now = nowIso();

  const next: Task = {
    status: "open",
    workflowStatus: "open",
    priority: "medium",
    type: "task",
    createdAt: now,
    ...entry,
    updatedAt: now
  };

  const index = tasks.findIndex(
    (task) =>
      normalizeText(task.id) === normalizeText(next.id) ||
      normalizeText(task.title) === normalizeText(next.title)
  );

  if (index >= 0) {
    next.createdAt = tasks[index].createdAt || now;
    tasks[index] = { ...tasks[index], ...next };
  } else {
    tasks.unshift(next);
  }

  await saveTaskFile(raw, tasks);
  return tasks;
}

function getBaseUrl(req: NextRequest) {
  const proto =
    req.headers.get("x-forwarded-proto") ||
    req.nextUrl.protocol?.replace(":", "") ||
    "https";

  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    req.nextUrl.host ||
    "sualuma.online";

  return `${proto}://${host}`;
}

async function fetchJsonUrl<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function fetchLiveContext(req: NextRequest) {
  const base = getBaseUrl(req);

  const [userDiagnostics, userAgentStatus, brainStatus, miaBrain] = await Promise.all([
    fetchJsonUrl<UserDiagnostics>(`${base}/api/studio/usuarios-diagnostico`),
    fetchJsonUrl<any>(`${base}/api/studio/user-agent/status`),
    fetchJsonUrl<any>(`${base}/api/brain/status`),
    fetchJsonUrl<any>(`${base}/api/studio/mia-brain`)
  ]);

  return {
    userDiagnostics,
    userAgentStatus,
    brainStatus: brainStatus ?? miaBrain ?? null
  };
}

function buildUserDiagTasks(diag: UserDiagnostics | null): Task[] {
  const checks = Array.isArray(diag?.checks) ? diag!.checks! : [];
  return checks
    .filter((check) => ["warn", "critical"].includes(normalizeText(check.status)))
    .slice(0, 12)
    .map((check) => ({
      id: `usuarios-diagnostico:${slugify(check.title || check.description || "alerta")}`,
      title: `Usuários: ${check.title || "alerta de diagnóstico"}`,
      source: "Agente de Usuários",
      type: "diagnostico",
      status: "open",
      workflowStatus: "open",
      priority: normalizeText(check.status) === "critical" ? "high" : "medium",
      message:
        `${check.description || "Revisar este ponto do sistema de usuários."}` +
        `${check.action ? ` Ação sugerida: ${check.action}` : ""}`,
      link: "/studio/usuarios-diagnostico",
      area: check.area || "Usuários"
    }));
}

function buildUserAgentTasks(status: any): Task[] {
  const alerts = Array.isArray(status?.alerts) ? status.alerts : [];
  return alerts.slice(0, 8).map((alert: any, index: number) => ({
    id: `user-agent-alert:${slugify(alert?.title || alert?.message || `alerta-${index + 1}`)}`,
    title: `Agente de Usuários: ${alert?.title || alert?.message || `alerta ${index + 1}`}`,
    source: "Agente de Usuários",
    type: "monitoramento",
    status: "open",
    workflowStatus: "open",
    priority:
      normalizeText(alert?.status) === "critical" || normalizeText(alert?.priority) === "high"
        ? "high"
        : "medium",
    message: String(alert?.message || alert?.description || "Revisar alerta do agente de usuários."),
    link: "/studio/usuarios-diagnostico"
  }));
}

async function syncExternalSignalsToTasks(diag: UserDiagnostics | null, userStatus: any) {
  const entries = [...buildUserDiagTasks(diag), ...buildUserAgentTasks(userStatus)];
  if (!entries.length) return 0;

  const { raw, tasks } = await readTaskFile();
  const now = nowIso();
  let changed = 0;

  for (const entry of entries) {
    const index = tasks.findIndex(
      (task) =>
        normalizeText(task.id) === normalizeText(entry.id) ||
        normalizeText(task.title) === normalizeText(entry.title)
    );

    if (index >= 0) {
      tasks[index] = {
        ...tasks[index],
        ...entry,
        createdAt: tasks[index].createdAt || entry.createdAt || now,
        updatedAt: now
      };
    } else {
      tasks.unshift({
        createdAt: now,
        updatedAt: now,
        ...entry
      });
    }

    changed += 1;
  }

  await saveTaskFile(raw, tasks);
  return changed;
}

function userDiagShortSummary(diag: UserDiagnostics | null) {
  if (!diag) return "Agente de Usuários: sem dados ao vivo agora.";

  const critical = Number(diag.totals?.critical || 0);
  const warn = Number(diag.totals?.warn || 0);
  const score = typeof diag.score === "number" ? diag.score : null;

  return `Agente de Usuários: score ${score ?? "?"}, ${critical} crítico(s), ${warn} alerta(s).`;
}

function formatUserDiagnostics(diag: UserDiagnostics | null) {
  if (!diag) return "Sem dados do Agente de Usuários agora.";

  const lines = [userDiagShortSummary(diag)];
  const checks = (Array.isArray(diag.checks) ? diag.checks : [])
    .filter((check) => ["warn", "critical"].includes(normalizeText(check.status)))
    .slice(0, 6);

  if (!checks.length) {
    lines.push("Nenhum alerta crítico ou de aviso encontrado neste momento.");
    return lines.join("\n");
  }

  checks.forEach((check, index) => {
    lines.push(
      `${index + 1}. ${check.title || "alerta"} • ${String(check.status || "").toUpperCase()}`,
      `   ${check.description || "Sem descrição."}${check.action ? ` Ação: ${check.action}` : ""}`
    );
  });

  return lines.join("\n");
}

function extractTextList(value: any) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        return (
          item.title ||
          item.message ||
          item.error ||
          item.name ||
          item.description ||
          JSON.stringify(item)
        );
      }
      return "";
    })
    .filter(Boolean)
    .slice(0, 6);
}

function collectBrainSignals(brain: any) {
  const signals: string[] = [];
  if (!brain) return signals;

  if (brain.ok === false) {
    signals.push("Cérebro Azul reportou estado não OK.");
  }

  if (typeof brain.status === "string") {
    signals.push(`Status atual: ${brain.status}.`);
  }

  if (typeof brain.health === "number") {
    signals.push(`Saúde atual: ${brain.health}.`);
  }

  if (typeof brain.score === "number") {
    signals.push(`Score atual: ${brain.score}.`);
  }

  for (const item of extractTextList(brain.errors)) {
    signals.push(`Erro: ${item}`);
  }

  for (const item of extractTextList(brain.alerts)) {
    signals.push(`Alerta: ${item}`);
  }

  const agents = Array.isArray(brain.agents) ? brain.agents : [];
  const unhealthy = agents.filter((agent: any) => {
    const status = normalizeText(agent?.status || agent?.state || "");
    return status && !["ok", "online", "healthy", "running"].includes(status);
  });

  unhealthy.slice(0, 4).forEach((agent: any) => {
    signals.push(
      `Agente ${agent?.name || agent?.id || "desconhecido"} em estado ${agent?.status || agent?.state || "indefinido"}.`
    );
  });

  return [...new Set(signals)].slice(0, 8);
}

const CATEGORY_RULES = [
  {
    label: "Venda / Receita",
    tokens: ["venda", "vender", "receita", "checkout", "pagamento", "stripe", "plano", "planos", "produto", "produtos", "lead", "leads", "crm", "funil"]
  },
  {
    label: "Usuários / Acesso",
    tokens: ["usuario", "usuarios", "usuário", "usuários", "acesso", "cadastro", "cliente", "prestador", "comunidade", "permissao", "permissão"]
  },
  {
    label: "UX / Onboarding",
    tokens: ["onboarding", "primeira", "experiencia", "experiência", "ux", "mobile", "jornada", "chat", "mia"]
  },
  {
    label: "Sistema / Operação",
    tokens: ["studio", "cerebro", "cérebro", "brain", "erro", "bug", "agente", "painel", "api", "sistema"]
  }
];

function categoryForTask(task: Task) {
  const text = normalizeText(`${task.title} ${task.message} ${task.source} ${task.link}`);
  let best = "Outras";
  let bestScore = 0;

  for (const rule of CATEGORY_RULES) {
    let score = 0;
    for (const token of rule.tokens) {
      if (text.includes(normalizeText(token))) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = rule.label;
    }
  }

  return best;
}

function scoreTaskAgainstQuery(task: Task, query: string) {
  const q = normalizeText(query);
  const text = normalizeText(`${task.title} ${task.message} ${task.source} ${task.link}`);
  let score = 0;

  for (const token of tokenize(q)) {
    if (text.includes(token)) score += token.length >= 6 ? 3 : 2;
  }

  if (isOpenTask(task)) score += 1;
  if (normalizePriority(task.priority) === "high") score += 3;

  if (/vender|venda|checkout|receita|plano|planos|produto|produtos|lead|crm|funil/.test(q) &&
      /vender|venda|checkout|receita|plano|planos|produto|produtos|lead|crm|funil/.test(text)) {
    score += 4;
  }

  if (/usuario|usuarios|usuário|usuários|acesso|cadastro|cliente|prestador/.test(q) &&
      /usuario|usuarios|usuário|usuários|acesso|cadastro|cliente|prestador/.test(text)) {
    score += 4;
  }

  if (/cerebro|cérebro|mia|brain|studio/.test(q) &&
      /cerebro|cérebro|mia|brain|studio/.test(text)) {
    score += 4;
  }

  if (/onboarding|primeira|experiencia|experiência|mobile/.test(q) &&
      /onboarding|primeira|experiencia|experiência|mobile/.test(text)) {
    score += 3;
  }

  return score;
}

function pickRelevantTasks(tasks: Task[], query: string) {
  const scored = tasks
    .filter(isOpenTask)
    .map((task) => ({ task, score: scoreTaskAgainstQuery(task, query) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.task);

  return scored.slice(0, 18);
}

function topPriorityTasks(tasks: Task[], limit = 8) {
  return [...tasks]
    .filter(isOpenTask)
    .sort((a, b) => {
      const pa = normalizePriority(a.priority) === "high" ? 2 : normalizePriority(a.priority) === "medium" ? 1 : 0;
      const pb = normalizePriority(b.priority) === "high" ? 2 : normalizePriority(b.priority) === "medium" ? 1 : 0;
      return pb - pa;
    })
    .slice(0, limit);
}

function formatTask(task: Task, index: number) {
  const lines = [
    `${index + 1}. ${task.title || task.id || "Tarefa sem título"}`,
    `   Status: ${humanStatus(task)} • Prioridade: ${humanPriority(task.priority)}`
  ];

  if (task.message) {
    lines.push(`   Contexto: ${String(task.message)}`);
  }

  if (task.link) {
    lines.push(`   Abrir: ${String(task.link)}`);
  }

  return lines.join("\n");
}

function groupAndFormatTasks(tasks: Task[]) {
  if (!tasks.length) return "Não encontrei tarefas abertas relacionadas.";

  const groups = new Map<string, Task[]>();

  for (const task of tasks) {
    const category = categoryForTask(task);
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category)!.push(task);
  }

  const lines: string[] = [];

  for (const [category, items] of groups.entries()) {
    lines.push(`### ${category}`);
    items.slice(0, 8).forEach((task, index) => {
      lines.push(formatTask(task, index));
    });
    lines.push("");
  }

  return lines.join("\n").trim();
}

function parseAction(message: string) {
  const text = message.trim();

  let match = text.match(/^(?:criar|incluir|adicionar)\s+tarefa\s*:?\s*(.+)$/i);
  if (match) return { type: "create" as const, title: match[1].trim() };

  match = text.match(/^(?:marcar|definir)\s+(.+?)\s+como\s+(?:conclu[ií]da|conclu[ií]do|feito|feita|done)$/i);
  if (match) return { type: "done" as const, title: match[1].trim() };

  match = text.match(/^(?:colocar|mover|definir)\s+(.+?)\s+(?:em andamento|como em andamento)$/i);
  if (match) return { type: "in_progress" as const, title: match[1].trim() };

  match = text.match(/^(?:arquivar|arquive)\s+(.+)$/i);
  if (match) return { type: "archive" as const, title: match[1].trim() };

  match = text.match(/^(?:reabrir|reabra)\s+(.+)$/i);
  if (match) return { type: "reopen" as const, title: match[1].trim() };

  match = text.match(/^(?:adicionar contexto(?: na tarefa)?|contexto(?: na tarefa)?)\s+(.+?)\s*:\s*(.+)$/i);
  if (match) return { type: "context" as const, title: match[1].trim(), context: match[2].trim() };

  return null;
}

async function executeAction(action: ReturnType<typeof parseAction>) {
  if (!action) {
    return { reply: "Nenhuma ação detectada.", changed: false };
  }

  if (action.type === "create") {
    const title = action.title;
    const tasks = await upsertTaskEntry({
      id: `manual:${slugify(title)}`,
      title,
      source: "Agente de Tarefas",
      type: "task",
      status: "open",
      workflowStatus: "open",
      priority: "medium",
      message: "Criada pelo chat do Agente de Tarefas."
    });

    const taskIndex = findTaskIndex(tasks, title);
    const task = taskIndex >= 0 ? tasks[taskIndex] : null;

    return {
      reply:
        `Pronto. Criei a nova tarefa:\n\n` +
        `${task ? formatTask(task, 0) : `1. ${title}`}\n\n` +
        `Agora ela entrou na fila aberta.`,
      changed: true
    };
  }

  const { raw, tasks } = await readTaskFile();
  const index = findTaskIndex(tasks, action.title);

  if (index < 0) {
    return {
      reply: `Não encontrei uma tarefa parecida com "${action.title}".`,
      changed: false
    };
  }

  const task = tasks[index];
  const updatedAt = nowIso();

  if (action.type === "done") {
    task.status = "done";
    task.workflowStatus = "done";
    task.updatedAt = updatedAt;

    await saveTaskFile(raw, tasks);

    return {
      reply:
        `Pronto. Marquei como concluída:\n\n` +
        `${formatTask(task, 0)}`,
      changed: true
    };
  }

  if (action.type === "in_progress") {
    task.status = "open";
    task.workflowStatus = "in_progress";
    task.updatedAt = updatedAt;

    await saveTaskFile(raw, tasks);

    return {
      reply:
        `Pronto. Coloquei em andamento:\n\n` +
        `${formatTask(task, 0)}`,
      changed: true
    };
  }

  if (action.type === "archive") {
    task.status = "archived";
    task.workflowStatus = "archived";
    task.updatedAt = updatedAt;

    await saveTaskFile(raw, tasks);

    return {
      reply:
        `Pronto. Arquivei a tarefa:\n\n` +
        `${formatTask(task, 0)}`,
      changed: true
    };
  }

  if (action.type === "reopen") {
    task.status = "open";
    task.workflowStatus = "open";
    task.updatedAt = updatedAt;

    await saveTaskFile(raw, tasks);

    return {
      reply:
        `Pronto. Reabri a tarefa:\n\n` +
        `${formatTask(task, 0)}`,
      changed: true
    };
  }

  if (action.type === "context") {
    const extra = action.context?.trim() || "";
    task.message = `${String(task.message || "").trim()}${task.message ? "\n\n" : ""}Atualização manual: ${extra}`;
    task.updatedAt = updatedAt;

    await saveTaskFile(raw, tasks);

    return {
      reply:
        `Pronto. Atualizei o contexto da tarefa:\n\n` +
        `${formatTask(task, 0)}`,
      changed: true
    };
  }

  return {
    reply: "Ação não suportada.",
    changed: false
  };
}

function buildSpeakText(summary: ReturnType<typeof summarizeTasks>, topTasks: Task[], diag: UserDiagnostics | null, brainSignals: string[]) {
  const parts: string[] = [
    `Hoje você tem ${summary.open} tarefas abertas de ${summary.total}.`
  ];

  const critical = Number(diag?.totals?.critical || 0);
  const warn = Number(diag?.totals?.warn || 0);
  if (critical || warn) {
    parts.push(`Agente de Usuários com ${critical} itens críticos e ${warn} alertas.`);
  }

  if (brainSignals.length) {
    parts.push(`Cérebro Azul com ${brainSignals.length} sinais relevantes.`);
  }

  if (topTasks[0]?.title) {
    parts.push(`Primeira prioridade: ${topTasks[0].title}.`);
  }

  return parts.join(" ");
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const message = String(body?.message || "").trim();

  const live = await fetchLiveContext(req);
  await syncExternalSignalsToTasks(live.userDiagnostics, live.userAgentStatus);

  const action = parseAction(message);
  if (action) {
    const result = await executeAction(action);
    const { tasks } = await readTaskFile();
    const summary = summarizeTasks(tasks);
    const brainSignals = collectBrainSignals(live.brainStatus);

    return NextResponse.json({
      ok: true,
      reply:
        `${result.reply}\n\n` +
        `${userDiagShortSummary(live.userDiagnostics)}\n` +
        `${brainSignals.length ? `Cérebro Azul: ${brainSignals.length} sinal(is) relevante(s).` : "Cérebro Azul: sem sinais relevantes agora."}`,
      speak: buildSpeakText(summary, topPriorityTasks(tasks, 3), live.userDiagnostics, brainSignals),
      changed: result.changed,
      summary
    });
  }

  const { tasks } = await readTaskFile();
  const summary = summarizeTasks(tasks);
  const brainSignals = collectBrainSignals(live.brainStatus);
  const normalizedMessage = normalizeText(message);

  if (!message || normalizedMessage === "resumo das tarefas") {
    const top = topPriorityTasks(tasks, 10);

    const reply =
      `Entendi. Olhando a fila real do sistema, você tem ${summary.open} tarefas abertas de ${summary.total} no total.\n` +
      `${userDiagShortSummary(live.userDiagnostics)}\n` +
      `${brainSignals.length ? `Cérebro Azul: ${brainSignals.length} sinal(is) relevante(s).` : "Cérebro Azul: sem sinais fortes capturados agora."}\n\n` +
      `### Atualizações do Agente de Usuários\n` +
      `${formatUserDiagnostics(live.userDiagnostics)}\n\n` +
      `${brainSignals.length ? `### Sinais do Cérebro Azul\n- ${brainSignals.join("\n- ")}\n\n` : ""}` +
      `### Tarefas principais agora\n` +
      `${groupAndFormatTasks(top)}\n\n` +
      `Comandos que eu já consigo executar:\n` +
      `- "criar tarefa: nome da tarefa"\n` +
      `- "marcar [nome da tarefa] como concluída"\n` +
      `- "colocar [nome da tarefa] em andamento"\n` +
      `- "arquivar [nome da tarefa]"\n` +
      `- "adicionar contexto na tarefa [nome]: texto"`;

    return NextResponse.json({
      ok: true,
      reply,
      speak: buildSpeakText(summary, top.slice(0, 3), live.userDiagnostics, brainSignals),
      changed: false,
      summary
    });
  }

  if (/alertas de usuarios|alertas de usuários|usuario|usuarios|usuário|usuários/.test(normalizedMessage)) {
    const related = tasks
      .filter((task) => {
        const text = normalizeText(`${task.title} ${task.message} ${task.source}`);
        return isOpenTask(task) && (
          text.includes("usuario") ||
          text.includes("usuarios") ||
          text.includes("usuário") ||
          text.includes("usuários") ||
          text.includes("acesso") ||
          text.includes("cliente") ||
          text.includes("prestador")
        );
      })
      .slice(0, 12);

    const reply =
      `Entendi. Aqui estão as atualizações do Agente de Usuários conectadas ao Agente de Tarefas.\n\n` +
      `### Atualizações do Agente de Usuários\n` +
      `${formatUserDiagnostics(live.userDiagnostics)}\n\n` +
      `### Tarefas relacionadas a usuários\n` +
      `${groupAndFormatTasks(related.length ? related : topPriorityTasks(tasks, 8))}`;

    return NextResponse.json({
      ok: true,
      reply,
      speak: buildSpeakText(summary, related.slice(0, 3), live.userDiagnostics, brainSignals),
      changed: false,
      summary
    });
  }

  if (/cerebro azul|cérebro azul|sinais do cerebro azul|sinais do cérebro azul|brain|mia/.test(normalizedMessage)) {
    const related = tasks
      .filter((task) => {
        const text = normalizeText(`${task.title} ${task.message} ${task.source}`);
        return isOpenTask(task) && (
          text.includes("cerebro") ||
          text.includes("cérebro") ||
          text.includes("mia") ||
          text.includes("brain") ||
          text.includes("studio") ||
          text.includes("painel")
        );
      })
      .slice(0, 12);

    const reply =
      `Entendi. Aqui estão os sinais do Cérebro Azul ligados ao Agente de Tarefas.\n\n` +
      `${brainSignals.length ? `### Sinais do Cérebro Azul\n- ${brainSignals.join("\n- ")}\n\n` : "### Sinais do Cérebro Azul\nNenhum sinal relevante foi capturado agora.\n\n"}` +
      `### Tarefas relacionadas\n` +
      `${groupAndFormatTasks(related.length ? related : topPriorityTasks(tasks, 8))}`;

    return NextResponse.json({
      ok: true,
      reply,
      speak: buildSpeakText(summary, related.slice(0, 3), live.userDiagnostics, brainSignals),
      changed: false,
      summary
    });
  }

  const matched = pickRelevantTasks(tasks, message);
  const fallback = topPriorityTasks(tasks, 10);
  const selected = matched.length ? matched : fallback;

  const practical = selected.slice(0, 3);

  const reply =
    `Entendi. Olhando a fila real do sistema, você tem ${summary.open} tarefas abertas de ${summary.total} no total.\n` +
    `${userDiagShortSummary(live.userDiagnostics)}\n` +
    `${brainSignals.length ? `Cérebro Azul: ${brainSignals.length} sinal(is) relevante(s).` : "Cérebro Azul: sem sinais fortes capturados agora."}\n` +
    `${matched.length ? `Encontrei ${matched.length} tarefa(s) relacionadas ao que você pediu.` : "Não achei uma correspondência exata, então separei as tarefas mais importantes para agora."}\n\n` +
    `### Atualizações do Agente de Usuários\n` +
    `${formatUserDiagnostics(live.userDiagnostics)}\n\n` +
    `${brainSignals.length ? `### Sinais do Cérebro Azul\n- ${brainSignals.join("\n- ")}\n\n` : ""}` +
    `### Tarefas relacionadas\n` +
    `${groupAndFormatTasks(selected)}\n\n` +
    `### Ordem prática para agora\n` +
    `${practical.map((task, index) => `${index + 1}. ${task.title || "Tarefa sem título"}`).join("\n")}\n\n` +
    `Comandos que eu já consigo executar:\n` +
    `- "criar tarefa: nome da tarefa"\n` +
    `- "marcar [nome da tarefa] como concluída"\n` +
    `- "colocar [nome da tarefa] em andamento"\n` +
    `- "arquivar [nome da tarefa]"\n` +
    `- "adicionar contexto na tarefa [nome]: texto"`;

  return NextResponse.json({
    ok: true,
    reply,
    speak: buildSpeakText(summary, practical, live.userDiagnostics, brainSignals),
    changed: false,
    summary
  });
}

export async function GET(req: NextRequest) {
  return POST(
    new NextRequest(req.url, {
      method: "POST",
      headers: req.headers,
      body: JSON.stringify({ message: "resumo das tarefas" })
    })
  );
}
