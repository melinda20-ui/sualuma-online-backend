import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnyRecord = Record<string, any>;

function cors(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

export async function OPTIONS() {
  return cors({ ok: true });
}

function normalizeSupabaseUrl(url: string) {
  return url.replace(/\/+$/, "");
}

function hasValue(value?: string) {
  return typeof value === "string" && value.trim().length > 0;
}

function parseJsonValue(value: any) {
  if (value === null || value === undefined) return true;

  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value;
  if (typeof value === "object") return value;

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (trimmed === "true") return true;
    if (trimmed === "false") return false;

    const asNumber = Number(trimmed);
    if (!Number.isNaN(asNumber) && trimmed !== "") return asNumber;

    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }

  return value;
}

async function supabaseRest(endpoint: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    "";

  if (!hasValue(supabaseUrl) || !hasValue(serviceKey)) {
    return {
      ok: false,
      status: 500,
      data: null,
      error: "Supabase service role não configurada no servidor.",
    };
  }

  const url = `${normalizeSupabaseUrl(supabaseUrl)}/rest/v1/${endpoint.replace(
    /^\/+/,
    ""
  )}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
    });

    let data: any = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    return {
      ok: response.ok,
      status: response.status,
      data,
      error: response.ok ? null : data,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: error instanceof Error ? error.message : "Erro desconhecido.",
    };
  }
}

function buildEntitlements(rows: AnyRecord[]) {
  const result: AnyRecord = {};

  for (const row of rows || []) {
    if (!row?.key) continue;
    result[row.key] = parseJsonValue(row.value);
  }

  return result;
}

function uniqueRefs(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      values
        .filter(Boolean)
        .map((item) => String(item))
        .filter((item) => item.trim().length > 0)
    )
  );
}

function isActiveSubscription(row: AnyRecord) {
  const status = String(row?.status || "").toLowerCase();

  return [
    "active",
    "trialing",
    "paid",
    "paid_pending_activation",
    "active_manual",
  ].includes(status);
}

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return cors(
      {
        ok: false,
        authenticated: false,
        error: "Usuário não autenticado.",
      },
      401
    );
  }

  const meta = user.user_metadata || {};

  const publicUser = {
    id: user.id,
    email: user.email,
    name:
      meta.full_name ||
      meta.name ||
      meta.nome ||
      user.email?.split("@")[0] ||
      "Usuário",
    avatarUrl:
      meta.avatar_url ||
      meta.picture ||
      meta.photo_url ||
      meta.foto_url ||
      meta.profile_photo_url ||
      "",
    metadata: meta,
  };

  const subscriptionsResult = await supabaseRest(
    `user_subscriptions?select=*&user_id=eq.${encodeURIComponent(
      user.id
    )}&order=created_at.desc&limit=10`
  );

  const subscriptions = Array.isArray(subscriptionsResult.data)
    ? subscriptionsResult.data
    : [];

  const activeSubscription =
    subscriptions.find(isActiveSubscription) || subscriptions[0] || null;

  let plan: AnyRecord | null = null;
  let subscription: AnyRecord | null = activeSubscription
    ? {
        id: activeSubscription.id,
        user_id: activeSubscription.user_id,
        plan_id: activeSubscription.plan_id,
        status: activeSubscription.status,
        started_at: activeSubscription.started_at,
        expires_at: activeSubscription.expires_at,
        stripe_customer_id: activeSubscription.stripe_customer_id || null,
        stripe_subscription_id: activeSubscription.stripe_subscription_id || null,
      }
    : null;

  let entitlements: AnyRecord = {};
  let agents: AnyRecord[] = [];
  let accessWarnings: string[] = [];

  if (!subscriptionsResult.ok) {
    accessWarnings.push(
      "Não foi possível ler user_subscriptions. Verifique a tabela e a service role."
    );
  }

  if (activeSubscription?.plan_id) {
    const rawPlanRef = String(activeSubscription.plan_id);

    const plansResult = await supabaseRest(
      `plans?select=id,plan_key,slug,name,price_cents,currency,active,description&or=(id.eq.${encodeURIComponent(
        rawPlanRef
      )},plan_key.eq.${encodeURIComponent(
        rawPlanRef
      )},slug.eq.${encodeURIComponent(rawPlanRef)})&limit=1`
    );

    const plans = Array.isArray(plansResult.data) ? plansResult.data : [];
    plan = plans[0] || null;

    if (!plan) {
      accessWarnings.push(
        `Assinatura encontrada, mas o plano "${rawPlanRef}" não foi encontrado em plans.`
      );
    }

    const refs = uniqueRefs([
      rawPlanRef,
      plan?.id,
      plan?.plan_key,
      plan?.slug,
    ]);

    const planFilter = refs
      .map((ref) => `plan_id.eq.${encodeURIComponent(ref)}`)
      .join(",");

    if (planFilter) {
      const entitlementsResult = await supabaseRest(
        `plan_entitlements?select=plan_id,key,value&or=(${planFilter})`
      );

      const entitlementRows = Array.isArray(entitlementsResult.data)
        ? entitlementsResult.data
        : [];

      entitlements = buildEntitlements(entitlementRows);

      if (!entitlementsResult.ok) {
        accessWarnings.push(
          "Não foi possível ler plan_entitlements para este plano."
        );
      }

      const agentsResult = await supabaseRest(
        `plan_agents?select=plan_id,agent_key,agent_name,active&active=eq.true&or=(${planFilter})`
      );

      agents = Array.isArray(agentsResult.data)
        ? agentsResult.data.map((agent: AnyRecord) => ({
            key: agent.agent_key,
            name: agent.agent_name || agent.agent_key,
            active: agent.active !== false,
          }))
        : [];

      if (!agentsResult.ok) {
        accessWarnings.push("Não foi possível ler plan_agents para este plano.");
      }
    }
  }

  const access = {
    hasSubscription: Boolean(activeSubscription),
    planKey: plan?.plan_key || activeSubscription?.plan_id || null,
    planName: plan?.name || null,
    status: activeSubscription?.status || "no_subscription",
    canUseMia: Boolean(
      entitlements.mia_chat_access ||
        agents.some((agent) => agent.key === "mia")
    ),
    canAccessStudio: Boolean(entitlements.studio_access),
    canAccessAdmin: Boolean(entitlements.admin_access),
    canAccessBasicCourses: Boolean(entitlements.basic_courses_access),
    serviceAreaLimit:
      typeof entitlements.service_area_limit === "number"
        ? entitlements.service_area_limit
        : Number(entitlements.service_area_limit || 0),
    providerFullAccess: Boolean(entitlements.provider_full_access),
  };

  return cors({
    ok: true,
    authenticated: true,
    user: publicUser,
    subscription,
    plan: plan
      ? {
          id: plan.id,
          plan_key: plan.plan_key,
          slug: plan.slug,
          name: plan.name,
          price_cents: plan.price_cents,
          currency: plan.currency,
          active: plan.active,
          description: plan.description,
        }
      : null,
    entitlements,
    agents,
    access,
    diagnostics: {
      source: "supabase",
      subscriptionsFound: subscriptions.length,
      hasActiveSubscription: Boolean(activeSubscription),
      warnings: accessWarnings,
    },
  });
}
