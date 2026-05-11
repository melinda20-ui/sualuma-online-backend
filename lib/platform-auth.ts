import { createClient } from "@/lib/supabase/server";

export async function requireTenant() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  const tenantId =
    user.user_metadata?.tenant_id;

  if (!tenantId) {
    throw new Error("Tenant missing");
  }

  return {
    user,
    tenantId,
    role: user.user_metadata?.role || "user",
    plan: user.user_metadata?.plan || "free",
  };
}

