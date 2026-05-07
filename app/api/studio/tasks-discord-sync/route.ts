import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { sendDiscordMessage } from "@/lib/discord-notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROOT = process.cwd();
const TASKS_FILE = path.join(ROOT, "data", "agent-tasks", "tasks.json");
const SENT_FILE = path.join(ROOT, "data", "discord", "sent-tasks.json");
const UPDATES_DIR = path.join(ROOT, "data", "agent-updates");

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

async function readBody(req: NextRequest) {
  try {
    return await req.json();
  } catch {
    return {};
  }
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
        index,
      })
    )
    .digest("hex");
}

function splitDiscordMessage(text: string, max = 1800) {
  const chunks: string[] = [];
  let current = "";

  for (const line of text.split("\n")) {
    if ((current + "\n" + line).length > max) {
      if (current.trim()) chunks.push(current.trim());
      current = line;
    } else {
      current += current ? `\n${line}` : line;
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

async function getLatestSummary() {
  try {
    const files = await fs.readdir(UPDATES_DIR);
    const summaries = files
      .filter((name) => name.startsWith("resumo-tarefas-") && name.endsWith(".txt"))
      .map((name) => path.join(UPDATES_DIR, name));

    if (!summaries.length) return null;

    const withStats = await Promise.all(
      summaries.map(async (file) => ({
        file,
        stat: await fs.stat(file),
      }))
    );

    withStats.sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);

    const latest = withStats[0].file;
    const content = await fs.readFile(latest, "utf8");

    return {
      file: path.relative(ROOT, latest),
      content,
    };
  } catch {
    return null;
  }
}

async function sendLatestSummary() {
  const latest = await getLatestSummary();

  if (!latest) {
    return {
      ok: true,
      notified: 0,
      message: "Nenhum resumo de tarefas encontrado.",
    };
  }

  const content = [
    "📌 **Resumo de atualização das tarefas — Sualuma**",
    "",
    `Arquivo: \`${latest.file}\``,
    "",
    latest.content,
  ].join("\n");

  const chunks = splitDiscordMessage(content);
  let notified = 0;

  for (const chunk of chunks) {
    const result = await sendDiscordMessage({ content: chunk });
    if (result.ok) notified++;
  }

  return {
    ok: true,
    mode: "summary",
    notified,
    chunks: chunks.length,
    file: latest.file,
  };
}

async function sendOpenTasks() {
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
    return { ok: true, notified: 0, message: "Nenhuma tarefa nova para enviar." };
  }

  let notified = 0;

  for (const item of openTasks) {
    const task = item.task;
    const title = task.title || "Nova tarefa no Studio";
    const message = task.message || task.description || "Sem descrição.";
    const link = absoluteLink(task.link || task.href || "/studio/agentesadms");

    const text = `🧠 **Nova tarefa na Central Sualuma**\n\n**${title}**\n${message}\n\nAbrir: ${link}`;
    const chunks = splitDiscordMessage(text);

    for (const chunk of chunks) {
      const result = await sendDiscordMessage({ content: chunk });
      if (result.ok) notified++;
    }
  }

  await writeJson(
    SENT_FILE,
    [...sent, ...openTasks.map((item: { task: any; id: string }) => item.id)].slice(-1000)
  );

  return { ok: true, mode: "open-tasks", notified };
}

async function handler(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "Não autorizado." }, { status: 401 });
  }

  if (process.env.DISCORD_TASKS_ENABLED !== "true") {
    return NextResponse.json({
      ok: true,
      skipped: true,
      message: "Alertas de tarefas desligados.",
    });
  }

  const body = req.method === "POST" ? await readBody(req) : {};
  const mode = String(body?.mode || req.nextUrl.searchParams.get("mode") || "");

  if (mode === "summary") {
    const result = await sendLatestSummary();
    return NextResponse.json(result);
  }

  const result = await sendOpenTasks();
  return NextResponse.json(result);
}

export async function GET(req: NextRequest) {
  return handler(req);
}

export async function POST(req: NextRequest) {
  return handler(req);
}
