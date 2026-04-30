import { NextResponse } from "next/server";
import { Pool } from "pg";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PgGlobal = typeof globalThis & {
  miaBrainPool?: Pool;
};

const globalForPg = globalThis as PgGlobal;

function getPool() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL não configurada no ambiente.");
  }

  if (!globalForPg.miaBrainPool) {
    globalForPg.miaBrainPool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }

  return globalForPg.miaBrainPool;
}

function safeTableName(tableName: string) {
  if (!/^mia_brain_[a-z0-9_]+$/.test(tableName)) {
    throw new Error(`Nome de tabela inválido: ${tableName}`);
  }

  return `"public"."${tableName}"`;
}

async function loadTable(pool: Pool, tableName: string) {
  try {
    const safeName = safeTableName(tableName);
    const result = await pool.query(`select * from ${safeName} limit 300`);

    return {
      ok: true,
      rows: result.rows,
      count: result.rowCount ?? result.rows.length,
    };
  } catch (error) {
    return {
      ok: false,
      rows: [],
      count: 0,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

function rowsFrom(
  tables: Record<string, { ok: boolean; rows: unknown[]; count: number; error?: string }>,
  tableName: string
) {
  return tables[tableName]?.rows ?? [];
}

export async function GET() {
  try {
    const pool = getPool();

    const tableList = await pool.query(`
      select tablename
      from pg_tables
      where schemaname = 'public'
        and tablename like 'mia_brain_%'
      order by tablename asc
    `);

    const tableNames = tableList.rows.map((row) => row.tablename as string);

    const tables: Record<
      string,
      { ok: boolean; rows: unknown[]; count: number; error?: string }
    > = {};

    await Promise.all(
      tableNames.map(async (tableName) => {
        tables[tableName] = await loadTable(pool, tableName);
      })
    );

    const providers = rowsFrom(tables, "mia_brain_providers");
    const models = rowsFrom(tables, "mia_brain_models");
    const skills = rowsFrom(tables, "mia_brain_skills");
    const prompts = rowsFrom(tables, "mia_brain_prompts");
    const voices = rowsFrom(tables, "mia_brain_voices");
    const logs = rowsFrom(tables, "mia_brain_logs");
    const usage = rowsFrom(tables, "mia_brain_usage");
    const costs = rowsFrom(tables, "mia_brain_costs");

    const metrics = {
      providers_total: providers.length,
      models_total: models.length,
      skills_total: skills.length,
      prompts_total: prompts.length,
      voices_total: voices.length,
      logs_total: logs.length,
      usage_events_total: usage.length,
      costs_rows_total: costs.length,
      tables_total: tableNames.length,
    };

    return NextResponse.json({
      ok: true,
      source: "postgres-direct",
      message: "Mia Brain conectada diretamente ao banco PostgreSQL/Supabase.",
      generated_at: new Date().toISOString(),
      tableNames,
      metrics,
      providers,
      models,
      skills,
      prompts,
      voices,
      logs,
      usage,
      costs,
      tables,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        source: "postgres-direct",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
