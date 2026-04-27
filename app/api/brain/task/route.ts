import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Supabase não configurado no .env do microSaaS" },
        { status: 500 }
      );
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Em alguns contextos o Next não permite setar cookies aqui.
          }
        },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Você precisa estar logado para criar tarefas no Brain." },
        { status: 401 }
      );
    }

    const body = await req.json();

    const description = body.description || body.prompt || "";
    const type = body.type || "content";
    const schedule = body.schedule || "now";

    if (!description.trim()) {
      return NextResponse.json(
        { error: "Descreva a tarefa que o Brain deve executar." },
        { status: 400 }
      );
    }

    const brainUrl = process.env.BRAIN_INTERNAL_URL || "http://127.0.0.1:3011";
    const brainKey = process.env.BRAIN_API_KEY;

    if (!brainKey) {
      return NextResponse.json(
        { error: "BRAIN_API_KEY não configurada no microSaaS." },
        { status: 500 }
      );
    }

    const brainResponse = await fetch(`${brainUrl}/api/task`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-brain-key": brainKey,
      },
      body: JSON.stringify({
        type,
        description,
        schedule,
        user_id: user.id,
      }),
    });

    const data = await brainResponse.json();

    if (!brainResponse.ok) {
      return NextResponse.json(data, { status: brainResponse.status });
    }

    return NextResponse.json({
      ok: true,
      message: "Tarefa enviada para o SuaLuma Brain.",
      task: data.task,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Erro ao enviar tarefa para o Brain.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
