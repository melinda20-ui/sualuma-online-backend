import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

export const dynamic = "force-dynamic";
export const revalidate = 0;

let pool: Pool | null = null;

type AnyObj = Record<string, any>;

const DEMO_THREAD_TITLES = new Set(
  [
    "atendimento clientes",
    "campanha de e-mail",
    "planejamento 12 semanas",
  ].map((item) => item.toLowerCase())
);

function getPool() {
  if (!pool) {
    const connectionString =
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.BLOG_DATABASE_URL;

    if (!connectionString) {
      throw new Error("DATABASE_URL não encontrada no ambiente.");
    }

    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 4,
    });
  }

  return pool;
}

async function query(sql: string, params: any[] = []) {
  const db = getPool();
  const result = await db.query(sql, params);
  return result.rows;
}

function json(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

function cleanTitle(value: unknown) {
  const title = String(value || "").trim().slice(0, 80);
  return title || "Novo chat";
}

function isDemoThread(thread: AnyObj) {
  const title = String(thread?.title || "").trim().toLowerCase();
  return DEMO_THREAD_TITLES.has(title);
}

async function ensureDefaultThread() {
  const rows = await query(`
    select id
    from public.sualuma_chat_threads
    where lower(trim(title)) not in ('atendimento clientes', 'campanha de e-mail', 'planejamento 12 semanas')
    order by updated_at desc nulls last, created_at desc
    limit 1
  `);

  if (rows[0]?.id) return rows[0].id;

  const created = await query(`
    insert into public.sualuma_chat_threads (title, kind, status, summary, metadata)
    values ('Novo chat', 'chat', 'active', '', '{"created_by":"chat-ui","mode":"truth"}'::jsonb)
    returning *
  `);

  return created[0]?.id;
}

function pickAnswer(data: any): string {
  if (!data) return "";

  if (typeof data === "string") {
    const clean = data.trim();
    if (!clean.startsWith("<!DOCTYPE") && !clean.startsWith("<html")) return clean;
    return "";
  }

  const direct =
    data?.answer ||
    data?.response ||
    data?.reply ||
    data?.text ||
    data?.content ||
    data?.message ||
    data?.result ||
    data?.output;

  if (typeof direct === "string" && direct.trim()) return direct.trim();

  if (data?.assistantMessage?.content) {
    return String(data.assistantMessage.content).trim();
  }

  if (data?.raw) {
    const nested = pickAnswer(data.raw);
    if (nested) return nested;
  }

  return "";
}

function getBaseUrl() {
  return (
    process.env.MIA_INTERNAL_ORIGIN ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "http://127.0.0.1:3000"
  ).replace(/\/$/, "");
}

async function callMiaBrain(content: string, threadId: string) {
  const baseUrl = getBaseUrl();

  try {
    const response = await fetch(`${baseUrl}/api/chat-antigo/brain`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-sualuma-source": "chat-dashboard",
      },
      cache: "no-store",
      body: JSON.stringify({
        source: "sualuma-chat",
        channel: "chat-dashboard",
        threadId,
        conversationId: threadId,
        message: content,
        prompt: content,
        input: content,
        text: content,
      }),
    });

    const rawText = await response.text();

    let data: any = rawText;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = rawText;
    }

    const answer = pickAnswer(data);

    return {
      ok: response.ok && !!answer,
      status: response.status,
      answer,
      raw: data,
    };
  } catch (error: any) {
    return {
      ok: false,
      status: 0,
      answer: "",
      raw: {
        error: error?.message || String(error),
      },
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const selectedThreadId = url.searchParams.get("threadId") || null;

    const allThreads = await query(`
      select
        t.*,
        coalesce((
          select content
          from public.sualuma_chat_messages m
          where m.thread_id = t.id
          order by m.created_at desc
          limit 1
        ), t.summary) as last_message,
        coalesce((
          select count(*)
          from public.sualuma_chat_messages m
          where m.thread_id = t.id
        ), 0)::int as messages_count
      from public.sualuma_chat_threads t
      order by t.updated_at desc nulls last, t.created_at desc
      limit 80
    `);

    const threads = allThreads.filter((thread) => !isDemoThread(thread));

    const selectedExists = selectedThreadId
      ? threads.some((thread) => thread.id === selectedThreadId)
      : false;

    const activeThreadId = selectedExists
      ? selectedThreadId
      : threads[0]?.id || null;

    const messages = activeThreadId
      ? await query(
          `
          select *
          from public.sualuma_chat_messages
          where thread_id = $1
          order by created_at asc
          limit 200
        `,
          [activeThreadId]
        )
      : [];

    const messagesTotal = threads.reduce(
      (total, thread) => total + Number(thread.messages_count || 0),
      0
    );

    return json({
      ok: true,
      source: "postgres-real",
      mode: "truth",
      generated_at: new Date().toISOString(),
      selectedThreadId: activeThreadId,
      metrics: {
        threads_total: threads.length,
        messages_total: messagesTotal,
        agents_active: 0,
        automations_active: 0,
      },
      threads,
      messages,
      agents: [],
      automations: [],
    });
  } catch (error: any) {
    return json(
      {
        ok: false,
        source: "postgres-real",
        mode: "truth",
        error: error?.message || String(error),
      },
      500
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = String(body?.action || "send-message").trim();

    if (action === "create-thread") {
      const title = cleanTitle(body?.title);

      const created = await query(
        `
        insert into public.sualuma_chat_threads (title, kind, status, summary, metadata)
        values ($1, 'chat', 'active', '', '{"created_by":"chat-ui","mode":"truth"}'::jsonb)
        returning *
      `,
        [title]
      );

      return json({
        ok: true,
        action,
        thread: created[0],
      });
    }

    if (action === "toggle-automation") {
      return json(
        {
          ok: false,
          action,
          error:
            "Modo verdade: automações ainda não estão implementadas neste chat.",
        },
        400
      );
    }

    const content = String(body?.content || body?.message || "").trim();

    let threadId = body?.threadId
      ? String(body.threadId)
      : body?.thread_id
        ? String(body.thread_id)
        : "";

    if (!content) {
      return json({ ok: false, error: "Mensagem vazia." }, 400);
    }

    if (!threadId) {
      threadId = await ensureDefaultThread();
    }

    const userMessage = await query(
      `
      insert into public.sualuma_chat_messages (thread_id, role, content, metadata)
      values ($1, 'user', $2, '{"source":"chat-ui","mode":"truth"}'::jsonb)
      returning *
    `,
      [threadId, content]
    );

    await query(
      `
      update public.sualuma_chat_threads
      set updated_at = now(),
          summary = left($2, 180)
      where id = $1
    `,
      [threadId, content]
    );

    const mia = await callMiaBrain(content, threadId);

    const assistantContent = mia.answer
      ? mia.answer
      : "A Mia não conseguiu gerar uma resposta real agora. Para manter o modo verdade, nenhuma resposta foi inventada.";

    const assistantMessage = await query(
      `
      insert into public.sualuma_chat_messages (thread_id, role, content, metadata)
      values ($1, 'assistant', $2, $3::jsonb)
      returning *
    `,
      [
        threadId,
        assistantContent,
        JSON.stringify({
          source: mia.ok ? "cerebro-blue-real" : "cerebro-blue-unavailable",
          mode: "truth",
          status: mia.status,
          ok: mia.ok,
        }),
      ]
    );

    await query(
      `
      update public.sualuma_chat_threads
      set updated_at = now()
      where id = $1
    `,
      [threadId]
    );

    return json({
      ok: true,
      action: "send-message",
      threadId,
      userMessage: userMessage[0],
      assistantMessage: assistantMessage[0],
      brain: {
        ok: mia.ok,
        status: mia.status,
      },
    });
  } catch (error: any) {
    return json(
      {
        ok: false,
        error: error?.message || String(error),
      },
      500
    );
  }
}
