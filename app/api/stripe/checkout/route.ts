import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PlanKey = "basico" | "pro" | "premium";

function normalizePlan(value: unknown): PlanKey | null {
  const raw = String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (["basico", "basic", "starter"].includes(raw)) return "basico";
  if (["pro", "prime"].includes(raw)) return "pro";
  if (["premium", "max"].includes(raw)) return "premium";

  return null;
}

function getOrigin(req: NextRequest) {
  const envOrigin =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL;

  if (envOrigin) return envOrigin.replace(/\/$/, "");

  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host");

  const protocol =
    req.headers.get("x-forwarded-proto") ||
    "https";

  if (host) return `${protocol}://${host}`;

  return "https://sualuma.online";
}

function getPriceMap() {
  return {
    basico: process.env.STRIPE_PRICE_BASICO || "price_1TPrgTJWAf8yuE3K4xneCcWS",
    pro: process.env.STRIPE_PRICE_PRO || "price_1TPrk4JWAf8yuE3KuDrJMtFm",
    premium: process.env.STRIPE_PRICE_PREMIUM || "price_1TPrlhJWAf8yuE3KXoHw2Asa",
  };
}

export async function POST(req: NextRequest) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json(
        {
          ok: false,
          error: "STRIPE_SECRET_KEY não configurada no servidor.",
        },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));

    const plan = normalizePlan(body.plan);
    const priceMap = getPriceMap();

    if (!plan) {
      return NextResponse.json(
        {
          ok: false,
          error: "Plano inválido. Use: basico, pro ou premium.",
        },
        { status: 400 }
      );
    }

    const priceId = priceMap[plan];

    if (!priceId) {
      return NextResponse.json(
        {
          ok: false,
          error: `Price ID não configurado para o plano ${plan}.`,
        },
        { status: 500 }
      );
    }

    const stripe = new Stripe(secretKey);

    const origin = getOrigin(req);
    const trialDays = Number(process.env.STRIPE_TRIAL_DAYS || "0");

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_collection: "always",
      allow_promotion_codes: true,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email:
        typeof body.email === "string" && body.email.includes("@")
          ? body.email
          : undefined,
      client_reference_id:
        typeof body.userId === "string" && body.userId
          ? body.userId
          : undefined,
      subscription_data: {
        ...(trialDays > 0 ? { trial_period_days: trialDays } : {}),
        metadata: {
          plan,
          source: "sualuma-os",
        },
      },
      metadata: {
        plan,
        source: "sualuma-os",
      },
      success_url: `${origin}/bem-vindo?checkout=sucesso&plan=${plan}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/planos?checkout=cancelado&plan=${plan}`,
    });

    return NextResponse.json(
      {
        ok: true,
        plan,
        priceId,
        checkoutUrl: session.url,
        sessionId: session.id,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("[stripe/checkout] erro:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
