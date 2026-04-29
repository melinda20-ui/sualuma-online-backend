import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DB_FILE = path.join(process.cwd(), "data", "community-posts.json");

const FIXED_CATEGORIES = [
  "Geral",
  "Trabalhos",
  "Portfólios",
  "Oportunidades",
  "Vendas",
  "Notícias",
  "Tecnologia",
  "Entretenimento",
  "Dúvidas",
  "Conquistas",
  "Outros",
];

function json(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

function clean(v: any) {
  return String(v || "").trim();
}

function normalizeText(v: any) {
  return clean(v)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizeCategory(input: any, source?: any) {
  const wanted = normalizeText(input);

  const found = FIXED_CATEGORIES.find((cat) => normalizeText(cat) === wanted);
  if (found) return found;

  // Todo trabalho publicado do portfólio vira "Trabalhos"
  if (clean(source) === "portfolio") return "Trabalhos";

  return "Outros";
}

function normalizeEmail(v: any) {
  return clean(v).toLowerCase();
}

async function getUser() {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    return data?.user || null;
  } catch {
    return null;
  }
}

async function readPosts() {
  try {
    const raw = await fs.readFile(DB_FILE, "utf8");
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writePosts(posts: any[]) {
  await fs.mkdir(path.dirname(DB_FILE), { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(posts, null, 2), "utf8");
}

function canManage(post: any, user: any, body: any) {
  const userEmail = normalizeEmail(user?.email);
  const postEmail = normalizeEmail(post?.authorEmail);

  if (userEmail && postEmail && userEmail === postEmail) return true;

  if (clean(body?.manageToken) && clean(body?.manageToken) === clean(post?.manageToken)) return true;

  return false;
}

export async function OPTIONS() {
  return json({ ok: true, categories: FIXED_CATEGORIES });
}

export async function GET(req: NextRequest) {
  try {
    const posts = await readPosts();

    const q = normalizeText(req.nextUrl.searchParams.get("q"));
    const categoryParam = req.nextUrl.searchParams.get("category");
    const category = normalizeText(categoryParam);
    const includeArchived = req.nextUrl.searchParams.get("includeArchived") === "1";

    let filtered = posts.map((p: any) => ({
      ...p,
      category: normalizeCategory(p.category, p.source),
    }));

    if (!includeArchived) {
      filtered = filtered.filter((p: any) => !p.archivedAt && p.status !== "archived");
    }

    if (category && category !== "geral") {
      filtered = filtered.filter((p: any) => normalizeText(p.category) === category);
    }

    if (q) {
      filtered = filtered.filter((p: any) => {
        const hay = normalizeText([
          p.title,
          p.content,
          p.body,
          p.category,
          p.authorName,
          p.authorTitle,
          p.linkUrl,
          p.url,
          p.videoUrl,
          p.youtubeUrl,
        ].join(" "));

        return hay.includes(q);
      });
    }

    return json({
      ok: true,
      categories: FIXED_CATEGORIES,
      posts: filtered,
      data: filtered,
      count: filtered.length,
      updatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    return json({ ok: false, error: error?.message || "Erro ao carregar posts." }, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    const body = await req.json().catch(() => ({}));
    const action = clean(body.action);

    const posts = await readPosts();

    if (["update", "archive", "restore", "delete"].includes(action)) {
      const id = clean(body.id);
      const index = posts.findIndex((p: any) => clean(p.id) === id);

      if (index < 0) return json({ ok: false, error: "Post não encontrado." }, 404);

      const post = posts[index];

      if (!canManage(post, user, body)) {
        return json({ ok: false, error: "Você não tem permissão para gerenciar este post." }, 403);
      }

      if (action === "delete") {
        const removed = posts.splice(index, 1)[0];
        await writePosts(posts);
        return json({ ok: true, deleted: true, post: removed, posts });
      }

      if (action === "archive") {
        posts[index] = {
          ...post,
          status: "archived",
          archivedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await writePosts(posts);
        return json({ ok: true, archived: true, post: posts[index], posts });
      }

      if (action === "restore") {
        posts[index] = {
          ...post,
          status: "published",
          archivedAt: "",
          updatedAt: new Date().toISOString(),
        };
        await writePosts(posts);
        return json({ ok: true, restored: true, post: posts[index], posts });
      }

      if (action === "update") {
        posts[index] = {
          ...post,
          category: normalizeCategory(body.category, post.source),
          title: clean(body.title) || post.title || "Publicação",
          content: clean(body.content) || clean(body.body) || post.content || post.body || "",
          body: clean(body.body) || clean(body.content) || post.body || post.content || "",
          imageUrl: clean(body.imageUrl) || "",
          linkUrl: clean(body.linkUrl) || clean(body.url) || "",
          url: clean(body.url) || clean(body.linkUrl) || "",
          videoUrl: clean(body.videoUrl) || clean(body.youtubeUrl) || "",
          youtubeUrl: clean(body.youtubeUrl) || clean(body.videoUrl) || "",
          updatedAt: new Date().toISOString(),
        };
        await writePosts(posts);
        return json({ ok: true, updated: true, post: posts[index], posts });
      }
    }

    const source = clean(body.source) || "manual";
    const isPortfolioPost = source === "portfolio";

    if (!user && !isPortfolioPost) {
      return json({ ok: false, error: "Faça login para publicar." }, 401);
    }

    const authorName =
      clean(body.authorName) ||
      clean(user?.user_metadata?.name) ||
      clean(user?.email) ||
      "Prestador Sualuma";

    const authorTitle =
      clean(body.authorTitle) ||
      clean(body.authorRole) ||
      "Prestador da comunidade";

    const post = {
      id: "post-" + Date.now() + "-" + Math.random().toString(16).slice(2),
      source,
      sourceId: clean(body.sourceId),
      type: clean(body.type) || "post",
      category: normalizeCategory(body.category, source),
      title: clean(body.title) || "Nova publicação",
      content: clean(body.content) || clean(body.body) || "",
      body: clean(body.body) || clean(body.content) || "",
      imageUrl: clean(body.imageUrl) || clean(body.coverImage) || "",
      linkUrl: clean(body.linkUrl) || clean(body.url) || "",
      url: clean(body.url) || clean(body.linkUrl) || "",
      videoUrl: clean(body.videoUrl) || clean(body.youtubeUrl) || "",
      youtubeUrl: clean(body.youtubeUrl) || clean(body.videoUrl) || "",
      authorName,
      authorTitle,
      authorPhotoUrl: clean(body.authorPhotoUrl),
      authorEmail: clean(user?.email) || clean(body.authorEmail),
      manageToken: clean(body.manageToken) || "",
      status: "published",
      archivedAt: "",
      likes: 0,
      comments: [],
      shares: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    posts.unshift(post);
    await writePosts(posts);

    return json({
      ok: true,
      categories: FIXED_CATEGORIES,
      id: post.id,
      post,
      data: post,
      posts,
    });
  } catch (error: any) {
    return json({ ok: false, error: error?.message || "Erro ao publicar." }, 500);
  }
}
