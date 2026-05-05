import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { sendDiscordMessage } from "@/lib/discord-notify";
import { safeUpsertAgentTask } from "@/lib/agent-tasks-safe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BLOG_FILE = path.join(process.cwd(), "data", "blog-posts.json");
const STATUS_FILE = path.join(process.cwd(), "data", "studio-blog-agent", "status.json");
const TASKS_FILE = path.join(process.cwd(), "data", "agent-tasks", "tasks.json");

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

function listPosts(raw: any) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.posts)) return raw.posts;
  return [];
}

function hasImage(post: any) {
  return Boolean(post.image || post.imageUrl || post.cover || post.coverImage || post.thumbnail || post.heroImage);
}

function hasSeo(post: any) {
  const desc = String(post.metaDescription || post.seoDescription || post.description || post.excerpt || "");
  return Boolean(post.title) && desc.length >= 60;
}

function isPublished(post: any) {
  return post.status === "published" || post.published === true || post.publicado === true;
}

function isIndexed(post: any) {
  return post.googleIndexed === true || post.indexed === true || post.searchIndexed === true;
}

async function upsertTask(title: string, message: string, link: string) {
  return safeUpsertAgentTask({
    id: title,
    source: "Nova • Agente de Blog",
    type: "task",
    status: "open",
    priority: "high",
    title,
    message,
    link
  });
}

async function handler(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "Não autorizado." }, { status: 401 });
  }

  if (process.env.DISCORD_BLOG_AGENT_ENABLED !== "true") {
    return NextResponse.json({ ok: true, skipped: true, message: "Blog Agent automático desligado." });
  }

  const raw = await readJson<any>(BLOG_FILE, []);
  const posts = listPosts(raw);

  const total = posts.length;
  const published = posts.filter(isPublished).length;
  const drafts = total - published;
  const withImage = posts.filter(hasImage).length;
  const withSeo = posts.filter(hasSeo).length;
  const indexed = posts.filter(isIndexed).length;
  const missingImage = Math.max(0, total - withImage);
  const missingSeo = Math.max(0, total - withSeo);
  const notIndexed = Math.max(0, total - indexed);

  const health = total
    ? Math.round(((published + withImage + withSeo + indexed) / (total * 4)) * 100)
    : 0;

  const status = {
    ok: true,
    agent: "Nova · Agente de Blog",
    total,
    published,
    drafts,
    withImage,
    withSeo,
    indexed,
    missingImage,
    missingSeo,
    notIndexed,
    health,
    updatedAt: new Date().toISOString()
  };

  await writeJson(STATUS_FILE, status);

  if (missingImage > 0) {
    await upsertTask(
      "Blog: corrigir posts sem imagem",
      `${missingImage} post(s) ainda precisam de imagem/capa para melhorar visual, compartilhamento e SEO.`,
      "/studio/blog-agent"
    );
  }

  if (missingSeo > 0) {
    await upsertTask(
      "Blog: corrigir SEO dos posts",
      `${missingSeo} post(s) precisam de meta description, resumo ou estrutura SEO mais forte.`,
      "/studio/blog-agent"
    );
  }

  if (notIndexed > 0) {
    await upsertTask(
      "Blog: verificar indexação no Google",
      `${notIndexed} post(s) ainda não têm confirmação de indexação marcada no sistema.`,
      "/studio/blog-agent"
    );
  }

  const discord = await sendDiscordMessage({
    content:
      `📝 **Agente de Blog rodou a auditoria automática**\n\n` +
      `Posts totais: **${total}**\n` +
      `Publicados: **${published}**\n` +
      `Rascunhos: **${drafts}**\n` +
      `Com imagem: **${withImage}**\n` +
      `Com SEO: **${withSeo}**\n` +
      `Indexados marcados: **${indexed}**\n` +
      `Saúde do blog: **${health}%**\n\n` +
      `Abrir painel: https://studio.sualuma.online/studio/blog-agent`
  });

  return NextResponse.json({ ...status, discord });
}

export async function GET(req: NextRequest) {
  return handler(req);
}

export async function POST(req: NextRequest) {
  return handler(req);
}
