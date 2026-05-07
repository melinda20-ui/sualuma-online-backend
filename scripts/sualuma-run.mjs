import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd().includes("luma-os") ? process.cwd() : "/root/luma-os";

const OBSERVER_DIR = path.join(ROOT, "data", "terminal-observer");
const INBOX_DIR = path.join(ROOT, "data", "agent-inbox");
const EVENTS_FILE = path.join(OBSERVER_DIR, "events.jsonl");
const SUMMARY_FILE = path.join(OBSERVER_DIR, "summary.json");
const BROADCAST_FILE = path.join(OBSERVER_DIR, "agent-broadcast.json");
const INBOX_FILE = path.join(INBOX_DIR, "terminal-events.jsonl");
const FOCUS_FILE = path.join(OBSERVER_DIR, "current-focus.json");

function ensureDir() {
  fs.mkdirSync(OBSERVER_DIR, { recursive: true });
  fs.mkdirSync(INBOX_DIR, { recursive: true });
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function appendJsonl(file, data) {
  fs.appendFileSync(file, JSON.stringify(data) + "\n", "utf8");
}

function tail(text, limit = 5000) {
  const value = String(text || "");
  return value.length > limit ? value.slice(-limit) : value;
}

function classify(command, exitCode, output) {
  const cmd = String(command || "").toLowerCase();
  const out = String(output || "").toLowerCase();

  if (exitCode !== 0) return "erro_detectado";
  if (cmd.includes("npm run build") || cmd.includes("next build") || out.includes("compiled successfully")) return "build_ok";
  if (cmd.includes("pm2 restart") || cmd.includes("pm2 reload")) return "restart_ok";
  if (cmd.includes("curl")) return "teste_ok";
  if (cmd.includes("git add") || cmd.includes("git commit") || cmd.includes("git push")) return "git_ok";
  if (cmd.includes("grep") || cmd.includes("sed") || cmd.includes("cat ")) return "auditoria_ok";
  return "comando_ok";
}

function readEvents(limit = 200) {
  try {
    const raw = fs.readFileSync(EVENTS_FILE, "utf8").trim();
    if (!raw) return [];
    return raw.split("\n").slice(-limit).map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return { raw: line };
      }
    });
  } catch {
    return [];
  }
}

function writeSummary() {
  const events = readEvents(200);
  const lastEvent = events.at(-1) || null;
  const errors = events.filter((event) => Number(event.exitCode || 0) !== 0).slice(-20);

  const summary = {
    ok: true,
    agent: "sualuma-terminal-observer",
    mode: "safe-runner-read-only",
    note: "Comandos executados via sr são registrados para o Agente de Tarefas. O observador não executa nada sozinho.",
    updatedAt: new Date().toISOString(),
    totalRecentEvents: events.length,
    lastEvent,
    lastClassification: lastEvent?.classification || "sem_eventos",
    recentErrors: errors,
    currentFocus: readJson(FOCUS_FILE, null),
    files: {
      events: "data/terminal-observer/events.jsonl",
      inbox: "data/agent-inbox/terminal-events.jsonl",
      summary: "data/terminal-observer/summary.json",
      broadcast: "data/terminal-observer/agent-broadcast.json",
      focus: "data/terminal-observer/current-focus.json"
    }
  };

  fs.writeFileSync(SUMMARY_FILE, JSON.stringify(summary, null, 2), "utf8");
  fs.writeFileSync(BROADCAST_FILE, JSON.stringify({
    to: "all-admin-agents",
    from: "sualuma-terminal-observer",
    type: "terminal_summary",
    priority: errors.length ? "high" : "normal",
    updatedAt: summary.updatedAt,
    summary,
  }, null, 2), "utf8");
}

ensureDir();

const command = process.argv.slice(2).join(" ").trim();

if (!command) {
  console.log("Use assim:");
  console.log('sr "npm run build"');
  process.exit(1);
}

const focus = readJson(FOCUS_FILE, null);

console.log("=== sualuma-run ===");
if (focus?.title) {
  console.log(`Tarefa em foco: ${focus.title}`);
} else {
  console.log("Sem tarefa em foco. O comando será registrado, mas o Kanban pode não saber qual tarefa atualizar.");
}
console.log(`Comando: ${command}`);
console.log("");

const startedAt = new Date();
const result = spawnSync("bash", ["-lc", command], {
  cwd: ROOT,
  encoding: "utf8",
  maxBuffer: 1024 * 1024 * 50,
});

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);

const finishedAt = new Date();
const output = `${result.stdout || ""}\n${result.stderr || ""}`;
const exitCode = typeof result.status === "number" ? result.status : 1;
const classification = classify(command, exitCode, output);

const event = {
  id: `terminal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  createdAt: finishedAt.toISOString(),
  source: "sualuma-run",
  mode: "read-only-log-after-command",
  cwd: ROOT,
  command,
  exitCode,
  success: exitCode === 0,
  classification,
  durationMs: finishedAt.getTime() - startedAt.getTime(),
  focus: focus ? {
    taskId: focus.taskId,
    title: focus.title,
    priority: focus.priority,
    selectedAt: focus.selectedAt,
  } : null,
  outputTail: tail(output),
  message: `Comando executado via sr: ${command}`,
};

appendJsonl(EVENTS_FILE, event);
appendJsonl(INBOX_FILE, {
  to: "all-admin-agents",
  from: "sualuma-terminal-observer",
  type: "terminal_event",
  priority: exitCode === 0 ? "normal" : "high",
  event,
});

writeSummary();

console.log("");
console.log(`=== Registrado no observador: ${classification} | exitCode=${exitCode} ===`);

process.exit(exitCode);
