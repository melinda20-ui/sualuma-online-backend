"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function cleanRedirect(value: FormDataEntryValue | null, fallback: string) {
  const raw = String(value || "").trim();

  if (!raw) return fallback;

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }

  if (raw.startsWith("/")) {
    return raw;
  }

  return fallback;
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const fullName = String(formData.get("full_name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const role = String(formData.get("role") || "client").trim() === "provider" ? "provider" : "client";
  const redirectTo = cleanRedirect(formData.get("redirect_to"), role === "provider" ? "/provider-services" : "/member-user");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sualuma.online";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role,
      },
      emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
    },
  });

  if (error) {
    redirect(`/sign-up?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(redirectTo)}&role=${role}`);
  }

  if (data.session) {
    redirect(redirectTo);
  }

  redirect(`/sign-up?success=check-email&next=${encodeURIComponent(redirectTo)}&role=${role}`);
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const role = String(formData.get("role") || "client").trim() === "provider" ? "provider" : "client";
  const redirectTo = cleanRedirect(formData.get("redirect_to"), role === "provider" ? "/provider-services" : "/member-user");

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/sign-in?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(redirectTo)}&role=${role}`);
  }

  redirect(redirectTo);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  redirect("/sign-in");
}
