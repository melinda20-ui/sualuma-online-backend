import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "prestador-chat-publico.json");

type PublicChatMessage = {
  id: string;
  name: string;
  message: string;
  page: string;
  createdAt: string;
  status: "nova" | "respondida";
};

async function readMessages(): Promise<PublicChatMessage[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveMessage(message: PublicChatMessage) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const messages = await readMessages();
  messages.unshift(message);
  await fs.writeFile(DATA_FILE, JSON.stringify(messages.slice(0, 300), null, 2));
}

async function sendWhatsAppNotification(message: PublicChatMessage) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const toNumber = process.env.WHATSAPP_TO_NUMBER;
  const graphVersion = process.env.WHATSAPP_GRAPH_VERSION || "v25.0";

  if (!token || !phoneNumberId || !toNumber) {
    return {
      ok: false,
      skipped: true,
      reason: "Variáveis do WhatsApp não configuradas.",
    };
  }

  const pageUrl =
    message.page?.startsWith("http")
      ? message.page
      : `https://sualuma.online${message.page || "/prestador/planos"}`;

  const body =
`💬 Nova mensagem no Chat Sua Luma

Página: ${pageUrl}

Nome: ${message.name || "Visitante"}

Mensagem:
${message.message}

Responder: entre no Studio ou responda manualmente pelo WhatsApp.`;

  const res = await fetch(
    `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: toNumber,
        type: "text",
        text: {
          preview_url: false,
          body,
        },
      }),
    }
  );

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    console.error("[prestador-chat-publico] WhatsApp falhou:", {
      status: res.status,
      error: data?.error?.message || "Erro desconhecido",
    });

    return {
      ok: false,
      status: res.status,
      error: data?.error?.message || "Erro desconhecido",
    };
  }

  return {
    ok: true,
    whatsappMessageId: data?.messages?.[0]?.id || null,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const name = String(body?.name || body?.nome || "Visitante").trim().slice(0, 80);
    const messageText = String(body?.message || body?.mensagem || "").trim().slice(0, 1500);
    const page = String(body?.page || "/prestador/planos").trim().slice(0, 300);

    if (!messageText) {
      return NextResponse.json(
        { ok: false, error: "Mensagem vazia." },
        { status: 400 }
      );
    }

    const message: PublicChatMessage = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name,
      message: messageText,
      page,
      createdAt: new Date().toISOString(),
      status: "nova",
    };

    await saveMessage(message);

    const whatsapp = await sendWhatsAppNotification(message);

    return NextResponse.json({
      ok: true,
      message,
      whatsapp,
    });
  } catch (error) {
    console.error("[prestador-chat-publico] Erro:", error);

    return NextResponse.json(
      { ok: false, error: "Não foi possível salvar a mensagem agora." },
      { status: 500 }
    );
  }
}

export async function GET() {
  const messages = await readMessages();

  return NextResponse.json({
    ok: true,
    total: messages.length,
    messages: messages.slice(0, 50),
  });
}
