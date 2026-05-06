import { createClient } from "@/lib/supabase/server";

export type PackageCode = "ia_client" | "services_client";

export type PackageAccessRow = {
  package_code: PackageCode;
  status: string;
  plan_name: string | null;
  plan_slug: string | null;
  current_period_end: string | null;
};

const ACTIVE_STATUSES = ["active", "trialing", "paid", "paid_pending_activation", "active_manual"];

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

function cleanKey(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

async function getSubscriptionPackages(supabase: any, userId: string): Promise<PackageAccessRow[]> {
  try {
    const { data: subscriptions } = await supabase
      .from("user_subscriptions")
      .select("id,plan_id,status,expires_at")
      .eq("user_id", userId)
      .in("status", ACTIVE_STATUSES)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!subscriptions?.length) return [];

    const planIds = Array.from(
      new Set(subscriptions.map((item: any) => item.plan_id).filter(Boolean))
    );

    if (!planIds.length) return [];

    const { data: plans } = await supabase
      .from("plans")
      .select("id,plan_key,slug,name")
      .in("id", planIds);

    const byId = new Map((plans || []).map((plan: any) => [plan.id, plan]));

    return subscriptions
      .map((sub: any) => {
        const plan: any = byId.get(sub.plan_id) || {};
        const key = cleanKey(plan.plan_key || plan.slug || plan.name);

        if (!CLIENT_PLAN_KEYS.has(key)) return null;

        return {
          package_code: "ia_client" as PackageCode,
          status: sub.status || "active",
          plan_name: plan.name || null,
          plan_slug: plan.slug || plan.plan_key || key,
          current_period_end: sub.expires_at || null,
        };
      })
      .filter(Boolean) as PackageAccessRow[];
  } catch {
    return [];
  }
}

export async function getCurrentUserPackageAccess() {
  const supabase: any = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      user: null,
      email: null,
      packages: [] as PackageAccessRow[],
      hasIaClient: false,
      hasServicesClient: false,
      hasCompleteAccess: false,
      error: userError?.message || "Usuário não autenticado.",
    };
  }

  const { data } = await supabase
    .from("user_package_access")
    .select("package_code,status,plan_name,plan_slug,current_period_end")
    .eq("user_id", user.id)
    .in("status", ACTIVE_STATUSES);

  const packageRows = ((data || []) as PackageAccessRow[]).filter((item) =>
    ACTIVE_STATUSES.includes(item.status)
  );

  const subscriptionPackages = await getSubscriptionPackages(supabase, user.id);

  const packages = [...packageRows, ...subscriptionPackages];

  const hasIaClient = packages.some(
    (item) => item.package_code === "ia_client" && ACTIVE_STATUSES.includes(item.status)
  );

  const hasServicesClient = packages.some(
    (item) => item.package_code === "services_client" && ACTIVE_STATUSES.includes(item.status)
  );

  return {
    user,
    email: user.email || null,
    packages,
    hasIaClient,
    hasServicesClient,
    hasCompleteAccess: hasIaClient && hasServicesClient,
    error: null,
  };
}
