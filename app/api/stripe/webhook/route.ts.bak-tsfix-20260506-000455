import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnyRecord = Record<string, any>;

type StoreProduct = {
  id: string;
  name: string;
  type?: string;
  price_brl?: number;
  delivery?: string;
  access_location?: string;
  order_bump?: {
    id?: string;
    name?: string;
    price_brl?: number;
    description?: string;
  };
};

type StoreFile = {
  store_name?: string;
  access_rule?: string;
  currency?: string;
  products?: StoreProduct[];
};

type PurchasesFile = {
  updated_at?: string;
  purchases: AnyRecord[];
};

type EntitlementsFile = {
  updated_at?: string;
  entitlements: AnyRecord[];
};

type OutboxFile = {
  updated_at?: string;
  emails: AnyRecord[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "store-products.json");
const PURCHASES_FILE = path.join(DATA_DIR, "agent-purchases.json");
const ENTITLEMENTS_FILE = path.join(DATA_DIR, "agent-entitlements.json");
const OUTBOX_FILE = path.join(DATA_DIR, "agent-email-outbox.json");

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(filePath: string, data: unknown) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function brlFromCents(value: unknown) {
  const cents = typeof value === "number" ? value : 0;
  return Math.round(cents) / 100;
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error("Supabase admin não configurado para gravar acesso.");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

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
    basico: "basic",
    basic: "basic",
    starter: "basic",

    prime: "prime",

    premium: "premium",

    pro: "pro",

    gratuito_prestador: "provider_free",
    prestador_gratuito: "provider_free",
    provider_free: "provider_free",

    pacote_propostas: "proposal_pack",
    pacote_de_propostas: "proposal_pack",
    proposal_pack: "proposal_pack",

    prioritario: "provider_priority",
    prestador_prioritario: "provider_priority",
    provider_priority: "provider_priority",

    agencia_time: "provider_agency_team",
    agencia_e_time: "provider_agency_team",
    prestador_agencia: "provider_agency_team",
    provider_agency_team: "provider_agency_team",

    flowmatic_start: "flowmatic_start",
    flowmatic_comecar: "flowmatic_start",
    flowmatic_comecar_agora: "flowmatic_start",

    flowmatic_rotina_pro: "flowmatic_rotina_pro",
    rotina_pro: "flowmatic_rotina_pro",

    flowmatic_solo_ceo: "flowmatic_solo_ceo",
    solo_ceo: "flowmatic_solo_ceo",

    flowmatic_imperio_solo: "flowmatic_imperio_solo",
    imperio_solo: "flowmatic_imperio_solo",

    template_saida_financeira: "template_saida_financeira",
    saida_financeira: "template_saida_financeira",

    template_mae_empreendedora: "template_mae_empreendedora",
    mae_empreendedora: "template_mae_empreendedora",

    trial_30_days: "trial_30_days",
    teste_gratis_30_dias: "trial_30_days",
    teste_30_dias: "trial_30_days",
  };

  return aliases[key] || key;
}

function getPlanKeyFromSession(metadata: AnyRecord, productId: string, productName: string) {
  const candidates = [
    metadata.plan_key,
    metadata.planKey,
    metadata.plan,
    metadata.service_plan_slug,
    metadata.slug,
    metadata.product_id,
    metadata.productId,
    productId,
    productName,
  ];

  for (const candidate of candidates) {
    const key = canonicalPlanKey(candidate);
    if (key && key !== "produto_desconhecido") return key;
  }

  return "";
}

function getStripeId(value: unknown) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value && "id" in value) {
    return String((value as AnyRecord).id || "");
  }
  return "";
}

function grantsAccessFromPaymentStatus(value: unknown) {
  const status = String(value || "");
  return status === "paid" || status === "no_payment_required";
}

