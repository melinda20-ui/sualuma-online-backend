import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AgentTask = {
  id: string;
  source: string;
  type: "task" | "notice" | "alert" | "checklist" | "bug" | "idea";
  priority: "urgent" | "high" | "medium" | "low";
  status: "open" | "doing" | "done" | "archived";
  title: string;
  message: string;
  link?: string;
  createdAt: string;
  updatedAt: string;
  meta?: Record<string, any>;
};

const DATA_DIR = path.join(process.cwd(), "data", "agent-tasks");
const TASKS_FILE = path.join(DATA_DIR, "tasks.json");

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readTasks(): Promise<AgentTask[]> {
  await ensureDir();
  try {
    const raw = await fs.readFile(TASKS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeTasks(tasks: AgentTask[]) {
  await ensureDir();
  await fs.writeFile(TASKS_FILE, JSON.stringify(tasks, null, 2));
}

function allowed(req: NextRequest) {
  const expected = process.env.AGENT_TASKS_SECRET;
  if (!expected) return false;
  return req.headers.get("x-agent-tasks-secret") === expected;
}

function normalizeTask(input: any): AgentTask {
  const now = new Date().toISOString();

  const type = ["task", "notice", "alert", "checklist", "bug", "idea"].includes(input.type)
    ? input.type
    : "task";

  const priority = ["urgent", "high", "medium", "low"].includes(input.priority)
    ? input.priority
    : "medium";

  const status = ["open", "doing", "done", "archived"].includes(input.status)
    ? input.status
    : "open";

  return {
    id: input.id || randomUUID(),
    source: String(input.source || "manual").slice(0, 80),
    type,
    priority,
    status,
    title: String(input.title || "Nova tarefa").slice(0, 180),
    message: String(input.message || "").slice(0, 4000),
    link: input.link ? String(input.link).slice(0, 500) : undefined,
    createdAt: input.createdAt || now,
    updatedAt: now,
    meta: input.meta && typeof input.meta === "object" ? input.meta : undefined,
  };
}

function sortTasks(tasks: AgentTask[]) {
  const statusWeight: Record<string, number> = { open: 0, doing: 1, done: 2, archived: 3 };
  const priorityWeight: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

  return [...tasks].sort((a, b) => {
    const s = statusWeight[a.status] - statusWeight[b.status];
    if (s !== 0) return s;
    const p = priorityWeight[a.priority] - priorityWeight[b.priority];
    if (p !== 0) return p;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export async function GET() {
  const tasks = sortTasks(await readTasks());

  const stats = {
    total: tasks.length,
    open: tasks.filter((t) => t.status === "open").length,
    doing: tasks.filter((t) => t.status === "doing").length,
    done: tasks.filter((t) => t.status === "done").length,
    urgent: tasks.filter((t) => t.priority === "urgent" && t.status !== "done" && t.status !== "archived").length,
    bugs: tasks.filter((t) => t.type === "bug" && t.status !== "done" && t.status !== "archived").length,
  };

  return NextResponse.json({ ok: true, stats, tasks });
}

export async function POST(req: NextRequest) {
  if (!allowed(req)) {
    return NextResponse.json({ ok: false, error: "Não autorizado." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "create");
  const tasks = await readTasks();

  if (action === "bulk-create") {
    const incoming = Array.isArray(body.tasks) ? body.tasks : [];
    const existingKeys = new Set(tasks.map((t) => `${t.source}:${t.title}`.toLowerCase()));

    const created: AgentTask[] = [];
    for (const raw of incoming) {
      const task = normalizeTask(raw);
      const key = `${task.source}:${task.title}`.toLowerCase();
      if (existingKeys.has(key)) continue;
      existingKeys.add(key);
      tasks.push(task);
      created.push(task);
    }

    await writeTasks(tasks);
    return NextResponse.json({ ok: true, created: created.length, tasks: sortTasks(tasks) });
  }

  if (action === "update") {
    const id = String(body.id || "");
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx < 0) return NextResponse.json({ ok: false, error: "Tarefa não encontrada." }, { status: 404 });

    tasks[idx] = {
      ...tasks[idx],
      ...body.patch,
      id: tasks[idx].id,
      updatedAt: new Date().toISOString(),
    };

    await writeTasks(tasks);
    return NextResponse.json({ ok: true, task: tasks[idx] });
  }

  const task = normalizeTask(body.task || body);
  tasks.push(task);
  await writeTasks(tasks);

  return NextResponse.json({ ok: true, task });
}
