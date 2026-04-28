import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

function sharedCookieOptions(options: any = {}) {
  const domain = process.env.SUALUMA_COOKIE_DOMAIN || ".sualuma.online";

  return {
    ...options,
    path: "/",
    sameSite: "lax" as const,
    domain,
  };
}

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, sharedCookieOptions(options));
            });
          } catch {
            // Normal em Server Components.
          }
        },
      },
    }
  );
}
