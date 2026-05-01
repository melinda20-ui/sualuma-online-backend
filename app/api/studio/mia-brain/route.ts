import { NextRequest, NextResponse } from "next/server";
import { Pool, QueryResultRow } from "pg";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ResourceType = "provider" | "model" | "skill" | "prompt" | "voice" | "setting" | "usage_log" | "transcription";

const TABLES: Record<ResourceType, string> = {
  provider: "mia_brain_providers",
  model: "mia_brain_models",
  skill: "mia_brain_skills",
  prompt: "mia_brain_prompts",
  voice: "mia_brain_voices",
  setting: "mia_brain_settings",
  usage_log: "mia_brain_usage_logs",
  transcription: "mia_brain_transcriptions",
};

declare global {
  // eslint-disable-next-line no-var
  var miaBrainPool: Pool | undefined;
}

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL || process.env.BLOG_DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL ou BLOG_DATABASE_URL não encontrada no ambiente.");
  }
  return url;
}

function getPool() {
  if (!global.miaBrainPool) {
    global.miaBrainPool = new Pool({
      connectionString: getDatabaseUrl(),
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000,
    });
  }

  return global.miaBrainPool;
}

async function safeQuery<T = any>(sql: string, params: any[] = []) {
  const pool = getPool();
  try {
    const result = await pool.query(sql, params);
    return { rows: result.rows as T[], error: null as null | string };
  } catch (error: any) {
    return { rows: [] as T[], error: error?.message || String(error) };
  }
}

async function getColumns(table: string) {
  const result = await safeQuery<{ column_name: string }>(
    `
    select column_name
    from information_schema.columns
    where table_schema = 'public'
    and table_name = $1
    order by ordinal_position
    `,
    [table]
  );

  return result.rows.map((row) => row.column_name);
}

async function selectAll(table: string, order = "created_at desc") {
  const columns = await getColumns(table);

  if (!columns.length) {
    return [];
  }

  const hasCreatedAt = columns.includes("created_at");
  const orderBy = hasCreatedAt ? order : "1 asc";

  const result = await safeQuery(`select * from public.${table} order by ${orderBy} limit 200`);
  return result.rows;
}

function toMoneyNumber(value: any) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function avg(values: number[]) {
  const clean = values.filter((v) => Number.isFinite(v));
  if (!clean.length) return 0;
  return Math.round(clean.reduce((a, b) => a + b, 0) / clean.length);
}

async function buildDashboardPayload() {
  const [
    providers,
    models,
    skills,
    prompts,
    voices,
    settings,
    usageLogs,
    transcriptions,
  ] = await Promise.all([
    selectAll("mia_brain_providers", "priority asc, created_at desc"),
    selectAll("mia_brain_models", "quality_score desc, created_at desc"),
    selectAll("mia_brain_skills", "created_at desc"),
    selectAll("mia_brain_prompts", "updated_at desc, created_at desc"),
    selectAll("mia_brain_voices", "created_at desc"),
    selectAll("mia_brain_settings", "created_at desc"),
    selectAll("mia_brain_usage_logs", "created_at desc"),
    selectAll("mia_brain_transcriptions", "created_at desc"),
  ]);

  const providerRows: any[] = providers;
  const modelRows: any[] = models;
  const skillRows: any[] = skills;
  const promptRows: any[] = prompts;
  const voiceRows: any[] = voices;
  const logRows: any[] = usageLogs;
  const transcriptionRows: any[] = transcriptions;

  const activeProviders = providerRows.filter((p) => p.status === "active").length;
  const activeSkills = skillRows.filter((s) => s.status === "active" || s.status === "enabled").length;

  const todayCost =
    providerRows.reduce((acc, item) => acc + toMoneyNumber(item.today_cost), 0) +
    logRows.reduce((acc, item) => acc + toMoneyNumber(item.cost || item.total_cost || item.estimated_cost), 0);

  const avgLatency = avg([
    ...providerRows.map((p) => Number(p.avg_latency_ms || 0)),
    ...modelRows.map((m) => Number(m.avg_latency_ms || 0)),
  ]);

  const totalRequests =
    providerRows.reduce((acc, item) => acc + Number(item.total_requests || 0), 0) +
    logRows.length;

  const totalErrors =
    providerRows.reduce((acc, item) => acc + Number(item.total_errors || 0), 0) +
    logRows.filter((l) => String(l.status || "").toLowerCase().includes("error")).length;

  return {
    ok: true,
    source: "postgres-direct",
    message: "Mia Brain conectada diretamente ao banco PostgreSQL/Supabase.",
    generated_at: new Date().toISOString(),
    metrics: {
      providers_total: providerRows.length,
      providers_active: activeProviders,
      models_total: modelRows.length,
      skills_total: skillRows.length,
      skills_active: activeSkills,
      prompts_total: promptRows.length,
      voices_total: voiceRows.length,
      logs_total: logRows.length,
      usage_events_total: logRows.length,
      transcriptions_total: transcriptionRows.length,
      settings_total: (settings as any[]).length,
      today_cost: todayCost,
      avg_latency_ms: avgLatency,
      total_requests: totalRequests,
      total_errors: totalErrors,
    },
    providers,
    models,
    skills,
    prompts,
    voices,
    settings,
    usageLogs,
    transcriptions,
  };
}

