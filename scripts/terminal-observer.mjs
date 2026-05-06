import fs from "node:fs";
import path from "node:path";

const ROOT = "/root/luma-os";
const OBSERVER_DIR = path.join(ROOT, "data", "terminal-observer");
const EVENTS_FILE = path.join(OBSERVER_DIR, "events.jsonl");
const SUMMARY_FILE = path.join(OBSERVER_DIR, "summary.json");
const BROADCAST_FILE = path.join(OBSERVER_DIR, "agent-broadcast.json");

function ensureDir() {
  fs.mkdirSync(OBSERVER_DIR, { recursive: true });
}

function readEvents(limit = 100) {
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

function classify(event) {
  const cmd = String(event?.command || "").toLowerCase();
  const exitCode = Number(event?.exitCode || 0);

  if (exitCode !== 0) return "erro_detectado";
  if (cmd.includes("npm run build") || cmd.includes("next build")) return "build_executado";
  if (cmd.includes("pm2 restart") || cmd.includes("pm2 reload")) return "app_reiniciado";
  if (cmd.includes("git add") || cmd.includes("git commit") || cmd.includes("git push")) return "git_atualizado";
  if (cmd.includes("curl")) return "teste_executado";
  if (cmd.includes("cp ") || cmd.includes("backup")) return "backup_criado";
  return "comando_observado";
}

function writeSummary() {
  ensureDir();

  const events = readEvents(200);
  const lastEvent = events.at(-1) || null;
  const errors = events.filter((e) => Number(e.exitCode || 0) !== 0).slice(-20);
  const builds = events.filter((e) => String(e.command || "").includes("npm run build")).slice(-10);
  const restarts = events.filter((e) => String(e.command || "").includes("pm2 restart")).slice(-10);

  const summary = {
    ok: true,
    agent: "sualuma-terminal-observer",
    mode: "read-only-observer",
    note: "Este agente apenas observa comandos/eventos e escreve logs/resumos. Não altera código nem executa tarefas sozinho.",
    updatedAt: new Date().toISOString(),
    totalRecentEvents: events.length,
    lastEvent,
    lastClassification: lastEvent ? classify(lastEvent) : "sem_eventos",
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
    summary,
  }, null, 2), "utf8");
}

ensureDir();
writeSummary();

setInterval(writeSummary, 4000);

console.log("[terminal-observer] observando eventos do terminal em modo leitura.");
