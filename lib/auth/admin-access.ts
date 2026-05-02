import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const ADMIN_EMAILS = new Set([
  "lumabusiness1.0@gmail.com",
  "milakadosh.ceo@sualuma.online",
  "adm@sualuma.online",
]);

export type CurrentAdminAccess = {
  ok: boolean;
  isAdmin: boolean;
  allowed: boolean;
  email: string | null;
  user: any | null;
  reason?: string;
};

export function isAdminEmail(email?: string | null) {
  return Boolean(email && ADMIN_EMAILS.has(email.toLowerCase()));
}

export async function getCurrentAdminAccess(): Promise<CurrentAdminAccess> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.getUser();

    const user = data?.user || null;
    const email = user?.email?.toLowerCase() || null;

    if (error || !user) {
      return {
        ok: false,
        isAdmin: false,
        allowed: false,
        email,
        user: null,
        reason: error?.message || "not_authenticated",
      };
    }

    const allowed = isAdminEmail(email);

    return {
      ok: allowed,
      isAdmin: allowed,
      allowed,
      email,
      user,
      reason: allowed ? "admin_allowed" : "not_admin",
    };
  } catch (error: any) {
    return {
      ok: false,
      isAdmin: false,
      allowed: false,
      email: null,
      user: null,
      reason: error?.message || "admin_access_error",
    };
  }
}

export async function getCurrentAdmin() {
  return getCurrentAdminAccess();
}

export async function requireAdminAccess(next = "/studio") {
  const access = await getCurrentAdminAccess();

  if (!access.ok) {
    redirect(`/login?next=${encodeURIComponent(next)}&role=admin`);
  }

  return access;
}

export async function requireAdmin(next = "/studio") {
  return requireAdminAccess(next);
}