export async function GET() {
  try {
    const payload = await buildDashboardPayload();
    return NextResponse.json(payload);
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

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const resource = body.resource as ResourceType;
    const id = body.id;
    const patch = body.patch || {};

    if (!resource || !TABLES[resource]) {
      return NextResponse.json({ ok: false, error: "resource inválido." }, { status: 400 });
    }

    if (!id) {
      return NextResponse.json({ ok: false, error: "id obrigatório." }, { status: 400 });
    }

    const table = TABLES[resource];
    const columns = await getColumns(table);

    if (!columns.includes("id")) {
      return NextResponse.json({ ok: false, error: `Tabela ${table} não possui coluna id.` }, { status: 400 });
    }

    const allowed = Object.keys(patch).filter(
      (key) =>
        columns.includes(key) &&
        !["id", "created_at"].includes(key)
    );

    if (!allowed.length) {
      return NextResponse.json({ ok: false, error: "Nenhum campo válido para atualizar." }, { status: 400 });
    }

    const values = allowed.map((key) => patch[key]);
    const setParts = allowed.map((key, index) => `${key} = $${index + 1}`);

    if (columns.includes("updated_at")) {
      setParts.push("updated_at = now()");
    }

    const result = await safeQuery(
      `
      update public.${table}
      set ${setParts.join(", ")}
      where id = $${values.length + 1}
      returning *
      `,
      [...values, id]
    );

    if (result.error) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ ok: true, resource, item: result.rows[0] || null });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const resource = (body.resource || "usage_log") as ResourceType;
    const data = body.data || {};

    if (!resource || !TABLES[resource]) {
      return NextResponse.json({ ok: false, error: "resource inválido." }, { status: 400 });
    }

    const table = TABLES[resource];
    const columns = await getColumns(table);

    const defaultUsageLog = {
      provider_slug: "mia-brain",
      model_slug: "dashboard",
      skill_slug: "teste-dashboard",
      event_type: "dashboard_test",
      status: "success",
      message: "Evento de teste registrado pelo painel Mia Brain.",
      input_tokens: 0,
      output_tokens: 0,
      cost: 0,
      total_cost: 0,
      estimated_cost: 0,
      latency_ms: 120,
      metadata: { origin: "mia-brain-dashboard", created_by: "studio" },
    };

    const payload =
      resource === "usage_log"
        ? { ...defaultUsageLog, ...data }
        : data;

    const insertKeys = Object.keys(payload).filter((key) => columns.includes(key));

    if (!insertKeys.length) {
      return NextResponse.json(
        {
          ok: false,
          error: `Nenhum campo enviado existe na tabela ${table}.`,
          available_columns: columns,
        },
        { status: 400 }
      );
    }

    const values = insertKeys.map((key) => {
      const value = payload[key];
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        return JSON.stringify(value);
      }
      return value;
    });

    const placeholders = insertKeys.map((_, index) => `$${index + 1}`);

    const result = await safeQuery(
      `
      insert into public.${table} (${insertKeys.join(", ")})
      values (${placeholders.join(", ")})
      returning *
      `,
      values
    );

    if (result.error) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ ok: true, resource, item: result.rows[0] || null });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || String(error) }, { status: 500 });
  }
}
