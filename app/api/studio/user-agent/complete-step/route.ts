import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getCurrentAdminAccess } from "@/lib/auth/admin-access";
import { sendWhatsAppText } from "@/lib/whatsapp/cloud-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATA_DIR = path.join(process.cwd(), "data/user-access-agent");
const DATA_FILE = path.join(DATA_DIR, "progress.json");

function readProgress() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return { checklist: [], events: [] };
    }

    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return { checklist: [], events: [] };
  }
}

function saveProgress(progress: any) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(progress, null, 2));
}

async function isAuthorized(request: NextRequest) {
  const token = process.env.SUALUMA_INTERNAL_AGENT_TOKEN;
  const auth = request.headers.get("authorization") || "";

  if (token && auth === `Bearer ${token}`) {
    return true;
  }

  const admin = await getCurrentAdminAccess();
  return Boolean(admin.isAdmin);
}

async function notifyWhatsapp(event: any) {
  const title = event?.title || "Etapa concluída";
  const description = event?.description || "Atualização registrada no Agente Usuários.";
  const group = event?.group || "Usuários e acessos";
  const source = event?.source || "sistema";

  const message = [
    "✅ *Sualuma | Agente Usuários*",
    "",
    `Etapa concluída: ${title}`,
    `Grupo: ${group}`,
    "",
    description,
    "",
    `Fonte: ${source}`,
    `Data: ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`,
    "",
    "A página de diagnóstico de usuários foi atualizada automaticamente."
  ].join("\n");

  return await sendWhatsAppText(message);
}

export async function POST(request: NextRequest) {
  const authorized = await isAuthorized(request);

  if (!authorized) {
    return NextResponse.json(
      {
        ok: false,
        error: "Acesso restrito ao admin ou token interno.",
      },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => ({}));

  const code = String(body.code || body.title || `step-${Date.now()}`)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-");

  const title = String(body.title || "Etapa concluída").trim();
  const description = String(body.description || "").trim();
  const group = String(body.group || "Geral").trim();
  const source = String(body.source || "manual").trim();

  const now = new Date().toISOString();

  const progress = readProgress();
  const checklist = Array.isArray(progress.checklist) ? progress.checklist : [];
  const events = Array.isArray(progress.events) ? progress.events : [];

  const existingIndex = checklist.findIndex((item: any) => item.code === code);

  const item = {
    code,
    group,
    title,
    description,
    status: "done",
    completedAt: now,
    source,
  };

  if (existingIndex >= 0) {
    checklist[existingIndex] = {
      ...checklist[existingIndex],
      ...item,
    };
  } else {
    checklist.unshift(item);
  }

  const event: any = {
    id: `evt_${Date.now()}`,
    type: "step_completed",
    code,
    group,
    title,
    description,
    source,
    createdAt: now,
  };

  events.unshift(event);

  progress.checklist = checklist.slice(0, 100);
  progress.events = events.slice(0, 100);

  const whatsapp = await notifyWhatsapp(event);

  event.whatsapp = whatsapp;

  saveProgress(progress);

  return NextResponse.json({
    ok: true,
    item,
    event,
    whatsapp,
  });
}
