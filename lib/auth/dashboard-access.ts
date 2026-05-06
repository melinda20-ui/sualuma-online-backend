import { createClient } from "@/lib/supabase/server";

const ADMIN_EMAILS = new Set([
  "lumabusiness1.0@gmail.com",
  "milakadosh.ceo@sualuma.online",
  "adm@sualuma.online",
]);

const ACTIVE_STATUSES = [
  "active",
  "trialing",
  "paid",
  "paid_pending_activation",
  "active_manual",
];

const CLIENT_PLAN_KEYS = new Set([
  "basic",
  "basico",
  "prime",
  "premium",
  "pro",
  "ia_pro",
  "basic_trial",
  "trial_30_days",
]);

export type DashboardAccess = {
  authenticated: boolean;
  email: string | null;
  isAdmin: boolean;
  hasIa: boolean;
  hasProvider: boolean;
  isCommonClient: boolean;
  planKeys: string[];
  target:
    | "login"
    | "admin"
    | "client_services"
    | "client_ia"
    | "provider"
    | "choice";
};

function cleanKey(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalize(value: unknown) {
  try {
    return JSON.stringify(value || {}).toLowerCase();
  } catch {
    return "";
  }
}

function hasAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word.toLowerCase()));
}

async function getActivePlanKeys(supabase: any, userId: string): Promise<string[]> {
  try {
    const { data: subscriptions, error } = await supabase
      .from("user_subscriptions")
      .select("id,plan_id,status")
      .eq("user_id", userId)
      .in("status", ACTIVE_STATUSES)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error || !subscriptions?.length) return [];

    const planIds = Array.from(
      new Set(
        subscriptions
          .map((item: any) => item.plan_id)
          .filter(Boolean)
      )
    );

    if (!planIds.length) return [];

    const { data: plans } = await supabase
      .from("plans")
      .select("id,plan_key,slug,name")
      .in("id", planIds);

    return Array.from(
      new Set(
        (plans || [])
          .flatMap((plan: any) => [
            cleanKey(plan.plan_key),
            cleanKey(plan.slug),
            cleanKey(plan.name),
          ])
          .filter(Boolean)
      )
    );
  } catch (error) {
    console.warn("[dashboard-access] Falha ao ler planos ativos:", error);
    return [];
  }
}

export async function getDashboardAccess(): Promise<DashboardAccess> {
  let user: any = null;
  let supabase: any = null;

  try {
    supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data?.user || null;
  } catch (error) {
    console.warn("[dashboard-access] Falha segura ao ler usuário:", error);
    user = null;
  }

  const email = String(user?.email || "").toLowerCase();

  if (!email) {
    return {
      authenticated: false,
      email: null,
      isAdmin: false,
      hasIa: false,
      hasProvider: false,
      isCommonClient: false,
      planKeys: [],
      target: "login",
    };
  }

  const isAdmin = ADMIN_EMAILS.has(email);
  const planKeys = supabase ? await getActivePlanKeys(supabase, user.id) : [];

  const metadataText = normalize({
    email,
    user_metadata: user?.user_metadata,
    app_metadata: user?.app_metadata,
    planKeys,
  });

  const hasIa =
    isAdmin ||
    planKeys.some((key) => CLIENT_PLAN_KEYS.has(String(key))) ||
    hasAny(metadataText, [
      "ia_client",
      "ai_client",
      "cliente_ia",
      "cliente ia",
      "plano_ia",
      "ia_plan",
      "ai_plan",
      "member-user",
      "premium",
      "pro",
      "prime",
      "basic",
      "básico",
      "basico",
    ]);

  const hasProvider = true;

  let target: DashboardAccess["target"] = "choice";

  if (isAdmin) target = "admin";
  else if (hasIa && hasProvider) target = "choice";
  else if (hasProvider) target = "provider";
  else target = "client_services";

  return {
    authenticated: true,
    email,
    isAdmin,
    hasIa,
    hasProvider,
    isCommonClient: !hasIa,
    planKeys,
    target,
  };
}

export function getDashboardUrl(target: DashboardAccess["target"]) {
  const studioUrl = process.env.SUALUMA_STUDIO_URL || "https://studio.sualuma.online";
  const clientUrl = process.env.SUALUMA_CLIENT_DASHBOARD_URL || "https://dashboardcliente.sualuma.online";
  const providerUrl = process.env.SUALUMA_PROVIDER_DASHBOARD_URL || "https://meuservico.sualuma.online";

  if (target === "admin") return studioUrl;
  if (target === "client_ia") return `${clientUrl}/member-user`;
  if (target === "client_services") return `${clientUrl}/member-services`;
  if (target === "provider") return `${providerUrl}/provider-services`;
  if (target === "choice") return "/portal";

  return "/login";
}
