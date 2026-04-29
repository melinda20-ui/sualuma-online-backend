import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function getPublicBaseUrl() {
  return (
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://sualuma.online"
  ).replace(/\/$/, "");
}

function redirectTo(path: string) {
  const baseUrl = getPublicBaseUrl();

  if (!path.startsWith("/")) {
    path = `/${path}`;
  }

  return NextResponse.redirect(new URL(path, baseUrl));
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") || "email";
  const next = requestUrl.searchParams.get("next") || "/bem-vindo";

  if (!token_hash) {
    return redirectTo("/bem-vindo?erro=link-invalido");
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    });

    if (error) {
      console.error("[auth/confirm] verifyOtp error:", error.message);
      return redirectTo("/bem-vindo?erro=confirmacao");
    }

    return redirectTo(next);
  } catch (error) {
    console.error("[auth/confirm] erro inesperado:", error);
    return redirectTo("/bem-vindo?erro=inesperado");
  }
}
