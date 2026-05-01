import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

export const dynamic = "force-dynamic";
export const revalidate = 0;

let pool: Pool | null = null;

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

async function ensureDefaultThread() {
  const rows = await query(`
    select id
    from public.sualuma_chat_threads
    order by updated_at desc nulls last, created_at desc
    limit 1
  `);

  if (rows[0]?.id) return rows[0].id;

  const created = await query(`
    insert into public.sualuma_chat_threads (title, kind, status, summary, metadata)
    values ('Nova conversa', 'chat', 'active', 'Conversa criada automaticamente.', '{"created_by":"chat-dashboard"}'::jsonb)
    returning id
  `);

  return created[0]?.id;
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const selectedThreadId = url.searchParams.get("threadId") || null;

    const threads = await query(`
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

    const activeThreadId = selectedThreadId || threads[0]?.id || null;

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

    const agents = await query(`
      select *
      from public.sualuma_chat_agents
      order by status asc, updated_at desc nulls last, created_at desc
      limit 80
    `);

    const automations = await query(`
      select *
      from public.sualuma_chat_automations
      order by status asc, updated_at desc nulls last, created_at desc
      limit 80
    `);

    const metricsRows = await query(`
      select
        (select count(*) from public.sualuma_chat_threads)::int as threads_total,
        (select count(*) from public.sualuma_chat_messages)::int as messages_total,
        (select count(*) from public.sualuma_chat_agents where status = 'active')::int as agents_active,
        (select count(*) from public.sualuma_chat_automations where status = 'active')::int as automations_active
    `);

    return json({
      ok: true,
      source: "postgres-direct",
      generated_at: new Date().toISOString(),
      selectedThreadId: activeThreadId,
      metrics: metricsRows[0] || {
        threads_total: 0,
        messages_total: 0,
        agents_active: 0,
        automations_active: 0,
      },
      threads,
      messages,
      agents,
      automations,
    });
  } catch (error: any) {
    return json(
      {
        ok: false,
        source: "postgres-direct",
        error: error?.message || String(error),
      },
      500
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const content = String(body?.content || "").trim();
    let threadId = body?.threadId ? String(body.threadId) : "";

    if (!content) {
      return json({ ok: false, error: "Mensagem vazia." }, 400);
    }

    if (!threadId) {
      threadId = await ensureDefaultThread();
    }

    const userMessage = await query(
      `
      insert into public.sualuma_chat_messages (thread_id, role, content, metadata)
      values ($1, 'user', $2, '{"source":"chat-ui"}'::jsonb)
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

    let assistantContent =
      "Recebi sua mensagem. No próximo passo eu vou conectar essa conversa diretamente ao cérebro da Mia para responder usando o roteador de IA.";

    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL ||
        process.env.SITE_URL ||
        "http://127.0.0.1:3000";

      const aiResponse = await fetch(`${baseUrl}/api/ai/router`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          message: content,
          prompt: content,
          input: content,
          source: "sualuma-chat",
          threadId,
        }),
      });

      if (aiResponse.ok) {
        const aiJson = await aiResponse.json().catch(() => null);
        assistantContent =
          aiJson?.answer ||
          aiJson?.response ||
          aiJson?.message ||
          aiJson?.text ||
          assistantContent;
      }
    } catch {
      // mantém fallback local sem quebrar o chat
    }

    const assistantMessage = await query(
      `
      insert into public.sualuma_chat_messages (thread_id, role, content, metadata)
      values ($1, 'assistant', $2, '{"source":"mia-brain-router-fallback"}'::jsonb)
      returning *
    `,
      [threadId, assistantContent]
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
      threadId,
      userMessage: userMessage[0],
      assistantMessage: assistantMessage[0],
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
