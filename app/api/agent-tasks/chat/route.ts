import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Task = {
  id?: string;
  title?: string;
  message?: string;
  description?: string;
  status?: string;
  priority?: string;
  type?: string;
  source?: string;
  link?: string;
  area?: string;
  owner?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
};

const TASKS_FILE = path.join(process.cwd(), "data", "agent-tasks", "tasks.json");

const STATUS_MAP: Record<string, string> = {
  "concluida": "done",
  "concluída": "done",
  "concluido": "done",
  "concluído": "done",
  "feito": "done",
  "feita": "done",
  "finalizada": "done",
  "finalizado": "done",
  "resolvida": "done",
  "resolvido": "done",
  "done": "done",
  "em andamento": "doing",
  "andamento": "doing",
  "fazendo": "doing",
  "doing": "doing",
  "aberta": "open",
  "aberto": "open",
  "open": "open",
  "pendente": "open",
  "todo": "open",
  "arquivada": "archived",
  "arquivado": "archived",
  "archived": "archived"
};

const SALE_WORDS = [
  "venda", "vender", "receita", "dinheiro", "checkout", "stripe", "plano", "planos",
  "produto", "produtos", "oferta", "funil", "crm", "lead", "leads", "campanha",
  "email", "e-mail", "cliente", "clientes", "lançamento", "lancamento"
];

const USER_WORDS = [
  "usuario", "usuário", "usuarios", "usuários", "cadastro", "login", "acesso",
  "autenticacao", "autenticação", "onboarding", "primeira experiencia", "primeira experiência",
  "dashboard", "cliente", "prestador", "membro", "member"
];

const UX_WORDS = [
  "ux", "mobile", "layout", "experiencia", "experiência", "tela", "pagina", "página",
  "jornada", "onboarding", "opt-in", "optin", "cor", "jogo"
];

function normalize(text: unknown) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{L}\p{N}\s/-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function taskText(task: Task) {
  return [
    task.id,
    task.title,
    task.message,
    task.description,
    task.status,
    task.priority,
    task.type,
    task.source,
    task.link,
    task.area,
    task.owner
  ].filter(Boolean).join(" ");
}

function isOpen(task: Task) {
  const s = normalize(task.status || "open");
  return !["done", "archived", "concluido", "concluida", "finalizado", "finalizada"].includes(s);
}

function isDone(task: Task) {
  return ["done", "concluido", "concluida", "finalizado", "finalizada"].includes(normalize(task.status));
}

function isUrgent(task: Task) {
  const text = normalize(taskText(task));
  const p = normalize(task.priority);
  return (
    ["urgent", "urgente", "high", "alta", "critica", "crítica"].includes(p) ||
    text.includes("urgente") ||
    text.includes("bloqueio") ||
    text.includes("critico") ||
    text.includes("crítico") ||
    text.includes("erro") ||
    text.includes("bug") ||
    text.includes("corrigir")
  );
}

function categoryOf(task: Task) {
  const text = normalize(taskText(task));
  if (SALE_WORDS.some((w) => text.includes(normalize(w)))) return "Venda / Receita";
  if (USER_WORDS.some((w) => text.includes(normalize(w)))) return "Usuários / Acesso";
  if (UX_WORDS.some((w) => text.includes(normalize(w)))) return "UX / Onboarding";
  if (text.includes("blog") || text.includes("seo") || text.includes("google")) return "Blog / SEO";
  return "Sistema / Operação";
}

async function readTasks(): Promise<{ raw: any; tasks: Task[]; isWrapped: boolean }> {
  try {
    const raw = JSON.parse(await fs.readFile(TASKS_FILE, "utf8"));
    if (Array.isArray(raw)) return { raw, tasks: raw, isWrapped: false };
    if (Array.isArray(raw?.tasks)) return { raw, tasks: raw.tasks, isWrapped: true };
    return { raw: [], tasks: [], isWrapped: false };
  } catch {
    return { raw: [], tasks: [], isWrapped: false };
  }
}

async function writeTasks(raw: any, tasks: Task[], isWrapped: boolean) {
  await fs.mkdir(path.dirname(TASKS_FILE), { recursive: true });
  const output = isWrapped ? { ...raw, tasks } : tasks;
  await fs.writeFile(TASKS_FILE, JSON.stringify(output, null, 2), "utf8");
}

