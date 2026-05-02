import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { USER_ACCESS_AGENT } from "@/lib/agents/user-access-agent";
import { getCurrentAdminAccess } from "@/lib/auth/admin-access";
import { isWhatsAppCloudConfigured } from "@/lib/whatsapp/cloud-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATA_FILE = path.join(process.cwd(), "data/user-access-agent/progress.json");

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

async function isAuthorized(request: NextRequest) {
  const token = process.env.SUALUMA_INTERNAL_AGENT_TOKEN;
  const auth = request.headers.get("authorization") || "";

  if (token && auth === `Bearer ${token}`) {
    return true;
  }

  const admin = await getCurrentAdminAccess();
  return Boolean(admin.isAdmin);
}

export async function GET(request: NextRequest) {
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

  const progress = readProgress();

  const whatsappWebhook =
    process.env.SUALUMA_WHATSAPP_WEBHOOK_URL ||
    process.env.N8N_WHATSAPP_WEBHOOK_URL ||
    process.env.WHATSAPP_WEBHOOK_URL ||
    "";
  const whatsappCloudReady = isWhatsAppCloudConfigured();


  return NextResponse.json({
    ok: true,
    agent: USER_ACCESS_AGENT,
    automaticMode: true,
    whatsapp: {
      connected: Boolean(whatsappWebhook || whatsappCloudReady),
      status: (whatsappWebhook || whatsappCloudReady) ? "connected" : "not_configured",
    },
    checklist: progress.checklist || [],
    events: progress.events || [],
    updatedAt: new Date().toISOString(),
  });
}
