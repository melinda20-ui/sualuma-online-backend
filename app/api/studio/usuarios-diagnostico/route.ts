import { NextResponse } from "next/server";
import fs from "fs/promises";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CheckStatus = "ok" | "warn" | "critical";

type DiagnosticCheck = {
  area: string;
  title: string;
  status: CheckStatus;
  description: string;
  action?: string;
  meta?: Record<string, unknown>;
};

type ExpectedPlan = {
  id: string;
  aliases: string[];
  area: "Cliente IA" | "Prestadores" | "Créditos" | "Flowmatic" | "Templates" | "Teste";
  label: string;
  price_cents: number;
  billing: "monthly" | "one_time" | "free";
  description: string;
  expected_entitlements: string[];
  expected_agents: string[];
};

const EXPECTED_PLANS: ExpectedPlan[] = [
  {
    id: "basic",
    aliases: ["basic", "basico", "básico", "plano_basico"],
    area: "Cliente IA",
    label: "Básico",
    price_cents: 4900,
    billing: "monthly",
    description: "Plano inicial para estruturar a operação.",
    expected_entitlements: [
      "mini_company",
      "mia_chat_access",
      "basic_courses_access",
      "service_area_limit",
      "studio_access",
      "admin_access",
    ],
    expected_agents: ["mia"],
  },
  {
    id: "prime",
    aliases: ["prime", "plano_prime"],
    area: "Cliente IA",
    label: "Prime",
    price_cents: 9700,
    billing: "monthly",
    description: "Plano recomendado para pequenos negócios em crescimento.",
    expected_entitlements: [
      "mini_company_complete",
      "initial_automations_access",
      "courses_services_access",
      "advanced_user_area",
      "support_priority_medium",
    ],
    expected_agents: ["mia"],
  },
  {
    id: "premium",
    aliases: ["premium", "plano_premium"],
    area: "Cliente IA",
    label: "Premium",
    price_cents: 19700,
    billing: "monthly",
    description: "Plano para empresas que querem automação e escala.",
    expected_entitlements: [
      "more_automations_access",
      "more_member_areas",
      "advanced_resources",
      "expanded_operational_dashboard",
      "support_priority_high",
    ],
    expected_agents: ["mia"],
  },
  {
    id: "pro",
    aliases: ["pro", "plano_pro"],
    area: "Cliente IA",
    label: "Pro",
    price_cents: 39700,
    billing: "monthly",
    description: "Plano para operações robustas, times e orquestração avançada.",
    expected_entitlements: [
      "premium_everything",
      "expanded_agent_access",
      "advanced_orchestration",
      "team_resources",
      "priority_support",
    ],
    expected_agents: ["mia"],
  },
  {
    id: "provider_free",
    aliases: [
      "provider_free",
      "prestador_free",
      "prestador_gratuito",
      "gratuito_prestador",
      "free_provider",
    ],
    area: "Prestadores",
    label: "Gratuito Prestador",
    price_cents: 0,
    billing: "free",
    description: "Plano gratuito para prestadores começarem.",
    expected_entitlements: [
      "provider_public_profile",
      "open_opportunities_access",
      "proposals_per_month",
      "admin_fee_percent",
      "standard_visibility",
    ],
    expected_agents: [],
  },
  {
    id: "proposal_pack",
    aliases: [
      "proposal_pack",
      "pacote_propostas",
      "pacote_de_propostas",
      "propostas_extras",
    ],
    area: "Créditos",
    label: "Pacote de Propostas",
    price_cents: 1990,
    billing: "one_time",
    description: "Compra avulsa de propostas extras.",
    expected_entitlements: [
      "extra_proposals",
      "one_time_payment",
      "no_monthly_subscription",
      "release_after_confirmation",
      "admin_fee_percent",
    ],
    expected_agents: [],
  },
  {
    id: "provider_priority",
    aliases: [
      "provider_priority",
      "prestador_prioritario",
      "prestador_priority",
      "prioritario_prestador",
    ],
    area: "Prestadores",
    label: "Prestador Prioritário",
    price_cents: 4990,
    billing: "monthly",
    description: "Plano pago para prestadores com mais destaque.",
    expected_entitlements: [
      "proposals_per_month",
      "listing_priority_high",
      "verified_provider_badge",
      "reduced_admin_fee_percent",
      "provider_priority_support",
    ],
    expected_agents: [],
  },

  {
    id: "provider_agency_team",
    aliases: [
      "provider_agency_team",
      "agencia_time",
      "agência_time",
      "prestador_agencia",
      "prestador_time",
      "provider_team",
      "provider_agency",
    ],
    area: "Prestadores",
    label: "Agência / Time",
    price_cents: 9700,
    billing: "monthly",
    description: "Plano para equipes, agências e prestadores fortes que querem operar em volume.",
    expected_entitlements: [
      "proposals_per_month_120",
      "priority_maximum",
      "team_profile",
      "admin_fee_percent_8",
      "reduced_contract_fee",
    ],
    expected_agents: [],
  },
  {
    id: "flowmatic_start",
    aliases: [
      "flowmatic_start",
      "flowmatic_comecar",
      "começar",
      "comecar",
      "entrada_flowmatic",
      "flowmatic_free",
    ],
    area: "Flowmatic",
    label: "Flowmatic Começar",
    price_cents: 0,
    billing: "free",
    description: "Plano gratuito para testar o Flowmatic e organizar o básico do dia.",
    expected_entitlements: [
      "painel_hoje",
      "three_daily_tasks",
      "template_organiza_minha_cabeca",
      "dona_limited_access",
      "simple_habit_history",
    ],
    expected_agents: ["dona_limited"],
  },
  {
    id: "flowmatic_rotina_pro",
    aliases: [
      "flowmatic_rotina_pro",
      "rotina_pro",
      "flowmatic_routine_pro",
    ],
    area: "Flowmatic",
    label: "Rotina Pro",
    price_cents: 2900,
    billing: "monthly",
    description: "Plano para separar casa, mente e trabalho sem se perder.",
    expected_entitlements: [
      "everything_flowmatic_start",
      "dona_full_agent",
      "calma_agent",
      "home_routine_templates",
      "daily_night_checkin",
      "simple_weekly_report",
    ],
    expected_agents: ["dona", "calma"],
  },
  {
    id: "flowmatic_solo_ceo",
    aliases: [
      "flowmatic_solo_ceo",
      "solo_ceo",
      "flowmatic_ceo",
    ],
    area: "Flowmatic",
    label: "Solo CEO",
    price_cents: 5900,
    billing: "monthly",
    description: "Plano para solopreneurs que querem organizar a vida e vender mais.",
    expected_entitlements: [
      "everything_rotina_pro",
      "vera_annual_plan_agent",
      "rica_sales_agent",
      "template_1_ano_12_semanas",
      "template_lancamento_30_dias",
      "smart_weekly_agenda",
      "simple_business_finance",
    ],
    expected_agents: ["dona", "calma", "vera", "rica"],
  },
  {
    id: "flowmatic_imperio_solo",
    aliases: [
      "flowmatic_imperio_solo",
      "imperio_solo",
      "império_solo",
      "flowmatic_empire",
    ],
    area: "Flowmatic",
    label: "Império Solo",
    price_cents: 9700,
    billing: "monthly",
    description: "Plano completo para transformar rotina, vendas e metas em sistema.",
    expected_entitlements: [
      "everything_solo_ceo",
      "advanced_business_dashboard",
      "advanced_financial_routine",
      "complete_agent_access",
      "priority_flowmatic_support",
    ],
    expected_agents: ["dona", "calma", "vera", "rica"],
  },
  {
    id: "template_saida_financeira",
    aliases: [
      "template_saida_financeira",
      "saida_financeira",
      "saída_financeira",
    ],
    area: "Templates",
    label: "Template Saída Financeira",
    price_cents: 2900,
    billing: "one_time",
    description: "Template de 90 dias para começar a criar renda própria.",
    expected_entitlements: [
      "mapa_financeiro",
      "meta_de_renda",
      "plano_de_acao",
      "checkpoints",
      "template_access",
    ],
    expected_agents: [],
  },
  {
    id: "template_mae_empreendedora",
    aliases: [
      "template_mae_empreendedora",
      "mãe_empreendedora",
      "mae_empreendedora",
    ],
    area: "Templates",
    label: "Template Mãe Empreendedora",
    price_cents: 2900,
    billing: "one_time",
    description: "Template para organizar blocos de trabalho em rotina com filhos, casa e imprevistos.",
    expected_entitlements: [
      "blocos_de_foco",
      "rotina_flexivel",
      "plano_1h_dia",
      "agenda_leve",
      "template_access",
    ],
    expected_agents: [],
  },
  {
    id: "trial_30_days",
    aliases: [
      "trial_30_days",
      "teste_30_dias",
      "teste_gratis_30_dias",
      "teste_grátis_30_dias",
    ],
    area: "Teste",
    label: "Teste grátis de 30 dias",
    price_cents: 0,
    billing: "free",
    description: "Teste completo da plataforma por 30 dias com cartão para ativação.",
    expected_entitlements: [
      "trial_30_days",
      "card_required_for_activation",
      "cancel_anytime",
      "initial_platform_access",
      "trial_before_subscription",
    ],
    expected_agents: ["mia"],
  },
];

