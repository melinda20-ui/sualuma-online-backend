import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const host = request.headers.get("host") || "host-desconhecido";

  const cookieDomain =
    process.env.NEXT_PUBLIC_SUPABASE_COOKIE_DOMAIN ||
    process.env.SUPABASE_COOKIE_DOMAIN ||
    ".sualuma.online";

  const response = NextResponse.json({
    ok: true,
    host,
    cookieDomain,
    message:
      "Cookie global de teste criado. Se o Domain estiver .sualuma.online, ele serve para todos os subdomínios.",
  });

  response.cookies.set("sualuma_global_cookie_test", `ok-${Date.now()}`, {
    domain: cookieDomain,
    path: "/",
    sameSite: "lax",
    secure: true,
    httpOnly: false,
    maxAge: 60 * 60,
  });

  return response;
}
