import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabaseAdmin() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL;

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase não configurado no ambiente.");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    const [
      providersRes,
      modelsRes,
      skillsRes,
      promptsRes,
      voicesRes,
      transcriptionsRes,
      logsRes,
      settingsRes,
    ] = await Promise.all([
      supabase.from("mia_brain_providers").select("*").order("priority", { ascending: true }),
      supabase.from("mia_brain_models").select("*").order("quality_score", { ascending: false }),
      supabase.from("mia_brain_skills").select("*").order("usage_count", { ascending: false }),
      supabase.from("mia_brain_prompts").select("*").order("updated_at", { ascending: false }),
      supabase.from("mia_brain_voices").select("*").order("created_at", { ascending: false }),
      supabase.from("mia_brain_transcriptions").select("*").order("created_at", { ascending: false }).limit(10),
      supabase.from("mia_brain_usage_logs").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("mia_brain_settings").select("*"),
    ]);

    const errors = [
      providersRes.error,
      modelsRes.error,
      skillsRes.error,
      promptsRes.error,
      voicesRes.error,
      transcriptionsRes.error,
      logsRes.error,
      settingsRes.error,
    ].filter(Boolean);

    if (errors.length) {
      return NextResponse.json(
        {
          ok: false,
          error: errors[0]?.message || "Erro ao buscar dados da Mia Brain.",
        },
        { status: 500 }
      );
    }

    const providers = providersRes.data || [];
    const models = modelsRes.data || [];
    const skills = skillsRes.data || [];
    const prompts = promptsRes.data || [];
    const voices = voicesRes.data || [];
    const transcriptions = transcriptionsRes.data || [];
    const logs = logsRes.data || [];
    const settingsRows = settingsRes.data || [];

    const activeProviders = providers.filter((p) => p.status === "active").length;
    const activeSkills = skills.filter((s) => s.status === "active").length;
    const todayCost = providers.reduce((sum, p) => sum + Number(p.today_cost || 0), 0);
    const latencyItems = providers.filter((p) => Number(p.avg_latency_ms || 0) > 0);
    const avgLatency =
      latencyItems.length > 0
        ? Math.round(
            latencyItems.reduce((sum, p) => sum + Number(p.avg_latency_ms || 0), 0) /
              latencyItems.length
          )
        : 0;

    const settings = Object.fromEntries(
      settingsRows.map((row) => [row.key, row.value])
    );

    return NextResponse.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      metrics: {
        activeProviders,
        activeSkills,
        todayCost,
        avgLatency,
        totalLogs: logs.length,
        totalPrompts: prompts.length,
        totalVoices: voices.length,
        totalTranscriptions: transcriptions.length,
      },
      providers,
      models,
      skills,
      prompts,
      voices,
      transcriptions,
      logs,
      settings,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido.";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
