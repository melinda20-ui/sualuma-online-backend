import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const MAIN_FILE = path.join(DATA_DIR, "provider-dashboard.json");
const USER_FILE = path.join(DATA_DIR, "provider-portfolios-by-user.json");

type AnyRecord = Record<string, any>;

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, data: any) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
}

function pickString(...values: any[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function normalizeProfile(input: AnyRecord = {}) {
  return {
    name: pickString(input.name, input.fullName, input.full_name, input.displayName, input.title, "Prestador Sualuma"),
    title: pickString(input.title, input.role, input.profession, input.headline, "Especialista em serviços digitais"),
    bio: pickString(input.bio, input.description, input.about),
    city: pickString(input.city, input.location),
    email: pickString(input.email),
    phone: pickString(input.phone, input.whatsapp),
    photoUrl: pickString(input.photoUrl, input.avatarUrl, input.fotoUrl, input.imageUrl, input.photo, input.avatar),
    avatarInitial: pickString(input.avatarInitial, input.initials, "P"),
    updatedAt: new Date().toISOString(),
  };
}

function normalizeItem(item: AnyRecord = {}, index = 0) {
  const id = pickString(item.id, item.key) || `portfolio-${Date.now()}-${index}`;

  return {
    id,
    title: pickString(item.title, item.name, item.projectTitle, "Trabalho sem título"),
    category: pickString(item.category, item.type, "Portfólio"),
    url: pickString(item.url, item.link, item.siteUrl, item.projectUrl),
    description: pickString(item.description, item.body, item.text, item.summary),
    coverImage: pickString(item.coverImage, item.imageUrl, item.photoUrl, item.previewImage, item.thumbnail),
    youtubeUrl: pickString(item.youtubeUrl, item.videoUrl, item.youtube, item.video),
    clientName: pickString(item.clientName, item.client),
    status: pickString(item.status, "publicado"),
    createdAt: pickString(item.createdAt) || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function extractPortfolio(body: AnyRecord = {}) {
  const state = body.state || body.data || body;

  const profileSource =
    body.profile ||
    state.profile ||
    state.providerProfile ||
    state.provider ||
    {};

  const portfolioSource =
    body.portfolio ||
    state.portfolio ||
    state.projects ||
    state.works ||
    state.items ||
    [];

  const profile = normalizeProfile(profileSource);
  const portfolio = Array.isArray(portfolioSource)
    ? portfolioSource.map((item, index) => normalizeItem(item, index)).filter((item) => item.title)
    : [];

  return { profile, portfolio };
}

async function getCurrentUser() {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    return data.user || null;
  } catch {
    return null;
  }
}

function userKey(user: any) {
  return user?.id || user?.email || "fallback-user";
}

export async function GET() {
  const user = await getCurrentUser();
  const main = await readJson<AnyRecord>(MAIN_FILE, {});
  const byUser = await readJson<AnyRecord>(USER_FILE, {});

  const key = userKey(user);
  const userData = byUser[key] || {};

  const profile = {
    ...(main.providerProfile || {}),
    ...(userData.profile || {}),
  };

  const portfolio =
    Array.isArray(userData.portfolio) && userData.portfolio.length
      ? userData.portfolio
      : Array.isArray(main.portfolio)
        ? main.portfolio
        : [];

  return NextResponse.json({
    ok: true,
    authenticated: Boolean(user),
    user: user
      ? {
          id: user.id,
          email: user.email,
        }
      : null,
    profile,
    portfolio,
    total: portfolio.length,
    updatedAt: userData.updatedAt || main.updatedAt || new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      {
        ok: false,
        error: "Faça login para salvar o portfólio no backend.",
      },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const { profile, portfolio } = extractPortfolio(body);

  const main = await readJson<AnyRecord>(MAIN_FILE, {});
  const byUser = await readJson<AnyRecord>(USER_FILE, {});
  const key = userKey(user);

  const currentUserData = byUser[key] || {};

  const finalProfile = {
    ...(main.providerProfile || {}),
    ...(currentUserData.profile || {}),
    ...profile,
    email: profile.email || user.email || currentUserData.profile?.email || "",
    updatedAt: new Date().toISOString(),
  };

  const currentPortfolio = Array.isArray(currentUserData.portfolio)
    ? currentUserData.portfolio
    : Array.isArray(main.portfolio)
      ? main.portfolio
      : [];

  const map = new Map<string, AnyRecord>();

  for (const item of currentPortfolio) {
    if (item?.id) map.set(item.id, item);
  }

  for (const item of portfolio) {
    if (item?.id) {
      map.set(item.id, {
        ...(map.get(item.id) || {}),
        ...item,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  const finalPortfolio = Array.from(map.values());

  byUser[key] = {
    userId: user.id,
    email: user.email,
    profile: finalProfile,
    portfolio: finalPortfolio,
    updatedAt: new Date().toISOString(),
  };

  main.providerProfile = {
    ...(main.providerProfile || {}),
    ...finalProfile,
  };

  main.portfolio = finalPortfolio;
  main.updatedAt = new Date().toISOString();

  await writeJson(USER_FILE, byUser);
  await writeJson(MAIN_FILE, main);

  return NextResponse.json({
    ok: true,
    profile: finalProfile,
    portfolio: finalPortfolio,
    total: finalPortfolio.length,
    message: "Portfólio salvo no backend.",
  });
}
