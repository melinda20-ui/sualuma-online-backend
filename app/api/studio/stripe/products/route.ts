import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY não configurada.");
  }

  return new Stripe(secretKey);
}

function moneyFromCents(amount: number | null | undefined, currency = "brl") {
  const value = typeof amount === "number" ? amount / 100 : 0;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(value);
}

function checkAdmin(req: NextRequest) {
  const expected = process.env.STUDIO_ADMIN_KEY;

  if (!expected) {
    return false;
  }

  const headerKey =
    req.headers.get("x-studio-admin-key") ||
    req.headers.get("x-admin-key") ||
    "";

  const auth = req.headers.get("authorization") || "";
  const bearer = auth.startsWith("Bearer ") ? auth.replace("Bearer ", "").trim() : "";

  return headerKey === expected || bearer === expected;
}

function safeSlug(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export async function GET() {
  try {
    const stripe = getStripe();

    const prices = await stripe.prices.list({
      active: true,
      limit: 100,
      expand: ["data.product"],
    });

    const products = prices.data
      .map((price) => {
        const product =
          typeof price.product === "string" ? null : price.product;

        if (!product || product.deleted) {
          return null;
        }

        const interval = price.recurring?.interval || null;
        const amount = price.unit_amount || 0;
        const currency = price.currency || "brl";

        const featuresRaw =
          product.metadata?.features ||
          product.metadata?.features_json ||
          "";

        let features: string[] = [];

        try {
          const parsed = JSON.parse(featuresRaw);
          if (Array.isArray(parsed)) {
            features = parsed.map(String);
          }
        } catch {
          features = featuresRaw
            ? featuresRaw
                .split("|")
                .map((item) => item.trim())
                .filter(Boolean)
            : [];
        }

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
          currency,
          price: moneyFromCents(amount, currency),
          priceFormatted: moneyFromCents(amount, currency),
          interval,
          recurring: interval ? `/${interval}` : "",
          type: price.type,
          lookupKey: price.lookup_key || "",
          metadata: product.metadata || {},
          features,
          checkoutPath: `/api/stripe/checkout-price`,
          created: product.created,
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => {
        if (a.amountNumber !== b.amountNumber) return a.amountNumber - b.amountNumber;
        return String(a.name).localeCompare(String(b.name));
      });

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
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!checkAdmin(req)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Acesso negado. Informe a chave admin do Studio.",
        },
        { status: 401 }
      );
    }

    const body = await req.json();

    const name = String(body.name || body.title || "").trim();
    const description = String(body.description || "").trim();
    const amountInput = body.amount ?? body.price ?? body.valor;
    const amountNumber = Number(
      String(amountInput || "")
        .replace("R$", "")
        .replace(/\./g, "")
        .replace(",", ".")
        .trim()
    );

    const currency = String(body.currency || "brl").toLowerCase();
    const interval = String(body.interval || "month").toLowerCase();
    const project = String(body.project || "services").trim();
    const slug = String(body.slug || safeSlug(name)).trim();

    const features = Array.isArray(body.features)
      ? body.features.map(String).filter(Boolean)
      : String(body.features || "")
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean);

    if (!name) {
      return NextResponse.json(
        { ok: false, error: "Nome do produto obrigatório." },
        { status: 400 }
      );
    }

    if (!amountNumber || amountNumber <= 0) {
      return NextResponse.json(
        { ok: false, error: "Valor inválido. Exemplo: 97 ou 97,00." },
        { status: 400 }
      );
    }

    const allowedIntervals = ["day", "week", "month", "year"];

    if (!allowedIntervals.includes(interval)) {
      return NextResponse.json(
        { ok: false, error: "Intervalo inválido. Use: day, week, month ou year." },
        { status: 400 }
      );
    }

    const stripe = getStripe();

    const product = await stripe.products.create({
      name,
      description: description || undefined,
      active: true,
      metadata: {
        source: "sualuma-studio",
        project,
        slug,
        public: "true",
        features_json: JSON.stringify(features),
      },
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(amountNumber * 100),
      currency,
      recurring: {
        interval: interval as Stripe.PriceCreateParams.Recurring.Interval,
      },
      metadata: {
        source: "sualuma-studio",
        project,
        slug,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Produto e preço criados com sucesso.",
      product: {
        id: product.id,
        productId: product.id,
        priceId: price.id,
        name: product.name,
        description: product.description || "",
        amount: price.unit_amount || 0,
        amountNumber,
        currency,
        price: moneyFromCents(price.unit_amount, currency),
        interval,
        features,
      },
    });
  } catch (error: any) {
    console.error("[studio/stripe/products][POST]", error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Erro ao criar produto/plano na Stripe.",
      },
      { status: 500 }
    );
  }
}
