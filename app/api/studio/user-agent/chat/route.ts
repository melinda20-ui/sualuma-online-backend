import { NextRequest, NextResponse } from "next/server";
import { USER_ACCESS_AGENT } from "@/lib/agents/user-access-agent";
import { getCurrentAdminAccess } from "@/lib/auth/admin-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function cleanMessages(input: unknown): ChatMessage[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      const maybe = item as Record<string, unknown>;
      const role = maybe.role === "assistant" ? "assistant" : "user";
      const content =
        typeof maybe.content === "string" ? maybe.content.trim() : "";

      if (!content) return null;

      return {
        role,
        content: content.slice(0, 4000),
      };
    })
    .filter((item): item is ChatMessage => Boolean(item))
    .slice(-6);
}

function getLastUserMessage(messages: ChatMessage[]) {
  return [...messages]
    .reverse()
    .find((message) => message.role === "user")?.content || "";
}

async function isAuthorized(request: NextRequest) {
  const token = process.env.SUALUMA_INTERNAL_AGENT_TOKEN;
  const auth = request.headers.get("authorization") || "";

  if (token && auth === `Bearer ${token}`) {
    return true;
  }

  const admin = await getCurrentAdminAccess();
  return Boolean(admin.isAdmin);
}

function buildSystemPrompt() {
  const agent = USER_ACCESS_AGENT as any;

  const officialContext = {
    name: agent.name,
    publicName: agent.publicName,
    role: agent.role,
    mission: agent.mission,
    currentFocus: agent.currentFocus,
    officialAccessIds: agent.officialAccessIds,
    addonIds: agent.addonIds,
    accessModel: agent.accessModel,
    routesToAudit: agent.routesToAudit,
    communityRules: agent.communityRules,
    dashboards: agent.dashboards,
    rules: agent.rules,
  };

  const contextText = JSON.stringify(officialContext, null, 2).slice(0, 10000);

  return [
    "IDENTIDADE FIXA",
    "Você é o User Guard, também chamado de Agente Usuários da Sualuma.",
    "Você é o guardião de acessos, planos, usuários, permissões, rotas privadas, planos Stripe e preparação de lançamento.",
    "",
    "COMO RESPONDER",
    "- Responda sempre em português do Brasil.",
    "- Seja direto, prático e operacional.",
    "- Explique como funcionária interna da Sualuma, não como chatbot genérico.",
    "- Quando a Luma perguntar o que fazer, responda com checklist executável.",
    "- Quando ela pedir diagnóstico, diga: o que está certo, o que falta, risco e próximo passo.",
    "- Quando falar de acessos, use os IDs oficiais.",
    "- Não use free_client como ID oficial novo.",
    "- O primeiro acesso gratuito oficial é empresa_contratante_servicos_free.",
    "- Plano Prime não existe.",
    "- Cliente IA não vira prestador automaticamente.",
    "- Prestador não vira Cliente IA automaticamente.",
    "- Admin acessa tudo, mas admin não é plano público e não pode ser comprado.",
    "- Comunidade é aberta para logados, mas sem WhatsApp, venda externa, spam ou tentativa de tirar cliente da plataforma.",
    "",
    "MODELO OFICIAL APRENDIDO",
    contextText,
  ].join("\n");
}

