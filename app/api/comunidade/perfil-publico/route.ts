import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "public, max-age=60, s-maxage=120",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createSupabaseAdmin(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function getProviderProfile(email: string) {
  const admin = getAdminClient();
  if (!admin) return null;

  const tables = ["provider_dashboards", "prestador_dashboards", "provider_profiles", "prestador_profiles", "profiles"];
  const emailColumns = ["email", "user_email"];

  for (const table of tables) {
    for (const col of emailColumns) {
      try {
        const { data, error } = await admin
          .from(table)
          .select("*")
          .eq(col, email)
          .maybeSingle();
        if (!error && data) {
          const dash = data.dashboard || data.dashboard_json || data.data || data.payload || data.profile_data || data.provider_data || data;
          const profile = dash?.providerProfile || dash?.profile || dash?.portfolioProfile || dash?.data?.providerProfile;
          if (profile) return profile;
        }
      } catch {}
    }
  }
  return null;
}

export async function GET(req: NextRequest) {
  const email = (req.nextUrl.searchParams.get("email") || "").toLowerCase().trim();

  if (!email) {
    return json({ ok: false, error: "Email é obrigatório." }, 400);
  }

  // Fetch provider profile
  const providerProfile = await getProviderProfile(email);

  // Build public profile
  const profile = {
    name: providerProfile?.name || email.split("@")[0],
    photoUrl: providerProfile?.photoUrl || providerProfile?.fotoUrl || providerProfile?.avatarUrl || providerProfile?.picture || "",
    bio: providerProfile?.bio || providerProfile?.description || "",
    customLink: providerProfile?.customLink || providerProfile?.website || providerProfile?.site || "",
    email,
  };

  // Fetch portfolio items
  const portfolio = providerProfile?.portfolio || providerProfile?.works || providerProfile?.trabalhos || 
    providerProfile?.data?.portfolio || providerProfile?.data?.works || [];

  return json({
    ok: true,
    profile,
    portfolio: Array.isArray(portfolio) ? portfolio : [],
  });
}
