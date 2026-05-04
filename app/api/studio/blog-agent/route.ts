import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnyPost = Record<string, any>;

const DATA_DIR = path.join(process.cwd(), "data", "studio-blog-agent");
const STATUS_FILE = path.join(DATA_DIR, "status.json");
const LOCAL_BLOG_FILE = path.join(process.cwd(), "data", "blog-posts.json");
const TASKS_FILE = path.join(process.cwd(), "data", "agent-tasks", "tasks.json");

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(path.dirname(TASKS_FILE), { recursive: true });
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

async function readPrismaPosts(): Promise<AnyPost[]> {
  try {
    const mod: any = await import("@/lib/prisma");
    const prisma = mod.prisma || mod.default;

    if (!prisma?.post?.findMany) return [];

    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      take: 1000
    });

    return Array.isArray(posts) ? posts : [];
  } catch {
    return [];
  }
}

async function readLocalPosts(): Promise<AnyPost[]> {
  const data = await readJson<any>(LOCAL_BLOG_FILE, []);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.posts)) return data.posts;
  return [];
}

function clean(value: unknown) {
  return String(value || "").trim();
}

function lower(value: unknown) {
  return clean(value).toLowerCase();
}

function pick(post: AnyPost, keys: string[]) {
  for (const key of keys) {
    if (post?.[key] !== undefined && post?.[key] !== null && clean(post[key])) {
      return post[key];
    }
  }
  return "";
}

function postKey(post: AnyPost) {
  return clean(
    post.id ||
      post.slug ||
      post.link ||
      post.url ||
      post.title ||
      post.titulo ||
      Math.random().toString(16).slice(2)
  );
}

function isPublished(post: AnyPost) {
  const status = lower(post.status || post.state || post.publicationStatus);
  return (
    status === "published" ||
    status === "publicado" ||
    status === "ativo" ||
    post.published === true ||
    Boolean(post.publishedAt)
  );
}

function hasImage(post: AnyPost) {
  return Boolean(
    pick(post, [
      "image",
      "coverImage",
      "featuredImage",
      "thumbnail",
      "ogImage",
      "imageUrl",
      "capa",
      "imagem"
    ])
  );
}

function hasSeo(post: AnyPost) {
  const title = pick(post, ["metaTitle", "seoTitle", "title", "titulo"]);
  const description = pick(post, [
    "metaDescription",
    "seoDescription",
    "description",
    "excerpt",
    "resumo"
  ]);

  return clean(title).length >= 20 && clean(description).length >= 60;
}

function isIndexed(post: AnyPost) {
  const status = lower(post.indexStatus || post.googleIndexStatus || post.indexacao);
  return (
    post.indexed === true ||
    post.googleIndexed === true ||
    status === "indexed" ||
    status === "indexado"
  );
}

function normalizePost(post: AnyPost) {
  return {
    id: postKey(post),
    title: clean(post.title || post.titulo || "Sem título"),
    slug: clean(post.slug || ""),
    status: clean(post.status || (isPublished(post) ? "published" : "draft")),
    source: clean(post.source || post.origem || "blog"),
    hasImage: hasImage(post),
    hasSeo: hasSeo(post),
    indexed: isIndexed(post),
    createdAt: clean(post.createdAt || post.created_at || ""),
    updatedAt: clean(post.updatedAt || post.updated_at || "")
  };
}

async function loadAllPosts() {
  const prismaPosts = await readPrismaPosts();
  const localPosts = await readLocalPosts();

  const map = new Map<string, AnyPost>();

  for (const post of [...prismaPosts, ...localPosts]) {
    map.set(postKey(post), post);
  }

  return Array.from(map.values());
}

