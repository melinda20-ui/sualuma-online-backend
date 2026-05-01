import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONTEXTO = `
O Sualuma Online é um ecossistema de microSaaS para autônomos, MEIs, prestadores e empreendedores solo.
Proposta: "Venda mais. Trabalhe menos. Cresça com IA."
Módulos: agentes de IA, chats, área do cliente, blog, marketplace, automações e estúdio interno.
Objetivo do Agente de Crescimento: diagnosticar vendas, funil, aquisição, retenção, precificação e próximos passos comerciais.
`;

const PROMPTS: Record<string, string> = {
  funil:
    "Analise o funil de vendas e conversão do Sualuma: proposta de valor, jornada, pontos de fuga, CTA, lista de espera e melhorias imediatas.",
  precificacao:
    "Analise a precificação do Sualuma: planos, percepção de valor, oferta de entrada, upsell, assinatura e oportunidades de receita.",
  retencao:
    "Analise retenção e churn do Sualuma: onboarding, hábito de uso, engajamento, alertas, LTV e risco de abandono.",
  aquisicao:
    "Analise aquisição e marketing do Sualuma: SEO, conteúdo, canais orgânicos, captação de leads, autoridade e tração imediata.",
};

function systemPrompt() {
  return `Você é o Agente de Crescimento do Sualuma.

CONTEXTO:
${CONTEXTO}

Responda curto e prático em português do Brasil.

Formato obrigatório:
SCORE: número de 0 a 100

Análise:
2 a 4 parágrafos diretos.

AÇÕES:
1. **Ação curta**: como executar.
2. **Ação curta**: como executar.
3. **Ação curta**: como executar.`;
}

function fallback(area: string) {
  const dados: Record<string, { score: number; content: string }> = {
    funil: {
      score: 58,
      content:
        "O funil do Sualuma tem uma proposta forte, mas ainda precisa deixar mais claro o caminho entre conhecer a plataforma, entender o valor e tomar uma ação.\n\nAÇÕES:\n1. **Criar CTA único principal**: escolha uma ação principal como entrar na lista de espera, solicitar diagnóstico ou começar teste.\n2. **Adicionar prova de valor**: inclua exemplos reais para autônomos, MEIs e prestadores.\n3. **Reduzir fricção**: simplifique a jornada inicial com uma página de entrada clara.",
    },
    precificacao: {
      score: 42,
      content:
        "A precificação ainda parece pouco visível. Sem planos claros, o usuário entende a ideia, mas não sabe quanto custa, qual pacote escolher e qual benefício recebe.\n\nAÇÕES:\n1. **Criar 3 planos simples**: Básico, Profissional e Prime.\n2. **Ancorar valor em economia de tempo**: mostre quanto o autônomo economiza usando o Sualuma.\n3. **Criar oferta de entrada**: use teste grátis, diagnóstico gratuito ou plano inicial acessível.",
    },
    retencao: {
      score: 46,
      content:
        "O risco de churn existe se o usuário entrar, testar uma vez e não criar hábito. Para reter, o Sualuma precisa virar rotina.\n\nAÇÕES:\n1. **Criar onboarding guiado**: leve o usuário a uma primeira vitória em até 10 minutos.\n2. **Criar painel de progresso**: mostre tarefas, evolução, pendências e ganhos.\n3. **Enviar alertas úteis**: notifique oportunidades, erros, leads e ações importantes.",
    },
    aquisicao: {
      score: 54,
      content:
        "A aquisição tem potencial forte porque microempreendedores sentem dores diárias. O ponto principal é transformar o Sualuma em autoridade prática.\n\nAÇÕES:\n1. **Criar conteúdo por dor**: MEI, vendas, atendimento, WhatsApp, organização e IA.\n2. **Usar iscas digitais**: checklist, diagnóstico gratuito ou mini agente gratuito.\n3. **Distribuir em canais orgânicos**: Instagram, YouTube Shorts, grupos, blog e WhatsApp.",
    },
  };

  return dados[area] || dados.funil;
}

