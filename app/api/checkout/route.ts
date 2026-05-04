import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

type StoreProduct = {
  id: string;
  name: string;
  price_brl: number;
  description: string;
  delivery?: string;
  access_location?: string;
  stripe_price_id?: string;
  order_bump?: {
    id?: string;
    name: string;
    price_brl: number;
    description: string;
    stripe_price_id?: string;
  };
};

async function getProducts(): Promise<StoreProduct[]> {
  const filePath = path.join(process.cwd(), "data", "store-products.json");
  const raw = await readFile(filePath, "utf8");
  const store = JSON.parse(raw);
  return store.products || [];
}

function dynamicLineItem(item: {
  name: string;
  description: string;
  price_brl: number;
}) {
  return {
    price_data: {
      currency: "brl",
      unit_amount: Math.round(item.price_brl * 100),
      product_data: {
        name: item.name,
        description: item.description.slice(0, 500),
        metadata: {
          source: "sualuma-store"
        }
      }
    },
    quantity: 1
  };
}

export async function POST(request: NextRequest) {
  try {
    const stripeSecret = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecret) {
      return NextResponse.json(
        {
          error:
            "Stripe ainda não está configurado. Configure STRIPE_SECRET_KEY no .env.local para liberar checkout real."
        },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecret);
    const body = await request.json();

    const productId = String(body.productId || body.product_id || "");
    const includeOrderBump = body.includeOrderBump === true || body.include_order_bump === true || body.includeOrderBump === "true" || body.include_order_bump === "true";

    const products = await getProducts();
    const product = products.find((item) => item.id === productId);

    if (!product) {
      return NextResponse.json(
        { error: "Produto não encontrado." },
        { status: 404 }
      );
    }

    const line_items: any[] = [];

    if (product.stripe_price_id) {
      line_items.push({ price: product.stripe_price_id, quantity: 1 });
    } else {
      line_items.push(
        dynamicLineItem({
          name: product.name,
          description: product.description,
          price_brl: product.price_brl
        })
      );
    }

    if (includeOrderBump && product.order_bump) {
      if (product.order_bump.stripe_price_id) {
        line_items.push({
          price: product.order_bump.stripe_price_id,
          quantity: 1
        });
      } else {
        line_items.push(
          dynamicLineItem({
            name: product.order_bump.name,
            description: product.order_bump.description,
            price_brl: product.order_bump.price_brl
          })
        );
      }
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.APP_URL ||
      "https://sualuma.online";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items,
      allow_promotion_codes: true,
      customer_creation: "always",
      success_url: `${appUrl}/loja-agentes/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/loja-agentes?checkout=cancelado`,
      metadata: {
        product_id: product.id,
        product_name: product.name,
        includes_order_bump: String(includeOrderBump),
        access_location: "chat.sualuma.online → Mia → Meus Agentes",
        delivery_rule:
          "Após pagamento confirmado, liberar no Painel de Agentes dentro da Mia."
      },
      payment_intent_data: {
        metadata: {
          product_id: product.id,
          product_name: product.name,
          includes_order_bump: String(includeOrderBump)
        }
      },
      custom_text: {
        submit: {
          message:
            "Depois da compra, você receberá instruções para acessar seu agente no Painel de Agentes dentro da Mia."
        }
      }
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido no checkout.";

    return NextResponse.json(
      { error: "Erro ao criar checkout.", details: message },
      { status: 500 }
    );
  }
}
