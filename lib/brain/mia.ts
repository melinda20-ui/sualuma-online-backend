type ChatMessage = {
  role?: "user" | "assistant" | "system";
  content?: string;
};

type BrainAgent = {
  id: string;
  name: string;
  match: string[];
  prompt: string;
  providerOrder: Array<"gemini" | "openrouter" | "ollama">;
};

export type BrainInput = {
  message: string;
  messages: ChatMessage[];
};

export type BrainResult = {
  ok: boolean;
  provider: string;
  agent: string;
  reply: string;
  fallback?: boolean;
  errors?: string[];
  ms: number;
};

const BASE_PROMPT = `
Você é Mia, o cérebro operacional do Luma OS / Sualuma.

Contexto:
- A Luma está construindo um microssaas com IA, automações, marketplace, dashboards, serviços, prestadores, clientes, blog, chat, Supabase, Gemini, OpenRouter, Ollama, n8n e futuramente agentes autônomos.
- Ela precisa de respostas práticas, claras, diretas e executáveis.
- Não responda de forma genérica.
- Quando for técnico, entregue passo a passo e comandos seguros.
- Quando for estratégia, entregue plano de ação com prioridade.
- Quando faltar dado, faça uma suposição útil e continue.
- Nunca exponha chaves, tokens, segredos ou conteúdo sensível.
- Responda em português do Brasil.
`;

const AGENTS: BrainAgent[] = [
  {
    id: "codigo",
    name: "Agente Dev / Código",
    match: ["erro", "terminal", "build", "next", "typescript", "api", "rota", "vps", "pm2", "nginx", "supabase", "git", "github", "código", "codigo", "layout", "css", "html"],
    providerOrder: ["openrouter", "gemini", "ollama"],
    prompt: `
Você é o agente técnico de desenvolvimento.
Prioridade:
1. proteger o site de quebrar;
2. fazer backup antes de alterar;
3. mexer no menor trecho possível;
4. rodar build antes de reiniciar;
5. explicar curto e dar comando pronto.
`,
  },
  {
    id: "negocios",
    name: "Agente Estratégia / Negócios",
    match: ["venda", "cliente", "oferta", "dinheiro", "plano", "assinatura", "preço", "preco", "faturar", "lucro", "estratégia", "estrategia", "microssaas"],
    providerOrder: ["gemini", "openrouter", "ollama"],
    prompt: `
Você é o agente estratégico de negócios.
Prioridade:
1. transformar ideia em dinheiro;
2. simplificar oferta;
3. sugerir próximos passos de venda;
4. focar em ações que gerem caixa rápido.
`,
  },
  {
    id: "marketing",
    name: "Agente Marketing / Conteúdo",
    match: ["post", "blog", "instagram", "youtube", "conteúdo", "conteudo", "copy", "anúncio", "anuncio", "headline", "tráfego", "trafego", "seo"],
    providerOrder: ["gemini", "openrouter", "ollama"],
    prompt: `
Você é o agente de marketing e conteúdo.
Prioridade:
1. copy persuasiva;
2. conteúdo simples de publicar;
3. SEO;
4. funil para gerar lead e venda.
`,
  },
  {
    id: "suporte",
    name: "Agente Suporte / Atendimento",
    match: ["suporte", "cliente reclamou", "responder cliente", "whatsapp", "email", "mensagem", "atendimento", "dúvida", "duvida"],
    providerOrder: ["gemini", "openrouter", "ollama"],
    prompt: `
Você é o agente de suporte e atendimento.
Prioridade:
1. responder com calma;
2. proteger a marca;
3. resolver rápido;
4. transformar problema em confiança.
`,
  },
  {
    id: "operacao",
    name: "Agente Operação / Produtividade",
    match: ["tarefa", "rotina", "notion", "organizar", "prioridade", "planejamento", "agenda", "produtividade", "execução", "execucao"],
    providerOrder: ["gemini", "openrouter", "ollama"],
    prompt: `
Você é o agente de operação.
Prioridade:
1. organizar caos;
2. definir próximas 3 ações;
3. cortar excesso;
4. transformar plano em execução.
`,
  },
];

function pickAgent(text: string): BrainAgent {
  const lower = text.toLowerCase();

  const scored = AGENTS.map((agent) => {
    const score = agent.match.reduce((sum, word) => {
      return lower.includes(word.toLowerCase()) ? sum + 1 : sum;
    }, 0);

    return { agent, score };
  }).sort((a, b) => b.score - a.score);

  if (scored[0]?.score > 0) return scored[0].agent;

  return {
    id: "geral",
    name: "Agente Geral / Mia",
    match: [],
    providerOrder: ["gemini", "openrouter", "ollama"],
    prompt: `
Você é a Mia em modo geral.
Responda de forma útil, prática, humana e específica para a realidade da Luma.
`,
  };
}

