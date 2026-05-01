import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { exec as execCb } from "child_process";
import { promisify } from "util";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const execAsync = promisify(execCb);
const ROOT = "/root/luma-os";
const REPORT_DIR = path.join(ROOT, "reports/copilot");
const TASKS_FILE = path.join(REPORT_DIR, "kanban-tasks.json");

type Status = "todo" | "doing" | "review" | "done";
type Check =
  | "server_updates"
  | "ufw"
  | "npm_audit"
  | "git_dirty"
  | "nginx_errors"
  | "pm2"
  | "build"
  | "reboot"
  | "generic";

type Task = {
  id: string;
  title: string;
  detail: string;
  source: string;
  check: Check;
  status: Status;
  createdAt: string;
  updatedAt: string;
  lastCheck?: string;
  lastResult?: string;
};

async function readText(file: string) {
  try {
    return await fs.readFile(file, "utf8");
  } catch {
    return "";
  }
}

async function readStoredTasks(): Promise<Task[]> {
  try {
    return JSON.parse(await fs.readFile(TASKS_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function saveTasks(tasks: Task[]) {
  await fs.mkdir(REPORT_DIR, { recursive: true });
  await fs.writeFile(TASKS_FILE, JSON.stringify(tasks, null, 2), "utf8");
}

function now() {
  return new Date().toISOString();
}

function addTask(
  tasks: Omit<Task, "status" | "createdAt" | "updatedAt">[],
  id: string,
  title: string,
  detail: string,
  source: string,
  check: Check
) {
  if (!tasks.some((t) => t.id === id)) {
    tasks.push({ id, title, detail, source, check });
  }
}

function detectTasks(reportTxt: string, reportJson: any) {
  const tasks: Omit<Task, "status" | "createdAt" | "updatedAt">[] = [];

  const updatesMatch =
    reportTxt.match(/Updates disponíveis:\s*(\d+)/i) ||
    reportTxt.match(/(\d+)\s+updates can be applied/i);

  if (updatesMatch && Number(updatesMatch[1]) > 0) {
    addTask(
      tasks,
      "server-updates",
      "Atualizações pendentes no servidor",
      `Existem ${updatesMatch[1]} atualizações pendentes. Atualize em janela segura.`,
      "Copiloto Local",
      "server_updates"
    );
  }

  if (/Status:\s*inactive/i.test(reportTxt) && /UFW/i.test(reportTxt)) {
    addTask(
      tasks,
      "ufw-firewall",
      "Firewall UFW inativo",
      "Avaliar ativação do firewall depois que todas as portas importantes estiverem mapeadas.",
      "Copiloto Local",
      "ufw"
    );
  }

  if (/npm audit|vulnerabil|vulnerabilidades|postcss/i.test(reportTxt)) {
    addTask(
      tasks,
      "npm-audit",
      "Vulnerabilidades no npm audit",
      "Revisar vulnerabilidades sem rodar npm audit fix --force às cegas.",
      "Copiloto Local",
      "npm_audit"
    );
  }

  if (/alterações pendentes no Git|Existem alterações pendentes no Git/i.test(reportTxt)) {
    addTask(
      tasks,
      "git-dirty",
      "Alterações pendentes no Git",
      "Revisar, commitar ou descartar mudanças antes de lançar.",
      "Copiloto Local",
      "git_dirty"
    );
  }

  const nginxPart = reportTxt.split("Erros recentes Nginx:")[1]?.split("==================================================")[0] || "";
  if (/(error|emerg|502|refused|upstream|failed)/i.test(nginxPart)) {
    addTask(
      tasks,
      "nginx-errors",
      "Erros recentes no Nginx",
      "Verificar logs do Nginx e confirmar se os erros são antigos ou ainda ativos.",
      "Copiloto Local",
      "nginx_errors"
    );
  }

  if (/offline|errored|stopped/i.test(reportTxt) && /PM2/i.test(reportTxt)) {
    addTask(
      tasks,
      "pm2-processes",
      "Processos PM2 com problema",
      "Garantir que luma-os, sualuma-backend e sualuma-brain estejam online.",
      "Copiloto Local",
      "pm2"
    );
  }

  if (/Could not find a production build|não existe build|nao existe build/i.test(reportTxt)) {
    addTask(
      tasks,
      "next-build",
      "Build de produção ausente",
      "Rodar build seguro e reiniciar o luma-os.",
      "Copiloto Local",
      "build"
    );
  }

  if (/reboot required|reboot obrigatório/i.test(reportTxt) && !/Sem reboot obrigatório/i.test(reportTxt)) {
    addTask(
      tasks,
      "reboot-required",
      "Servidor pedindo reboot",
      "Programar reinicialização em horário seguro.",
      "Copiloto Local",
      "reboot"
    );
  }

  if (reportJson?.suggestions && Array.isArray(reportJson.suggestions)) {
    reportJson.suggestions.forEach((s: string, i: number) => {
      if (/opencode|próximo nível|proximo nivel/i.test(s)) return;
      addTask(
        tasks,
        `suggestion-${i}`,
        "Sugestão automática do Copiloto",
        String(s),
        "Copiloto Inteligente",
        "generic"
      );
    });
  }

  return tasks;
}

async function collect() {
  const reportTxt = await readText(path.join(REPORT_DIR, "latest.txt"));
  const jsonRaw = await readText(path.join(REPORT_DIR, "latest.json"));

  let reportJson: any = null;
  try {
    reportJson = jsonRaw ? JSON.parse(jsonRaw) : null;
  } catch {
    reportJson = null;
  }

  const generated = detectTasks(reportTxt, reportJson);
  const stored = await readStoredTasks();
  const storedMap = new Map(stored.map((t) => [t.id, t]));
  const stamp = now();

  const merged: Task[] = generated.map((task) => {
    const old = storedMap.get(task.id);
    return {
      ...task,
      status: old?.status || "todo",
      createdAt: old?.createdAt || stamp,
      updatedAt: old?.updatedAt || stamp,
      lastCheck: old?.lastCheck,
      lastResult: old?.lastResult,
    };
  });

  stored.forEach((old) => {
    const stillExists = merged.some((t) => t.id === old.id);
    if (!stillExists && old.status === "done") {
      merged.push(old);
    }
  });

  await saveTasks(merged);

  return {
    generatedAt: reportJson?.generated_at || null,
    reportTxt,
    reportJson,
    tasks: merged,
  };
}

async function sh(command: string) {
  return execAsync(command, {
    cwd: ROOT,
    timeout: 90000,
    maxBuffer: 1024 * 1024,
  });
}

async function verifyTask(task: Task) {
  try {
    if (task.check === "server_updates") {
      const out = (await sh("apt list --upgradable 2>/dev/null | tail -n +2 | wc -l")).stdout.trim();
      const count = Number(out || "0");
      return { passed: count === 0, message: count === 0 ? "Sem atualizações pendentes." : `Ainda existem ${count} atualizações pendentes.` };
    }

    if (task.check === "ufw") {
      const out = (await sh("ufw status | head -n 1")).stdout.trim();
      const passed = /active/i.test(out);
      return { passed, message: passed ? "Firewall UFW ativo." : "UFW ainda está inativo." };
    }

    if (task.check === "npm_audit") {
      const out = (await sh("npm audit --json --omit=dev 2>/dev/null || true")).stdout;
      let total = 0;
      try {
        const parsed = JSON.parse(out);
        total = parsed?.metadata?.vulnerabilities?.total || 0;
      } catch {
        total = /vulnerabilities|vulnerabilidades/i.test(out) ? 1 : 0;
      }
      return { passed: total === 0, message: total === 0 ? "npm audit sem vulnerabilidades." : `Ainda existem ${total} vulnerabilidade(s).` };
    }

    if (task.check === "git_dirty") {
      const out = (await sh("git status --short | wc -l")).stdout.trim();
      const count = Number(out || "0");
      return { passed: count === 0, message: count === 0 ? "Git limpo." : `Ainda existem ${count} alteração(ões) pendente(s).` };
    }

    if (task.check === "nginx_errors") {
      const out = (await sh("tail -n 80 /var/log/nginx/error.log 2>/dev/null || true")).stdout.trim();
      const bad = /(emerg|crit|502|connect\(\) failed|upstream|refused)/i.test(out);
      return { passed: !bad, message: !bad ? "Sem erros recentes fortes no Nginx." : "Ainda há erros recentes no Nginx." };
    }

    if (task.check === "pm2") {
      const out = (await sh("pm2 jlist")).stdout;
      const list = JSON.parse(out);
      const bad = list.filter((p: any) => p?.pm2_env?.status !== "online").map((p: any) => p.name);
      return { passed: bad.length === 0, message: bad.length === 0 ? "Todos os processos PM2 estão online." : `Processos com problema: ${bad.join(", ")}` };
    }

    if (task.check === "build") {
      await sh("test -f .next/BUILD_ID && curl -fsSI --max-time 10 http://127.0.0.1:3000 >/dev/null");
      return { passed: true, message: "Build existe e Next respondeu localmente." };
    }

    if (task.check === "reboot") {
      const out = (await sh("test -f /var/run/reboot-required && echo yes || echo no")).stdout.trim();
      return { passed: out === "no", message: out === "no" ? "Servidor não pede reboot." : "Servidor ainda pede reboot." };
    }

    await sh("/bin/bash /root/luma-os/tools/sualuma-copilot-local.sh >/dev/null 2>&1 || true");
    return { passed: false, message: "Sugestão genérica reavaliada. Marque manualmente se estiver resolvida." };
  } catch (err: any) {
    return { passed: false, message: err?.message || "Falha ao verificar tarefa." };
  }
}

export async function GET() {
  const data = await collect();
  const counts = {
    total: data.tasks.length,
    todo: data.tasks.filter((t) => t.status === "todo").length,
    doing: data.tasks.filter((t) => t.status === "doing").length,
    review: data.tasks.filter((t) => t.status === "review").length,
    done: data.tasks.filter((t) => t.status === "done").length,
  };

  return NextResponse.json({
    ok: true,
    generatedAt: data.generatedAt,
    counts,
    tasks: data.tasks,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const action = body.action;

  if (action === "refresh") {
    await sh("/bin/bash /root/luma-os/tools/sualuma-copilot-local.sh >/dev/null 2>&1 || true");
    const data = await collect();
    return NextResponse.json({ ok: true, refreshed: true, tasks: data.tasks });
  }

  const data = await collect();
  const tasks = data.tasks;
  const task = tasks.find((t) => t.id === body.id);

  if (!task) {
    return NextResponse.json({ ok: false, error: "Tarefa não encontrada." }, { status: 404 });
  }

  if (action === "setStatus") {
    const status = body.status as Status;
    if (!["todo", "doing", "review", "done"].includes(status)) {
      return NextResponse.json({ ok: false, error: "Status inválido." }, { status: 400 });
    }

    task.status = status;
    task.updatedAt = now();
    await saveTasks(tasks);
    return NextResponse.json({ ok: true, task });
  }

  if (action === "verify") {
    const result = await verifyTask(task);
    task.status = result.passed ? "done" : "doing";
    task.lastCheck = now();
    task.lastResult = result.message;
    task.updatedAt = now();
    await saveTasks(tasks);

    return NextResponse.json({
      ok: true,
      passed: result.passed,
      message: result.message,
      task,
    });
  }

  return NextResponse.json({ ok: false, error: "Ação inválida." }, { status: 400 });
}
