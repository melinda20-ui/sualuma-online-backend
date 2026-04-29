import { NextResponse } from "next/server";
import pg from "pg";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const { Pool } = pg;

type Tone = "pink" | "blue" | "green" | "yellow" | "red" | "purple";

const validTones = new Set(["pink", "blue", "green", "yellow", "red", "purple"]);

function safeTone(value: unknown, fallback: Tone = "blue"): Tone {
  return typeof value === "string" && validTones.has(value) ? (value as Tone) : fallback;
}

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

let pool: any = null;

function getConnectionString() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.SUPABASE_DB_URL ||
    ""
  );
}

function getPool() {
  const connectionString = getConnectionString();

  if (!connectionString) {
    return null;
  }

  if (!pool) {
    pool = new Pool({
      connectionString,
      max: 5,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
    });
  }

  return pool;
}

function normalizeRows(rows: any[] | null | undefined, fallbackRows: any[]) {
  if (!rows || rows.length === 0) return fallbackRows;

  return rows.map((row) => ({
    ...row,
    tone: safeTone(row.tone),
  }));
}

async function query(sql: string) {
  const activePool = getPool();

  if (!activePool) {
    return [];
  }

  const result = await activePool.query(sql);
  return result.rows;
}



function formatFinanceMoney(value: unknown) {
  const numberValue = Number(value || 0);

  return numberValue.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function getFinanceFallbackData(): any {
  return {
    summary: {
      operatingBalance: "R$ 36.320,00",
      revenue: "R$ 48.750,00",
      costs: "R$ 12.430,00",
      reinvestment: "R$ 8.600,00",
      profitLabel: "Lucro líquido após custos principais do mês",
      revenueGrowth: "+18,6%",
      costsGrowth: "controlado",
      reinvestmentGrowth: "+12%",
      healthScore: 82,
      miaSummary:
        "O financeiro está saudável, mas precisa separar origem da receita, custos fixos, custos variáveis e ROI dos agentes antes de escalar.",
    },
    financeDashboardCards: [
      { title: "Receita total", value: "R$ 48.750", detail: "Entradas estimadas do mês atual", tone: "green" },
      { title: "Custos principais", value: "R$ 12.430", detail: "Infraestrutura, ferramentas e operação", tone: "yellow" },
      { title: "Saldo operacional", value: "R$ 36.320", detail: "Valor livre depois dos custos principais", tone: "pink" },
      { title: "Reinvestimento", value: "R$ 8.600", detail: "Valor reservado para crescimento e aquisição", tone: "blue" },
    ],
    financeRevenueRows: [],
    financeBars: [],
    financeCostRows: [],
    financeCostBars: [],
    financeProjectionRows: [],
    financeMiaRows: [],
  };
}

async function readStudioFinanceData(): Promise<any> {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL;

  if (!connectionString) {
    return getFinanceFallbackData();
  }

  const pg = await import("pg");
  const pool = new pg.Pool({ connectionString });

  try {
    const [
      summaryResult,
      cardsResult,
      revenueRowsResult,
      barsResult,
      costRowsResult,
      projectionRowsResult,
      miaRowsResult,
    ] = await Promise.all([
      pool.query("select * from public.studio_finance_summary where id = 'main' limit 1"),
      pool.query("select title, value, detail, tone, priority from public.studio_finance_cards order by priority asc, updated_at desc"),
      pool.query("select title, value, detail, tone, priority from public.studio_finance_revenue_rows order by priority asc, updated_at desc"),
      pool.query("select group_key, label, value, percent, tone, priority from public.studio_finance_bars order by priority asc, updated_at desc"),
      pool.query("select title, value, detail, tone, priority from public.studio_finance_cost_rows order by priority asc, updated_at desc"),
      pool.query("select title, value, detail, tone, priority from public.studio_finance_projection_rows order by priority asc, updated_at desc"),
      pool.query("select title, value, detail, tone, priority from public.studio_finance_mia_rows order by priority asc, updated_at desc"),
    ]);

    const summaryRow = summaryResult.rows[0] || {};

    const mapDataRow = (row: any) => ({
      title: row.title,
      value: row.value,
      detail: row.detail,
      tone: row.tone || "blue",
      priority: row.priority || 100,
    });

    const mapBar = (row: any) => ({
      label: row.label,
      value: row.value,
      percent: Number(row.percent || 0),
      tone: row.tone || "blue",
      priority: row.priority || 100,
    });

    const allBars = barsResult.rows || [];

    return {
      summary: {
        operatingBalance: formatFinanceMoney(summaryRow.operating_balance),
        revenue: formatFinanceMoney(summaryRow.revenue),
        costs: formatFinanceMoney(summaryRow.costs),
        reinvestment: formatFinanceMoney(summaryRow.reinvestment),
        profitLabel:
          summaryRow.profit_label ||
          "Lucro líquido após custos principais do mês",
        revenueGrowth: summaryRow.revenue_growth || "+18,6%",
        costsGrowth: summaryRow.costs_growth || "controlado",
        reinvestmentGrowth: summaryRow.reinvestment_growth || "+12%",
        healthScore: Number(summaryRow.health_score || 82),
        miaSummary:
          summaryRow.mia_summary ||
          "O financeiro está saudável, mas precisa separar origem da receita, custos fixos, custos variáveis e ROI dos agentes antes de escalar.",
      },
      financeDashboardCards: cardsResult.rows.map(mapDataRow),
      financeRevenueRows: revenueRowsResult.rows.map(mapDataRow),
      financeBars: allBars.filter((row: any) => row.group_key === "revenue").map(mapBar),
      financeCostRows: costRowsResult.rows.map(mapDataRow),
      financeCostBars: allBars.filter((row: any) => row.group_key === "cost").map(mapBar),
      financeProjectionRows: projectionRowsResult.rows.map(mapDataRow),
      financeMiaRows: miaRowsResult.rows.map(mapDataRow),
    };
  } catch (error) {
    console.error("Erro ao carregar financeiro do Studio:", error);
    return getFinanceFallbackData();
  } finally {
    await pool.end().catch(() => {});
  }
}

export async function GET() {
  let financeData: any = getFinanceFallbackData();

  try {
    financeData = await readStudioFinanceData();
  } catch (financeError) {
    console.error("Erro ao preparar financeData:", financeError);
  }

  try {
    const activePool = getPool();

    if (!activePool) {
      return NextResponse.json(
        {
          ok: false,
          source: "fallback",
          error: "DATABASE_URL/POSTGRES_URL/SUPABASE_DB_URL não encontrado no runtime.",
          data: fallback,
        },
        { headers: { "Cache-Control": "no-store" } }
      );
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

    for (const link of linkRows) {
      const current = linksBySubdomain.get(link.subdomain_key) || [];
      current.push(link.path);
      linksBySubdomain.set(link.subdomain_key, current);
    }

    const subdomainRows = subdomainRowsRaw.length
      ? subdomainRowsRaw.map((item: any) => ({
          name: item.name,
          status: item.status,
          tone: safeTone(item.tone),
          links: linksBySubdomain.get(item.subdomain_key) || [],
        }))
      : fallback.subdomainRows;

    return NextResponse.json(
      {
        ok: true,
        source: "postgres",
        data: {
          systemTaskRows: normalizeRows(taskRows, fallback.systemTaskRows),
          storeProductRows: normalizeRows(productRows, fallback.storeProductRows),
          communityModerationRows: normalizeRows(reportRows, fallback.communityModerationRows),
          cnpjNotificationRows: normalizeRows(cnpjRows, fallback.cnpjNotificationRows),
          subdomainRows,
        financeData,
        },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[studio/dashboard] erro:", error);

    return NextResponse.json(
      {
        ok: false,
        source: "fallback",
        error: error instanceof Error ? error.message : String(error),
        data: fallback,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }
}
