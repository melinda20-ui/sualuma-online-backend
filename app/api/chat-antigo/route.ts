import { NextResponse } from "next/server";
import { Pool } from "pg";

export const dynamic = "force-dynamic";

let pool: Pool | null = null;

function getPool() {
  if (!pool) {
    const connectionString =
      process.env.DATABASE_URL ||
      process.env.BLOG_DATABASE_URL;

    if (!connectionString) {
      throw new Error("DATABASE_URL não encontrada no ambiente.");
    }

    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 3,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 8_000,
    });
  }

  return pool;
}

async function safeQuery(sql: string, params: unknown[] = []) {
  try {
    const result = await getPool().query(sql, params);
    return {
      ok: true,
      rows: result.rows,
      count: result.rowCount || 0,
      error: null,
    };
  } catch (error: any) {
    return {
      ok: false,
      rows: [],
      count: 0,
      error: error?.message || String(error),
    };
  }
}

export async function GET() {
  try {
    const tables = await safeQuery(`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
      order by table_name asc
    `);

    const existingTables = new Set(
      tables.rows.map((row: any) => String(row.table_name))
    );

    const has = (name: string) => existingTables.has(name);

    const conversations = has("sualuma_chat_conversations")
      ? await safeQuery(`
          select *
          from public.sualuma_chat_conversations
          order by updated_at desc nulls last, created_at desc nulls last
          limit 40
        `)
      : has("chat_conversations")
      ? await safeQuery(`
          select *
          from public.chat_conversations
          order by updated_at desc nulls last, created_at desc nulls last
          limit 40
        `)
      : { ok: false, rows: [], count: 0, error: "Tabela de conversas não encontrada." };

    const messages = has("sualuma_chat_messages")
      ? await safeQuery(`
          select *
          from public.sualuma_chat_messages
          order by created_at desc nulls last
          limit 80
        `)
      : has("chat_messages")
      ? await safeQuery(`
          select *
          from public.chat_messages
          order by created_at desc nulls last
          limit 80
        `)
      : { ok: false, rows: [], count: 0, error: "Tabela de mensagens não encontrada." };

    const miaProviders = has("mia_brain_providers")
      ? await safeQuery(`
          select *
          from public.mia_brain_providers
          order by priority asc nulls last, name asc
          limit 30
        `)
      : { ok: false, rows: [], count: 0, error: "Tabela mia_brain_providers não encontrada." };

    const miaSkills = has("mia_brain_skills")
      ? await safeQuery(`
          select *
          from public.mia_brain_skills
          order by usage_count desc nulls last, name asc
          limit 40
        `)
      : { ok: false, rows: [], count: 0, error: "Tabela mia_brain_skills não encontrada." };

    const usageLogs = has("mia_brain_usage_logs")
      ? await safeQuery(`
          select *
          from public.mia_brain_usage_logs
          order by created_at desc nulls last
          limit 40
        `)
      : { ok: false, rows: [], count: 0, error: "Tabela mia_brain_usage_logs não encontrada." };

    const automations = has("automations")
      ? await safeQuery(`
          select *
          from public.automations
          order by updated_at desc nulls last, created_at desc nulls last
          limit 40
        `)
      : has("studio_automations")
      ? await safeQuery(`
          select *
          from public.studio_automations
          order by updated_at desc nulls last, created_at desc nulls last
          limit 40
        `)
      : { ok: false, rows: [], count: 0, error: "Tabela de automações não encontrada." };

    const agents = has("agents")
      ? await safeQuery(`
          select *
          from public.agents
          order by updated_at desc nulls last, created_at desc nulls last
          limit 40
        `)
      : has("studio_agents")
      ? await safeQuery(`
          select *
          from public.studio_agents
          order by updated_at desc nulls last, created_at desc nulls last
          limit 40
        `)
      : { ok: false, rows: [], count: 0, error: "Tabela de agentes não encontrada." };

    const todayCost = usageLogs.rows.reduce((sum: number, row: any) => {
      const created = row.created_at ? new Date(row.created_at) : null;
      const now = new Date();
      const sameDay =
        created &&
        created.getUTCFullYear() === now.getUTCFullYear() &&
        created.getUTCMonth() === now.getUTCMonth() &&
        created.getUTCDate() === now.getUTCDate();

      return sameDay ? sum + Number(row.cost || 0) : sum;
    }, 0);

    const totalErrors = usageLogs.rows.filter((row: any) => row.status === "error" || row.status === "err").length;

    return NextResponse.json({
      ok: true,
      source: "postgres-direct",
      generated_at: new Date().toISOString(),
      tables: Array.from(existingTables),
      metrics: {
        conversations_total: conversations.count,
        messages_total: messages.count,
        agents_total: agents.count,
        automations_total: automations.count,
        providers_total: miaProviders.count,
        providers_active: miaProviders.rows.filter((p: any) => p.status === "active").length,
        skills_total: miaSkills.count,
        skills_active: miaSkills.rows.filter((s: any) => s.status === "active").length,
        logs_total: usageLogs.count,
        today_cost: todayCost,
        total_errors: totalErrors,
      },
      conversations: conversations.rows,
      messages: messages.rows,
      agents: agents.rows.length ? agents.rows : miaProviders.rows,
      automations: automations.rows.length ? automations.rows : miaSkills.rows,
      mia: {
        providers: miaProviders.rows,
        skills: miaSkills.rows,
        logs: usageLogs.rows,
      },
      debug: {
        conversations_error: conversations.error,
        messages_error: messages.error,
        agents_error: agents.error,
        automations_error: automations.error,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