async function tryQwenOllama(system: string, messages: ChatMessage[]) {
  const baseUrl = String(
    process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434"
  ).replace(/\/+$/, "");

  const model =
    process.env.OLLAMA_MODEL ||
    process.env.OLLAMA_MODEL_CHAT ||
    "qwen2.5:7b-instruct";

  const temperature = Number(process.env.OLLAMA_TEMPERATURE || 0.2);
  const numCtx = Number(process.env.OLLAMA_NUM_CTX || 4096);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        stream: false,
        messages: [
          {
            role: "system",
            content: system,
          },
          ...messages,
        ],
        options: {
          temperature,
          num_ctx: numCtx,
          num_predict: 180,
        },
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        typeof data?.error === "string"
          ? data.error
          : `Ollama respondeu HTTP ${response.status}`
      );
    }

    const reply =
      typeof data?.message?.content === "string"
        ? data.message.content.trim()
        : typeof data?.response === "string"
          ? data.response.trim()
          : "";

    if (!reply) {
      throw new Error("O Qwen não retornou texto.");
    }

    return {
      reply,
      provider: "ollama-qwen",
      model,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function localFallback(lastUserMessage: string) {
  const clean = lastUserMessage.toLowerCase();

  if (clean.includes("empresa") || clean.includes("contratante")) {
    return [
      "Luma, o acesso que estamos configurando agora é `empresa_contratante_servicos_free`.",
      "",
      "Ele serve para quem quer contratar prestadores dentro da Sualuma.",
      "",
      "Libera: criar conta, acessar comunidade, ver serviços, contratar prestador, enviar briefing, conversar dentro da plataforma e acompanhar entrega.",
      "",
      "Bloqueia: vender serviço, anunciar, aparecer como prestador, criar portfólio, divulgar WhatsApp, puxar cliente para fora, acessar Studio/Admin e usar agentes pagos sem plano ou compra avulsa.",
    ].join("\n");
  }

  return [
    "Estou ativo como User Guard, mas o Qwen/Ollama demorou ou não respondeu agora.",
    "",
    "Meu foco atual é configurar os acessos para lançamento:",
    "- `empresa_contratante_servicos_free`",
    "- `ia_client_basic`",
    "- `ia_client_pro`",
    "- `ia_client_premium`",
    "- `provider_free`",
    "- `service_provider`",
    "- `admin`",
    "",
    "Próximo passo recomendado: configurar primeiro `empresa_contratante_servicos_free` nas regras reais de acesso e depois testar bloqueios de prestador, IA, Studio e Admin.",
  ].join("\n");
}

export async function GET(request: NextRequest) {
  const authorized = await isAuthorized(request);

  if (!authorized) {
    return NextResponse.json(
      {
        ok: false,
        error: "Acesso restrito ao admin ou token interno.",
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    ok: true,
    provider: "ollama-qwen",
    model:
      process.env.OLLAMA_MODEL ||
      process.env.OLLAMA_MODEL_CHAT ||
      "qwen2.5:7b-instruct",
    message: "Chat do User Guard conectado ao Qwen/Ollama.",
  });
}

export async function POST(request: NextRequest) {
  const authorized = await isAuthorized(request);

  if (!authorized) {
    return NextResponse.json(
      {
        ok: false,
        error: "Acesso restrito ao admin ou token interno.",
      },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => ({}));

  let messages = cleanMessages(body.messages);

  const directMessage =
    typeof body.message === "string" ? body.message.trim() : "";

  if (directMessage) {
    const directChatMessage: ChatMessage = {
      role: "user",
      content: directMessage.slice(0, 4000),
    };

    messages = [...messages, directChatMessage].slice(-6);
  }

  const lastUserMessage = getLastUserMessage(messages);

  if (!lastUserMessage) {
    return NextResponse.json(
      {
        ok: false,
        error: "Envie uma mensagem para o User Guard.",
      },
      { status: 400 }
    );
  }

  const system = buildSystemPrompt();

  try {
    const result = await tryQwenOllama(system, messages);

    return NextResponse.json({
      ok: true,
      reply: result.reply,
      provider: result.provider,
      model: result.model,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      ok: true,
      reply: localFallback(lastUserMessage),
      provider: "local-fallback-after-qwen-error",
      model:
        process.env.OLLAMA_MODEL ||
        process.env.OLLAMA_MODEL_CHAT ||
        "qwen2.5:7b-instruct",
      warning:
        error instanceof Error
          ? error.message
          : "Falha desconhecida ao chamar Qwen/Ollama.",
      generatedAt: new Date().toISOString(),
    });
  }
}
