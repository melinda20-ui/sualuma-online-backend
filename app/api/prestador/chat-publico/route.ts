import { NextRequest, NextResponse } from "next/server";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

type PublicChatMessage = {
  id: string;
  name: string;
  message: string;
  page: string;
  createdAt: string;
  status: "nova";
};

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "prestador-chat-publico.json");

async function readMessages(): Promise<PublicChatMessage[]> {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const name = String(body?.name || "Visitante").trim().slice(0, 80);
    const message = String(body?.message || "").trim().slice(0, 1200);
    const page = String(body?.page || "/prestador/planos").trim().slice(0, 180);

    if (!message) {
      return NextResponse.json(
        { ok: false, error: "Mensagem vazia." },
        { status: 400 }
      );
    }

    await mkdir(DATA_DIR, { recursive: true });

    const messages = await readMessages();

    const item: PublicChatMessage = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name,
      message,
      page,
      createdAt: new Date().toISOString(),
      status: "nova",
    };

    messages.unshift(item);

    await writeFile(DATA_FILE, JSON.stringify(messages.slice(0, 300), null, 2));

    const webhookUrl = process.env.PRESTADOR_CHAT_WEBHOOK_URL;

    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
      } catch (error) {
        console.error("[prestador-chat-publico] Falha ao enviar webhook:", error);
      }
    }

    return NextResponse.json({ ok: true, message: item });
  } catch (error) {
    console.error("[prestador-chat-publico] Erro:", error);

    return NextResponse.json(
      { ok: false, error: "Erro interno ao salvar mensagem." },
      { status: 500 }
    );
  }
}