function buildRecommendations(metrics: any) {
  const recs: string[] = [];

  if (metrics.total === 0) {
    recs.push("Criar os primeiros posts pilares do blog: IA para pequenos negócios, automação, presença digital e produtividade.");
  }

  if (metrics.drafts > 0) {
    recs.push(`Revisar e publicar ${metrics.drafts} rascunho(s) que ainda não estão ativos.`);
  }

  if (metrics.withoutImage > 0) {
    recs.push(`Adicionar imagem/capa em ${metrics.withoutImage} post(s) para melhorar aparência, compartilhamento e confiança.`);
  }

  if (metrics.withoutSeo > 0) {
    recs.push(`Corrigir SEO de ${metrics.withoutSeo} post(s): título, descrição, palavra-chave e links internos.`);
  }

  if (metrics.indexUnknown > 0) {
    recs.push("Conectar Google Search Console depois para confirmar indexação real no Google.");
  }

  recs.push("Criar artigos explicando siglas do painel financeiro: LTV, CAC/CAQ, breakeven, margem, equity, ROI e imposto.");

  return recs;
}

async function updateTask(status: any) {
  const raw = await readJson<any>(TASKS_FILE, []);
  const tasks = Array.isArray(raw) ? raw : Array.isArray(raw?.tasks) ? raw.tasks : [];

  const now = new Date().toISOString();

  const task = {
    id: "blog-agent-status",
    source: "blog-agent",
    type: "monitoramento",
    priority: status.metrics.withoutSeo > 0 || status.metrics.withoutImage > 0 ? "high" : "medium",
    status: "open",
    title: "Monitorar publicações, imagens, SEO e indexação do blog",
    message:
      `Blog Agent atualizado: ${status.metrics.total} posts no total, ` +
      `${status.metrics.published} publicados, ${status.metrics.drafts} rascunhos, ` +
      `${status.metrics.withImage} com imagem, ${status.metrics.withSeo} com SEO, ` +
      `${status.metrics.indexed} com indexação marcada e ${status.metrics.indexUnknown} sem confirmação real de indexação.`,
    link: "/studio/blog-agent",
    createdAt: now,
    updatedAt: now
  };

  const index = tasks.findIndex((item: any) => item.id === task.id);

  if (index >= 0) {
    task.createdAt = tasks[index].createdAt || now;
    tasks[index] = { ...tasks[index], ...task };
  } else {
    tasks.unshift(task);
  }

  const output = Array.isArray(raw) ? tasks : { ...raw, tasks };
  await writeJson(TASKS_FILE, output);
}

async function refreshStatus() {
  await ensureDir();

  const posts = await loadAllPosts();
  const normalized = posts.map(normalizePost);

  const total = normalized.length;
  const published = normalized.filter((post) => isPublished(post)).length;
  const drafts = total - published;
  const withImage = normalized.filter((post) => post.hasImage).length;
  const withSeo = normalized.filter((post) => post.hasSeo).length;
  const indexed = normalized.filter((post) => post.indexed).length;

  const metrics = {
    total,
    published,
    drafts,
    withImage,
    withoutImage: total - withImage,
    withSeo,
    withoutSeo: total - withSeo,
    indexed,
    indexUnknown: total - indexed,
    qualityScore:
      total > 0
        ? Math.round(((published + withImage + withSeo) / (total * 3)) * 100)
        : 0
  };

  const status = {
    ok: true,
    agent: "Nova · Agente de Blog",
    updatedAt: new Date().toISOString(),
    metrics,
    posts: normalized.slice(0, 50),
    recommendations: buildRecommendations(metrics),
    notes: [
      "Indexação real no Google ainda depende de integração com Google Search Console.",
      "Posts locais vêm de data/blog-posts.json.",
      "Posts do admin vêm do Prisma, quando a conexão estiver disponível."
    ]
  };

  await writeJson(STATUS_FILE, status);
  await updateTask(status);

  return status;
}

export async function GET() {
  const status = await refreshStatus();
  return NextResponse.json(status);
}

export async function POST(req: NextRequest) {
  await req.json().catch(() => ({}));
  const status = await refreshStatus();
  return NextResponse.json(status);
}
