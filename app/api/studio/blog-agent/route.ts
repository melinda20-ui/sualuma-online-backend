import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(value: unknown) {
  return String(value || "").trim();
}

function isPublished(post: any) {
  return clean(post.status).toLowerCase() === "published";
}

function hasImage(post: any) {
  return Boolean(clean(post.image || post.featuredImage || post.coverImage));
}

function hasSeo(post: any) {
  return Boolean(clean(post.slug) && clean(post.excerpt));
}

function normalizePost(post: any) {
  return {
    id: post.id,
    title: clean(post.title),
    slug: clean(post.slug),
    excerpt: clean(post.excerpt),
    status: clean(post.status || "draft"),
    published: isPublished(post),
    hasImage: hasImage(post),
    hasSeo: hasSeo(post),
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
}

function buildRecommendations(metrics: any) {
  const recs: string[] = [];

  if (metrics.total === 0) {
    recs.push("Criar os primeiros rascunhos reais pelo Admin Conteúdo.");
  }

  if (metrics.drafts > 0) {
    recs.push(`Revisar ${metrics.drafts} rascunho(s) no Admin Conteúdo antes de publicar.`);
  }

  if (metrics.published === 0 && metrics.total > 0) {
    recs.push("Nenhum post publicado ainda. O blog público só deve mostrar posts com status published.");
  }

  if (metrics.withImage < metrics.total && metrics.total > 0) {
    recs.push("Adicionar imagem principal nos posts antes de publicar.");
  }

  if (metrics.withSeo < metrics.total && metrics.total > 0) {
    recs.push("Revisar slug e descrição SEO dos posts.");
  }

  return recs;
}

async function getStatus() {
  const rawPosts = await prisma.post.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  });

  const posts = rawPosts.map(normalizePost);

  const total = posts.length;
  const published = posts.filter((post) => post.published).length;
  const drafts = total - published;
  const withImage = posts.filter((post) => post.hasImage).length;
  const withSeo = posts.filter((post) => post.hasSeo).length;

  const metrics = {
    total,
    published,
    drafts,
    withImage,
    withSeo,
    healthScore: total
      ? Math.round(((published + withImage + withSeo) / (total * 3)) * 100)
      : 0,
  };

  return {
    ok: true,
    source: "admin-conteudo-prisma",
    message: "Blog Agent lendo a mesma fonte real do Admin Conteúdo.",
    metrics,
    posts,
    recommendations: buildRecommendations(metrics),
    notes: [
      "Fonte real: prisma.post via /api/posts.",
      "data/blog-posts.json não deve ser usado como fonte principal do Admin Conteúdo.",
      "Rascunhos aparecem no Admin Conteúdo; blog público só mostra publicados.",
    ],
    updatedAt: new Date().toISOString(),
  };
}

export async function GET() {
  try {
    return NextResponse.json(await getStatus());
  } catch (error: any) {
    console.error("[studio/blog-agent] erro:", error);

    return NextResponse.json(
      {
        ok: false,
        source: "admin-conteudo-prisma",
        error: error?.message || "Erro ao analisar posts reais.",
        metrics: {
          total: 0,
          published: 0,
          drafts: 0,
          withImage: 0,
          withSeo: 0,
          healthScore: 0,
        },
        posts: [],
        recommendations: ["Corrigir conexão do Blog Agent com o Admin Conteúdo."],
        updatedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  }
}

export async function POST() {
  return GET();
}
