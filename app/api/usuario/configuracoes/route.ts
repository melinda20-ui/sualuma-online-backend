import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function cleanText(value: unknown, max = 180) {
  if (typeof value !== "string") return null;
  const cleaned = value.trim().slice(0, max);
  return cleaned.length ? cleaned : null;
}

function cleanChoice(value: unknown, allowed: string[], fallback: string) {
  if (typeof value !== "string") return fallback;
  return allowed.includes(value) ? value : fallback;
}

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { ok: false, error: "Usuário não autenticado." },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    const defaults = {
      user_id: user.id,
      display_name:
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "",
      business_name: "",
      business_segment: "",
      whatsapp: "",
      role_goal: "",
      default_workspace: "estudio",

      notification_email: true,
      notification_whatsapp: false,
      notification_push: true,

      notify_new_user: true,
      notify_system_errors: true,
      notify_task_done: true,

      theme_mode: "system",
      ai_tone: "direto",
      ai_detail_level: "medio",

      allow_ai_personalization: true,
      allow_marketing_emails: false,
      onboarding_done: false,
    };

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
      },
      settings: {
        ...defaults,
        ...(data || {}),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Erro inesperado." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { ok: false, error: "Usuário não autenticado." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const payload = {
      user_id: user.id,

      display_name: cleanText(body.display_name, 90),
      business_name: cleanText(body.business_name, 120),
      business_segment: cleanText(body.business_segment, 120),
      whatsapp: cleanText(body.whatsapp, 40),
      role_goal: cleanText(body.role_goal, 280),

      default_workspace: cleanText(body.default_workspace, 80) || "estudio",

      notification_email: Boolean(body.notification_email),
      notification_whatsapp: Boolean(body.notification_whatsapp),
      notification_push: Boolean(body.notification_push),

      notify_new_user: Boolean(body.notify_new_user),
      notify_system_errors: Boolean(body.notify_system_errors),
      notify_task_done: Boolean(body.notify_task_done),

      theme_mode: cleanChoice(body.theme_mode, ["system", "light", "dark"], "system"),
      ai_tone: cleanChoice(
        body.ai_tone,
        ["direto", "estrategico", "didatico", "executivo"],
        "direto"
      ),
      ai_detail_level: cleanChoice(
        body.ai_detail_level,
        ["curto", "medio", "detalhado"],
        "medio"
      ),

      allow_ai_personalization: Boolean(body.allow_ai_personalization),
      allow_marketing_emails: Boolean(body.allow_marketing_emails),
      onboarding_done: Boolean(body.onboarding_done),
    };

    const { data, error } = await supabase
      .from("user_settings")
      .upsert(payload, { onConflict: "user_id" })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      settings: data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Erro inesperado." },
      { status: 500 }
    );
  }
}
