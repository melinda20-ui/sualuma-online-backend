import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BlogPost = {
  id: string;
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  image?: string;
  date: string;
  link: string;
  content: string;
};

async function readLocalPosts(): Promise<BlogPost[]> {
  const file = path.join(process.cwd(), "data", "blog-posts.json");
  const raw = await fs.readFile(file, "utf8");
  const posts = JSON.parse(raw);
  return Array.isArray(posts) ? posts : [];
}

export async function GET() {
  try {
    const posts = await readLocalPosts();

    return NextResponse.json(
      {
        ok: true,
        source: "local-sualuma-blog",
        posts: posts.map((post) => ({
          id: post.id,
          title: post.title,
          excerpt: post.excerpt,
          link: post.link,
          date: post.date,
          image: post.image || "",
          category: post.category,
          slug: post.slug,
        })),
        updatedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Erro ao carregar artigos.",
        posts: [],
      },
      { status: 200 }
    );
  }
}