function parseAI(raw: string) {
  const scoreMatch = raw.match(/SCORE:\s*(\d+)/i);
  const score = scoreMatch ? Number(scoreMatch[1]) : 50;
  const content = raw.replace(/SCORE:\s*\d+\s*/i, "").trim();

  return {
    score,
    content: content || raw || "A IA respondeu vazio.",
  };
}

async function fetchWithTimeout(url: string, options: RequestInit, ms = 60000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function callOllama(prompt: string) {
  const base = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
  const model =
    process.env.AGENTE_CRESCIMENTO_MODEL ||
    process.env.OLLAMA_MODEL ||
    "llama3";

  const res = await fetchWithTimeout(
    `${base.replace(/\/$/, "")}/api/generate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        stream: false,
        prompt: `${systemPrompt()}\n\nPEDIDO:\n${prompt}`,
        options: {
          temperature: 0.35,
          num_predict: 520,
          num_ctx: 2048
        }
      }),
    },
    60000
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Ollama ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.response || null;
}

async function callOpenCode(prompt: string) {
  const url =
    process.env.OPENCODE_API_URL ||
    process.env.OPEN_CODE_API_URL ||
    process.env.OPEN_CODE_BASE_URL;

  if (!url) return null;

  const key =
    process.env.OPENCODE_API_KEY ||
    process.env.OPEN_CODE_API_KEY ||
    "";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (key) {
    headers.Authorization = `Bearer ${key}`;
  }

  const isOpenAICompatible = url.includes("/v1/chat/completions");

  const body = isOpenAICompatible
    ? {
        model:
          process.env.OPENCODE_MODEL ||
          process.env.OPEN_CODE_MODEL ||
          "local",
        messages: [
          { role: "system", content: systemPrompt() },
          { role: "user", content: prompt },
        ],
        temperature: 0.35,
        max_tokens: 900,
      }
    : {
        system: systemPrompt(),
        prompt,
        messages: [
          { role: "system", content: systemPrompt() },
          { role: "user", content: prompt },
        ],
      };

  const res = await fetchWithTimeout(
    url,
    {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    },
    60000
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenCode ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();

  return (
    data.choices?.[0]?.message?.content ||
    data.response ||
    data.text ||
    data.answer ||
    data.message ||
    null
  );
}

async function callAI(prompt: string) {
  const providers = [
    { name: "ollama", fn: callOllama },
    { name: "opencode", fn: callOpenCode },
  ];

  const errors: string[] = [];

  for (const provider of providers) {
    try {
      const raw = await provider.fn(prompt);

      if (raw && raw.trim()) {
        return {
          provider: provider.name,
          raw,
          errors,
        };
      }
    } catch (error) {
      errors.push(
        `${provider.name}: ${
          error instanceof Error ? error.message : "erro desconhecido"
        }`
      );
    }
  }

  return {
    provider: "fallback",
    raw: "",
    errors,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const area = String(body.area || "funil");

    if (!PROMPTS[area]) {
      return NextResponse.json({ error: "Área inválida." }, { status: 400 });
    }

    const ai = await callAI(PROMPTS[area]);

    if (ai.provider === "fallback") {
      const fb = fallback(area);

      return NextResponse.json({
        area,
        score: fb.score,
        content: fb.content,
        mode: "fallback",
        provider: "fallback",
        errors: ai.errors,
      });
    }

    const parsed = parseAI(ai.raw);

    return NextResponse.json({
      area,
      score: parsed.score,
      content: parsed.content,
      mode: "ai",
      provider: ai.provider,
      errors: ai.errors,
    });
  } catch (error) {
    const fb = fallback("funil");

    return NextResponse.json({
      area: "funil",
      score: fb.score,
      content: fb.content,
      mode: "fallback_error",
      provider: "fallback",
      error: error instanceof Error ? error.message : "erro desconhecido",
    });
  }
}
