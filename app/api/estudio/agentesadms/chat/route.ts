import { NextRequest, NextResponse } from "next/server";
import { getAdminAgentById } from "@/lib/studio/admin-agents-store";

export const runtime = "nodejs";

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
      const content = typeof maybe.content === "string" ? maybe.content.trim() : "";

      if (!content) return null;

      return {
        role,
        content: content.slice(0, 8000),
      };
    })
    .filter((item): item is ChatMessage => Boolean(item))
    .slice(-24);
}

function getLastUserMessage(messages: ChatMessage[]) {
  return [...messages].reverse().find((message) => message.role === "user")?.content || "";
}

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[?!.,;:]+/g, "")
    .replace(/\s+/g, " ");
}

function isSimpleConversation(text: string) {
  const clean = normalizeText(text);

  if (!clean) return true;

  const exactSimple = [
    "oi",
    "ola",
    "olá",
    "bom dia",
    "boa tarde",
    "boa noite",
    "e ai",
    "e aí",
    "teste",
    "testando",
    "voce consegue me entender",
    "você consegue me entender",
    "voce me entende",
    "você me entende",
    "consegue me entender",
    "entendeu",
    "vc me entende",
    "vc consegue me entender",
  ].map(normalizeText);

  if (exactSimple.includes(clean)) return true;

  if (clean.length <= 12 && /^(oi|ola|olá|bom dia|boa tarde|boa noite)/i.test(clean)) {
    return true;
  }

  if (clean.includes("consegue me entender")) return true;
  if (clean.includes("voce me entende")) return true;
  if (clean.includes("vc me entende")) return true;

  return false;
}

function directSimpleConversationReply(params: {
  agentName: string;
  agentRole: string;
  skills: string[];
  message: string;
}) {
  const clean = normalizeText(params.message);
  const skillText = params.skills.length ? params.skills.join(", ") : "minhas skills ainda não foram configuradas";

  if (
    clean.includes("consegue me entender") ||
    clean.includes("voce me entende") ||
    clean.includes("vc me entende") ||
    clean.includes("entendeu")
  ) {
    return `Sim, eu consigo te entender. Eu sou ${params.agentName}, agente de ${params.agentRole} dentro do Studio Sualuma. Meu papel é conversar com você de forma natural, entender sua intenção e só transformar em relatório, tarefa ou diagnóstico quando você pedir isso claramente. Minhas skills atuais são: ${skillText}.`;
  }

  if (clean === "teste" || clean === "testando") {
    return `Teste recebido. Eu sou ${params.agentName} e estou respondendo pela camada local de intenção simples. Isso evita que uma mensagem básica vire relatório sem necessidade.`;
  }

  return `Oi, Luma. Eu sou ${params.agentName}, agente de ${params.agentRole}. Estou ativo aqui na Central de Agentes ADMs. Pode conversar comigo normalmente, pedir uma análise, me mandar um problema ou ajustar meu cérebro pelo painel da estrela.`;
}

function buildSystemPrompt(params: {
  agentName: string;
  agentRole: string;
  systemPrompt: string;
  skills: string[];
  behaviorRules: string[];
}) {
  const { agentName, agentRole, systemPrompt, skills, behaviorRules } = params;

  return [
    `IDENTIDADE FIXA`,
    `Você é ${agentName}.`,
    `Sua função dentro do Studio Sualuma é: ${agentRole}.`,
    systemPrompt,
    ``,
    `CONTEXTO`,
    `Você trabalha dentro do Studio Sualuma, uma central administrativa do microSaaS Sualuma.`,
    `A usuária é a fundadora. Ela está criando agentes internos para administrar sistema, usuários, conteúdo, suporte, métricas, segurança, prospecção e tarefas.`,
    `Você não é um chatbot genérico. Você é um agente administrativo interno.`,
    ``,
    `SKILLS`,
    skills.length ? skills.map((skill) => `- ${skill}`).join("\n") : "- Nenhuma skill extra configurada.",
    ``,
    `REGRAS OBRIGATÓRIAS`,
    `- Responda sempre em português do Brasil.`,
    `- Converse naturalmente antes de tentar montar relatório.`,
    `- Não transforme toda mensagem em relatório.`,
    `- Não diga que a usuária é o agente. Você é ${agentName}.`,
    `- Não peça nome do agente quando o agente ativo já é você.`,
    `- Só peça período de análise quando a usuária pedir relatório, comparação ou auditoria.`,
    `- Se for problema técnico, explique primeiro em linguagem simples.`,
    `- Se for ação, organize por prioridade, impacto e próximo passo.`,
    ...behaviorRules.map((rule) => `- ${rule}`),
  ].join("\n");
}

