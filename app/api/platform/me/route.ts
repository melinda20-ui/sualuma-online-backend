import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cors(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function OPTIONS() {
  return cors({ ok: true });
}

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return cors(
      {
        ok: false,
        error: "Usuário não autenticado.",
      },
      401
    );
  }

  const meta = user.user_metadata || {};

  return cors({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      name:
        meta.full_name ||
        meta.name ||
        meta.nome ||
        user.email?.split("@")[0] ||
        "Usuário",
      avatarUrl:
        meta.avatar_url ||
        meta.picture ||
        meta.photo_url ||
        meta.foto_url ||
        meta.profile_photo_url ||
        "",
      metadata: meta,
    },
  });
}
