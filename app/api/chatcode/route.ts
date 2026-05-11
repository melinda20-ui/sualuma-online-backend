import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SYSTEM_PROMPT = `Você é o ChatCode, um assistente de IA focado em desenvolvimento, terminal, VPS, automação e infraestrutura. Você é o mesmo assistente que a Luma usa no terminal dela.

Regras:
- Responda em português do Brasil.
- Seja direto, prático e sem enrolação.
- Quando for técnico, entregue passo a passo e comandos prontos.
- Quando for estratégia, entregue plano de ação com prioridade.
- Quando faltar dado, faça uma suposição útil e continue.
- Nunca exponha chaves, tokens, segredos ou conteúdo sensível.
- Prefira respostas curtas e objetivas.
- Se for um comando, mostre ele formatado.
- Você pode usar markdown para formatar respostas.`;

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2.5:7b-instruct";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "qwen/qwen3-coder:free";

async function tryOpenRouter(messages: { role: string; content: string }[]) {
  if (!OPENROUTER_API_KEY) throw new Error("OpenRouter não configurado");

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://sualuma.online",
      "X-Title": "ChatCode",
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      temperature: 0.3,
      max_tokens: 1500,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${text.slice(0, 200)}`);
  }

  const json = await res.json();
  return json?.choices?.[0]?.message?.content?.trim() || "";
}

async function tryOllama(messages: { role: string; content: string }[]) {
  const allMessages = [{ role: "system", content: SYSTEM_PROMPT }, ...messages];

  const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: allMessages,
      stream: false,
      options: { temperature: 0.3, num_ctx: 4096 },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ollama ${res.status}: ${text.slice(0, 200)}`);
  }

  const json = await res.json();
  return json?.message?.content || json?.response || "";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const messages: { role: string; content: string }[] = body.messages || [];
    const message =
      body.message ||
      messages.filter((m) => m.role === "user").at(-1)?.content ||
      "";

    if (!message && messages.length === 0) {
      return NextResponse.json(
        { ok: false, reply: "Envie uma mensagem." },
        { status: 400 }
      );
    }

    let reply = "";
    let provider = "";

    if (messages.length === 0) {
      messages.push({ role: "user", content: message });
    }

    try {
      reply = await tryOpenRouter(messages);
      provider = "openrouter";
    } catch (e1) {
      console.warn("[chatcode] OpenRouter falhou, tentando Ollama:", e1);
      try {
        reply = await tryOllama(messages);
        provider = "ollama";
      } catch (e2) {
        console.error("[chatcode] Ollama também falhou:", e2);
        return NextResponse.json({
          ok: false,
          reply: "Os provedores de IA estão indisponíveis no momento. Tente novamente mais tarde.",
          provider: "none",
          error: String(e2),
        });
      }
    }

    return NextResponse.json({ ok: true, reply, provider });
  } catch (err: any) {
    console.error("[chatcode] Erro interno:", err);
    return NextResponse.json(
      { ok: false, reply: "Erro interno no servidor.", error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
