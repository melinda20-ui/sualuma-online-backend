import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd().includes("luma-os") ? process.cwd() : "/root/luma-os";
const TASKS_FILE = path.join(ROOT, "data", "agent-tasks", "tasks.json");
const UPDATES_DIR = path.join(ROOT, "data", "agent-updates");
const INBOX_DIR = path.join(ROOT, "data", "agent-inbox");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function scoreTask(task, query) {
  const title = normalize(task.title || "");
  const message = normalize(task.message || task.description || "");
  const text = `${title} ${message}`.trim();

  if (!query || !title) return 0;
  if (title === query) return 100;
  if (title.includes(query)) return 90;
  if (text.includes(query)) return 75;

  const qTokens = query.split(" ").filter((x) => x.length >= 3);
  if (!qTokens.length) return 0;

  const matches = qTokens.filter((token) => text.includes(token)).length;
  return Math.round((matches / qTokens.length) * 60);
}

const queryRaw = process.argv.slice(2).join(" ").trim();

if (!queryRaw) {
  console.log('Uso: sf "nome da tarefa"');
  process.exit(1);
}

const query = normalize(queryRaw);
const raw = readJson(TASKS_FILE, []);
const tasks = Array.isArray(raw) ? raw : Array.isArray(raw?.tasks) ? raw.tasks : [];

if (!tasks.length) {
  console.error("❌ Nenhuma tarefa encontrada em data/agent-tasks/tasks.json");
  process.exit(1);
}

const ranked = tasks
  .map((task, index) => ({
    task,
    index,
    score: scoreTask(task, query),
  }))
  .sort((a, b) => b.score - a.score);

const best = ranked[0];

if (!best || best.score < 25) {
  console.error("❌ Não encontrei uma tarefa existente com segurança.");
  console.error("");
  console.error("Sugestões próximas:");
  ranked
    .filter((item) => item.score > 0)
    .slice(0, 8)
    .forEach((item) => {
      console.error(`- ${item.task.title || "(sem título)"} | status: ${item.task.status || "sem status"} | score: ${item.score}`);
    });

  console.error("");
  console.error("Nada foi alterado.");
  process.exit(2);
}

const now = new Date().toISOString();
const task = tasks[best.index];
const oldStatus = task.status || task.state || "sem status";

task.status = "done";
task.updatedAt = now;
task.completedAt = task.completedAt || now;
task.completedBy = "sf";
task.lastManualUpdate = {
  at: now,
  source: "sf",
  command: `sf "${queryRaw}"`,
  note: "Tarefa existente marcada como concluída manualmente pelo atalho sf.",
};

const output = Array.isArray(raw) ? tasks : { ...raw, tasks };
writeJson(TASKS_FILE, output);

ensureDir(UPDATES_DIR);
ensureDir(INBOX_DIR);

const safeTs = now.replace(/[:.]/g, "-");
const summaryFile = path.join(UPDATES_DIR, `sf-tarefa-concluida-${safeTs}.txt`);
const inboxFile = path.join(INBOX_DIR, `sf-tarefa-concluida-${safeTs}.json`);

const summary = [
  "✅ Tarefa concluída via sf",
  "",
  `Tarefa: ${task.title}`,
  `Status anterior: ${oldStatus}`,
  "Status novo: done",
  `Atualizado em: ${now}`,
  "",
  "Regra respeitada: nenhuma tarefa nova foi criada.",
].join("\n");

fs.writeFileSync(summaryFile, summary, "utf8");

writeJson(inboxFile, {
  to: "gestor-de-tarefas",
  from: "sf",
  type: "task_status_update",
  action: "mark_done",
  createdAt: now,
  rule: "Não criar tarefa nova. Apenas atualizar tarefa existente.",
  task: {
    id: task.id,
    title: task.title,
    oldStatus,
    newStatus: "done",
    priority: task.priority,
    link: task.link,
  },
  summaryFile: path.relative(ROOT, summaryFile),
});

console.log(summary);
console.log("");
console.log(`📄 Resumo: ${path.relative(ROOT, summaryFile)}`);
console.log(`📨 Aviso gestor: ${path.relative(ROOT, inboxFile)}`);
