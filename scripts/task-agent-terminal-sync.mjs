import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd().includes("luma-os") ? process.cwd() : "/root/luma-os";

const TASKS_FILE = path.join(ROOT, "data", "agent-tasks", "tasks.json");
const INBOX_FILE = path.join(ROOT, "data", "agent-inbox", "terminal-events.jsonl");
const OBSERVER_DIR = path.join(ROOT, "data", "terminal-observer");
const STATE_FILE = path.join(OBSERVER_DIR, "task-sync-state.json");
const REPORT_FILE = path.join(OBSERVER_DIR, "task-sync-report.json");

const WATCH = process.argv.includes("--watch");
const INTERVAL_MS = 8000;

const STOP_WORDS = new Set([
  "para", "como", "com", "dos", "das", "que", "uma", "por", "de", "do", "da",
  "em", "no", "na", "nos", "nas", "ao", "aos", "as", "os", "e", "ou", "o",
  "a", "um", "uns", "das", "dos", "isso", "esse", "essa", "esta", "este",
  "urgente", "criar", "fazer", "colocar", "atualizar", "concluir"
]);

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  ensureDir(file);
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

function readTaskStore() {
  const raw = readJson(TASKS_FILE, []);

  if (Array.isArray(raw)) {
    return { shape: "array", raw, tasks: raw };
  }

  if (raw && typeof raw === "object" && Array.isArray(raw.tasks)) {
    return { shape: "object", raw, tasks: raw.tasks };
  }

  return { shape: "array", raw: [], tasks: [] };
}

function writeTaskStore(store, tasks) {
  if (store.shape === "object") {
    store.raw.tasks = tasks;
    writeJson(TASKS_FILE, store.raw);
    return;
  }

  writeJson(TASKS_FILE, tasks);
}

