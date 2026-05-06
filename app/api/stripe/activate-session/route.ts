import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { createClient as createAdminSupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnyRecord = Record<string, any>;

const SITE_URL = "https://sualuma.online";

function cleanKey(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function canonicalPlanKey(value: unknown) {
  const key = cleanKey(value);

  const aliases: Record<string, string> = {
    trial: "basic",
    trial_30_days: "basic",
    teste_gratis: "basic",
    teste_gratis_30_dias: "basic",
    teste_30_dias: "basic",
    basico: "basic",
    basic: "basic",
    starter: "basic",
    prime: "prime",
    premium: "premium",
    pro: "pro",
  };

  return aliases[key] || key;
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error("Supabase admin não configurado.");
  }

  return createAdminSupabaseClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY não configurada.");
  }

  return new Stripe(secretKey);
}

function getStripeId(value: unknown) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value && "id" in value) {
    return String((value as AnyRecord).id || "");
  }
  return "";
}

function getProductName(session: AnyRecord) {
  const line = session.line_items?.data?.[0];
  const product = line?.price?.product;

  if (product && typeof product !== "string") {
    return String(product.name || "");
  }

  return "";
}

function getPlanKey(session: AnyRecord) {
  const line = session.line_items?.data?.[0];
  const price = line?.price;
  const product = price?.product;

  const productMetadata =
    product && typeof product !== "string" ? product.metadata || {} : {};

  const candidates = [
    session.metadata?.plan_key,
    session.metadata?.planKey,
    session.metadata?.plan,
    price?.metadata?.plan_key,
    price?.metadata?.plan,
    productMetadata.plan_key,
    productMetadata.plan,
    productMetadata.slug,
    getProductName(session),
  ];

  for (const candidate of candidates) {
    const key = canonicalPlanKey(candidate);
    if (key) return key;
  }

  return "basic";
}

async function findUserByEmail(admin: any, email: string) {
  if (!email) return "";

  try {
    const { data, error } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (error) return "";

    const found = data.users.find(
      (user: AnyRecord) =>
        String(user.email || "").toLowerCase() === email.toLowerCase()
    );

    return found?.id || "";
  } catch {
    return "";
  }
}

async function findOrCreatePlan(admin: any, planKey: string, productName: string) {
  const aliases = Array.from(
    new Set([
      planKey,
      canonicalPlanKey(planKey),
      planKey.replace(/_/g, "-"),
      planKey.replace(/-/g, "_"),
    ].filter(Boolean))
  );

  const byPlanKey = await admin
    .from("plans")
    .select("id, plan_key, slug, name")
    .in("plan_key", aliases)
    .limit(1)
    .maybeSingle();

  if (byPlanKey.data?.id) return byPlanKey.data;

  const bySlug = await admin
    .from("plans")
    .select("id, plan_key, slug, name")
    .in("slug", aliases)
    .limit(1)
    .maybeSingle();

  if (bySlug.data?.id) return bySlug.data;

  const nameMap: Record<string, string> = {
    basic: "Básico",
    prime: "Prime",
    premium: "Premium",
    pro: "Pro",
  };

  const insertPayload = {
    plan_key: planKey,
    slug: planKey,
    name: productName || nameMap[planKey] || planKey,
  };

  const created = await admin
    .from("plans")
    .insert(insertPayload)
    .select("id, plan_key, slug, name")
    .single();

  if (created.error) throw created.error;

  return created.data;
}

function grantsAccess(session: AnyRecord, subscription: AnyRecord | null) {
  const paymentStatus = String(session.payment_status || "").toLowerCase();
  const sessionStatus = String(session.status || "").toLowerCase();
  const subscriptionStatus = String(subscription?.status || "").toLowerCase();

  return (
    sessionStatus === "complete" &&
    (
      paymentStatus === "paid" ||
      paymentStatus === "no_payment_required" ||
      subscriptionStatus === "active" ||
      subscriptionStatus === "trialing"
    )
  );
}

