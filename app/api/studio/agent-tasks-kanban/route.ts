import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getCurrentAdminAccess } from "@/lib/auth/admin-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TASKS_FILE = path.join(process.cwd(), "data", "agent-tasks", "tasks.json");

type Task = {
  id?: string;
  title?: string;
  message?: string;
  status?: string;
  priority?: string;
  type?: string;
  source?: string;
  link?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
};

function norm(value: unknown) {
  return String(value || "").toLowerCase().trim();
}

async function readTasksFile() {
  try {
    const raw = JSON.parse(await fs.readFile(TASKS_FILE, "utf8"));
    const tasks = Array.isArray(raw) ? raw : Array.isArray(raw?.tasks) ? raw.tasks : [];
    return { raw, tasks };
  } catch {
    return { raw: [], tasks: [] };
  }
}

async function writeTasksFile(raw: any, tasks: Task[]) {
  await fs.mkdir(path.dirname(TASKS_FILE), { recursive: true });
  const output = Array.isArray(raw) ? tasks : { ...(raw || {}), tasks };
  await fs.writeFile(TASKS_FILE, JSON.stringify(output, null, 2), "utf8");
}

function summary(tasks: Task[]) {
  return {
    total: tasks.length,
    emEspera: tasks.filter((t) => ["open", "waiting", "todo"].includes(norm(t.status))).length,
    emAndamento: tasks.filter((t) => ["doing", "in_progress"].includes(norm(t.status))).length,
    concluidas: tasks.filter((t) => ["done", "concluido", "concluído", "finalizado"].includes(norm(t.status))).length,
    arquivadas: tasks.filter((t) => norm(t.status) === "archived").length,
    urgentesAbertas: tasks.filter((t) => norm(t.priority) === "urgent" && !["done", "archived"].includes(norm(t.status))).length,
    bugs: tasks.filter((t) => norm(t.type) === "bug" && !["done", "archived"].includes(norm(t.status))).length
  };
}

function priorityWeight(task: Task) {
  const p = norm(task.priority);
  if (p === "urgent") return 0;
  if (p === "high") return 1;
  if (p === "medium") return 2;
  if (p === "low") return 3;
  return 4;
}

function statusWeight(task: Task) {
  const s = norm(task.status);
  if (s === "doing" || s === "in_progress") return 0;
  if (s === "open" || s === "waiting" || s === "todo") return 1;
  if (s === "done") return 2;
  if (s === "archived") return 3;
  return 4;
}

function sortTasks(tasks: Task[]) {
  return [...tasks].sort((a, b) => {
    const sw = statusWeight(a) - statusWeight(b);
    if (sw !== 0) return sw;

    const pw = priorityWeight(a) - priorityWeight(b);
    if (pw !== 0) return pw;

    return new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime();
  });
}

async function isAuthorized(req: NextRequest) {
  const token = process.env.SUALUMA_INTERNAL_AGENT_TOKEN;
  const auth = req.headers.get("authorization") || "";

  if (token && auth === `Bearer ${token}`) return true;

  const admin = await getCurrentAdminAccess();
  return Boolean(admin.isAdmin);
}

export async function GET() {
  const { tasks } = await readTasksFile();

  return NextResponse.json({
    ok: true,
    summary: summary(tasks),
    tasks: sortTasks(tasks)
  });
}

export async function PATCH(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ ok: false, error: "Não autorizado." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const id = String(body.id || "").trim();
  const patch = body.patch && typeof body.patch === "object" ? body.patch : {};

  if (!id) {
    return NextResponse.json({ ok: false, error: "ID da tarefa ausente." }, { status: 400 });
  }

  const allowedStatus = ["open", "doing", "done", "archived"];
  const allowedPriority = ["urgent", "high", "medium", "low"];

  const { raw, tasks } = await readTasksFile();
  const index = tasks.findIndex((task: Task) => String(task.id) === id);

  if (index < 0) {
    return NextResponse.json({ ok: false, error: "Tarefa não encontrada." }, { status: 404 });
  }

  const cleanPatch: Task = {};

  if (allowedStatus.includes(String(patch.status))) {
    cleanPatch.status = String(patch.status);
    cleanPatch.workflowStatus = patch.status === "doing" ? "in_progress" : String(patch.status);
  }

  if (allowedPriority.includes(String(patch.priority))) {
    cleanPatch.priority = String(patch.priority);
  }

  if (typeof patch.message === "string") {
    cleanPatch.message = patch.message.slice(0, 4000);
  }

  tasks[index] = {
    ...tasks[index],
    ...cleanPatch,
    updatedAt: new Date().toISOString()
  };

  await writeTasksFile(raw, tasks);

  return NextResponse.json({
    ok: true,
    task: tasks[index],
    summary: summary(tasks),
    tasks: sortTasks(tasks)
  });
}
