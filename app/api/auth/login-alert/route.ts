import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { sendBrevoEmail } from "@/lib/email/brevo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AlertItem = {
  email: string;
  firstAlertAt: string;
  lastInitialEmailAt: string;
  reminderSentAt?: string | null;
  source?: string;
  ip?: string;
  userAgent?: string;
  status: "pending" | "reminded";
};

const STORE_PATH = path.join(process.cwd(), "data", "login-rate-limit-alerts.json");

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function readStore(): Promise<AlertItem[]> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeStore(items: AlertItem[]) {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(items, null, 2), "utf8");
}

function minutesAgo(dateIso: string) {
  return (Date.now() - new Date(dateIso).getTime()) / 1000 / 60;
}

function buildInitialEmail(email: string) {
  const loginUrl = "https://sualuma.online/login";

  const subject = "Seu acesso foi pausado por segurança";

  const text = `Olá! Detectamos muitas tentativas de login para ${email}. Por segurança, o acesso foi pausado temporariamente. Aguarde alguns minutos ou tente novamente em uma aba anônima. Link: ${loginUrl}`;

  const html = `
  <div style="margin:0;padding:0;background:#070816;font-family:Arial,Helvetica,sans-serif;color:#ffffff;">
    <div style="max-width:620px;margin:0 auto;padding:34px 18px;">
      <div style="border:1px solid rgba(124,58,237,.35);background:linear-gradient(135deg,#111329,#080914);border-radius:24px;padding:30px;box-shadow:0 20px 70px rgba(0,0,0,.35);">
        <div style="font-size:13px;color:#38bdf8;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin-bottom:14px;">
          Sualuma • Segurança de acesso
        </div>

        <h1 style="font-size:28px;line-height:1.15;margin:0 0 14px;color:#ffffff;">
          Seu acesso foi pausado por alguns minutos
        </h1>

        <p style="font-size:16px;line-height:1.7;color:#cbd5e1;margin:0 0 18px;">
          Detectamos muitas tentativas de login seguidas para este e-mail:
          <strong style="color:#ffffff;">${email}</strong>.
        </p>

        <div style="background:rgba(239,68,68,.12);border:1px solid rgba(248,113,113,.35);border-radius:18px;padding:18px;margin:22px 0;">
          <p style="font-size:15px;line-height:1.6;color:#fecaca;margin:0;">
            Isso é uma proteção automática para evitar acessos indevidos. Espere alguns minutos antes de tentar novamente.
          </p>
        </div>

        <p style="font-size:15px;line-height:1.7;color:#cbd5e1;margin:0 0 22px;">
          Você pode tentar novamente em alguns minutos ou abrir uma aba anônima/privada do navegador.
          Em breve enviaremos outro aviso quando for seguro tentar de novo.
        </p>

        <a href="${loginUrl}" style="display:inline-block;background:linear-gradient(135deg,#2563eb,#7c3aed,#c026d3);color:#ffffff;text-decoration:none;font-weight:800;padding:15px 22px;border-radius:999px;">
          Tentar entrar novamente
        </a>

        <p style="font-size:12px;line-height:1.6;color:#64748b;margin:28px 0 0;">
          Se não foi você, ignore este e-mail. Sua conta continua protegida.
        </p>
      </div>
    </div>
  </div>`;

  return { subject, text, html };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { ok: false, error: "E-mail inválido ou ausente." },
        { status: 400 }
      );
    }

    const nowIso = new Date().toISOString();
    const items = await readStore();

    const existingIndex = items.findIndex((item) => item.email === email);
    const existing = existingIndex >= 0 ? items[existingIndex] : null;

    if (existing && minutesAgo(existing.lastInitialEmailAt) < 10) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: "E-mail de alerta já enviado recentemente.",
      });
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const userAgent = request.headers.get("user-agent") || "unknown";
    const source = body.source ? String(body.source).slice(0, 120) : "login";

    const emailContent = buildInitialEmail(email);
    await sendBrevoEmail({
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    const nextItem: AlertItem = {
      email,
      firstAlertAt: existing?.firstAlertAt || nowIso,
      lastInitialEmailAt: nowIso,
      reminderSentAt: null,
      source,
      ip,
      userAgent,
      status: "pending",
    };

    if (existingIndex >= 0) {
      items[existingIndex] = nextItem;
    } else {
      items.push(nextItem);
    }

    await writeStore(items);

    return NextResponse.json({
      ok: true,
      message: "Alerta de limite de login enviado.",
    });
  } catch (error: any) {
    console.error("[login-alert] erro:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Erro ao enviar alerta." },
      { status: 500 }
    );
  }
}