function readEvents() {
  try {
    const raw = fs.readFileSync(INBOX_FILE, "utf8").trim();
    if (!raw) return [];

    return raw
      .split("\n")
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokenize(value) {
  return normalize(value)
    .split(/\s+/)
    .filter((token) => token.length >= 4 && !STOP_WORDS.has(token));
}

function eventText(event) {
  return [
    event?.event?.command,
    event?.event?.message,
    event?.event?.classification,
    event?.event?.cwd,
    event?.command,
    event?.message,
    event?.classification,
    event?.cwd,
  ]
    .filter(Boolean)
    .join(" ");
}

function eventId(event) {
  return String(event?.event?.id || event?.id || "");
}

function detectIntent(text) {
  const clean = normalize(text);

  const hasError =
    clean.includes("erro") ||
    clean.includes("falhou") ||
    clean.includes("failed") ||
    clean.includes("cannot find") ||
    clean.includes("type error") ||
    clean.includes("build failed");

  const hasDone =
    clean.includes("concluido") ||
    clean.includes("concluida") ||
    clean.includes("finalizado") ||
    clean.includes("finalizada") ||
    clean.includes("pronto") ||
    clean.includes("resolvido") ||
    clean.includes("resolvida") ||
    clean.includes("corrigido") ||
    clean.includes("corrigida") ||
    clean.includes("validado") ||
    clean.includes("validada") ||
    clean.includes("build passou") ||
    clean.includes("testado") ||
    clean.includes("aprovado") ||
    clean.includes("deploy ok");

  const hasDoing =
    clean.includes("em andamento") ||
    clean.includes("iniciado") ||
    clean.includes("iniciada") ||
    clean.includes("retomando") ||
    clean.includes("implementando") ||
    clean.includes("ajustando") ||
    clean.includes("corrigindo") ||
    clean.includes("auditando") ||
    clean.includes("trabalhando");

  if (hasDone && !hasError) {
    return { status: "done", reason: "evento indica conclusão" };
  }

  if (hasDoing || hasError) {
    return { status: "doing", reason: hasError ? "evento indica erro/continuidade" : "evento indica andamento" };
  }

  return null;
}

function explicitTaskId(text) {
  const match = String(text).match(/(?:task|tarefa|id)\s*[:=#]\s*([a-zA-Z0-9-]+)/i);
  return match ? match[1] : "";
}

function scoreTask(task, text) {
  const cleanText = normalize(text);
  const explicit = explicitTaskId(text);

  if (explicit && String(task.id || "") === explicit) {
    return 1000;
  }

  const title = String(task.title || "");
  const cleanTitle = normalize(title);

  if (cleanTitle && cleanText.includes(cleanTitle)) {
    return 500;
  }

  const titleTokens = tokenize(title);
  const messageTokens = tokenize(task.message || "");
  const textTokens = new Set(tokenize(text));

  const titleMatches = titleTokens.filter((token) => textTokens.has(token)).length;
  const messageMatches = messageTokens.filter((token) => textTokens.has(token)).length;

  let score = titleMatches * 12 + messageMatches * 2;

  if (task.link && cleanText.includes(normalize(task.link))) score += 30;
  if (task.source && cleanText.includes(normalize(task.source))) score += 20;

  return score;
}

function findBestTask(tasks, text) {
  const candidates = tasks
    .filter((task) => task && typeof task === "object")
    .filter((task) => !["archived", "arquivado", "arquivada"].includes(String(task.status || "").toLowerCase()))
    .map((task) => ({ task, score: scoreTask(task, text) }))
    .sort((a, b) => b.score - a.score);

  const best = candidates[0];

  if (!best) return null;

  if (best.score >= 1000) return best.task;
  if (best.score >= 36) return best.task;

  return null;
}

function syncOnce() {
  ensureDir(REPORT_FILE);

  const state = readJson(STATE_FILE, {
    processedIds: [],
  });

  const processed = new Set(Array.isArray(state.processedIds) ? state.processedIds : []);
  const events = readEvents();

  const store = readTaskStore();
  const tasks = store.tasks;

  const changes = [];
  const skipped = [];

  for (const event of events) {
    const id = eventId(event);

    if (!id || processed.has(id)) continue;

    const text = eventText(event);
    const intent = detectIntent(text);

    if (!intent) {
      skipped.push({ eventId: id, reason: "sem intenção clara de andamento/conclusão" });
      processed.add(id);
      continue;
    }

    const task = findBestTask(tasks, text);

    if (!task) {
      skipped.push({ eventId: id, reason: "nenhuma tarefa existente bateu com segurança" });
      processed.add(id);
      continue;
    }

    const oldStatus = String(task.status || "open");

    if (oldStatus !== intent.status) {
      task.status = intent.status;
      task.updatedAt = new Date().toISOString();

      if (Object.prototype.hasOwnProperty.call(task, "workflowStatus")) {
        task.workflowStatus = intent.status === "done" ? "completed" : "in_progress";
      }

      changes.push({
        eventId: id,
        taskId: task.id,
        title: task.title,
        from: oldStatus,
        to: intent.status,
        reason: intent.reason,
      });
    } else {
      skipped.push({
        eventId: id,
        taskId: task.id,
        title: task.title,
        reason: "tarefa já estava no status correto",
      });
    }

    processed.add(id);
  }

  if (changes.length > 0) {
    writeTaskStore(store, tasks);
  }

  const processedIds = Array.from(processed).slice(-1000);

  writeJson(STATE_FILE, {
    processedIds,
    updatedAt: new Date().toISOString(),
  });

  const report = {
    ok: true,
    agent: "sualuma-task-terminal-sync",
    mode: "safe-auto-task-sync",
    rule: "Não cria tarefas novas. Apenas muda tarefas existentes para doing ou done quando o evento do terminal bate com segurança.",
    updatedAt: new Date().toISOString(),
    totalEventsSeen: events.length,
    changes,
    skipped: skipped.slice(-50),
  };

  writeJson(REPORT_FILE, report);

  console.log(`[task-terminal-sync] mudanças: ${changes.length} | ignorados: ${skipped.length}`);

  return report;
}

try {
  syncOnce();

  if (WATCH) {
    console.log("[task-terminal-sync] rodando automático em modo seguro. Não cria tarefas novas.");
    setInterval(() => {
      try {
        syncOnce();
      } catch (error) {
        console.error("[task-terminal-sync] erro no loop:", error);
      }
    }, INTERVAL_MS);
  }
} catch (error) {
  console.error("[task-terminal-sync] erro:", error);
  process.exitCode = 1;
}
