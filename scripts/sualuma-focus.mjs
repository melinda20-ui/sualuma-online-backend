import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd().includes("luma-os") ? process.cwd() : "/root/luma-os";
const TASKS_FILE = path.join(ROOT, "data", "agent-tasks", "tasks.json");
const OBSERVER_DIR = path.join(ROOT, "data", "terminal-observer");
const FOCUS_FILE = path.join(OBSERVER_DIR, "current-focus.json");

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

fs.mkdirSync(OBSERVER_DIR, { recursive: true });

const query = process.argv.slice(2).join(" ").trim();

if (!query) {
  console.log("Use assim:");
  console.log('sf "parte do nome da tarefa"');
  process.exit(1);
}

const raw = readJson(TASKS_FILE, []);
const tasks = Array.isArray(raw) ? raw : Array.isArray(raw.tasks) ? raw.tasks : [];

const q = normalize(query);

const openTasks = tasks.filter((task) => {
  const status = String(task.status || "").toLowerCase();
  return !["done", "completed", "concluida", "concluída", "archived", "arquivada"].includes(status);
});

const matches = openTasks.filter((task) => {
  const haystack = normalize(`${task.title || ""} ${task.message || ""} ${task.source || ""}`);
  return haystack.includes(q);
});

if (!matches.length) {
  console.log("❌ Nenhuma tarefa aberta encontrada com esse texto.");
  console.log("Dica: use uma palavra do título que aparece no Kanban.");
  process.exit(1);
}

const task = matches[0];

const focus = {
  ok: true,
  taskId: task.id,
  title: task.title,
  status: task.status,
  priority: task.priority,
  query,
  selectedAt: new Date().toISOString(),
  note: "Tarefa em foco para comandos registrados pelo sr/sualuma-run.",
};

fs.writeFileSync(FOCUS_FILE, JSON.stringify(focus, null, 2), "utf8");

console.log("✅ Tarefa em foco definida:");
console.log(`${task.title}`);
console.log("");
console.log("Agora rode comandos usando sr, exemplo:");
console.log('sr "npm run build"');
