import { NextResponse } from "next/server";
import { Pool } from "pg";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Tone = "pink" | "blue" | "green" | "yellow" | "red" | "purple";

const validTones = new Set(["pink", "blue", "green", "yellow", "red", "purple"]);

function safeTone(value: unknown, fallback: Tone = "blue"): Tone {
  return typeof value === "string" && validTones.has(value) ? (value as Tone) : fallback;
}

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.SUPABASE_DB_URL ||
  "";

const pool = connectionString
  ? new Pool({
      connectionString,
    })
  : null;

const fallback = {
  systemTaskRows: [
    {
      title: "Corrigir páginas de entrada",
      detail: "Home, blog, planos e páginas de captura precisam estar sem erro para receber leads.",
      value: "em risco",
      tone: "red",
      tag: "Sistema",
    },
    {
      title: "Ativar rastreio por subdomínio",
      detail: "Monitorar tráfego e origem dos leads por área do ecossistema.",
      value: "em andamento",
      tone: "yellow",
      tag: "Marketing",
    },
  ],
  storeProductRows: [
    {
      title: "Agente Propostas Comerciais",
      detail: "Categoria: Agentes • Status: publicado • Conversão alta",
      value: "ativo",
      tone: "green",
    },
    {
      title: "Automação Follow-up WhatsApp",
      detail: "Categoria: Automações • Falta revisar descrição e gatilho",
      value: "revisar",
      tone: "yellow",
    },
  ],
  communityModerationRows: [
    {
      title: "Denúncia contra @marcos.dev",
      detail: "Motivo: autopromoção repetida em comentários. Denunciado por @ana.paula.",
      value: "enviar aviso",
      tone: "yellow",
    },
  ],
  cnpjNotificationRows: [
    {
      title: "Declaração mensal",
      detail: "Verificar se há pendência ou obrigação recorrente do mês.",
      value: "atenção",
      tone: "yellow",
    },
  ],
  subdomainRows: [
    {
      name: "sualuma.online",
      status: "Online",
      tone: "green",
      links: ["/", "/planos", "/login"],
    },
    {
      name: "studio.sualuma.online",
      status: "Ativo",
      tone: "pink",
      links: ["/studio-lab", "/studio", "/admin"],
    },
  ],
};

function normalizeRows(rows: any[] | null | undefined, fallbackRows: any[]) {
  if (!rows || rows.length === 0) return fallbackRows;

  return rows.map((row) => ({
    ...row,
    tone: safeTone(row.tone),
  }));
}

async function query<T = any>(sql: string): Promise<T[]> {
  if (!pool) return [];
  const result = await pool.query(sql);
  return result.rows as T[];
}

export async function GET() {
  try {
    if (!pool) {
      return NextResponse.json({
        ok: false,
        source: "fallback",
        error: "DATABASE_URL/POSTGRES_URL/SUPABASE_DB_URL não encontrado.",
        data: fallback,
      });
    }

    const [
      taskRows,
      productRows,
      reportRows,
      cnpjRows,
      subdomainRowsRaw,
      linkRows,
    ] = await Promise.all([
      query(`
        select title, detail, value, tone, tag, priority
        from studio_system_tasks
        order by priority asc, created_at asc
      `),
      query(`
        select title, detail, value, tone, category, status, priority
        from studio_store_products
        order by priority asc, created_at asc
      `),
      query(`
        select title, detail, value, tone, reported_user, reporter_user, reason, status, created_at
        from studio_community_reports
        order by created_at desc
      `),
      query(`
        select title, detail, value, tone, status, due_date, created_at
        from studio_cnpj_notifications
        order by created_at desc
      `),
      query(`
        select subdomain_key, name, status, tone
        from studio_subdomains
        order by created_at asc
      `),
      query(`
        select subdomain_key, path, status
        from studio_subdomain_links
        order by path asc
      `),
    ]);

    const linksBySubdomain = new Map<string, string[]>();

    for (const link of linkRows as any[]) {
      const current = linksBySubdomain.get(link.subdomain_key) || [];
      current.push(link.path);
      linksBySubdomain.set(link.subdomain_key, current);
    }

    const subdomainRows = subdomainRowsRaw.length
      ? (subdomainRowsRaw as any[]).map((item) => ({
          name: item.name,
          status: item.status,
          tone: safeTone(item.tone),
          links: linksBySubdomain.get(item.subdomain_key) || [],
        }))
      : fallback.subdomainRows;

    return NextResponse.json({
      ok: true,
      source: "postgres",
      data: {
        systemTaskRows: normalizeRows(taskRows, fallback.systemTaskRows),
        storeProductRows: normalizeRows(productRows, fallback.storeProductRows),
        communityModerationRows: normalizeRows(reportRows, fallback.communityModerationRows),
        cnpjNotificationRows: normalizeRows(cnpjRows, fallback.cnpjNotificationRows),
        subdomainRows,
      },
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      source: "fallback",
      error: error instanceof Error ? error.message : String(error),
      data: fallback,
    });
  }
}
