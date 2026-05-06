import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const OBSERVER_DIR = path.join(ROOT, "data", "terminal-observer");
const INBOX_DIR = path.join(ROOT, "data", "agent-inbox");

const EVENTS_FILE = path.join(OBSERVER_DIR, "events.jsonl");
const SUMMARY_FILE = path.join(OBSERVER_DIR, "summary.json");
const BROADCAST_FILE = path.join(OBSERVER_DIR, "agent-broadcast.json");
const INBOX_FILE = path.join(INBOX_DIR, "terminal-events.jsonl");

function ensureDirs() {
  fs.mkdirSync(OBSERVER_DIR, { recursive: true });
  fs.mkdirSync(INBOX_DIR, { recursive: true });
}

function readEvents(limit = 200) {
  try {
    const raw = fs.readFileSync(EVENTS_FILE, "utf8").trim();
    if (!raw) return [];

    return raw
      .split("\n")
      .slice(-limit)
      .map((line) => {
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

function classify(command, exitCode) {
  const cmd = String(command || "").toLowerCase();

  if (Number(exitCode) !== 0) return "erro_detectado";
  if (cmd.includes("npm run build") || cmd.includes("next build")) return "build_executado";
  if (cmd.includes("pm2 restart") || cmd.includes("pm2 reload")) return "app_reiniciado";
  if (cmd.includes("git add") || cmd.includes("git commit") || cmd.includes("git push")) return "git_atualizado";
  if (cmd.includes("curl")) return "teste_executado";
  if (cmd.includes("backup") || cmd.includes("cp ")) return "backup_criado";
  return "evento_manual_observado";
}

function writeSummary() {
  const events = readEvents(200);
  const lastEvent = events.at(-1) || null;
  const errors = events.filter((event) => Number(event.exitCode || 0) !== 0).slice(-20);
  const builds = events.filter((event) => String(event.command || "").includes("npm run build")).slice(-10);
  const restarts = events.filter((event) => String(event.command || "").includes("pm2 restart")).slice(-10);

  const summary = {
    ok: true,
    agent: "sualuma-terminal-observer",
    mode: "safe-manual-read-only",
    note: "Modo seguro: não altera bashrc, não fica preso no terminal e não executa comandos sozinho. Apenas registra eventos quando chamado manualmente.",
    updatedAt: new Date().toISOString(),
    totalRecentEvents: events.length,
    lastEvent,
    lastClassification: lastEvent ? lastEvent.classification : "sem_eventos",
    recentErrors: errors,
    recentBuilds: builds,
    recentRestarts: restarts,
    files: {
      events: "data/terminal-observer/events.jsonl",
      inbox: "data/agent-inbox/terminal-events.jsonl",
      summary: "data/terminal-observer/summary.json",
      broadcast: "data/terminal-observer/agent-broadcast.json"
    }
  };

  fs.writeFileSync(SUMMARY_FILE, JSON.stringify(summary, null, 2), "utf8");
  fs.writeFileSync(BROADCAST_FILE, JSON.stringify({
    to: "all-admin-agents",
    from: "sualuma-terminal-observer",
    type: "terminal_summary",
    priority: errors.length ? "high" : "normal",
    updatedAt: summary.updatedAt,
    summary
  }, null, 2), "utf8");

  return summary;
}

ensureDirs();

const command = process.argv.slice(2).join(" ").trim() || "Evento manual sem comando informado";
const exitCode = 0;
const classification = classify(command, exitCode);

const event = {
  id: `terminal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  createdAt: new Date().toISOString(),
  source: "manual-safe-terminal-observer",
  mode: "read-only",
  command,
  exitCode,
  classification,
  cwd: ROOT,
  message: `Evento registrado pelo observador seguro: ${command}`
};

fs.appendFileSync(EVENTS_FILE, JSON.stringify(event) + "\n", "utf8");
fs.appendFileSync(INBOX_FILE, JSON.stringify({
  to: "all-admin-agents",
  from: "sualuma-terminal-observer",
  type: "terminal_event",
  priority: classification === "erro_detectado" ? "high" : "normal",
  event
}) + "\n", "utf8");

const summary = writeSummary();

console.log("✅ Evento registrado com segurança.");
console.log("Classificação:", classification);
console.log("Total recente:", summary.totalRecentEvents);
console.log("Resumo:", "data/terminal-observer/summary.json");
console.log("Inbox:", "data/agent-inbox/terminal-events.jsonl");