async function findUserIdForAccess(supabase: any, session: AnyRecord, metadata: AnyRecord, customerEmail: string) {
  const directUserId =
    String(session.client_reference_id || "").trim() ||
    String(metadata.user_id || metadata.userId || "").trim();

  if (directUserId) return directUserId;

  if (!customerEmail) return "";

  try {
    const { data, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (error) return "";

    const found = data.users.find(
      (user: AnyRecord) => String(user.email || "").toLowerCase() === customerEmail.toLowerCase()
    );

    return found?.id || "";
  } catch {
    return "";
  }
}

async function findPlanForAccess(supabase: any, planKey: string) {
  const aliases = Array.from(
    new Set([
      planKey,
      planKey.replace(/_/g, "-"),
      planKey.replace(/-/g, "_"),
      canonicalPlanKey(planKey),
    ].filter(Boolean))
  );

  const byPlanKey = await supabase
    .from("plans")
    .select("id, plan_key, slug, name")
    .in("plan_key", aliases)
    .limit(1)
    .maybeSingle();

  if (byPlanKey.data) return byPlanKey.data as AnyRecord;

  const bySlug = await supabase
    .from("plans")
    .select("id, plan_key, slug, name")
    .in("slug", aliases)
    .limit(1)
    .maybeSingle();

  return (bySlug.data || null) as AnyRecord | null;
}

async function recordSubscriptionAccess(params: {
  session: AnyRecord;
  metadata: AnyRecord;
  productId: string;
  productName: string;
  grantsAccess: boolean;
}) {
  const { session, metadata, productId, productName, grantsAccess } = params;

  if (!grantsAccess) {
    return {
      ok: false,
      skipped: true,
      reason: "payment_not_granted_yet",
    };
  }

  try {
    const supabase = getSupabaseAdmin();

    const customerEmail =
      session.customer_details?.email ||
      session.customer_email ||
      metadata.email ||
      "";

    const userId = await findUserIdForAccess(supabase, session, metadata, customerEmail);
    const planKey = getPlanKeyFromSession(metadata, productId, productName);

    if (!userId) {
      return {
        ok: false,
        skipped: true,
        reason: "missing_user_id",
        message: "Checkout não trouxe user_id/client_reference_id e não foi possível achar usuário pelo e-mail.",
      };
    }

    if (!planKey) {
      return {
        ok: false,
        skipped: true,
        reason: "missing_plan_key",
        message: "Checkout não trouxe plan_key identificável.",
      };
    }

    const plan = await findPlanForAccess(supabase, planKey);

    if (!plan?.id) {
      return {
        ok: false,
        skipped: true,
        reason: "plan_not_found",
        planKey,
      };
    }

    const subscriptionId = getStripeId(session.subscription);
    const customerId = getStripeId(session.customer);
    const now = new Date().toISOString();

    const row: AnyRecord = {
      user_id: userId,
      plan_id: plan.id,
      status: "active",
      started_at: now,
      expires_at: null,
      stripe_customer_id: customerId || null,
      stripe_subscription_id: subscriptionId || null,
    };

    let existing: AnyRecord | null = null;

    if (subscriptionId) {
      const existingBySub = await supabase
        .from("user_subscriptions")
        .select("id")
        .eq("stripe_subscription_id", subscriptionId)
        .limit(1)
        .maybeSingle();

      existing = (existingBySub.data || null) as AnyRecord | null;
    }

    if (!existing) {
      const existingByUserPlan = await supabase
        .from("user_subscriptions")
        .select("id")
        .eq("user_id", userId)
        .eq("plan_id", plan.id)
        .limit(1)
        .maybeSingle();

      existing = (existingByUserPlan.data || null) as AnyRecord | null;
    }

    if (existing?.id) {
      const { error } = await supabase
        .from("user_subscriptions")
        .update(row)
        .eq("id", existing.id);

      if (error) throw error;

      return {
        ok: true,
        action: "updated",
        userId,
        planId: plan.id,
        planKey,
        subscriptionId,
      };
    }

    const { error } = await supabase.from("user_subscriptions").insert(row);

    if (error) throw error;

    return {
      ok: true,
      action: "inserted",
      userId,
      planId: plan.id,
      planKey,
      subscriptionId,
    };
  } catch (error: any) {
    return {
      ok: false,
      skipped: false,
      reason: "supabase_write_error",
      error: error?.message || String(error),
    };
  }
}

export async function POST(request: NextRequest) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecret) {
    return NextResponse.json(
      { error: "STRIPE_SECRET_KEY não configurado." },
      { status: 500 }
    );
  }

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET não configurado. Crie o webhook no Stripe e coloque o whsec_ no .env.local." },
      { status: 500 }
    );
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Assinatura Stripe ausente." },
      { status: 400 }
    );
  }

  const stripe = new Stripe(stripeSecret);
  const rawBody = await request.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Webhook inválido.", details: error?.message || "Assinatura não conferiu." },
      { status: 400 }
    );
  }

  const allowedEvents = [
    "checkout.session.completed",
    "checkout.session.async_payment_succeeded"
  ];

  if (!allowedEvents.includes(event.type)) {
    return NextResponse.json({ received: true, ignored: event.type });
  }

  const session = event.data.object as any;
  const metadata = session.metadata || {};

  const productId = String(metadata.product_id || metadata.productId || "produto-desconhecido");
  const includesOrderBump = String(metadata.includes_order_bump || metadata.include_order_bump || "false") === "true";

  const store = await readJson<StoreFile>(STORE_FILE, { products: [] });
  const product = (store.products || []).find((item) => item.id === productId);

  const customerEmail =
    session.customer_details?.email ||
    session.customer_email ||
    metadata.email ||
    "";

  const productName =
    product?.name ||
    String(metadata.product_name || metadata.productName || productId);

  const grantsAccess = grantsAccessFromPaymentStatus(session.payment_status);
  const now = new Date().toISOString();

  const accessLocation =
    product?.access_location ||
    "chat.sualuma.online → Mia → Meus Agentes";

  const items = [
    {
      id: productId,
      name: productName,
      type: product?.type || "agent",
      source: "main_product"
    }
  ];

  if (includesOrderBump && product?.order_bump?.id) {
    items.push({
      id: product.order_bump.id,
      name: product.order_bump.name || product.order_bump.id,
      type: "order_bump",
      source: "order_bump"
    });
  }

  const accessRecord = await recordSubscriptionAccess({
    session,
    metadata,
    productId,
    productName,
    grantsAccess,
  });

  const purchase = {
    session_id: session.id,
    event_id: event.id,
    status: grantsAccess ? "access_granted" : "checkout_completed_pending_payment",
    payment_status: session.payment_status || "unknown",
    customer_email: customerEmail,
    customer_name: session.customer_details?.name || "",
    product_id: productId,
    product_name: productName,
    includes_order_bump: includesOrderBump,
    amount_total_brl: brlFromCents(session.amount_total),
    currency: String(session.currency || "brl").toUpperCase(),
    access_location: accessLocation,
    mia_panel_url: "https://chat.sualuma.online",
    created_at: now,
    raw_mode: session.mode || "payment",
    access_record: accessRecord,
  };

  const purchasesFile = await readJson<PurchasesFile>(PURCHASES_FILE, { purchases: [] });
  purchasesFile.purchases = purchasesFile.purchases.filter((item) => item.session_id !== session.id);
  purchasesFile.purchases.unshift(purchase);
  purchasesFile.updated_at = now;
  await writeJson(PURCHASES_FILE, purchasesFile);

  const entitlementsFile = await readJson<EntitlementsFile>(ENTITLEMENTS_FILE, { entitlements: [] });
  entitlementsFile.entitlements = entitlementsFile.entitlements.filter((item) => item.session_id !== session.id);
  entitlementsFile.entitlements.unshift({
    session_id: session.id,
    customer_email: customerEmail,
    status: grantsAccess ? "active" : "pending_payment",
    source: "stripe_checkout",
    product_id: productId,
    product_name: productName,
    items,
    access_location: accessLocation,
    mia_panel_url: "https://chat.sualuma.online",
    created_at: now,
    access_record: accessRecord,
  });
  entitlementsFile.updated_at = now;
  await writeJson(ENTITLEMENTS_FILE, entitlementsFile);

  const outboxFile = await readJson<OutboxFile>(OUTBOX_FILE, { emails: [] });

  if (customerEmail) {
    outboxFile.emails = outboxFile.emails.filter((item) => item.session_id !== session.id);
    outboxFile.emails.unshift({
      session_id: session.id,
      to: customerEmail,
      status: "pending_send",
      subject: `Seu acesso Sualuma: ${productName}`,
      body: [
        `Olá! Sua compra foi confirmada.`,
        ``,
        `Produto comprado: ${productName}`,
        `Valor: R$ ${brlFromCents(session.amount_total).toFixed(2)}`,
        ``,
        `Como acessar:`,
        `1. Entre em https://chat.sualuma.online`,
        `2. Abra o chat da Mia`,
        `3. Vá até o Painel de Agentes`,
        `4. Procure por: ${productName}`,
        ``,
        `Equipe Sualuma`
      ].join("\n"),
      created_at: now
    });
    outboxFile.updated_at = now;
    await writeJson(OUTBOX_FILE, outboxFile);
  }

  return NextResponse.json({
    received: true,
    recorded: true,
    session_id: session.id,
    product_id: productId,
    customer_email: customerEmail,
    status: purchase.status,
    accessRecorded: accessRecord.ok === true,
    accessRecord,
  });
}