function hasValue(value?: string) {
  return typeof value === "string" && value.trim().length > 0;
}

function money(cents: number) {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

function normalizeText(value: unknown) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

async function exists(target: string) {
  try {
    await fs.access(target);
    return true;
  } catch {
    try {
      await fs.access(`${process.cwd()}/${target}`);
      return true;
    } catch {
      return false;
    }
  }
}

async function listNginxSites() {
  try {
    return await fs.readdir("/etc/nginx/sites-enabled");
  } catch {
    return [];
  }
}

function normalizeSupabaseUrl(url: string) {
  return url.replace(/\/+$/, "");
}

async function supabaseRest(baseUrl: string, serviceKey: string, endpoint: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    const response = await fetch(
      `${normalizeSupabaseUrl(baseUrl)}/rest/v1/${endpoint.replace(/^\/+/, "")}`,
      {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
          Prefer: "count=exact",
        },
      }
    );

    const contentRange = response.headers.get("content-range");
    let count: number | null = null;

    if (contentRange && contentRange.includes("/")) {
      const raw = contentRange.split("/").pop();
      if (raw && raw !== "*") {
        const parsed = Number(raw);
        if (!Number.isNaN(parsed)) count = parsed;
      }
    }

    let data: unknown = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    return {
      ok: response.ok,
      status: response.status,
      count,
      data,
      error: response.ok ? null : data,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      count: null,
      data: null,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function supabaseAuthUsers(baseUrl: string, serviceKey: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    const response = await fetch(
      `${normalizeSupabaseUrl(baseUrl)}/auth/v1/admin/users?page=1&per_page=1`,
      {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    let data: any = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    return {
      ok: response.ok,
      status: response.status,
      total:
        typeof data?.total === "number"
          ? data.total
          : Array.isArray(data?.users)
          ? data.users.length
          : null,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      total: null,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  } finally {
    clearTimeout(timeout);
  }
}

function findMatchingPlan(expected: ExpectedPlan, plans: any[]) {
  const aliases = new Set([expected.id, ...expected.aliases].map(normalizeText));

  return (
    plans.find((plan) => aliases.has(normalizeText(plan.plan_key))) ||
    plans.find((plan) => aliases.has(normalizeText(plan.slug))) ||
    plans.find((plan) => aliases.has(normalizeText(plan.id))) ||
    plans.find((plan) => aliases.has(normalizeText(plan.name))) ||
    plans.find((plan) => normalizeText(plan.name).includes(normalizeText(expected.label)))
  );
}

export async function GET() {
  const checks: DiagnosticCheck[] = [];

  const add = (
    area: string,
    title: string,
    status: CheckStatus,
    description: string,
    action?: string,
    meta?: Record<string, unknown>
  ) => {
    checks.push({ area, title, status, description, action, meta });
  };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    "";

  const envItems = [
    ["Ambiente", "URL pública do Supabase", "NEXT_PUBLIC_SUPABASE_URL", supabaseUrl, true],
    ["Ambiente", "Chave pública anon do Supabase", "NEXT_PUBLIC_SUPABASE_ANON_KEY", supabaseAnonKey, true],
    ["Ambiente", "Chave service role para diagnóstico admin", "SUPABASE_SERVICE_ROLE_KEY", supabaseServiceKey, true],
    ["Pagamentos", "Stripe configurado para planos pagos", "STRIPE_SECRET_KEY", process.env.STRIPE_SECRET_KEY || "", false],
    ["Mia/Agentes", "Chave interna do cérebro/Mia", "BRAIN_API_KEY", process.env.BRAIN_API_KEY || "", false],
  ] as const;

  for (const [area, title, env, value, required] of envItems) {
    const configured = hasValue(value);

    add(
      area,
      title,
      configured ? "ok" : required ? "critical" : "warn",
      configured ? "Configurado sem expor o valor da chave." : "Ainda não configurado.",
      configured ? undefined : `Adicionar ${env} no .env.local.`,
      { env, configured }
    );
  }

  const fileChecks = [
    ["Arquivos do sistema", "Página atual de diagnóstico", "app/studio/usuarios-diagnostico/page.tsx", true],
    ["Arquivos do sistema", "API atual de diagnóstico", "app/api/studio/usuarios-diagnostico/route.ts", true],
    ["Acessos da plataforma", "API do usuário logado", "app/api/platform/me/route.ts", true],
    ["Acessos da plataforma", "Área de autenticação", "app/auth", true],
    ["Acessos da plataforma", "Área do chat/Mia", "app/chat", false],
    ["Studio", "Área Studio", "app/studio", true],
    ["Segurança", "Middleware de sessão", "middleware.ts", false],
    ["Pagamentos", "API checkout Stripe", "app/api/stripe/checkout/route.ts", false],
    ["Pagamentos", "Webhook Stripe", "app/api/stripe/webhook/route.ts", false],
  ] as const;

  for (const [area, title, target, required] of fileChecks) {
    const found = await exists(target);

    add(
      area,
      title,
      found ? "ok" : required ? "critical" : "warn",
      found ? `${title} encontrado.` : `${title} não encontrado.`,
      found ? undefined : `Verificar/criar ${target}.`,
      { path: target, found }
    );
  }

  const nginxSites = await listNginxSites();
  const hasSualumaNginx = nginxSites.some((site) =>
    site.toLowerCase().includes("sualuma")
  );
  const hasStudioNginx = nginxSites.some((site) =>
    site.toLowerCase().includes("studio")
  );

  add(
    "Subdomínios",
    "Configuração Nginx do domínio Sualuma",
    hasSualumaNginx ? "ok" : "warn",
    hasSualumaNginx
      ? "Configuração relacionada ao sualuma encontrada no Nginx."
      : "Não consegui confirmar configuração do sualuma em /etc/nginx/sites-enabled.",
    hasSualumaNginx ? undefined : "Verificar Nginx manualmente.",
    { nginxSites }
  );

  add(
    "Subdomínios",
    "Configuração Nginx do Studio",
    hasStudioNginx ? "ok" : "warn",
    hasStudioNginx
      ? "Configuração relacionada ao Studio encontrada no Nginx."
      : "Não consegui confirmar configuração específica do Studio no Nginx.",
    hasStudioNginx ? undefined : "Verificar se studio.sualuma.online aponta para o app correto.",
    { nginxSites }
  );

  const supabaseSummary: any = {
    connected: false,
    authUserCount: null,
    tables: {},
    plansReport: [],
    allPlansFound: [],
  };

  if (hasValue(supabaseUrl) && hasValue(supabaseServiceKey)) {
    const authUsers = await supabaseAuthUsers(supabaseUrl, supabaseServiceKey);

    supabaseSummary.connected = authUsers.ok;
    supabaseSummary.authUserCount = authUsers.total;

    add(
      "Supabase",
      "Conexão admin com Supabase Auth",
      authUsers.ok ? "ok" : "critical",
      authUsers.ok
        ? `Consegui consultar usuários do Auth. Total detectado: ${authUsers.total ?? "não informado"}.`
        : "Não consegui consultar usuários do Supabase Auth com a service role.",
      authUsers.ok ? undefined : "Verificar NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.",
      { status: authUsers.status, total: authUsers.total }
    );

    const requiredTables = [
      "profiles",
      "plans",
      "user_subscriptions",
      "plan_entitlements",
      "plan_agents",
    ];

    const optionalTables = ["user_service_areas", "user_access_overrides"];

    for (const table of [...requiredTables, ...optionalTables]) {
      const result = await supabaseRest(
        supabaseUrl,
        supabaseServiceKey,
        `${table}?select=*&limit=1`
      );

      const required = requiredTables.includes(table);

      supabaseSummary.tables[table] = {
        ok: result.ok,
        count: result.count,
        status: result.status,
      };

      add(
        "Supabase",
        `Tabela ${table}`,
        result.ok ? "ok" : required ? "critical" : "warn",
        result.ok
          ? `Tabela encontrada. Registros detectados: ${result.count ?? "não informado"}.`
          : `Tabela ${table} não foi confirmada.`,
        result.ok
          ? undefined
          : required
          ? `Criar ou revisar a tabela ${table} no Supabase.`
          : `Opcional: criar ${table} quando for usar essa função.`,
        { table, status: result.status, count: result.count }
      );
    }

    const plansResult = await supabaseRest(
      supabaseUrl,
      supabaseServiceKey,
      "plans?select=id,plan_key,slug,name,price_cents,currency,active,description&limit=500"
    );

    const entitlementsResult = await supabaseRest(
      supabaseUrl,
      supabaseServiceKey,
      "plan_entitlements?select=plan_id,key,value&limit=2000"
    );

    const agentsResult = await supabaseRest(
      supabaseUrl,
      supabaseServiceKey,
      "plan_agents?select=plan_id,agent_key,agent_name,active&limit=2000"
    );

    const plans = Array.isArray(plansResult.data) ? plansResult.data : [];
    const entitlements = Array.isArray(entitlementsResult.data)
      ? entitlementsResult.data
      : [];
    const agents = Array.isArray(agentsResult.data) ? agentsResult.data : [];

    const readProjectFile = async (relativePath: string) => {
      try {
        return await fs.readFile(`${process.cwd()}/${relativePath}`, "utf8");
      } catch {
        return "";
      }
    };

    const checkoutSources = [
      await readProjectFile("app/api/stripe/checkout/route.ts"),
      await readProjectFile("app/api/stripe/checkout-price/route.ts"),
      await readProjectFile("app/api/stripe/checkout-service-plan/route.ts"),
      await readProjectFile("app/api/flowmind/checkout/route.ts"),
    ].join("\n");

    const webhookSource = await readProjectFile("app/api/stripe/webhook/route.ts");
    const platformMeSource = await readProjectFile("app/api/platform/me/route.ts");
    const middlewareSource = await readProjectFile("middleware.ts");
    const clientDashboardSource = [
      await readProjectFile("app/member-user/page.tsx"),
      await readProjectFile("app/provider-services/page.tsx"),
      await readProjectFile("app/member-services/page.tsx"),
      await readProjectFile("app/cliente/indique/page.tsx"),
    ].join("\n");

    const accessFlowChecks = [
      {
        title: "Checkout vincula compra ao plano",
        ok:
          /stripe/i.test(checkoutSources) &&
          /(plan_key|planKey|metadata|price_id|priceId|checkout)/i.test(checkoutSources),
        okDescription:
          "O checkout parece enviar referência do plano/produto para o Stripe.",
        warnDescription:
          "Ainda não confirmei no código se o checkout envia plan_key, metadata ou price_id suficiente para identificar o plano comprado.",
        action:
          "Garantir que o checkout envie plan_key/metadata para o Stripe em cada compra.",
      },
      {
        title: "Webhook grava assinatura/acesso do usuário",
        ok:
          /user_subscriptions/i.test(webhookSource) &&
          /(insert|upsert|update)/i.test(webhookSource) &&
          /(plan_key|plan_id|metadata|subscription)/i.test(webhookSource),
        okDescription:
          "O webhook parece gravar assinatura/acesso em user_subscriptions.",
        warnDescription:
          "Ainda não confirmei que o webhook do Stripe grava user_subscriptions com o plano comprado.",
        action:
          "No webhook Stripe, após pagamento confirmado, gravar user_id, plan_id/plan_key e status em user_subscriptions.",
      },
      {
        title: "/api/platform/me devolve plano e permissões reais",
        ok:
          /user_subscriptions/i.test(platformMeSource) &&
          /plan_entitlements/i.test(platformMeSource) &&
          /plan_agents/i.test(platformMeSource),
        okDescription:
          "/api/platform/me parece ler assinatura, permissões e agentes do Supabase.",
        warnDescription:
          "/api/platform/me ainda não parece devolver assinatura + permissões + agentes reais do plano.",
        action:
          "Atualizar /api/platform/me para buscar user_subscriptions, plan_entitlements e plan_agents.",
      },
      {
        title: "Studio/Admin protegido contra usuário comum",
        ok:
          /(studio|admin)/i.test(middlewareSource) &&
          /(auth|session|token|role)/i.test(middlewareSource),
        okDescription:
          "O middleware parece proteger áreas administrativas.",
        warnDescription:
          "Ainda não confirmei proteção real de Studio/Admin contra usuário comum.",
        action:
          "Garantir no middleware ou nas páginas que /studio e /admin exigem role admin.",
      },
      {
        title: "Telas usam permissões para liberar/bloquear recursos",
        ok:
          /(entitlements|permissions|plan_agents|user_subscriptions|platform\/me)/i.test(clientDashboardSource),
        okDescription:
          "As telas principais parecem consultar plano/permissões para montar a experiência.",
        warnDescription:
          "Ainda não confirmei que dashboards do cliente/prestador bloqueiam recursos pelo plano real.",
        action:
          "Fazer dashboards consultarem /api/platform/me e esconder/bloquear recursos não permitidos.",
      },
    ];

    const accessFlowBlockers = accessFlowChecks
      .filter((item) => !item.ok)
      .map((item) => item.title);

    for (const item of accessFlowChecks) {
      add(
        "Fluxo de liberação",
        item.title,
        item.ok ? "ok" : "warn",
        item.ok ? item.okDescription : item.warnDescription,
        item.ok ? undefined : item.action,
        { sourceLevelCheck: true }
      );
    }


    supabaseSummary.allPlansFound = plans.map((plan: any) => ({
      id: plan.id,
      name: plan.name,
      price_cents: plan.price_cents,
      active: plan.active,
    }));

    add(
      "Planos",
      "Leitura geral dos planos no Supabase",
      plansResult.ok ? "ok" : "critical",
      plansResult.ok
        ? `Foram encontrados ${plans.length} plano(s) cadastrados na tabela plans.`
        : "Não consegui ler a tabela plans.",
      plansResult.ok ? undefined : "Revisar tabela plans e permissões do Supabase.",
      { count: plans.length }
    );

    for (const expected of EXPECTED_PLANS) {
      const matchedPlan = findMatchingPlan(expected, plans);
      const matchedPlanId = matchedPlan?.id;
      const matchedPlanKey = matchedPlan?.plan_key || expected.id;

      const acceptedPlanRefs = [
        matchedPlanId,
        matchedPlanKey,
        expected.id,
      ].filter(Boolean);

      const planEntitlements = matchedPlan
        ? entitlements.filter((item: any) => acceptedPlanRefs.includes(item.plan_id))
        : [];

      const planAgents = matchedPlan
        ? agents.filter((item: any) => acceptedPlanRefs.includes(item.plan_id))
        : [];

      const entitlementKeys = planEntitlements.map((item: any) => item.key);
      const agentKeys = planAgents.map((item: any) => item.agent_key);

      const missingEntitlements = expected.expected_entitlements.filter(
        (key) => !entitlementKeys.includes(key)
      );

      const missingAgents = expected.expected_agents.filter(
        (key) => !agentKeys.includes(key)
      );

      const priceOk =
        matchedPlan &&
        Number(matchedPlan.price_cents || 0) === expected.price_cents;

      const activeOk = matchedPlan ? matchedPlan.active !== false : false;

      const catalogStatus: CheckStatus = !matchedPlan
        ? "critical"
        : !priceOk ||
          !activeOk ||
          missingEntitlements.length > 0 ||
          missingAgents.length > 0
        ? "warn"
        : "ok";

      const accessFlowReady = accessFlowBlockers.length === 0;

      const status: CheckStatus =
        catalogStatus === "critical"
          ? "critical"
          : accessFlowReady
          ? catalogStatus
          : "warn";

      const report = {
        expected,
        found: Boolean(matchedPlan),
        matchedPlan: matchedPlan || null,
        priceOk: Boolean(priceOk),
        activeOk: Boolean(activeOk),
        entitlements: planEntitlements,
        agents: planAgents,
        missingEntitlements,
        missingAgents,
        catalogStatus,
        accessFlowReady,
        accessFlowBlockers,
        status,
      };

      supabaseSummary.plansReport.push(report);

      add(
        expected.area,
        `Plano ${expected.label}`,
        status,
        matchedPlan
          ? `Encontrado como "${matchedPlan.name || matchedPlan.id}". Preço detectado: ${money(
              Number(matchedPlan.price_cents || 0)
            )}. Esperado: ${money(expected.price_cents)}${
              expected.billing === "monthly"
                ? "/mês"
                : expected.billing === "one_time"
                ? " pagamento único"
                : ""
            }.`
          : `Plano ${expected.label} ainda não foi encontrado na tabela plans.`,
        matchedPlan
          ? status === "ok"
            ? undefined
            : "Revisar preço, status ativo, permissões ou agentes deste plano."
          : `Criar o plano com id sugerido "${expected.id}" ou algum alias reconhecido.`,
        {
          expectedId: expected.id,
          aliases: expected.aliases,
          matchedPlanId,
          priceOk,
          activeOk,
          missingEntitlements,
          missingAgents,
        }
      );

      if (matchedPlan) {
        add(
          expected.area,
          `Permissões do plano ${expected.label}`,
          missingEntitlements.length === 0 ? "ok" : "warn",
          missingEntitlements.length === 0
            ? `Todas as permissões esperadas do plano ${expected.label} foram encontradas.`
            : `Faltam ${missingEntitlements.length} permissão(ões): ${missingEntitlements.join(", ")}.`,
          missingEntitlements.length === 0
            ? undefined
            : `Adicionar permissões em plan_entitlements para plan_id "${matchedPlanId}".`,
          { found: entitlementKeys, missing: missingEntitlements }
        );

        if (expected.expected_agents.length > 0) {
          add(
            expected.area,
            `Agentes do plano ${expected.label}`,
            missingAgents.length === 0 ? "ok" : "warn",
            missingAgents.length === 0
              ? `Todos os agentes esperados do plano ${expected.label} foram encontrados.`
              : `Faltam agentes: ${missingAgents.join(", ")}.`,
            missingAgents.length === 0
              ? undefined
              : `Adicionar agentes em plan_agents para plan_id "${matchedPlanId}".`,
            { found: agentKeys, missing: missingAgents }
          );
        }
      }
    }


    const flowmaticFeatureChecks = [
      {
        title: "Painel Hoje",
        plans: ["flowmatic_start", "flowmatic_rotina_pro", "flowmatic_solo_ceo", "flowmatic_imperio_solo"],
        keys: ["painel_hoje", "daily_panel", "today_panel"],
      },
      {
        title: "Dona — Gerente do Dia",
        plans: ["flowmatic_start", "flowmatic_rotina_pro", "flowmatic_solo_ceo", "flowmatic_imperio_solo"],
        keys: ["dona_limited_access", "dona_full_agent", "agent_dona", "dona_agent"],
      },
      {
        title: "Vera — Estrategista",
        plans: ["flowmatic_solo_ceo", "flowmatic_imperio_solo"],
        keys: ["vera_annual_plan_agent", "agent_vera", "vera_agent"],
      },
      {
        title: "Rica — Vendas",
        plans: ["flowmatic_solo_ceo", "flowmatic_imperio_solo"],
        keys: ["rica_sales_agent", "agent_rica", "rica_agent"],
      },
      {
        title: "Calma — Produtividade leve",
        plans: ["flowmatic_rotina_pro", "flowmatic_solo_ceo", "flowmatic_imperio_solo"],
        keys: ["calma_agent", "agent_calma", "calma_productivity"],
      },
      {
        title: "Bússola — Relatório semanal",
        plans: ["flowmatic_rotina_pro", "flowmatic_solo_ceo", "flowmatic_imperio_solo"],
        keys: ["bussola_weekly_report", "agent_bussola", "weekly_report", "simple_weekly_report"],
      },
      {
        title: "Templates inclusos",
        plans: ["flowmatic_start", "flowmatic_rotina_pro", "flowmatic_solo_ceo", "flowmatic_imperio_solo"],
        keys: ["templates_included", "template_access", "template_organiza_minha_cabeca", "template_1_ano_12_semanas"],
      },
      {
        title: "Solo CEO como plano recomendado para MVP",
        plans: ["flowmatic_solo_ceo"],
        keys: ["mvp_recommended", "solo_ceo_recommended", "recommended_for_mvp"],
      },
    ];

    for (const feature of flowmaticFeatureChecks) {
      const matchingReports = supabaseSummary.plansReport.filter((report: any) =>
        feature.plans.includes(report.expected.id)
      );

      const foundKeys = matchingReports.flatMap((report: any) =>
        (report.entitlements || []).map((item: any) => item.key)
      );

      const foundAgents = matchingReports.flatMap((report: any) =>
        (report.agents || []).map((item: any) => item.agent_key)
      );

      const combined = [...foundKeys, ...foundAgents];
      const found = feature.keys.some((key) => combined.includes(key));

      add(
        "Flowmatic Comparativo",
        feature.title,
        found ? "ok" : "warn",
        found
          ? `O recurso "${feature.title}" foi encontrado em pelo menos um plano Flowmatic.`
          : `O recurso "${feature.title}" ainda não foi confirmado nos planos Flowmatic esperados.`,
        found
          ? undefined
          : `Adicionar uma permissão/agente equivalente em plan_entitlements ou plan_agents. Chaves aceitas: ${feature.keys.join(", ")}.`,
        {
          expectedPlans: feature.plans,
          acceptedKeys: feature.keys,
          foundKeys,
          foundAgents,
        }
      );
    }

    const activeSubscriptions = await supabaseRest(
      supabaseUrl,
      supabaseServiceKey,
      "user_subscriptions?select=id&status=eq.active&limit=1"
    );

    add(
      "Usuários",
      "Assinaturas ativas",
      activeSubscriptions.ok && Number(activeSubscriptions.count || 0) > 0
        ? "ok"
        : "warn",
      activeSubscriptions.ok
        ? `Assinaturas ativas detectadas: ${activeSubscriptions.count ?? "não informado"}.`
        : "Não consegui consultar assinaturas ativas.",
      activeSubscriptions.ok && Number(activeSubscriptions.count || 0) > 0
        ? undefined
        : "Quando usuários reais comprarem ou forem ativados, eles devem aparecer em user_subscriptions.",
      { count: activeSubscriptions.count, status: activeSubscriptions.status }
    );
  } else {
    add(
      "Supabase",
      "Diagnóstico real do banco",
      "critical",
      "Não foi possível consultar o Supabase porque faltam URL ou service role.",
      "Configurar NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local."
    );
  }

  const totals = checks.reduce(
    (acc, check) => {
      acc.total += 1;
      acc[check.status] += 1;
      return acc;
    },
    { total: 0, ok: 0, warn: 0, critical: 0 }
  );

  const score =
    totals.total === 0
      ? 0
      : Math.round(
          ((totals.ok * 100 + totals.warn * 45) / (totals.total * 100)) * 100
        );

  return NextResponse.json(
    {
      ok: true,
      updatedAt: new Date().toISOString(),
      score,
      totals,
      checks,
      supabase: supabaseSummary,
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
