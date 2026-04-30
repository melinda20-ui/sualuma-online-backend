import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getEnv(name: string) {
  return process.env[name] || "";
}

function moneyFromCents(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format((cents || 0) / 100);
}

function getSupabaseAdmin() {
  const url = getEnv("NEXT_PUBLIC_SUPABASE_URL") || getEnv("SUPABASE_URL");
  const key = getEnv("SUPABASE_SERVICE_ROLE_KEY") || getEnv("SUPABASE_SERVICE_KEY");

  if (!url || !key) {
    throw new Error("Supabase admin não configurado.");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getStripe() {
  const secret = getEnv("STRIPE_SECRET_KEY");

  if (!secret) {
    throw new Error("STRIPE_SECRET_KEY não configurada.");
  }

  return new Stripe(secret);
}

async function listPlans() {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("service_provider_plans")
    .select("*")
    .order("price_cents", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export async function GET() {
  try {
    const plans = await listPlans();

    return NextResponse.json({
      ok: true,
      message: "Planos carregados. Use POST para sincronizar com Stripe.",
      count: plans.length,
      plans: plans.map((plan: any) => ({
        id: plan.id,
        slug: plan.slug,
        name: plan.name,
        type: plan.type,
        priceCents: plan.price_cents,
        priceFormatted: moneyFromCents(plan.price_cents),
        stripeProductId: plan.stripe_product_id,
        stripePriceId: plan.stripe_price_id,
        active: plan.active,
        needsStripe: Number(plan.price_cents || 0) > 0 && (!plan.stripe_product_id || !plan.stripe_price_id),
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Erro ao listar planos.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const dryRun = url.searchParams.get("dry") === "1";

    const stripe = getStripe();
    const supabase = getSupabaseAdmin();
    const plans = await listPlans();

    const results = [];

    for (const plan of plans as any[]) {
      const priceCents = Number(plan.price_cents || 0);

      if (!plan.active) {
        results.push({
          slug: plan.slug,
          status: "skipped_inactive",
          message: "Plano inativo ignorado.",
        });
        continue;
      }

      if (priceCents <= 0) {
        results.push({
          slug: plan.slug,
          status: "skipped_free",
          message: "Plano gratuito não precisa de Stripe.",
        });
        continue;
      }

      if (plan.stripe_product_id && plan.stripe_price_id) {
        results.push({
          slug: plan.slug,
          status: "already_connected",
          productId: plan.stripe_product_id,
          priceId: plan.stripe_price_id,
          message: "Plano já tem produto e preço Stripe.",
        });
        continue;
      }

      if (dryRun) {
        results.push({
          slug: plan.slug,
          status: "would_create",
          name: plan.name,
          type: plan.type,
          amount: moneyFromCents(priceCents),
          message: "Dry run: criaria produto/preço no Stripe.",
        });
        continue;
      }

      const product = await stripe.products.create({
        name: plan.name,
        description: plan.description || undefined,
        active: true,
        metadata: {
          source: "sualuma_service_provider_plan",
          plan_id: String(plan.id),
          plan_slug: String(plan.slug),
          plan_type: String(plan.type || ""),
        },
      });

      const isSubscription = String(plan.type || "").toLowerCase() === "assinatura";

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: priceCents,
        currency: String(plan.currency || "BRL").toLowerCase(),
        ...(isSubscription
          ? {
              recurring: {
                interval: "month",
              },
            }
          : {}),
        metadata: {
          source: "sualuma_service_provider_plan",
          plan_id: String(plan.id),
          plan_slug: String(plan.slug),
          plan_type: String(plan.type || ""),
        },
      });

      const { error: updateError } = await supabase
        .from("service_provider_plans")
        .update({
          stripe_product_id: product.id,
          stripe_price_id: price.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", plan.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      results.push({
        slug: plan.slug,
        status: "created",
        productId: product.id,
        priceId: price.id,
        amount: moneyFromCents(priceCents),
        type: isSubscription ? "subscription_monthly" : "one_time",
      });
    }

    return NextResponse.json({
      ok: true,
      source: "stripe",
      dryRun,
      results,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Erro ao sincronizar Stripe.",
      },
      { status: 500 }
    );
  }
}
