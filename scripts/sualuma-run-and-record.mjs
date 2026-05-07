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

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function appendJsonl(file, data) {
  ensureDir(path.dirname(file));
  fs.appendFileSync(file, `${JSON.stringify(data)}\n`, "utf8");
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
  if (cmd.includes("cp ") || cmd.includes("backup")) return "backup_criado";
  if (cmd.includes("grep") || cmd.includes("sed") || cmd.includes("cat") || cmd.includes("ls ")) return "auditoria_leitura";
  return "comando_observado";
}

function writeSummary() {
  ensureDir(OBSERVER_DIR);
  ensureDir(INBOX_DIR);

  const events = readEvents(200);
  const lastEvent = events.at(-1) || null;
  const recentErrors = events.filter((event) => Number(event.exitCode || 0) !== 0).slice(-20);
  const recentBuilds = events.filter((event) => String(event.command || "").includes("npm run build")).slice(-10);
  const recentRestarts = events.filter((event) => String(event.command || "").includes("pm2 restart")).slice(-10);

  const summary = {
    ok: true,
    agent: "sualuma-terminal-observer",
    mode: "safe-sr-manual-read-only",
    note: "Modo seguro: só registra comandos executados via sr. Não mexe no bashrc, não observa tudo sozinho e não altera código automaticamente.",
    updatedAt: new Date().toISOString(),
    totalRecentEvents: events.length,
    lastEvent,
    lastClassification: lastEvent?.classification || "sem_eventos",
    recentErrors,
    recentBuilds,
    recentRestarts,
    files: {
      events: "data/terminal-observer/events.jsonl",
      inbox: "data/agent-inbox/terminal-events.jsonl",
      summary: "data/terminal-observer/summary.json",
      broadcast: "data/terminal-observer/agent-broadcast.json",
    },
  };

  fs.writeFileSync(SUMMARY_FILE, JSON.stringify(summary, null, 2), "utf8");
  fs.writeFileSync(
    BROADCAST_FILE,
    JSON.stringify(
      {
        to: "all-admin-agents",
        from: "sualuma-terminal-observer",
        type: "terminal_summary",
        priority: recentErrors.length ? "high" : "normal",
        updatedAt: summary.updatedAt,
        summary,
      },
      null,
      2
    ),
    "utf8"
  );
}

const command = process.argv.slice(2).join(" ").trim();

if (!command) {
  console.log('Uso: sr "comando que você já ia rodar"');
  process.exit(1);
}

console.log(`=== sr executando ===`);
console.log(command);
console.log("");

const result = spawnSync(command, {
  cwd: ROOT,
  shell: "/bin/bash",
  stdio: "inherit",
  env: process.env,
});

const exitCode =
  typeof result.status === "number"
    ? result.status
    : result.signal
      ? 130
      : 1;

const event = {
  id: `terminal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  createdAt: new Date().toISOString(),
  source: "sr",
  mode: "read-only-record-after-run",
  command,
  exitCode,
  classification: classify(command, exitCode),
  cwd: ROOT,
  message:
    exitCode === 0
      ? `Comando executado e registrado via sr: ${command}`
      : `Comando executado via sr retornou erro ${exitCode}: ${command}`,
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
console.log("=== sr registrou o evento ===");
console.log(`Classificação: ${event.classification}`);
console.log(`Exit code: ${exitCode}`);
console.log("Resumo: data/terminal-observer/summary.json");
console.log("Inbox: data/agent-inbox/terminal-events.jsonl");

process.exit(exitCode);
