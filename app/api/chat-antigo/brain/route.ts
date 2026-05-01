import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnyObj = Record<string, any>;

type EndpointAttempt = {
  endpoint: string;
  ok: boolean;
  status?: number;
  error?: string;
  answer_preview?: string;
};

const CANDIDATE_ENDPOINTS = [
  "/api/chat",
  "/api/ai/router",
  "/api/brain/task",
  "/api/brain/executor",
];

function getDatabaseUrl() {
  return process.env.DATABASE_URL || process.env.BLOG_DATABASE_URL || "";
}

function getPool(): Pool | null {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) return null;

  const globalRef = globalThis as typeof globalThis & {
    __miaChatAntigoBrainPool?: Pool;
  };

  if (!globalRef.__miaChatAntigoBrainPool) {
    globalRef.__miaChatAntigoBrainPool = new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1")
        ? false
        : { rejectUnauthorized: false },
      max: 4,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 12000,
    });
  }

  return globalRef.__miaChatAntigoBrainPool;
}

async function queryRows(sql: string, params: unknown[] = []) {
  const pool = getPool();

  if (!pool) {
    return {
      rows: [] as AnyObj[],
      error: "DATABASE_URL não encontrada.",
    };
  }

  try {
    const result = await pool.query(sql, params);
    return {
      rows: result.rows as AnyObj[],
      error: null as string | null,
    };
  } catch (error: any) {
    return {
      rows: [] as AnyObj[],
      error: error?.message || String(error),
    };
  }
}

function safeText(value: unknown, max = 4000) {
  if (typeof value === "string") return value.slice(0, max);
  try {
    return JSON.stringify(value).slice(0, max);
  } catch {
    return String(value).slice(0, max);
  }
}