async function activateSession(sessionId: string) {
  if (!sessionId || !sessionId.startsWith("cs_")) {
    throw new Error("Session ID inválido.");
  }

  const stripe = getStripe();

  const session: AnyRecord = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["line_items.data.price.product", "subscription", "customer"],
  });

  const subscriptionId = getStripeId(session.subscription);
  const customerId = getStripeId(session.customer);

  let subscription: AnyRecord | null =
    typeof session.subscription === "object" && session.subscription
      ? session.subscription
      : null;

  if (!subscription && subscriptionId) {
    subscription = (await stripe.subscriptions.retrieve(subscriptionId)) as any;
  }

  if (!grantsAccess(session, subscription)) {
    throw new Error(`Pagamento ainda não liberado. Status: ${session.payment_status || session.status}`);
  }

  const serverSupabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();

  const admin = getSupabaseAdmin();

  const email =
    session.customer_details?.email ||
    session.customer_email ||
    session.metadata?.email ||
    user?.email ||
    "";

  const userId =
    user?.id ||
    String(session.client_reference_id || "").trim() ||
    String(session.metadata?.user_id || session.metadata?.userId || "").trim() ||
    (await findUserByEmail(admin, email));

  if (!userId) {
    throw new Error("Não consegui identificar o usuário para liberar o plano.");
  }

  const planKey = getPlanKey(session);
  const productName = getProductName(session);
  const plan = await findOrCreatePlan(admin, planKey, productName);

  if (!plan?.id) {
    throw new Error(`Plano não encontrado/criado: ${planKey}`);
  }

  const status =
    String(subscription?.status || "").toLowerCase() === "trialing"
      ? "trialing"
      : "active";

  const now = new Date().toISOString();

  const periodEnd =
    subscription?.current_period_end || subscription?.trial_end || null;

  const row: AnyRecord = {
    user_id: userId,
    plan_id: plan.id,
    status,
    started_at: now,
    expires_at: periodEnd ? new Date(Number(periodEnd) * 1000).toISOString() : null,
    stripe_customer_id: customerId || null,
    stripe_subscription_id: subscriptionId || null,
  };

  let existing: AnyRecord | null = null;

  if (subscriptionId) {
    const existingBySub = await admin
      .from("user_subscriptions")
      .select("id")
      .eq("stripe_subscription_id", subscriptionId)
      .limit(1)
      .maybeSingle();

    existing = existingBySub.data || null;
  }

  if (!existing) {
    const existingByUserPlan = await admin
      .from("user_subscriptions")
      .select("id")
      .eq("user_id", userId)
      .eq("plan_id", plan.id)
      .limit(1)
      .maybeSingle();

    existing = existingByUserPlan.data || null;
  }

  if (existing?.id) {
    const { error } = await admin
      .from("user_subscriptions")
      .update(row)
      .eq("id", existing.id);

    if (error) throw error;

    return {
      ok: true,
      action: "updated",
      userId,
      planKey,
      status,
      subscriptionId,
    };
  }

  const { error } = await admin.from("user_subscriptions").insert(row);

  if (error) throw error;

  return {
    ok: true,
    action: "inserted",
    userId,
    planKey,
    status,
    subscriptionId,
  };
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id") || "";

  try {
    const result = await activateSession(sessionId);
    console.log("[stripe/activate-session] acesso liberado:", result);

    return NextResponse.redirect(new URL("/portal", SITE_URL));
  } catch (error: any) {
    console.error("[stripe/activate-session] erro:", error);

    const redirectUrl = new URL("/plans", SITE_URL);
    redirectUrl.searchParams.set("activation", "erro");
    redirectUrl.searchParams.set("reason", error?.message || "Erro ao liberar acesso.");

    return NextResponse.redirect(redirectUrl);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const result = await activateSession(String(body.sessionId || body.session_id || ""));

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("[stripe/activate-session:POST] erro:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Erro ao liberar acesso.",
      },
      { status: 500 }
    );
  }
}