function summary(tasks: Task[]) {
  const open = tasks.filter(isOpen);
  const done = tasks.filter(isDone);
  const urgent = open.filter(isUrgent);
  const bugs = open.filter((t) => normalize(taskText(t)).includes("bug") || normalize(taskText(t)).includes("erro"));
  return {
    total: tasks.length,
    open: open.length,
    done: done.length,
    urgent: urgent.length,
    bugs: bugs.length
  };
}

function scoreTask(task: Task, query: string) {
  const text = normalize(taskText(task));
  const q = normalize(query);
  let score = 0;

  for (const token of q.split(" ").filter((t) => t.length >= 3)) {
    if (text.includes(token)) score += 2;
  }

  if (q.includes("vender") || q.includes("venda") || q.includes("dinheiro") || q.includes("receita")) {
    if (SALE_WORDS.some((w) => text.includes(normalize(w)))) score += 8;
  }

  if (q.includes("usuario") || q.includes("cliente") || q.includes("acesso") || q.includes("cadastro")) {
    if (USER_WORDS.some((w) => text.includes(normalize(w)))) score += 8;
  }

  if (q.includes("onboarding") || q.includes("primeira experiencia") || q.includes("layout") || q.includes("ux")) {
    if (UX_WORDS.some((w) => text.includes(normalize(w)))) score += 8;
  }

  if (q.includes("urgente") || q.includes("prioridade") || q.includes("agora") || q.includes("hoje")) {
    if (isUrgent(task)) score += 6;
  }

  if (!isOpen(task)) score -= 10;

  return score;
}

