import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { sendDiscord } from "@/lib/sualuma-discord";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);

type AnyObj = Record<string, unknown>;

type DiagnosticsState = {
  lastSummaryAt?: string;
  targets?: Record<string, { ok?: boolean; status?: number; error?: string }>;
};

const TASKS_FILE = path.join(process.cwd(), "data", "agent-tasks", "tasks.json");
const DIAGNOSTICS_FILE = path.join(process.cwd(), "data", "system-diagnostics", "state.json");
const REPORT_FILE = path.join(process.cwd(), "data", "agent-orchestrator", "launch-squad-last-report.json");

function authorized(req: NextRequest) {
  const secret = process.env.DISCORD_NOTIFY_SECRET || "";
  if (!secret) return true;

  const received =
    req.nextUrl.searchParams.get("secret") ||
    req.headers.get("x-sualuma-secret") ||
    "";

  return received === secret;
}

function isRecord(value: unknown): value is AnyObj {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, data: unknown) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
}

function normalizeTasks(raw: unknown): AnyObj[] {
  if (Array.isArray(raw)) return raw.filter(isRecord);
  if (isRecord(raw) && Array.isArray(raw.tasks)) return raw.tasks.filter(isRecord);
  return [];
}

function getString(item: AnyObj, key: string): string {
  const value = item[key];
  return typeof value === "string" ? value : "";
}

function taskTitle(task: AnyObj): string {
  return (
    getString(task, "title") ||
    getString(task, "name") ||
    getString(task, "task") ||
    getString(task, "description") ||
    "Tarefa sem título"
  );
}

function taskBlob(task: AnyObj): string {
  return [
    taskTitle(task),
    getString(task, "description"),
    getString(task, "details"),
    getString(task, "area"),
    getString(task, "agent"),
    getString(task, "owner"),
    getString(task, "priority"),
    getString(task, "status"),
    getString(task, "state")
  ].join(" ").toLowerCase();
}

function isOpenTask(task: AnyObj): boolean {
  const status = `${getString(task, "status")} ${getString(task, "state")}`.toLowerCase();

  if (!status.trim()) return true;

  return ![
    "done",
    "concluido",
    "concluído",
    "finalizado",
    "feito",
    "resolvido",
    "complete",
    "completed",
    "closed"
  ].some((word) => status.includes(word));
}

function priorityRank(task: AnyObj): number {
  const text = `${getString(task, "priority")} ${taskBlob(task)}`.toLowerCase();

  if (text.includes("crítico") || text.includes("critico") || text.includes("urgente")) return 5;
  if (text.includes("alta") || text.includes("high")) return 4;
  if (text.includes("média") || text.includes("media")) return 3;
  if (text.includes("baixa") || text.includes("low")) return 1;

  return 2;
}

function pickTasks(tasks: AnyObj[], keywords: string[], limit = 4): AnyObj[] {
  return tasks
    .filter((task) => keywords.some((keyword) => taskBlob(task).includes(keyword.toLowerCase())))
    .sort((a, b) => priorityRank(b) - priorityRank(a))
    .slice(0, limit);
}

function formatTasks(tasks: AnyObj[]): string {
  if (!tasks.length) return "sem bloqueio específico registrado";
  return tasks.map((task, index) => `${index + 1}) ${taskTitle(task)}`).join(" | ");
}

async function tailPm2Errors(): Promise<string> {
  const command = `
for f in \
/root/.pm2/logs/luma-os-error.log \
/root/.pm2/logs/sualuma-brain-error.log \
/root/.pm2/logs/cerebro-blue-error.log \
/root/.pm2/logs/leads-prospector-error.log \
/root/.pm2/logs/sualuma-agents-orchestrator-error.log
do
  if [ -f "$f" ]; then
    echo "--- $f"
    tail -n 60 "$f"
  fi
done
`;

  try {
    const { stdout } = await execFileAsync("bash", ["-lc", command], {
      timeout: 5000,
      maxBuffer: 200000
    });
    return stdout;
  } catch {
    return "";
  }
}

