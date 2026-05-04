import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

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

  const paid = session.payment_status === "paid";
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

  const purchase = {
    session_id: session.id,
    event_id: event.id,
    status: paid ? "paid_pending_activation" : "checkout_completed_pending_payment",
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
    raw_mode: session.mode || "payment"
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
    status: paid ? "active" : "pending_payment",
    source: "stripe_checkout",
    product_id: productId,
    product_name: productName,
    items,
    access_location: accessLocation,
    mia_panel_url: "https://chat.sualuma.online",
    created_at: now
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
      subject: `Seu acesso aos agentes Sualuma: ${productName}`,
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
        `Se for agente sob encomenda, você receberá as próximas instruções para o briefing e ativação.`,
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
    status: purchase.status
  });
}
