import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROFILES_DIR = path.join(process.cwd(), "data", "community-profiles");

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

async function readLocalProfile(email: string) {
  try {
    const raw = await fs.readFile(path.join(PROFILES_DIR, emailToFile(email)), "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function writeLocalProfile(email: string, data: any) {
  await fs.mkdir(PROFILES_DIR, { recursive: true });
  await fs.writeFile(path.join(PROFILES_DIR, emailToFile(email)), JSON.stringify(data, null, 2), "utf8");
}

function emailToFile(email: string) {
  return email.replace(/[@.]/g, "_") + ".json";
}

export async function GET(req: NextRequest) {
  const email = (req.nextUrl.searchParams.get("email") || "").toLowerCase().trim();

  if (!email) {
    return json({ ok: false, error: "Email é obrigatório." }, 400);
  }

  const providerProfile = await getProviderProfile(email);
  const localProfile = await readLocalProfile(email);

  const profile = {
    name: providerProfile?.name || email.split("@")[0],
    photoUrl: localProfile.photoUrl || providerProfile?.photoUrl || providerProfile?.fotoUrl || providerProfile?.avatarUrl || providerProfile?.picture || "",
    bio: localProfile.bio || providerProfile?.bio || providerProfile?.description || "",
    customLink: localProfile.customLink || providerProfile?.customLink || providerProfile?.website || providerProfile?.site || "",
    email,
  };

  const portfolio = providerProfile?.portfolio || providerProfile?.works || providerProfile?.trabalhos || 
    providerProfile?.data?.portfolio || providerProfile?.data?.works || [];

  return json({
    ok: true,
    profile,
    portfolio: Array.isArray(portfolio) ? portfolio : [],
  });
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return json({ ok: false, error: "Faça login para editar seu perfil." }, 401);
  }

  const body = await req.json().catch(() => ({}));
  const email = (user.email || "").toLowerCase().trim();

  if (!email) {
    return json({ ok: false, error: "Email não encontrado na sessão." }, 400);
  }

  const current = await readLocalProfile(email);
  const updated = {
    bio: typeof body.bio === "string" ? body.bio.trim() : current.bio || "",
    customLink: typeof body.customLink === "string" ? body.customLink.trim() : current.customLink || "",
    photoUrl: typeof body.photoUrl === "string" ? body.photoUrl.trim() : current.photoUrl || "",
    updatedAt: new Date().toISOString(),
  };

  await writeLocalProfile(email, updated);

  return json({ ok: true, profile: { ...updated, name: user.email?.split("@")[0] || "Usuário", email } });
}
