import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function getPublicBaseUrl() {
  return (
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://sualuma.online"
  ).replace(/\/$/, "");
}

function safeRedirectUrl(path: string) {
  const baseUrl = getPublicBaseUrl();

  if (!path || path === "null" || path === "undefined") {
    return new URL("/bem-vindo", baseUrl);
  }

  if (path.startsWith("http")) {
    try {
      const url = new URL(path);
      const allowedHosts = [
        "sualuma.online",
        "www.sualuma.online",
        "app.sualuma.online",
        "chat.sualuma.online",
        "blog.sualuma.online",
        "studio.sualuma.online",
      ];

      if (allowedHosts.includes(url.hostname)) {
        return url;
      }
    } catch {}
  }

  if (!path.startsWith("/")) {
    path = `/${path}`;
  }

  return new URL(path, baseUrl);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  const code = requestUrl.searchParams.get("code");
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const next = requestUrl.searchParams.get("next") || "/bem-vindo";

  const successRedirect = safeRedirectUrl(next);
  const errorRedirect = safeRedirectUrl("/login?erro=confirmacao");

  try {
    const supabase = await createClient();

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        return NextResponse.redirect(successRedirect);
      }

      console.error("[auth/callback] exchangeCodeForSession error:", error.message);
      return NextResponse.redirect(errorRedirect);
    }

    if (token_hash && type) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as any,
      });

      if (!error) {
        return NextResponse.redirect(successRedirect);
      }

      console.error("[auth/callback] verifyOtp error:", error.message);
      return NextResponse.redirect(errorRedirect);
    }

    return NextResponse.redirect(errorRedirect);
  } catch (error) {
    console.error("[auth/callback] erro inesperado:", error);
    return NextResponse.redirect(errorRedirect);
  }
}
