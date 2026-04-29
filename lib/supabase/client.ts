import { createBrowserClient } from "@supabase/ssr";

function getCookieOptions() {
  const domain = process.env.NEXT_PUBLIC_SUPABASE_COOKIE_DOMAIN;

  const options: any = {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  };

  if (domain) {
    options.domain = domain;
  }

  return options;
}

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL ou ANON KEY não configurados.");
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: getCookieOptions(),
  });
}
