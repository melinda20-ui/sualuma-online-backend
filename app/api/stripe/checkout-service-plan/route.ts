import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getBaseUrl(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin) return origin;

  const host = request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "https";

  if (host) return `${proto}://${host}`;

  return process.env.NEXT_PUBLIC_SITE_URL || "https://sualuma.online";
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error("Supabase não configurado.");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getStripe() {
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeKey) {
    throw new Error("STRIPE_SECRET_KEY não configurada.");
  }

  return new Stripe(stripeKey);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const slug = String(body.slug || body.planSlug || "").trim();

    if (!slug) {
      return NextResponse.json(
        {
          ok: false,
          error: "Envie o slug do plano. Exemplo: pacote-propostas, prioritario ou agencia-time.",
        },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data: plan, error } = await supabase
      .from("service_provider_plans")
      .select("*")
      .eq("slug", slug)
      .eq("active", true)
      .single();

    if (error || !plan) {
      return NextResponse.json(
        {
          ok: false,
          error: "Plano não encontrado ou inativo.",
          details: error?.message,
        },
        { status: 404 }
      );
    }

    if (!plan.stripe_price_id) {
      return NextResponse.json(
        {
          ok: false,
          error: "Este plano ainda não tem priceId do Stripe salvo.",
          plan: {
            slug: plan.slug,
            name: plan.name,
            stripeProductId: plan.stripe_product_id,
            stripePriceId: plan.stripe_price_id,
          },
        },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const baseUrl = getBaseUrl(request);

    const isSubscription = plan.type === "assinatura";

    const successUrl =
      body.successUrl ||
      `${baseUrl}/servicos/planos?checkout=success&plan=${encodeURIComponent(plan.slug)}`;

    const cancelUrl =
      body.cancelUrl ||
      `${baseUrl}/servicos/planos?checkout=cancel&plan=${encodeURIComponent(plan.slug)}`;

    const session = await stripe.checkout.sessions.create({
      mode: isSubscription ? "subscription" : "payment",
      line_items: [
        {
          price: plan.stripe_price_id,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        source: "sualuma-service-plan",
        service_plan_id: plan.id,
        service_plan_slug: plan.slug,
        service_plan_type: plan.type,
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({
      ok: true,
      checkoutUrl: session.url,
      sessionId: session.id,
      mode: isSubscription ? "subscription" : "payment",
      plan: {
        id: plan.id,
        slug: plan.slug,
        name: plan.name,
        type: plan.type,
        stripeProductId: plan.stripe_product_id,
        stripePriceId: plan.stripe_price_id,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Erro ao criar checkout do plano de serviço.",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Use POST com { slug: 'pacote-propostas' | 'prioritario' | 'agencia-time' } para criar checkout.",
  });
}
