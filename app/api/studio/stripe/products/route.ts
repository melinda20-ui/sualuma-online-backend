import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY não configurada.");
  }

  return new Stripe(secretKey);
}

function toMoney(cents: number, currency = "brl") {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format((cents || 0) / 100);
}

function toNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toPositiveInteger(value: unknown, fallback = 0) {
  const n = Math.floor(toNumber(value, fallback));
  return Math.max(0, n);
}

function normalizeArea(value: unknown) {
  const area = String(value || "services").trim().toLowerCase();

  if (["servicos", "serviços", "services", "service"].includes(area)) {
    return "services";
  }

  return area || "services";
}

function getAdminKey(request: NextRequest) {
  return (
    request.headers.get("x-studio-admin-key") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    ""
  ).trim();
}

function assertAdmin(request: NextRequest) {
  const configuredKey = process.env.STUDIO_ADMIN_KEY || process.env.BRAIN_EXECUTOR_KEY;
  const receivedKey = getAdminKey(request);

  if (!configuredKey) {
    return false;
  }

  return receivedKey === configuredKey;
}

function splitFeatures(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean).slice(0, 12);
  }

  return String(value || "")
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function serializePrice(price: any) {
  const product = price.product || {};
  const productIsString = typeof product === "string";

  const productMetadata = productIsString ? {} : product.metadata || {};
  const priceMetadata = price.metadata || {};
  const metadata = { ...productMetadata, ...priceMetadata };

  const area = normalizeArea(metadata.sualuma_area || metadata.area || "geral");
  const features = String(metadata.features || "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);

  const amountCents = price.unit_amount || 0;
  const currency = price.currency || "brl";

  return {
    productId: productIsString ? product : product.id,
    productName: productIsString ? "Produto Stripe" : product.name,
    description: productIsString ? "" : product.description || "",
    productActive: productIsString ? true : product.active !== false,
    priceId: price.id,
    active: price.active,
    type: price.type,
    amount: amountCents / 100,
    amountCents,
    amountFormatted: toMoney(amountCents, currency),
    currency: currency.toUpperCase(),
    interval: price.recurring?.interval || "único",
    trialDays: toPositiveInteger(metadata.trial_days, 0),
    area,
    features,
    metadata,
    created: price.created,
  };
}

export async function GET(request: NextRequest) {
  try {
    const stripe = getStripe();
    const { searchParams } = new URL(request.url);
    const areaFilter = normalizeArea(searchParams.get("area") || "");

    const prices = await stripe.prices.list({
      active: true,
      limit: 100,
      expand: ["data.product"],
    });

    let products = prices.data
      .map(serializePrice)
      .filter((item) => item.productActive && item.active)
      .sort((a, b) => a.amountCents - b.amountCents);

    if (areaFilter && areaFilter !== "geral") {
      products = products.filter((item) => item.area === areaFilter);
    }

    return NextResponse.json({
      ok: true,
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

export async function POST(request: NextRequest) {
  try {
    if (!assertAdmin(request)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Acesso negado. Informe a STUDIO_ADMIN_KEY.",
        },
        { status: 401 }
      );
    }

    const stripe = getStripe();
    const body = await request.json();

    const name = String(body?.name || "").trim();
    const description = String(body?.description || "").trim();
    const area = normalizeArea(body?.area || "services");
    const intervalInput = String(body?.interval || "month").trim().toLowerCase();
    const interval = ["month", "year"].includes(intervalInput) ? intervalInput : "month";
    const amountCents = body?.amountCents
      ? toPositiveInteger(body.amountCents)
      : Math.round(toNumber(body?.amount, 0) * 100);
    const trialDays = toPositiveInteger(body?.trialDays, 0);
    const features = splitFeatures(body?.features);

    if (!name) {
      return NextResponse.json(
        { ok: false, error: "Informe o nome do plano/produto." },
        { status: 400 }
      );
    }

    if (!amountCents || amountCents < 100) {
      return NextResponse.json(
        { ok: false, error: "Informe um valor válido. Exemplo: 97 para R$ 97,00." },
        { status: 400 }
      );
    }

    const metadata = {
      sualuma_area: area,
      area,
      created_by: "studio",
      trial_days: String(trialDays),
      features: features.join("|").slice(0, 500),
    };

    const product = await stripe.products.create({
      name,
      description,
      active: true,
      metadata,
    });

    const price = await stripe.prices.create({
      product: product.id,
      currency: "brl",
      unit_amount: amountCents,
      recurring: {
        interval: interval as "month" | "year",
      },
      metadata,
    });

    await stripe.products.update(product.id, {
      default_price: price.id,
    });

    return NextResponse.json({
      ok: true,
      message: "Produto e plano criados com sucesso na Stripe.",
      productId: product.id,
      priceId: price.id,
      productName: product.name,
      amountFormatted: toMoney(amountCents, "brl"),
      interval,
      trialDays,
      area,
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
