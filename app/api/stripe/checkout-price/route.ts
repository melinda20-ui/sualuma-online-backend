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

function toPositiveInteger(value: unknown, fallback = 0) {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) ? Math.max(0, n) : fallback;
}

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    const body = await request.json();

    const priceId = String(body?.priceId || "").trim();

    if (!priceId.startsWith("price_")) {
      return NextResponse.json(
        { ok: false, error: "Price ID inválido." },
        { status: 400 }
      );
    }

    const price: any = await stripe.prices.retrieve(priceId, {
      expand: ["product"],
    });

    if (!price?.active) {
      return NextResponse.json(
        { ok: false, error: "Este preço não está ativo na Stripe." },
        { status: 400 }
      );
    }

    const product: any = price.product;

    if (product && typeof product !== "string" && product.active === false) {
      return NextResponse.json(
        { ok: false, error: "Este produto não está ativo na Stripe." },
        { status: 400 }
      );
    }

    const productMetadata = product && typeof product !== "string" ? product.metadata || {} : {};
    const metadata = {
      ...productMetadata,
      ...(price.metadata || {}),
    };

    const trialDays = toPositiveInteger(metadata.trial_days, 0);
    const mode = price.type === "recurring" ? "subscription" : "payment";

    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://sualuma.online";

    const sessionParams: any = {
      mode,
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      success_url: `${origin}/bem-vindo?checkout=sucesso&price=${price.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/services/plans?checkout=cancelado&price=${price.id}`,
      metadata: {
        price_id: price.id,
        product_id: typeof product === "string" ? product : product?.id || "",
        sualuma_area: metadata.sualuma_area || metadata.area || "services",
      },
      allow_promotion_codes: true,
    };

    if (mode === "subscription" && trialDays > 0) {
      sessionParams.subscription_data = {
        trial_period_days: trialDays,
        metadata: sessionParams.metadata,
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({
      ok: true,
      checkoutUrl: session.url,
      sessionId: session.id,
      priceId: price.id,
    });
  } catch (error: any) {
    console.error("[stripe/checkout-price]", error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Erro ao criar checkout.",
      },
      { status: 500 }
    );
  }
}
