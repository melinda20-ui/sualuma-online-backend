import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getLoginDestination } from "@/lib/auth/login-destination";

function loginErrorUrl(request: NextRequest, message: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", message || "Erro ao autenticar.");
  return url;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error =
    url.searchParams.get("error") ||
    url.searchParams.get("error_description");

  if (error) {
    return NextResponse.redirect(loginErrorUrl(request, error));
  }

  const supabase = await createClient();

  if (code) {
    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      return NextResponse.redirect(
        loginErrorUrl(request, exchangeError.message)
      );
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.redirect(
      loginErrorUrl(request, "Sessão não encontrada. Faça login novamente.")
    );
  }

  const destination = getLoginDestination(user.email);

  return NextResponse.redirect(new URL(destination, request.url));
}
