import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getFlowmaticCheckoutItem } from "../../../flowmind/lib/commerce";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getOrigin(req: NextRequest) {
  const envOrigin =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL;

  if (envOrigin) return envOrigin.replace(/\/$/, "");

  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const protocol = req.headers.get("x-forwarded-proto") || "https";

  if (host) return `${protocol}://${host}`;

  return "https://sualuma.online";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const kind = String(body.kind || "");
    const slug = String(body.slug || "");
    const userId = String(body.userId || "demo-user");

    const item = getFlowmaticCheckoutItem(kind, slug);

    if (!item) {
      return NextResponse.json(
        {
          ok: false,
          error: "Item Flowmatic não encontrado para checkout.",
        },
        { status: 404 }
      );
    }

    const origin = getOrigin(req);

    if (item.mode === "free") {
      return NextResponse.json({
        ok: true,
        mode: "free",
        item,
        redirectUrl: item.successPath,
      });
    }

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

    if (!item.priceEnv) {
      return NextResponse.json(
        {
          ok: false,
          error: "Este item não tem variável de preço configurada.",
          item,
        },
        { status: 500 }
      );
    }

    const priceId = process.env[item.priceEnv];

    if (!priceId || !priceId.startsWith("price_")) {
      return NextResponse.json(
        {
          ok: false,
          error: `Price ID não configurado. Adicione ${item.priceEnv}=price_... no .env.local`,
          missingEnv: item.priceEnv,
          item: {
            kind: item.kind,
            slug: item.slug,
            name: item.name,
            mode: item.mode,
          },
        },
        { status: 500 }
      );
    }

    const stripe = new Stripe(secretKey);

    const successUrl = `${origin}${item.successPath}?checkout=sucesso&kind=${item.kind}&slug=${item.slug}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}${item.cancelPath}?checkout=cancelado`;

    const session = await stripe.checkout.sessions.create({
      mode: item.mode,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      client_reference_id: userId,
      metadata: {
        source: "flowmatic",
        flowmatic_kind: item.kind,
        flowmatic_slug: item.slug,
        flowmatic_name: item.name,
        user_id: userId,
      },
      ...(item.mode === "subscription"
        ? {
            subscription_data: {
              metadata: {
                source: "flowmatic",
                flowmatic_kind: item.kind,
                flowmatic_slug: item.slug,
                flowmatic_name: item.name,
                user_id: userId,
              },
            },
          }
        : {}),
    });

    return NextResponse.json({
      ok: true,
      mode: item.mode,
      checkoutUrl: session.url,
      sessionId: session.id,
      item: {
        kind: item.kind,
        slug: item.slug,
        name: item.name,
        priceEnv: item.priceEnv,
      },
    });
  } catch (error) {
    console.error("[flowmind/checkout]", error);

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Erro ao criar checkout Flowmatic.",
      },
      { status: 500 }
    );
  }
}
