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


function getStripeFallbackData(): any {
  return {
    summary: {
      revenue: "R$ 0,00",
      successfulPayments: "0",
      activeSubscriptions: "0",
      failedPayments: "0",
      healthScore: 0,
      statusLabel: "Stripe ainda não conectado",
      statusDetail: "Base Stripe criada no banco. Falta configurar a chave Stripe e sincronizar pagamentos reais.",
    },
    stripeDashboardCards: [
      { title: "Receita Stripe", value: "R$ 0,00", detail: "Nenhum pagamento real sincronizado ainda.", tone: "yellow" },
      { title: "Pagamentos aprovados", value: "0", detail: "Aguardando conexão com Stripe.", tone: "blue" },
      { title: "Assinaturas ativas", value: "0", detail: "Ainda sem usuários pagantes conectados.", tone: "pink" },
      { title: "Falhas de pagamento", value: "0", detail: "Sem eventos Stripe importados.", tone: "green" },
    ],
    stripePaymentRows: [],
    stripeSubscriptionRows: [],
    stripeActionRows: [],
    stripeAlertRows: [],
    stripeRevenueBars: [],
  };
}

function stripeText(row: any, keys: string[], fallbackValue = "") {
  for (const key of keys) {
    const value = row?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value);
    }
  }
  return fallbackValue;
}

function stripeNumberText(row: any, keys: string[], fallbackValue = "0") {
  for (const key of keys) {
    const value = row?.[key];
    if (value !== undefined && value !== null && value !== "") {
      return String(value);
    }
  }
  return fallbackValue;
}

function stripeMoney(row: any, textKeys: string[], centKeys: string[], fallbackValue = "R$ 0,00") {
  for (const key of textKeys) {
    const value = row?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value);
    }
  }

  for (const key of centKeys) {
    const value = Number(row?.[key]);
    if (Number.isFinite(value)) {
      return (value / 100).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
    }
  }

  return fallbackValue;
}

async function readStudioStripeData(): Promise<any> {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.SUPABASE_DB_URL;

  if (!connectionString) {
    return getStripeFallbackData();
  }

  const pg = await import("pg");
  const pool = new pg.Pool({ connectionString });

  try {
    const [
      summaryResult,
      cardsResult,
      paymentRowsResult,
      subscriptionRowsResult,
      actionRowsResult,
      alertRowsResult,
      revenueBarsResult,
    ] = await Promise.all([
      pool.query("select * from studio_stripe_summary limit 1"),
      pool.query("select * from studio_stripe_cards order by priority asc, title asc"),
      pool.query("select * from studio_stripe_payment_rows order by priority asc, title asc"),
      pool.query("select * from studio_stripe_subscription_rows order by priority asc, title asc"),
      pool.query("select * from studio_stripe_action_rows order by priority asc, title asc"),
      pool.query("select * from studio_stripe_alert_rows order by priority asc, title asc"),
      pool.query("select * from studio_stripe_revenue_bars order by priority asc, label asc"),
    ]);

    const fallbackStripe = getStripeFallbackData();
    const summary = summaryResult.rows?.[0] || {};

    const mapDataRow = (row: any) => ({
      title: stripeText(row, ["title", "name"], "Stripe"),
      detail: stripeText(row, ["detail", "description"], ""),
      value: stripeText(row, ["value", "status", "amount"], "pendente"),
      tone: safeTone(row?.tone, "yellow"),
      priority: row?.priority ?? 99,
    });

    const mapBar = (row: any) => ({
      label: stripeText(row, ["label", "title", "name"], "Stripe"),
      value: stripeText(row, ["value", "percent", "percentage"], "0%"),
      tone: safeTone(row?.tone, "blue"),
      priority: row?.priority ?? 99,
    });

    const cards = cardsResult.rows.map(mapDataRow);
    const paymentRows = paymentRowsResult.rows.map(mapDataRow);
    const subscriptionRows = subscriptionRowsResult.rows.map(mapDataRow);
    const actionRows = actionRowsResult.rows.map(mapDataRow);
    const alertRows = alertRowsResult.rows.map(mapDataRow);
    const revenueBars = revenueBarsResult.rows.map(mapBar);

    return {
      summary: {
        revenue: stripeMoney(
          summary,
          ["revenue", "monthly_revenue", "revenue_value", "total_revenue", "stripe_revenue"],
          ["revenue_cents", "monthly_revenue_cents", "total_revenue_cents"],
          "R$ 0,00"
        ),
        successfulPayments: stripeNumberText(summary, ["successful_payments", "paid_payments", "payments_success", "approved_payments"], "0"),
        activeSubscriptions: stripeNumberText(summary, ["active_subscriptions", "subscriptions_active", "active_customers"], "0"),
        failedPayments: stripeNumberText(summary, ["failed_payments", "payment_failures", "failed_count"], "0"),
        healthScore: Number(summary?.health_score ?? summary?.healthScore ?? 0),
        statusLabel: stripeText(summary, ["status_label", "status", "title"], "Stripe ainda não conectado"),
        statusDetail: stripeText(summary, ["status_detail", "detail", "description", "mia_summary"], "Base Stripe criada no banco. Falta conectar a chave Stripe real."),
      },
      stripeDashboardCards: cards.length ? cards : fallbackStripe.stripeDashboardCards,
      stripePaymentRows: paymentRows.length ? paymentRows : fallbackStripe.stripePaymentRows,
      stripeSubscriptionRows: subscriptionRows.length ? subscriptionRows : fallbackStripe.stripeSubscriptionRows,
      stripeActionRows: actionRows.length ? actionRows : fallbackStripe.stripeActionRows,
      stripeAlertRows: alertRows.length ? alertRows : fallbackStripe.stripeAlertRows,
      stripeRevenueBars: revenueBars.length ? revenueBars : fallbackStripe.stripeRevenueBars,
    };
  } catch (error) {
    console.error("Erro ao carregar Stripe do Studio:", error);
    return getStripeFallbackData();
  } finally {
    await pool.end().catch(() => {});
  }
}

export async function GET() {
  let financeData: any = getFinanceFallbackData();
  let stripeData: any = getStripeFallbackData();

  try {
    financeData = await readStudioFinanceData();
  } catch (financeError) {
    console.error("Erro ao preparar financeData:", financeError);
  }

  try {
    stripeData = await readStudioStripeData();
  } catch (stripeError) {
    console.error("Erro ao preparar stripeData:", stripeError);
  }

  try {
    const activePool = getPool();

    if (!activePool) {
      return NextResponse.json(
        {
          ok: false,
          source: "fallback",
          error: "DATABASE_URL/POSTGRES_URL/SUPABASE_DB_URL não encontrado no runtime.",
          data: { ...fallback, financeData, stripeData },
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
          stripeData,
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
        data: { ...fallback, financeData, stripeData },
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }
}
