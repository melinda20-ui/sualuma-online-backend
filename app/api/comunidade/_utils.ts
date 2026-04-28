import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export function json(payload: any, status = 200) {
  return NextResponse.json(payload, { status, headers: corsHeaders() });
}

export function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

export function getBearerToken(request: Request) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  return token || "";
}

export async function requireUser(request: Request) {
  const token = getBearerToken(request);

  if (!token) {
    return { user: null, error: "Faça login para continuar." };
  }

  const supabase = adminSupabase();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return { user: null, error: "Sessão inválida ou expirada. Faça login novamente." };
  }

  return { user: data.user, error: null };
}

export function userName(user: any) {
  const meta = user?.user_metadata || {};
  return (
    meta.full_name ||
    meta.name ||
    meta.nome ||
    user?.email?.split("@")?.[0] ||
    "Usuário"
  );
}

export function userAvatar(user: any) {
  const meta = user?.user_metadata || {};
  return meta.avatar_url || meta.picture || meta.photo || "";
}
