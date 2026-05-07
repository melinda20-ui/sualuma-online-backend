import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanText(value: unknown) {
  return String(value || "").trim();
}

function excerptFrom(content: string, fallback = "") {
  const clean = cleanText(fallback || content)
    .replace(/[#*_>`]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return clean.length > 180 ? `${clean.slice(0, 177)}...` : clean;
}

function normalizePost(post: any) {
  const slug = cleanText(post.slug || `post-${post.id}`);

  return {
    id: String(post.id),
    title: cleanText(post.title),
    excerpt: excerptFrom(post.content, post.excerpt),
    link: `/blog/${slug}`,
    date: post.createdAt ? new Date(post.createdAt).toISOString() : new Date().toISOString(),
    image: cleanText(post.image || post.featuredImage || post.coverImage || ""),
    category: cleanText(post.category || "Sualuma"),
    slug,
  };
}

export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      where: {
        status: "published",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 12,
    });

    return NextResponse.json(
      {
        ok: true,
        source: "admin-conteudo-prisma",
        message: "Blog público lendo posts publicados do Admin Conteúdo.",
        posts: posts.map(normalizePost),
        updatedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error: any) {
    console.error("[api/blog/latest] erro:", error);

    return NextResponse.json(
      {
        ok: false,
        source: "admin-conteudo-prisma",
        error: error?.message || "Erro ao carregar posts reais.",
        posts: [],
        updatedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  }
}
