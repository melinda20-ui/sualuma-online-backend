import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL ou ANON KEY não configurados.");
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: getCookieOptions(),
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, {
              ...options,
              ...getCookieOptions(),
            });
          });
        } catch {
          // Em Server Components o Next pode bloquear escrita de cookie.
          // O middleware/proxy faz a renovação da sessão quando necessário.
        }
      },
    },
  });
}
