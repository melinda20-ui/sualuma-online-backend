import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

async function getSupabase() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase não configurado.");
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: any[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {}
      },
    },
  });
}

export async function GET() {
  try {
    const supabase = await getSupabase();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Você precisa estar logado." }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("chat_conversations")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "Erro ao buscar conversas.", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, conversations: data || [] });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Erro interno.", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await getSupabase();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Você precisa estar logado." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    const { data, error } = await supabase
      .from("chat_conversations")
      .insert({
        user_id: user.id,
        title: body.title || "Nova conversa",
        agent_slug: body.agent_slug || "mia",
        channel: body.channel || "main",
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Erro ao criar conversa.", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, conversation: data });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Erro interno.", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
