import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function safeNext(value: string | null) {
  const fallback = "/portal";
  const next = String(value || fallback).trim();

  if (!next.startsWith("/") || next.startsWith("//")) {
    return fallback;
  }

  return next;
}

const SITE_URL = "https://sualuma.online";

function redirectTo(_request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, SITE_URL));
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = (searchParams.get("type") || "email") as any;
  const next = safeNext(searchParams.get("next"));

  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (error) {
    console.error("[auth/callback] erro do Supabase:", error, errorDescription);
    return redirectTo(
      request,
      `/login?erro=${encodeURIComponent(errorDescription || error)}`
    );
  }

  try {
    const supabase = await createClient();

    if (code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error("[auth/callback] exchangeCodeForSession:", exchangeError.message);
        return redirectTo(
          request,
          `/login?erro=${encodeURIComponent("Não foi possível confirmar sua sessão. Tente fazer login novamente.")}`
        );
      }

      return redirectTo(request, next);
    }

    if (tokenHash) {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type,
      });

      if (verifyError) {
        console.error("[auth/callback] verifyOtp:", verifyError.message);
        return redirectTo(
          request,
          `/login?erro=${encodeURIComponent("Não foi possível confirmar seu e-mail. Peça um novo link e tente novamente.")}`
        );
      }

      return redirectTo(request, next);
    }

    return redirectTo(
      request,
      `/login?erro=${encodeURIComponent("Link de confirmação inválido ou expirado.")}`
    );
  } catch (err: any) {
    console.error("[auth/callback] erro inesperado:", err?.message || err);
    return redirectTo(
      request,
      `/login?erro=${encodeURIComponent("Erro inesperado ao confirmar acesso.")}`
    );
  }
}
