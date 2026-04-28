import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const FALLBACK_URL = "https://dashboardcliente.sualuma.online";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || FALLBACK_URL;

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(next);
}
