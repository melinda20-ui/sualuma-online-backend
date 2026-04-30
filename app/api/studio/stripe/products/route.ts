import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;

  if (!key) {
    throw new Error("STRIPE_SECRET_KEY não configurada.");
  }

  return new Stripe(key);
}

function formatBRL(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function parseFeatures(metadata: Stripe.Metadata | null | undefined) {
  if (!metadata) return [];

  const raw = metadata.features || metadata.benefits || "";

  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
  } catch {}

  return raw
    .split(/\n|\|/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function classifyProduct(product: Stripe.Product) {
  const metadataCategory = String(product.metadata?.category || "").toLowerCase();
  const name = product.name.toLowerCase();

  if (metadataCategory) return metadataCategory;
  if (name.includes("serviço") || name.includes("servico") || name.includes("site") || name.includes("landing")) return "servicos";
  if (name.includes("ia") || name.includes("ai") || name.includes("agente")) return "ia";

  return "geral";
}

async function listStripeProducts() {
  const stripe = getStripe();

  const prices = await stripe.prices.list({
    active: true,
    limit: 100,
    expand: ["data.product"],
  });

  const products = prices.data
    .map((price) => {
      const product = price.product as Stripe.Product;

      if (!product || product.deleted) return null;

      const amount = price.unit_amount || 0;
      const interval = price.recurring?.interval || null;
      const category = classifyProduct(product);

      return {
        id: product.id,
        productId: product.id,
        priceId: price.id,
        name: product.name,
        title: product.name,
        description: product.description || "",
        active: product.active,
        priceActive: price.active,
        amount,
        amountCents: amount,
        amountNumber: amount / 100,
        currency: price.currency,
        price: formatBRL(amount),
        priceFormatted: formatBRL(amount),
        interval,
        recurring: interval ? `/${interval}` : "",
        type: price.type,
        category,
        lookupKey: price.lookup_key || "",
        metadata: product.metadata || {},
        features: parseFeatures(product.metadata),
        checkoutPath: "/api/stripe/checkout-price",
        created: product.created,
      };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => b.created - a.created);

  return products;
}

function getAdminKey(req: NextRequest) {
  const headerKey = req.headers.get("x-studio-admin-key") || "";
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  return headerKey || bearer;
}

export async function GET() {
  try {
    const products = await listStripeProducts();

    return NextResponse.json({
      ok: true,
      source: "stripe",
      count: products.length,
      products,
    });
  } catch (error: any) {
    console.error("[studio/stripe/products][GET]", error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Erro ao listar produtos da Stripe.",
        products: [],
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminKey = process.env.STUDIO_ADMIN_KEY;

    if (!adminKey) {
      return NextResponse.json(
        {
          ok: false,
          error: "STUDIO_ADMIN_KEY não configurada no servidor.",
        },
        { status: 500 }
      );
    }

    const receivedKey = getAdminKey(req);

    if (receivedKey !== adminKey) {
      return NextResponse.json(
        {
          ok: false,
          error: "Chave admin inválida.",
        },
        { status: 401 }
      );
    }

    const body = await req.json();

    const name = String(body.name || "").trim();
    const description = String(body.description || "").trim();
    const category = String(body.category || "servicos").trim();
    const interval = String(body.interval || "month").trim() as Stripe.PriceCreateParams.Recurring.Interval;
    const currency = String(body.currency || "brl").trim().toLowerCase();
    const rawAmount = Number(body.amountNumber || body.amount || body.price || 0);
    const amountCents = Math.round(rawAmount * 100);

    const features = String(body.features || "")
      .split(/\n|\|/)
      .map((item) => item.trim())
      .filter(Boolean);

    if (!name) {
      return NextResponse.json(
        { ok: false, error: "Informe o nome do plano/produto." },
        { status: 400 }
      );
    }

    if (!amountCents || amountCents < 100) {
      return NextResponse.json(
        { ok: false, error: "Informe um valor válido. Exemplo: 97." },
        { status: 400 }
      );
    }

    const stripe = getStripe();

    const product = await stripe.products.create({
      name,
      description,
      active: true,
      metadata: {
        category,
        features: JSON.stringify(features),
        created_from: "studio_sualuma",
      },
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: amountCents,
      currency,
      recurring: {
        interval,
      },
      metadata: {
        category,
        created_from: "studio_sualuma",
      },
    });

    const products = await listStripeProducts();

    return NextResponse.json({
      ok: true,
      message: "Produto e preço criados na Stripe.",
      productId: product.id,
      priceId: price.id,
      product,
      price,
      products,
    });
  } catch (error: any) {
    console.error("[studio/stripe/products][POST]", error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Erro ao criar produto na Stripe.",
      },
      { status: 500 }
    );
  }
}
