import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { sendDiscord } from "@/lib/sualuma-discord";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Snapshot = {
  lastSummaryAt?: string;
  statuses?: Record<string, string>;
};

const TASKS_FILE = path.join(process.cwd(), "data", "agent-tasks", "tasks.json");
const SNAPSHOT_FILE = path.join(process.cwd(), "data", "discord", "task-status-snapshot.json");

function authorized(req: NextRequest) {
  const secret = process.env.DISCORD_NOTIFY_SECRET || "";
  if (!secret) return true;

  const received =
    req.nextUrl.searchParams.get("secret") ||
    req.headers.get("x-sualuma-secret") ||
    "";

  return received === secret;
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

function normalizeStatus(task: any) {
  if (task?.done === true || task?.completed === true) return "done";

  return String(task?.status || task?.state || task?.stage || "open")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isDone(status: string) {
  return [
    "done",
    "concluido",
    "finalizado",
    "completed",
    "feito",
    "resolvido",
    "closed",
    "publicado"
  ].includes(status);
}

function taskId(task: any, index: number) {
  if (task?.id) return String(task.id);

  const base = JSON.stringify({
    title: task?.title,
    name: task?.name,
    message: task?.message,
    link: task?.link,
    index
  });

  return crypto.createHash("sha1").update(base).digest("hex");
}

function taskTitle(task: any) {
  return String(task?.title || task?.name || task?.message || "Tarefa sem título").slice(0, 120);
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "Não autorizado." }, { status: 401 });
  }

  const force = req.nextUrl.searchParams.get("force") === "1";
  const raw = await readJson<any>(TASKS_FILE, []);
  const tasks: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.tasks) ? raw.tasks : [];

  const snapshot = await readJson<Snapshot>(SNAPSHOT_FILE, { statuses: {} });
  const previous = snapshot.statuses || {};

  const current: Record<string, string> = {};
  const completedNow: any[] = [];

  for (let index = 0; index < tasks.length; index++) {
    const task = tasks[index];
    const id = taskId(task, index);
    const status = normalizeStatus(task);

    current[id] = status;

    if (previous[id] && !isDone(previous[id]) && isDone(status)) {
      completedNow.push(task);
    }
  }

  const doneCount = tasks.filter((task: any) => isDone(normalizeStatus(task))).length;
  const pendingCount = Math.max(0, tasks.length - doneCount);

  const now = Date.now();
  const lastSummary = snapshot.lastSummaryAt ? Date.parse(snapshot.lastSummaryAt) : 0;
  const shouldSummary = force || !lastSummary || now - lastSummary >= 20 * 60 * 1000;

  if (completedNow.length || shouldSummary) {
    const completedText = completedNow.length
      ? `\n✅ **Concluídas agora:**\n${completedNow
          .slice(0, 8)
          .map((task: any) => `• ${taskTitle(task)}`)
          .join("\n")}`
      : "";

    await sendDiscord({
      content:
        `📋 **Central de Tarefas Sualuma**\n` +
        `Faltam: **${pendingCount}**\n` +
        `Concluídas: **${doneCount}**\n` +
        `Total: **${tasks.length}**` +
        completedText
    });
  }

  await writeJson(SNAPSHOT_FILE, {
    lastSummaryAt: shouldSummary ? new Date().toISOString() : snapshot.lastSummaryAt,
    statuses: current
  });

  return NextResponse.json({
    ok: true,
    total: tasks.length,
    done: doneCount,
    pending: pendingCount,
    completedNow: completedNow.length
  });
}