function pickAnswer(data: any): string {
  if (!data) return "";

  if (typeof data === "string") {
    const clean = data.trim();
    if (!clean.startsWith("<!DOCTYPE") && !clean.startsWith("<html")) return clean;
    return "";
  }

  const openAiStyle =
    data?.choices?.[0]?.message?.content ||
    data?.choices?.[0]?.delta?.content ||
    data?.choices?.[0]?.text;

  if (typeof openAiStyle === "string" && openAiStyle.trim()) {
    return openAiStyle.trim();
  }

  const keys = [
    "answer",
    "resposta",
    "reply",
    "response",
    "text",
    "content",
    "output",
    "result",
    "message",
  ];

  for (const key of keys) {
    const value = data?.[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (value && typeof value === "object") {
      const nested = pickAnswer(value);
      if (nested) return nested;
    }
  }

  return "";
}

function getOrigin(req: NextRequest) {
  return (
    process.env.MIA_INTERNAL_ORIGIN ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "http://127.0.0.1:3000"
  ).replace(/\/$/, "");
}

async function loadBrainContext() {
  const [providers, skills, prompts, settings, recentLogs] = await Promise.all([
    queryRows(`
      select slug, name, category, status, model_default, is_free, priority, avg_latency_ms
      from public.mia_brain_providers
      order by priority asc, name asc
      limit 30
    `),
    queryRows(`
      select slug, name, description, category, status, usage_count, success_rate, avg_latency_ms
      from public.mia_brain_skills
      order by usage_count desc, name asc
      limit 30
    `),
    queryRows(`
      select slug, name, type, version, content, is_active
      from public.mia_brain_prompts
      where is_active = true
      order by updated_at desc
      limit 10
    `),
    queryRows(`
      select key, value, updated_at
      from public.mia_brain_settings
      order by key asc
      limit 20
    `),
    queryRows(`
      select provider_slug, model_slug, skill_slug, event_type, status, message, latency_ms, cost, created_at
      from public.mia_brain_usage_logs
      order by created_at desc
      limit 12
    `),
  ]);

  const providersRows = providers.rows;
  const skillsRows = skills.rows;
  const promptsRows = prompts.rows;

  return {
    ok: !providers.error && !skills.error,
    errors: {
      providers: providers.error,
      skills: skills.error,
      prompts: prompts.error,
      settings: settings.error,
      recentLogs: recentLogs.error,
    },
    summary: {
      providers_total: providersRows.length,
      providers_active: providersRows.filter((p) => p.status === "active").length,
      skills_total: skillsRows.length,
      skills_active: skillsRows.filter((s) => s.status === "active").length,
      prompts_total: promptsRows.length,
    },
    providers: providersRows,
    skills: skillsRows,
    prompts: promptsRows,
    settings: settings.rows,
    recent_logs: recentLogs.rows,
  };
}

async function saveBrainLog(params: {
  eventType: string;
  status: "ok" | "error" | "warn";
  message: string;
  latencyMs?: number | null;
  metadata?: AnyObj;
}) {
  await queryRows(
    `
    insert into public.mia_brain_usage_logs
      (provider_slug, model_slug, skill_slug, event_type, status, message, latency_ms, input_tokens, output_tokens, cost, metadata)
    values
      ($1, $2, $3, $4, $5, $6, $7, 0, 0, 0, $8::jsonb)
    `,
    [
      "supabase",
      "postgres",
      "atendimento-ia",
      params.eventType,
      params.status,
      params.message.slice(0, 4000),
      params.latencyMs ?? null,
      JSON.stringify(params.metadata || {}),
    ],
  );
}

async function callEndpoint({
  origin,
  endpoint,
  message,
  threadId,
  brain,
}: {
  origin: string;
  endpoint: string;
  message: string;
  threadId: string;
  brain: AnyObj;
}): Promise<EndpointAttempt & { answer?: string; raw?: unknown }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  const payload = {
    source: "chat-antigo",
    channel: "chat-antigo",
    threadId,
    conversationId: threadId,

    message,
    prompt: message,
    input: message,
    text: message,
    task: message,
    command: message,

    messages: [
      {
        role: "system",
        content:
          "Você é a Mia, cérebro inteligente da Sualuma. Responda em português brasileiro, com clareza, estratégia e foco em ajudar a Luma a construir o sistema.",
      },
      {
        role: "user",
        content: message,
      },
    ],

    brain_context: {
      summary: brain.summary,
      providers: brain.providers,
      skills: brain.skills,
      prompts: brain.prompts,
      settings: brain.settings,
      recent_logs: brain.recent_logs,
    },
  };

  try {
    const response = await fetch(`${origin}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-sualuma-source": "chat-antigo-brain",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const rawText = await response.text();

    let data: unknown = rawText;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = rawText;
    }

    const answer = pickAnswer(data);

    const isExplicitApiError =
      typeof data === "object" &&
      data !== null &&
      "ok" in data &&
      (data as AnyObj).ok === false;

    if (response.ok && !isExplicitApiError && answer) {
      return {
        endpoint,
        ok: true,
        status: response.status,
        answer,
        answer_preview: answer.slice(0, 180),
        raw: data,
      };
    }

    return {
      endpoint,
      ok: false,
      status: response.status,
      error: answer || safeText(data, 500),
      raw: data,
    };
  } catch (error: any) {
    return {
      endpoint,
      ok: false,
      error: error?.name === "AbortError" ? "timeout" : error?.message || String(error),
    };
  } finally {
    clearTimeout(timer);
  }
}

function fallbackAnswer(message: string, brain: AnyObj, attempts: EndpointAttempt[]) {
  const activeProviders = (brain.providers || [])
    .filter((p: AnyObj) => p.status === "active")
    .map((p: AnyObj) => p.name)
    .slice(0, 6)
    .join(", ");

  const activeSkills = (brain.skills || [])
    .filter((s: AnyObj) => s.status === "active")
    .map((s: AnyObj) => s.name)
    .slice(0, 6)
    .join(", ");

  const failed = attempts
    .map((a) => `${a.endpoint}: ${a.error || a.status || "falhou"}`)
    .join(" | ");

  return [
    "Mia conectada ao Chat Antigo.",
    "",
    `Recebi sua mensagem: "${message}"`,
    "",
    "Contexto ativo do cérebro:",
    `- Provedores ativos: ${activeProviders || "nenhum provedor ativo encontrado"}`,
    `- Skills ativas: ${activeSkills || "nenhuma skill ativa encontrada"}`,
    "",
    "Eu tentei chamar o roteador real da Mia, mas nenhum endpoint devolveu resposta final agora.",
    "",
    `Tentativas: ${failed || "sem detalhes"}`,
  ].join("\n");
}

export async function GET() {
  const brain = await loadBrainContext();

  const memory = await queryRows(`
    select id, event_type, status, message, metadata, created_at
    from public.mia_brain_usage_logs
    where event_type like 'chat_antigo_%'
       or metadata->>'source' = 'chat-antigo'
    order by created_at desc
    limit 50
  `);

  return NextResponse.json({
    ok: true,
    source: "chat-antigo-brain",
    brain,
    messages: memory.rows.reverse(),
    generated_at: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now();

  let body: AnyObj = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const message = String(
    body.message ||
      body.prompt ||
      body.input ||
      body.text ||
      body.task ||
      ""
  ).trim();

  const threadId = String(
    body.threadId ||
      body.thread_id ||
      body.conversationId ||
      body.conversation_id ||
      "chat-antigo-geral"
  );

  if (!message) {
    return NextResponse.json(
      {
        ok: false,
        error: "Mensagem vazia. Envie { message: \"sua pergunta\" }.",
      },
      { status: 400 },
    );
  }

  const origin = getOrigin(req);
  const brain = await loadBrainContext();

  await saveBrainLog({
    eventType: "chat_antigo_user",
    status: "ok",
    message,
    metadata: {
      source: "chat-antigo",
      threadId,
    },
  });

  const attempts: EndpointAttempt[] = [];
  let answer = "";
  let usedEndpoint: string | null = null;
  let rawResponse: unknown = null;

  for (const endpoint of CANDIDATE_ENDPOINTS) {
    const attempt = await callEndpoint({
      origin,
      endpoint,
      message,
      threadId,
      brain,
    });

    attempts.push({
      endpoint: attempt.endpoint,
      ok: attempt.ok,
      status: attempt.status,
      error: attempt.error,
      answer_preview: attempt.answer_preview,
    });

    if (attempt.ok && attempt.answer) {
      answer = attempt.answer;
      usedEndpoint = endpoint;
      rawResponse = attempt.raw;
      break;
    }
  }

  if (!answer) {
    answer = fallbackAnswer(message, brain, attempts);
  }

  const latencyMs = Date.now() - startedAt;

  await saveBrainLog({
    eventType: "chat_antigo_assistant",
    status: usedEndpoint ? "ok" : "warn",
    message: answer,
    latencyMs,
    metadata: {
      source: "chat-antigo",
      threadId,
      endpoint: usedEndpoint,
      attempts,
    },
  });

  return NextResponse.json({
    ok: true,
    source: "chat-antigo-brain",
    endpoint: usedEndpoint,
    answer,
    attempts,
    context_summary: brain.summary,
    raw: rawResponse,
    latency_ms: latencyMs,
    generated_at: new Date().toISOString(),
  });
}
