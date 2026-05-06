import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PlanKey = "basico" | "prime" | "premium" | "ia_pro";

function normalizePlan(value: unknown): PlanKey | null {
  const raw = String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (["basico", "basic", "starter"].includes(raw)) return "basico";
  if (["prime"].includes(raw)) return "prime";
  if (["premium", "max"].includes(raw)) return "premium";
  if (["ia_pro", "iapro", "pro"].includes(raw)) return "ia_pro";

  return null;
}

function getOrigin(req: NextRequest) {
  const envOrigin =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL;

  if (envOrigin) return envOrigin.replace(/\/$/, "");

  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const protocol = req.headers.get("x-forwarded-proto") || "https";

  if (host && !host.includes("localhost")) return `${protocol}://${host}`;

  return "https://sualuma.online";
}

function getPriceMap() {
  return {
    basico: process.env.STRIPE_PRICE_BASICO || "",
    prime: process.env.STRIPE_PRICE_PRIME || process.env.STRIPE_PRICE_PRO || "",
    premium: process.env.STRIPE_PRICE_PREMIUM || "",
    ia_pro: process.env.STRIPE_PRICE_IA_PRO || process.env.STRIPE_PRICE_PRO || "",
  };
}

function getPublicPlanName(plan: PlanKey) {
  const names: Record<PlanKey, string> = {
    basico: "Básico",
    prime: "Prime",
    premium: "Premium",
    ia_pro: "IA Pro",
  };

  return names[plan];
}

function getAccessPlanKey(plan: PlanKey) {
  if (plan === "basico") return "basic";
  if (plan === "ia_pro") return "pro";
  return plan;
}

function getTrialDays(plan: PlanKey) {
  if (plan === "ia_pro") return 30;
  return 7;
}

export async function POST(req: NextRequest) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json(
        { ok: false, error: "STRIPE_SECRET_KEY não configurada no servidor." },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const plan = normalizePlan(body.plan);

    if (!plan) {
      return NextResponse.json(
        { ok: false, error: "Plano inválido." },
        { status: 400 }
      );
    }

    const priceId = getPriceMap()[plan];

    if (!priceId) {
      return NextResponse.json(
        { ok: false, error: `Price ID não configurado para o plano ${plan}.` },
        { status: 500 }
      );
    }

    const stripe = new Stripe(secretKey);
    const origin = getOrigin(req);

    const userId =
      typeof body.userId === "string" && body.userId
        ? body.userId
        : typeof body.user_id === "string" && body.user_id
          ? body.user_id
          : "";

    const email =
      typeof body.email === "string" && body.email.includes("@")
        ? body.email
        : undefined;

    const trialDays = getTrialDays(plan);

    const metadata = {
      plan,
      plan_name: getPublicPlanName(plan),
      plan_key: getAccessPlanKey(plan),
      user_id: userId,
      source: "sualuma-os",
      trial_days: String(trialDays),
    };

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_collection: "always",
      allow_promotion_codes: true,
      customer_email: email,
      client_reference_id: userId || undefined,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: trialDays,
        trial_settings: {
          end_behavior: {
            missing_payment_method: "cancel",
          },
        },
        metadata,
      },
      metadata,
      success_url: `${origin}/api/stripe/activate-session?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/plans?checkout=cancelado&plan=${plan}`,
    });

    return NextResponse.json(
      {
        ok: true,
        plan,
        priceId,
        checkoutUrl: session.url,
        sessionId: session.id,
        trialDays,
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
