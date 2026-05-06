import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Review = {
  id: string;
  productId: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: string;
  approved: boolean;
};

type Product = {
  id: string;
  slug: string;
  title: string;
};

const DATA_DIR = path.join(process.cwd(), "data", "loja-agentes");
const REVIEWS_FILE = path.join(DATA_DIR, "reviews.json");
const PRODUCTS_FILE = path.join(DATA_DIR, "produtos.json");

async function ensureDataFiles() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(REVIEWS_FILE);
  } catch {
    await fs.writeFile(REVIEWS_FILE, "[]", "utf8");
  }
}

async function readReviews(): Promise<Review[]> {
  await ensureDataFiles();

  const raw = await fs.readFile(REVIEWS_FILE, "utf8");
  if (!raw.trim()) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeReviews(reviews: Review[]) {
  await ensureDataFiles();
  await fs.writeFile(REVIEWS_FILE, JSON.stringify(reviews, null, 2), "utf8");
}

async function readProducts(): Promise<Product[]> {
  try {
    const raw = await fs.readFile(PRODUCTS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function cleanText(value: unknown, max = 500) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, max);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    const includePending = searchParams.get("includePending") === "true";

    let reviews = await readReviews();

    if (productId) {
      reviews = reviews.filter((review) => review.productId === productId);
    }

    if (!includePending) {
      reviews = reviews.filter((review) => review.approved === true);
    }

    reviews.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      ok: true,
      reviews,
      total: reviews.length,
    });
  } catch (error) {
    console.error("Erro ao buscar reviews:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Erro ao buscar avaliações.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const productId = cleanText(body.productId, 120);
    const name = cleanText(body.name, 100);
    const comment = cleanText(body.comment, 500);
    const rating = Number(body.rating);

    if (!productId) {
      return NextResponse.json(
        { ok: false, error: "Produto não informado." },
        { status: 400 }
      );
    }

    const products = await readProducts();
    const productExists = products.some((product) => product.id === productId);

    if (!productExists) {
      return NextResponse.json(
        { ok: false, error: "Produto não encontrado." },
        { status: 404 }
      );
    }

    if (!name || name.length < 2) {
      return NextResponse.json(
        { ok: false, error: "Informe seu nome." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { ok: false, error: "Selecione uma nota de 1 a 5." },
        { status: 400 }
      );
    }

    if (!comment || comment.length < 10) {
      return NextResponse.json(
        { ok: false, error: "Escreva pelo menos 10 caracteres." },
        { status: 400 }
      );
    }

    const reviews = await readReviews();

    const newReview: Review = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `review-${Date.now()}`,
      productId,
      name,
      rating: Math.round(rating),
      comment,
      createdAt: new Date().toISOString(),
      approved: false,
    };

    reviews.push(newReview);
    await writeReviews(reviews);

    return NextResponse.json(
      {
        ok: true,
        message:
          "Avaliação enviada com sucesso. Ela aparecerá após aprovação manual.",
        review: newReview,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao salvar review:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Erro ao enviar avaliação.",
      },
      { status: 500 }
    );
  }
}
