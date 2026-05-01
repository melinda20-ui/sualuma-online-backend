import { NextRequest, NextResponse } from "next/server";
import { Pool, type QueryResultRow } from "pg";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

let pool: Pool | null = null;

function getPool() {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL não encontrada.");
  }

  pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 3,
  });

  return pool;
}

async function query<T extends QueryResultRow = QueryResultRow>(sql: string, params: unknown[] = []) {
  const db = getPool();
  const result = await db.query<T>(sql, params);
  return result.rows;
}

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const threadId = searchParams.get("threadId");

    const threads = await query(`
      select
        t.*,
        coalesce((
          select m.content
          from public.sualuma_chat_messages m
          where m.thread_id = t.id
          order by m.created_at desc
          limit 1
        ), t.summary, '') as last_message,
        coalesce((
          select count(*)
          from public.sualuma_chat_messages m
          where m.thread_id = t.id
        ), 0)::int as messages_count
      from public.sualuma_chat_threads t
      order by t.updated_at desc
      limit 50
    `);

    const selectedThreadId = threadId || String(threads?.[0]?.id || "");

    const messages = selectedThreadId
      ? await query(
          `
          select *
          from public.sualuma_chat_messages
          where thread_id = $1
          order by created_at asc
          limit 200
          `,
          [selectedThreadId]
        )
      : [];

    const agents = await query(`
      select *
      from public.sualuma_chat_agents
      order by sort_order asc, created_at asc
    `);

    const automations = await query(`
      select *
      from public.sualuma_chat_automations
      order by sort_order asc, created_at asc
    `);

    const metricsRows = await query(`
      select
        (select count(*)::int from public.sualuma_chat_threads) as threads_total,
        (select count(*)::int from public.sualuma_chat_messages) as messages_total,
        (select count(*)::int from public.sualuma_chat_agents where is_active = true) as agents_active,
        (select count(*)::int from public.sualuma_chat_automations where is_active = true) as automations_active
    `);

    return json({
      ok: true,
      source: "postgres-direct",
      selectedThreadId,
      metrics: metricsRows[0] || {},
      threads,
      messages,
      agents,
      automations,
      generated_at: new Date().toISOString(),
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body?.action;

    if (action === "create-thread") {
      const title = String(body?.title || "Novo chat").trim() || "Novo chat";
      const agentSlug = String(body?.agent_slug || "mia-brain");

      const rows = await query(
        `
        insert into public.sualuma_chat_threads (title, agent_slug, summary, metadata)
        values ($1, $2, $3, $4::jsonb)
        returning *
        `,
        [title, agentSlug, "Nova conversa criada no Chat Sualuma.", JSON.stringify({ created_by: "chat-dashboard" })]
      );

      return json({ ok: true, thread: rows[0] });
    }

    if (action === "send-message") {
      const threadId = String(body?.thread_id || "");
      const content = String(body?.content || "").trim();

      if (!threadId || !content) {
        return json({ ok: false, error: "thread_id e content são obrigatórios." }, 400);
      }

      const userRows = await query(
        `
        insert into public.sualuma_chat_messages (thread_id, role, content, metadata)
        values ($1, 'user', $2, $3::jsonb)
        returning *
        `,
        [threadId, content, JSON.stringify({ source: "chat-ui" })]
      );

      const assistantText =
        "Recebi sua mensagem e salvei esta conversa no banco de dados. No próximo passo, posso conectar essa resposta diretamente à Mia Brain/roteador de IA.";

      const assistantRows = await query(
        `
        insert into public.sualuma_chat_messages (thread_id, role, content, metadata)
        values ($1, 'assistant', $2, $3::jsonb)
        returning *
        `,
        [threadId, assistantText, JSON.stringify({ generated_by: "placeholder-db" })]
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

      return json({
        ok: true,
        userMessage: userRows[0],
        assistantMessage: assistantRows[0],
      });
    }

    if (action === "toggle-automation") {
      const slug = String(body?.slug || "");
      const isActive = Boolean(body?.is_active);

      const rows = await query(
        `
        update public.sualuma_chat_automations
        set is_active = $2,
            status = case when $2 then 'active' else 'paused' end
        where slug = $1
        returning *
        `,
        [slug, isActive]
      );

      return json({ ok: true, automation: rows[0] });
    }

    return json({ ok: false, error: "Ação inválida." }, 400);
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
