import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function json(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const access_token = body?.access_token;
    const refresh_token = body?.refresh_token;

    if (!access_token || !refresh_token) {
      return json(
        {
          ok: false,
          authenticated: false,
          error: "Tokens de sessão ausentes.",
        },
        400
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    if (error) {
      return json(
        {
          ok: false,
          authenticated: false,
          error: error.message,
        },
        401
      );
    }

    return json({
      ok: true,
      authenticated: !!data.user,
      id: data.user?.id ?? null,
      email: data.user?.email ?? null,
    });
  } catch (error: any) {
    return json(
      {
        ok: false,
        authenticated: false,
        error: error?.message ?? "Erro interno ao sincronizar sessão.",
      },
      500
    );
  }
}