function fallbackReply(params: {
  agentName: string;
  agentRole: string;
  skills: string[];
  messages: ChatMessage[];
}) {
  const last = getLastUserMessage(params.messages);
  const lower = normalizeText(last);
  const skillText = params.skills.length ? params.skills.join(", ") : "sem skills extras configuradas";

  if (isSimpleConversation(last)) {
    return directSimpleConversationReply({
      agentName: params.agentName,
      agentRole: params.agentRole,
      skills: params.skills,
      message: last,
    });
  }

  if (lower.includes("relatorio") || lower.includes("analise") || lower.includes("auditoria")) {
    return `Entendi. Como ${params.agentName}, eu posso montar essa análise separando objetivo, dados necessários, diagnóstico, impacto e próxima ação. Minhas skills atuais são: ${skillText}.`;
  }

  if (lower.includes("erro") || lower.includes("bug") || lower.includes("problema") || lower.includes("falha")) {
    return `Entendi o problema. Como ${params.agentName}, eu analisaria assim: onde a falha aparece, qual impacto ela causa, causa provável e próximo passo para resolver. Minhas skills atuais são: ${skillText}.`;
  }

  return `Entendi. Como ${params.agentName}, agente de ${params.agentRole}, vou responder considerando sua intenção e minhas skills atuais: ${skillText}.`;
}

async function tryOllama(system: string, messages: ChatMessage[]) {
  const base = (process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").replace(/\/$/, "");
  const model = process.env.OLLAMA_MODEL || "llama3";

  const response = await fetch(`${base}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        { role: "system", content: system },
        ...messages,
      ],
      options: {
        temperature: 0.15,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = await response.json() as {
    message?: { content?: string };
    response?: string;
  };

  return data.message?.content || data.response || "";
}

async function tryAnthropic(system: string, messages: ChatMessage[]) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY não configurada.");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
      max_tokens: 1200,
      temperature: 0.15,
      system,
      messages,
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = await response.json() as {
    content?: Array<{ text?: string }>;
  };

  return data.content?.map((block) => block.text || "").join("").trim() || "";
}

async function tryOpenRouter(system: string, messages: ChatMessage[]) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY não configurada.");
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://studio.sualuma.online",
      "X-Title": "Studio Sualuma Agentes ADMs",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4",
      temperature: 0.15,
      max_tokens: 1200,
      messages: [
        { role: "system", content: system },
        ...messages,
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return data.choices?.[0]?.message?.content?.trim() || "";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      agentId?: string;
      messages?: unknown;
    };

    const agentId = typeof body.agentId === "string" ? body.agentId : "atlas";
    const agent = await getAdminAgentById(agentId);
    const messages = cleanMessages(body.messages);

    const agentName = agent?.name || "Atlas";
    const agentRole = agent?.role || "Supervisor Geral dos Agentes ADMs";
    const skills = agent?.skills || [];
    const behaviorRules = agent?.behaviorRules || [];
    const systemPrompt = agent?.systemPrompt || `Você é ${agentName}, agente administrativo do Studio Sualuma.`;

    const lastUserMessage = getLastUserMessage(messages);

    if (isSimpleConversation(lastUserMessage)) {
      return NextResponse.json({
        reply: directSimpleConversationReply({
          agentName,
          agentRole,
          skills,
          message: lastUserMessage,
        }),
        provider: "local-intent-router",
      });
    }

    const system = buildSystemPrompt({
      agentName,
      agentRole,
      systemPrompt,
      skills,
      behaviorRules,
    });

    let reply = "";

    try {
      reply = await tryOllama(system, messages);
      if (reply.trim()) {
        return NextResponse.json({ reply, provider: "ollama" });
      }
    } catch {}

    try {
      reply = await tryAnthropic(system, messages);
      if (reply.trim()) {
        return NextResponse.json({ reply, provider: "anthropic" });
      }
    } catch {}

    try {
      reply = await tryOpenRouter(system, messages);
      if (reply.trim()) {
        return NextResponse.json({ reply, provider: "openrouter" });
      }
    } catch {}

    return NextResponse.json({
      reply: fallbackReply({
        agentName,
        agentRole,
        skills,
        messages,
      }),
      provider: "fallback",
    });
  } catch {
    return NextResponse.json(
      {
        reply: "Não consegui processar a mensagem agora. Verifique a API interna dos agentes ADMs.",
      },
      { status: 500 }
    );
  }
}