function normalizeMessages(input: any): BrainInput {
  const rawMessages = Array.isArray(input?.messages) ? input.messages : [];
  const directMessage =
    input?.message ||
    input?.text ||
    input?.prompt ||
    rawMessages.filter((m: ChatMessage) => m?.role === "user").at(-1)?.content ||
    "";

  const messages: ChatMessage[] =
    rawMessages.length > 0
      ? rawMessages
      : [{ role: "user", content: String(directMessage || "") }];

  return {
    message: String(directMessage || "").trim(),
    messages,
  };
}

function buildPrompt(input: BrainInput, agent: BrainAgent) {
  const recent = input.messages
    .filter((m) => m?.content)
    .slice(-8)
    .map((m) => `${m.role || "user"}: ${m.content}`)
    .join("\n");

  return `
${BASE_PROMPT}

Agente escolhido:
${agent.name}

Instruções do agente:
${agent.prompt}

Histórico recente:
${recent}

Mensagem principal da usuária:
${input.message}

Responda agora.
`;
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);

  try {
    return await promise;
  } finally {
    clearTimeout(timeout);
  }
}

async function callGemini(prompt: string) {
  const key = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  if (!key) throw new Error("Gemini não configurado.");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.55,
        topP: 0.9,
        maxOutputTokens: 900,
      },
    }),
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Gemini respondeu ${res.status}: ${text.slice(0, 500)}`);
  }

  const json = JSON.parse(text);
  const reply =
    json?.candidates?.[0]?.content?.parts
      ?.map((p: any) => p?.text || "")
      .join("")
      .trim() || "";

  if (!reply) throw new Error("Gemini respondeu vazio.");

  return reply;
}

async function callOpenRouter(prompt: string) {
  const key = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "qwen/qwen3-coder:free";

  if (!key) throw new Error("OpenRouter não configurado.");

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "https://sualuma.online",
      "X-Title": process.env.OPENROUTER_APP_NAME || "Sualuma OS",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: BASE_PROMPT,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.45,
      max_tokens: 900,
    }),
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`OpenRouter respondeu ${res.status}: ${text.slice(0, 500)}`);
  }

  const json = JSON.parse(text);
  const reply = json?.choices?.[0]?.message?.content?.trim() || "";

  if (!reply) throw new Error("OpenRouter respondeu vazio.");

  return reply;
}

async function callOllama(prompt: string) {
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
  const model = process.env.OLLAMA_MODEL || "llama3.2:1b";

  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: {
        temperature: 0.45,
        num_predict: 700,
      },
    }),
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Ollama respondeu ${res.status}: ${text.slice(0, 500)}`);
  }

  const json = JSON.parse(text);
  const reply = json?.response?.trim() || "";

  if (!reply) throw new Error("Ollama respondeu vazio.");

  return reply;
}

async function callProvider(provider: "gemini" | "openrouter" | "ollama", prompt: string) {
  if (provider === "gemini") return await callGemini(prompt);
  if (provider === "openrouter") return await callOpenRouter(prompt);
  return await callOllama(prompt);
}

export async function runMiaBrain(rawInput: any): Promise<BrainResult> {
  const started = Date.now();
  const input = normalizeMessages(rawInput);
  const errors: string[] = [];

  if (!input.message) {
    return {
      ok: false,
      provider: "local-validation",
      agent: "validação",
      reply: "Me manda uma mensagem para eu conseguir responder.",
      fallback: true,
      errors: ["Mensagem vazia."],
      ms: Date.now() - started,
    };
  }

  const agent = pickAgent(input.message);
  const prompt = buildPrompt(input, agent);

  for (const provider of agent.providerOrder) {
    try {
      const reply = await withTimeout(callProvider(provider, prompt), 28000, provider);

      return {
        ok: true,
        provider,
        agent: agent.name,
        reply,
        ms: Date.now() - started,
      };
    } catch (err: any) {
      errors.push(err?.message || String(err));
    }
  }

  return {
    ok: false,
    provider: "local-emergency",
    agent: agent.name,
    fallback: true,
    reply:
      `Mia em modo emergência.\n\n` +
      `Eu entendi sua mensagem: "${input.message}".\n\n` +
      `O cérebro tentou Gemini, OpenRouter e Ollama, mas todos falharam agora. ` +
      `Mesmo assim, meu próximo passo prático seria: dividir isso em uma ação pequena, testar, validar e só depois avançar.\n\n` +
      `Tenta mandar de novo em alguns segundos. Se continuar, peça: "Mia, me mostre o erro técnico".`,
    errors,
    ms: Date.now() - started,
  };
}

export function getBrainStatus() {
  return {
    ok: true,
    brain: "Mia",
    agents: AGENTS.map((a) => ({
      id: a.id,
      name: a.name,
      providerOrder: a.providerOrder,
    })),
    providers: {
      gemini: {
        configured: !!process.env.GEMINI_API_KEY,
        model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      },
      openrouter: {
        configured: !!process.env.OPENROUTER_API_KEY,
        model: process.env.OPENROUTER_MODEL || "qwen/qwen3-coder:free",
      },
      ollama: {
        configured: !!process.env.OLLAMA_BASE_URL,
        baseUrl: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434",
        model: process.env.OLLAMA_MODEL || "llama3.2:1b",
      },
    },
  };
}