function topMatches(tasks: Task[], query: string, limit = 12) {
  return tasks
    .map((task) => ({ task, score: scoreTask(task, query) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function extractCreateTitle(message: string) {
  const raw = message.trim();
  const patterns = [
    /(?:criar|crie|adicionar|adicione|incluir|inclua)\s+(?:uma\s+)?(?:nova\s+)?tarefa\s*:?\s*(.+)$/i,
    /(?:nova\s+tarefa)\s*:?\s*(.+)$/i
  ];

  for (const p of patterns) {
    const match = raw.match(p);
    if (match?.[1]) return match[1].trim();
  }

  return "";
}

function extractWantedStatus(message: string) {
  const n = normalize(message);

  const ordered = [
    "em andamento",
    "concluida",
    "concluída",
    "concluido",
    "concluído",
    "finalizada",
    "finalizado",
    "resolvida",
    "resolvido",
    "feita",
    "feito",
    "done",
    "aberta",
    "aberto",
    "open",
    "pendente",
    "todo",
    "arquivada",
    "arquivado",
    "archived"
  ];

  for (const word of ordered) {
    if (n.includes(normalize(word))) return STATUS_MAP[word] || STATUS_MAP[normalize(word)];
  }

  return "";
}

function extractStatusTarget(message: string) {
  let text = message
    .replace(/marcar|marca|mudar|altera|alterar|colocar|coloca|setar|seta|finalizar|finaliza|concluir|conclui|resolver|resolve/gi, " ")
    .replace(/tarefa/gi, " ")
    .replace(/como|para|pra|em andamento|concluida|concluída|concluido|concluído|finalizada|finalizado|resolvida|resolvido|feita|feito|done|aberta|aberto|open|pendente|todo|arquivada|arquivado|archived/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  return text;
}

function formatTaskLine(task: Task, index: number, reason = "") {
  const title = task.title || task.id || "Tarefa sem título";
  const status = task.status || "open";
  const priority = task.priority || "sem prioridade";
  const link = task.link ? `\n   Abrir: ${task.link}` : "";
  const msg = task.message || task.description;
  const context = msg ? `\n   Contexto: ${msg}` : "";
  const why = reason ? `\n   Por que importa: ${reason}` : "";

  return `${index}. ${title}\n   Status: ${status} • Prioridade: ${priority}${why}${context}${link}`;
}

function reasonFor(task: Task, query: string) {
  const text = normalize(taskText(task));
  const reasons: string[] = [];

  if (isUrgent(task)) reasons.push("parece urgente ou de alto impacto");
  if (SALE_WORDS.some((w) => text.includes(normalize(w)))) reasons.push("impacta venda/receita");
  if (USER_WORDS.some((w) => text.includes(normalize(w)))) reasons.push("impacta entrada, cadastro ou experiência do usuário");
  if (UX_WORDS.some((w) => text.includes(normalize(w)))) reasons.push("impacta onboarding/primeira experiência");
  if (text.includes("erro") || text.includes("bug") || text.includes("corrigir")) reasons.push("pode travar uso real do sistema");

  const q = normalize(query);
  const hits = q.split(" ").filter((token) => token.length >= 4 && text.includes(token)).slice(0, 5);
  if (hits.length) reasons.push(`bateu com: ${hits.join(", ")}`);

  return reasons.join("; ") || "tem relação com o que você pediu";
}

function buildContextReply(message: string, tasks: Task[]) {
  const s = summary(tasks);
  const matches = topMatches(tasks, message, 30);

  if (!matches.length) {
    const urgent = tasks.filter(isOpen).filter(isUrgent).slice(0, 8);
    return {
      reply:
        `Entendi. Não achei tarefas com essas palavras exatas, mas olhando o sistema eu vejo ${s.open} abertas de ${s.total} no total.\n\n` +
        `As mais importantes para olhar agora são:\n\n` +
        urgent.map((item, i) => formatTaskLine(item, i + 1, reasonFor(item, message))).join("\n\n") +
        `\n\nVocê pode pedir assim:\n` +
        `- "tarefas que impedem venda hoje"\n` +
        `- "tarefas de usuários e cadastro"\n` +
        `- "marcar [nome da tarefa] como concluída"\n` +
        `- "criar tarefa: revisar checkout dos planos"`,
      speak:
        `Não achei tarefas com essas palavras exatas. Você tem ${s.open} abertas de ${s.total}. Vou te mostrar as urgentes para começar.`
    };
  }

  const groups: Record<string, Task[]> = {};
  for (const item of matches) {
    const cat = categoryOf(item.task);
    groups[cat] ||= [];
    groups[cat].push(item.task);
  }

  let reply =
    `Entendi. Olhando a fila real do sistema, você tem ${s.open} tarefas abertas de ${s.total} no total.\n` +
    `Encontrei ${matches.length} tarefa(s) relacionadas ao que você pediu.\n\n`;

  reply += `Minha leitura rápida: para vender e receber usuários hoje, priorize primeiro o que destrava oferta, checkout, cadastro, onboarding e confiança da primeira experiência.\n\n`;

  for (const [cat, items] of Object.entries(groups)) {
    reply += `### ${cat}\n`;
    reply += items.slice(0, 8).map((task, i) => formatTaskLine(task, i + 1, reasonFor(task, message))).join("\n\n");
    reply += "\n\n";
  }

  const top3 = matches.slice(0, 3).map((m, i) => `${i + 1}. ${m.task.title || m.task.id}`).join("\n");

  reply +=
    `### Ordem prática para agora\n${top3}\n\n` +
    `Comandos que eu já consigo executar:\n` +
    `- "criar tarefa: nome da tarefa"\n` +
    `- "marcar [nome da tarefa] como concluída"\n` +
    `- "colocar [nome da tarefa] em andamento"\n` +
    `- "arquivar [nome da tarefa]"`;

  return {
    reply,
    speak:
      `Encontrei ${matches.length} tarefas relacionadas. Hoje você tem ${s.open} abertas de ${s.total}. As três primeiras prioridades são: ${matches
        .slice(0, 3)
        .map((m) => m.task.title || m.task.id)
        .join(". ")}.`
  };
}

async function createTask(message: string, raw: any, tasks: Task[], isWrapped: boolean) {
  const title = extractCreateTitle(message);
  if (!title || title.length < 4) {
    return {
      changed: false,
      reply: `Me diga o nome da tarefa assim: "criar tarefa: revisar checkout dos planos".`,
      speak: `Me diga o nome da tarefa depois de criar tarefa.`
    };
  }

  const now = new Date().toISOString();
  const exists = tasks.find((t) => normalize(t.title || t.id) === normalize(title));

  if (exists) {
    return {
      changed: false,
      reply: `Essa tarefa já existe:\n\n${formatTaskLine(exists, 1)}`,
      speak: `Essa tarefa já existe na fila.`
    };
  }

  const newTask: Task = {
    id: `task-${Date.now()}`,
    title,
    status: "open",
    priority: "medium",
    type: "task",
    source: "Agente de Tarefas",
    message: "Criada pelo chat do Agente de Tarefas.",
    createdAt: now,
    updatedAt: now
  };

  tasks.unshift(newTask);
  await writeTasks(raw, tasks, isWrapped);

  return {
    changed: true,
    reply: `Pronto. Criei a nova tarefa:\n\n${formatTaskLine(newTask, 1)}\n\nAgora ela entrou na fila aberta.`,
    speak: `Pronto. Criei a nova tarefa: ${title}.`
  };
}

async function updateTaskStatus(message: string, raw: any, tasks: Task[], isWrapped: boolean) {
  const status = extractWantedStatus(message);
  const target = extractStatusTarget(message);

  if (!status) return null;

  if (!target || target.length < 3) {
    return {
      changed: false,
      reply: `Entendi que você quer mudar um status, mas preciso do nome da tarefa. Exemplo: "marcar checkout dos planos como concluída".`,
      speak: `Preciso do nome da tarefa para mudar o status.`
    };
  }

  const matches = topMatches(tasks, target, 5);

  if (!matches.length) {
    return {
      changed: false,
      reply: `Não achei uma tarefa parecida com "${target}". Tente usar uma parte do título exato da tarefa.`,
      speak: `Não achei uma tarefa parecida com esse nome.`
    };
  }

  if (matches.length > 1 && matches[0].score - matches[1].score < 3) {
    return {
      changed: false,
      reply:
        `Achei mais de uma tarefa parecida. Para evitar mexer na errada, escolha uma delas:\n\n` +
        matches.map((m, i) => formatTaskLine(m.task, i + 1)).join("\n\n"),
      speak: `Achei mais de uma tarefa parecida. Escolha uma delas para eu não mexer na errada.`
    };
  }

  const task = matches[0].task;
  const old = task.status || "open";
  task.status = status;
  task.updatedAt = new Date().toISOString();

  await writeTasks(raw, tasks, isWrapped);

  return {
    changed: true,
    reply:
      `Pronto. Atualizei o status da tarefa:\n\n` +
      `${formatTaskLine(task, 1)}\n\n` +
      `Antes: ${old}\nAgora: ${status}`,
    speak: `Pronto. Atualizei a tarefa ${task.title || task.id}. Status anterior: ${old}. Novo status: ${status}.`
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const message = String(body.message || "").trim();

    if (!message) {
      return NextResponse.json({ ok: false, error: "Mensagem vazia." }, { status: 400 });
    }

    const { raw, tasks, isWrapped } = await readTasks();
    const n = normalize(message);

    let result:
      | { changed?: boolean; reply: string; speak: string }
      | null = null;

    if (/(criar|crie|adicionar|adicione|incluir|inclua|nova tarefa)/i.test(message)) {
      result = await createTask(message, raw, tasks, isWrapped);
    }

    if (!result && /(marcar|marca|mudar|altera|alterar|colocar|coloca|setar|seta|finalizar|finaliza|concluir|conclui|resolver|resolve|arquivar|arquiva)/i.test(message)) {
      result = await updateTaskStatus(message, raw, tasks, isWrapped);
    }

    if (!result) {
      if (n.includes("resumo")) {
        const s = summary(tasks);
        const urgent = tasks.filter(isOpen).filter(isUrgent).slice(0, 10);
        result = {
          reply:
            `Resumo real da fila:\n\n` +
            `Total: ${s.total}\nAbertas: ${s.open}\nConcluídas: ${s.done}\nUrgentes: ${s.urgent}\nBugs/erros: ${s.bugs}\n\n` +
            `### Top urgentes\n\n` +
            urgent.map((task, i) => formatTaskLine(task, i + 1, reasonFor(task, message))).join("\n\n"),
          speak: `Você tem ${s.open} tarefas abertas de ${s.total}. Existem ${s.urgent} urgentes e ${s.bugs} bugs ou erros.`
        };
      } else {
        result = buildContextReply(message, tasks);
      }
    }

    return NextResponse.json({
      ok: true,
      reply: result.reply,
      speak: result.speak,
      changed: Boolean(result.changed),
      summary: summary(tasks)
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Erro no Agente de Tarefas." },
      { status: 500 }
    );
  }
}
