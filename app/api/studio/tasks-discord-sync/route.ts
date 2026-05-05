import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { sendDiscordMessage } from "@/lib/discord-notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TASKS_FILE = path.join(process.cwd(), "data", "agent-tasks", "tasks.json");
const SENT_FILE = path.join(process.cwd(), "data", "discord", "sent-tasks.json");

function authorized(req: NextRequest) {
  const secret = process.env.DISCORD_NOTIFY_SECRET?.trim();
  const received =
    req.headers.get("x-sualuma-secret") ||
    req.nextUrl.searchParams.get("secret");

  return Boolean(secret && received && secret === received);
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

function absoluteLink(link?: string) {
  if (!link) return "https://studio.sualuma.online/studio/agentesadms";
  if (link.startsWith("http")) return link;
  return `https://studio.sualuma.online${link.startsWith("/") ? link : `/${link}`}`;
}

function fingerprint(task: any, index: number) {
  return crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        id: task.id,
        title: task.title,
        message: task.message,
        createdAt: task.createdAt,
        index
      })
    )
    .digest("hex");
}

async function handler(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "Não autorizado." }, { status: 401 });
  }

  if (process.env.DISCORD_TASKS_ENABLED !== "true") {
    return NextResponse.json({ ok: true, skipped: true, message: "Alertas de tarefas desligados." });
  }

  const raw = await readJson<any>(TASKS_FILE, []);
  const tasks = Array.isArray(raw) ? raw : Array.isArray(raw?.tasks) ? raw.tasks : [];
  const sent = await readJson<string[]>(SENT_FILE, []);

  const openTasks = tasks
    .map((task: any, index: number) => ({ task, id: fingerprint(task, index) }))
    .filter(({ task, id }: { task: any; id: string }) => {
      const status = String(task.status || task.state || "").toLowerCase();
      return !sent.includes(id) && !["done", "concluido", "concluído", "finalizado"].includes(status);
    })
    .slice(0, 8);

  if (!openTasks.length) {
    return NextResponse.json({ ok: true, notified: 0, message: "Nenhuma tarefa nova para enviar." });
  }

  let notified = 0;

  for (const item of openTasks) {
    const task = item.task;
    const title = task.title || "Nova tarefa no Studio";
    const message = task.message || task.description || "Sem descrição.";
    const link = absoluteLink(task.link || task.href || "/studio/agentesadms");

    const result = await sendDiscordMessage({
      content: `🧠 **Nova tarefa na Central Sualuma**\n\n**${title}**\n${message}\n\nAbrir: ${link}`
    });

    if (result.ok) notified++;
  }

  await writeJson(SENT_FILE, [...sent, ...openTasks.map((item: { task: any; id: string }) => item.id)].slice(-1000));

  return NextResponse.json({ ok: true, notified });
}

export async function GET(req: NextRequest) {
  return handler(req);
}

export async function POST(req: NextRequest) {
  return handler(req);
}
