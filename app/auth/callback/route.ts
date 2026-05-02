import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getLoginDestination } from "@/lib/auth/login-destination";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as any;

  try {
    const supabase = await createClient();

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent("Não consegui confirmar seu login. Tente entrar novamente.")}`, request.url)
        );
      }
    }

    if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type,
      });

      if (error) {
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent("Link expirado ou inválido. Tente entrar novamente.")}`, request.url)
        );
      }
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const destination = getLoginDestination(user?.email);

    return NextResponse.redirect(new URL(destination, request.url));
  } catch (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent("Erro ao autenticar. Tente novamente.")}`, request.url)
    );
  }
}
