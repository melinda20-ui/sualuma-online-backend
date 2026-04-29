import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DB_FILE = path.join(process.cwd(), "data", "provider-portfolios.json");

function json(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

function normalizeKey(value: string) {
  return String(value || "prestador-demo@sualuma.online")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9@._-]/g, "");
}

async function getAuthEmail() {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    return data?.user?.email || "";
  } catch {
    return "";
  }
}

async function readDb() {
  try {
    return JSON.parse(await fs.readFile(DB_FILE, "utf8"));
  } catch {
    return {};
  }
}

async function writeDb(db: any) {
  await fs.mkdir(path.dirname(DB_FILE), { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), "utf8");
}

function defaultRecord(email: string) {
  return {
    ok: true,
    email,
    profile: {
      name: "Prestador Sualuma",
      title: "Especialista em sites, automações e presença digital",
      bio: "Configure seu perfil para começar a receber propostas, entregar projetos e usar os agentes da Sualuma.",
      photoUrl: "",
      platformJobs: 18,
      outsideJobs: 43,
      clients: 54,
      satisfaction: 98,
    },
    projects: [
      {
        id: "port-demo-1",
        title: "Site institucional futurista",
        category: "Sites",
        url: "https://sualuma.online",
        youtubeUrl: "",
        imageUrl: "",
        result: "Modelo de apresentação profissional para empresas digitais.",
        description: "Projeto usado como exemplo inicial do portfólio.",
        communityPublishedAt: "",
        communityPostId: "",
        createdAt: new Date().toISOString(),
      },
    ],
    updatedAt: new Date().toISOString(),
  };
}

function getRecord(db: any, key: string) {
  if (!db[key]) db[key] = defaultRecord(key);
  db[key].ok = true;
  db[key].email = key;
  db[key].profile = db[key].profile || defaultRecord(key).profile;
  db[key].projects = Array.isArray(db[key].projects) ? db[key].projects : [];
  db[key].updatedAt = db[key].updatedAt || new Date().toISOString();
  return db[key];
}

export async function OPTIONS() {
  return json({ ok: true });
}

export async function GET(req: NextRequest) {
  try {
    const authEmail = await getAuthEmail();
    const emailFromUrl = req.nextUrl.searchParams.get("email") || "";
    const key = normalizeKey(authEmail || emailFromUrl || "prestador-demo@sualuma.online");

    const db = await readDb();
    const record = getRecord(db, key);
    await writeDb(db);

    return json(record);
  } catch (error: any) {
    return json({ ok: false, error: error?.message || "Erro ao carregar portfólio." }, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const authEmail = await getAuthEmail();
    const key = normalizeKey(authEmail || body.email || body.ownerEmail || "prestador-demo@sualuma.online");

    const db = await readDb();
    const record = getRecord(db, key);

    const action = String(body.action || "");

    if (action === "profile") {
      record.profile = {
        ...record.profile,
        name: String(body.name || record.profile.name || ""),
        title: String(body.title || record.profile.title || ""),
        bio: String(body.bio || record.profile.bio || ""),
        photoUrl: String(body.photoUrl || record.profile.photoUrl || ""),
      };
    }

    if (action === "add") {
      record.projects.unshift({
        id: "work-" + Date.now() + "-" + Math.random().toString(16).slice(2),
        title: String(body.title || "Novo trabalho"),
        category: String(body.category || "Portfólio"),
        url: String(body.url || ""),
        youtubeUrl: String(body.youtubeUrl || ""),
        imageUrl: String(body.imageUrl || ""),
        result: String(body.result || ""),
        description: String(body.description || ""),
        communityPublishedAt: "",
        communityPostId: "",
        createdAt: new Date().toISOString(),
      });
    }

    if (action === "update") {
      const id = String(body.id || "");
      record.projects = record.projects.map((item: any) => {
        if (String(item.id) !== id) return item;
        return {
          ...item,
          title: String(body.title || item.title || ""),
          category: String(body.category || item.category || ""),
          url: String(body.url || ""),
          youtubeUrl: String(body.youtubeUrl || ""),
          imageUrl: String(body.imageUrl || item.imageUrl || ""),
          result: String(body.result || ""),
          description: String(body.description || ""),
          updatedAt: new Date().toISOString(),
        };
      });
    }

    if (action === "mark_published") {
      const id = String(body.id || "");
      record.projects = record.projects.map((item: any) => {
        if (String(item.id) !== id) return item;
        return {
          ...item,
          communityPublishedAt: new Date().toISOString(),
          communityPostId: String(body.communityPostId || item.communityPostId || ""),
        };
      });
    }

    if (action === "delete") {
      const id = String(body.id || "");
      record.projects = record.projects.filter((item: any) => String(item.id) !== id);
    }

    record.updatedAt = new Date().toISOString();
    db[key] = record;
    await writeDb(db);

    return json(record);
  } catch (error: any) {
    return json({ ok: false, error: error?.message || "Erro ao salvar portfólio." }, 500);
  }
}
