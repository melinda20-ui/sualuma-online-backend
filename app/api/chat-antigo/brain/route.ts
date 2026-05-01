import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

export const dynamic = "force-dynamic";

let pool: Pool | null = null;

function getPool() {
  if (!pool) {
    const connectionString =
      process.env.DATABASE_URL ||
      process.env.BLOG_DATABASE_URL;

    if (!connectionString) {
      throw new Error("DATABASE_URL não encontrada.");
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

async function query(sql: string, params: unknown[] = []) {
  try {
    const result = await getPool().query(sql, params);
    return { ok: true, rows: result.rows, error: null as string | null };
  } catch (error: any) {
    return { ok: false, rows: [] as any[], error: error?.message || String(error) };
  }
}

async function setupMemoryTable() {
  await query(`
    create table if not exists public.chat_antigo_brain_messages (
      id uuid primary key default gen_random_uuid(),
      role text not null,
      content text not null,
      provider_slug text,
      model_slug text,
      source text default 'chat-antigo',
      metadata jsonb default '{}'::jsonb,
      created_at timestamptz default now()
    )
  `);
}

function pickAnswer(data: any): string {
  return (
    data?.answer ||
    data?.response ||
    data?.text ||
    data?.message ||
    data?.output ||
    data?.result?.answer ||
    data?.result?.text ||
    data?.data?.answer ||
    data?.data?.text ||
    ""
  );
}

async function tryInternalBrain(message: string, context: any) {
  const port = process.env.PORT || "3000";
  const base = `http://127.0.0.1:${port}`;

  const endpoints = [
    "/api/ai/router",
    "/api/brain/task",
    "/api/brain/executor",
  ];

  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 18_000);

      const res = await fetch(`${base}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          message,
          prompt: message,
          input: message,
          source: "chat-antigo",
          channel: "chat-antigo",
          context,
        }),
      });

      clearTimeout(timer);

      const text = await res.text();

      let json: any = null;
      try {
        json = JSON.parse(text);
      } catch {
        json = { text };
      }

      if (res.ok) {
        const answer = pickAnswer(json);
        if (answer) {
          return {
            ok: true,
            endpoint,
            answer,
            raw: json,
          };
        }
      }
    } catch {
      // tenta o próximo endpoint
    }
  }

  return {
    ok: false,
    endpoint: null,
    answer: "",
    raw: null,
  };
}

function buildFallbackAnswer(message: string, context: any) {
  const activeProviders = context.providers
    .filter((p: any) => p.status === "active")
    .map((p: any) => p.name || p.slug)
    .slice(0, 5)
    .join(", ");

  const activeSkills = context.skills
    .filter((s: any) => s.status === "active")
    .map((s: any) => s.name || s.slug)
    .slice(0, 5)
    .join(", ");

  return `Mia conectada ao Chat Antigo.

Recebi sua mensagem:
"${message}"

Contexto ativo do cérebro:
- Provedores ativos: ${activeProviders || "nenhum provedor ativo encontrado"}
- Skills ativas: ${activeSkills || "nenhuma skill ativa encontrada"}

O roteador interno ainda não devolveu uma resposta final, então deixei esta resposta de fallback. A ponte com o cérebro já está funcionando e registrando a conversa no banco.`;
}

export async function GET() {
  await setupMemoryTable();

  const recent = await query(`
    select *
    from public.chat_antigo_brain_messages
    order by created_at desc
    limit 30
  `);

  return NextResponse.json({
    ok: true,
    source: "chat-antigo-brain",
    messages: recent.rows,
    generated_at: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  try {
    await setupMemoryTable();

    const body = await req.json().catch(() => ({}));
    const message = String(body?.message || body?.content || body?.prompt || "").trim();

    if (!message) {
      return NextResponse.json(
        { ok: false, error: "Mensagem vazia." },
        { status: 400 }
      );
    }

    await query(
      `
        insert into public.chat_antigo_brain_messages
          (role, content, source, metadata)
        values
          ($1, $2, $3, $4)
      `,
      ["user", message, "chat-antigo", JSON.stringify({ from: "chat-antigo-ui" })]
    );

    const providers = await query(`
      select *
      from public.mia_brain_providers
      order by priority asc nulls last, name asc
      limit 30
    `);

    const skills = await query(`
      select *
      from public.mia_brain_skills
      order by usage_count desc nulls last, name asc
      limit 40
    `);

    const prompts = await query(`
      select *
      from public.mia_brain_prompts
      where is_active = true
      order by updated_at desc nulls last, created_at desc nulls last
      limit 20
    `);

    const memory = await query(`
      select *
      from public.chat_antigo_brain_messages
      order by created_at desc
      limit 12
    `);

    const context = {
      providers: providers.rows,
      skills: skills.rows,
      prompts: prompts.rows,
      memory: memory.rows.reverse(),
    };

    const brain = await tryInternalBrain(message, context);

    const answer = brain.ok
      ? brain.answer
      : buildFallbackAnswer(message, context);

    await query(
      `
        insert into public.chat_antigo_brain_messages
          (role, content, provider_slug, model_slug, source, metadata)
        values
          ($1, $2, $3, $4, $5, $6)
      `,
      [
        "assistant",
        answer,
        brain.ok ? "internal-router" : "fallback",
        brain.endpoint || "fallback",
        "chat-antigo",
        JSON.stringify({
          endpoint: brain.endpoint,
          raw: brain.raw,
        }),
      ]
    );

    await query(
      `
        insert into public.mia_brain_usage_logs
          (provider_slug, model_slug, skill_slug, event_type, status, message, latency_ms, input_tokens, output_tokens, cost, metadata)
        values
          ($1, $2, $3, $4, $5, $6, $7, 0, 0, 0, $8)
      `,
      [
        brain.ok ? "internal-router" : "fallback",
        brain.endpoint || "fallback",
        "atendimento-ia",
        "chat-antigo",
        "ok",
        "Chat Antigo enviou mensagem para o cérebro da Mia.",
        null,
        JSON.stringify({ user_message: message }),
      ]
    );

    return NextResponse.json({
      ok: true,
      source: "chat-antigo-brain",
      endpoint: brain.endpoint,
      answer,
      context_summary: {
        providers_total: providers.rows.length,
        skills_total: skills.rows.length,
        prompts_total: prompts.rows.length,
        memory_total: memory.rows.length,
      },
      generated_at: new Date().toISOString(),
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
