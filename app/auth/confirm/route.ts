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

function redirectTo(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, request.url));
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const tokenHash = searchParams.get("token_hash");
  const token = searchParams.get("token");
  const type = (searchParams.get("type") || "email") as any;
  const next = safeNext(searchParams.get("next"));

  if (!tokenHash && !token) {
    return redirectTo(
      request,
      `/login?erro=${encodeURIComponent("Link de confirmação inválido ou incompleto.")}`
    );
  }

  try {
    const supabase = await createClient();

    const payload = tokenHash
      ? { token_hash: tokenHash, type }
      : { token, type };

    const { error } = await supabase.auth.verifyOtp(payload as any);

    if (error) {
      console.error("[auth/confirm] verifyOtp:", error.message);
      return redirectTo(
        request,
        `/login?erro=${encodeURIComponent("Não foi possível confirmar seu e-mail. Peça um novo link e tente novamente.")}`
      );
    }

    return redirectTo(request, next);
  } catch (err: any) {
    console.error("[auth/confirm] erro inesperado:", err?.message || err);
    return redirectTo(
      request,
      `/login?erro=${encodeURIComponent("Erro inesperado ao confirmar e-mail.")}`
    );
  }
}
