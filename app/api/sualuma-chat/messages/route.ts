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

export async function GET(req: Request) {
  try {
    const supabase = await getSupabase();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Você precisa estar logado." }, { status: 401 });
    }

    const url = new URL(req.url);
    const conversationId = url.searchParams.get("conversation_id");

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversation_id é obrigatório." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("user_id", user.id)
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: "Erro ao buscar mensagens.", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, messages: data || [] });
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

    const body = await req.json();

    const content = String(body.content || "").trim();
    let conversationId = body.conversation_id || null;
    const agentSlug = body.agent_slug || "mia";
    const channel = body.channel || "main";

    if (!content) {
      return NextResponse.json(
        { error: "A mensagem não pode estar vazia." },
        { status: 400 }
      );
    }

    let conversation: any = null;

    if (!conversationId) {
      const title = content.length > 42 ? content.slice(0, 42).trim() + "..." : content;

      const { data: newConversation, error: convError } = await supabase
        .from("chat_conversations")
        .insert({
          user_id: user.id,
          title,
          agent_slug: agentSlug,
          channel,
        })
        .select("*")
        .single();

      if (convError) {
        return NextResponse.json(
          { error: "Erro ao criar conversa.", details: convError.message },
          { status: 500 }
        );
      }

      conversation = newConversation;
      conversationId = newConversation.id;
    } else {
      const { data: foundConversation, error: findError } = await supabase
        .from("chat_conversations")
        .select("*")
        .eq("id", conversationId)
        .eq("user_id", user.id)
        .single();

      if (findError || !foundConversation) {
        return NextResponse.json({ error: "Conversa não encontrada." }, { status: 404 });
      }

      conversation = foundConversation;
    }

    const { data: userMessage, error: userMessageError } = await supabase
      .from("chat_messages")
      .insert({
        conversation_id: conversationId,
        user_id: user.id,
        role: "user",
        content,
        metadata: {},
      })
      .select("*")
      .single();

    if (userMessageError) {
      return NextResponse.json(
        { error: "Erro ao salvar mensagem.", details: userMessageError.message },
        { status: 500 }
      );
    }

    const { data: recentMessages } = await supabase
      .from("chat_messages")
      .select("role, content, created_at")
      .eq("user_id", user.id)
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(20);

    const brainUrl = process.env.BRAIN_INTERNAL_URL || "http://127.0.0.1:3011";
    const brainKey = process.env.BRAIN_API_KEY;

    if (!brainKey) {
      return NextResponse.json({ error: "BRAIN_API_KEY não configurada." }, { status: 500 });
    }

    const brainResponse = await fetch(`${brainUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-brain-key": brainKey,
      },
      body: JSON.stringify({
        user_id: user.id,
        agent_slug: agentSlug,
        channel,
        messages: recentMessages || [{ role: "user", content }],
      }),
    });

    const brainData = await brainResponse.json();

    if (!brainResponse.ok) {
      return NextResponse.json(
        { error: "Erro no Brain.", details: brainData },
        { status: 500 }
      );
    }

    const reply = String(brainData.reply || "Não consegui gerar resposta agora.");

    const { data: assistantMessage, error: assistantError } = await supabase
      .from("chat_messages")
      .insert({
        conversation_id: conversationId,
        user_id: user.id,
        role: "assistant",
        content: reply,
        metadata: {
          agent_slug: agentSlug,
          channel,
          model: brainData.model || null,
        },
      })
      .select("*")
      .single();

    if (assistantError) {
      return NextResponse.json(
        { error: "Erro ao salvar resposta.", details: assistantError.message },
        { status: 500 }
      );
    }

    await supabase
      .from("chat_conversations")
      .update({
        updated_at: new Date().toISOString(),
        agent_slug: agentSlug,
        channel,
      })
      .eq("id", conversationId)
      .eq("user_id", user.id);

    return NextResponse.json({
      ok: true,
      conversation,
      user_message: userMessage,
      assistant_message: assistantMessage,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Erro interno.", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
