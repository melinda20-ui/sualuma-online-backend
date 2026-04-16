import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = body?.message?.trim();

    if (!message) {
      return NextResponse.json(
        { ok: false, error: "Mensagem vazia." },
        { status: 400 }
      );
    }

    const ollamaRes = await fetch("http://127.0.0.1:11434/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen2.5:3b",
        stream: false,
        messages: [
          {
            role: "system",
            content:
              "Você é a IA do Luma OS. Responda em português, de forma clara, elegante e útil para empreendedoras e negócios digitais.",
          },
          {
            role: "user",
            content: message,
          },
        ],
      }),
    });

    if (!ollamaRes.ok) {
      const errorText = await ollamaRes.text();
      return NextResponse.json(
        { ok: false, error: `Erro do Ollama: ${errorText}` },
        { status: 500 }
      );
    }

    const data = await ollamaRes.json();

    return NextResponse.json({
      ok: true,
      reply: data?.message?.content || "Não consegui responder agora.",
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Erro ao conectar com o Ollama." },
      { status: 500 }
    );
  }
}

