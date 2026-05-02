import { createClient } from "@/lib/supabase/server";

export type PackageCode = "ia_client" | "services_client";

export type PackageAccessRow = {
  package_code: PackageCode;
  status: string;
  plan_name: string | null;
  plan_slug: string | null;
  current_period_end: string | null;
};

const ACTIVE_STATUSES = ["active", "trialing"];

export async function getCurrentUserPackageAccess() {
  const supabase = await createClient();

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

  const { data, error } = await supabase
    .from("user_package_access")
    .select("package_code,status,plan_name,plan_slug,current_period_end")
    .eq("user_id", user.id)
    .in("status", ACTIVE_STATUSES);

  if (error) {
    return {
      user,
      email: user.email || null,
      packages: [] as PackageAccessRow[],
      hasIaClient: false,
      hasServicesClient: false,
      hasCompleteAccess: false,
      error: error.message,
    };
  }

  const packages = (data || []) as PackageAccessRow[];

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