function logHints(logs: string): string[] {
  const lower = logs.toLowerCase();
  const hints: string[] = [];

  if (lower.includes("internal server error")) hints.push("há Internal Server Error nos logs");
  if (lower.includes("typeerror")) hints.push("há TypeError nos logs");
  if (lower.includes("referenceerror")) hints.push("há ReferenceError nos logs");
  if (lower.includes("failed to fetch")) hints.push("há falha de fetch/API nos logs");
  if (lower.includes("econnrefused")) hints.push("há conexão recusada em algum serviço");
  if (lower.includes("unauthorized") || lower.includes("não autorizado")) hints.push("há erro de autorização/secret em algum endpoint");

  return hints.slice(0, 4);
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "Não autorizado." }, { status: 401 });
  }

  const rawTasks = await readJson<unknown>(TASKS_FILE, []);
  const tasks = normalizeTasks(rawTasks);
  const openTasks = tasks.filter(isOpenTask).sort((a, b) => priorityRank(b) - priorityRank(a));

  const diagnostics = await readJson<DiagnosticsState>(DIAGNOSTICS_FILE, { targets: {} });
  const targetEntries = Object.entries(diagnostics.targets || {});
  const downTargets = targetEntries.filter(([, info]) => info?.ok === false);

  const logs = await tailPm2Errors();
  const hints = logHints(logs);

  const launchTasks = pickTasks(openTasks, [
    "lançamento",
    "lancamento",
    "checkout",
    "stripe",
    "pagamento",
    "login",
    "cadastro",
    "internal",
    "erro",
    "produção",
    "producao"
  ]);

  const userTasks = pickTasks(openTasks, [
    "usuário",
    "usuario",
    "user",
    "cliente",
    "prestador",
    "login",
    "cadastro",
    "onboarding",
    "permissão",
    "permissao"
  ]);

  const uxTasks = pickTasks(openTasks, [
    "ux",
    "mobile",
    "responsivo",
    "responsividade",
    "design",
    "layout",
    "loja",
    "botão",
    "botao",
    "interface"
  ]);

  const growthTasks = pickTasks(openTasks, [
    "growth",
    "crescimento",
    "blog",
    "seo",
    "google",
    "lead",
    "campanha",
    "funil",
    "conversão",
    "conversao",
    "stripe",
    "venda"
  ]);

  const health = targetEntries.length
    ? Math.round(((targetEntries.length - downTargets.length) / targetEntries.length) * 100)
    : 100;

  const downText = downTargets.length
    ? downTargets
        .slice(0, 5)
        .map(([name, info]) => `${name}(${info.status || info.error || "erro"})`)
        .join(", ")
    : "nenhuma página caída no último estado salvo";

  const priorityList = openTasks
    .slice(0, 6)
    .map((task, index) => `${index + 1}. ${taskTitle(task)}`)
    .join("\n");

  const now = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

  const lines = [
    "🌙 **Squad de Lançamento Sualuma — relatório 20/20 min**",
    `Horário: ${now}`,
    "",
    `🩺 Saúde monitorada: **${health}%**`,
    `🚨 Páginas/provas com problema: ${downText}`,
    `📌 Tarefas abertas: **${openTasks.length}**`,
    "",
    `🚀 **Agente de Lançamento:** ${formatTasks(launchTasks)}`,
    `👥 **Agente de Usuários:** ${formatTasks(userTasks)}`,
    `🎨 **Agente de UX:** ${formatTasks(uxTasks)}`,
    `📈 **Agente de Growth:** ${formatTasks(growthTasks)}`,
    "",
    hints.length
      ? `🧠 **Sinais dos logs:** ${hints.join("; ")}`
      : "🧠 **Sinais dos logs:** nenhum erro crítico óbvio no recorte lido.",
    "",
    priorityList
      ? `✅ **O que ainda falta priorizar:**\n${priorityList}`
      : "✅ **O que ainda falta priorizar:** nenhuma tarefa aberta encontrada."
  ];

  const content = lines.join("\n").slice(0, 1900);

  const discord = await sendDiscord({
    username: "Squad de Lançamento Sualuma",
    content
  });

  const report = {
    ok: true,
    updatedAt: new Date().toISOString(),
    health,
    openTasks: openTasks.length,
    downTargets: downTargets.length,
    hints,
    discord
  };

  await writeJson(REPORT_FILE, report);

  return NextResponse.json(report);
}
