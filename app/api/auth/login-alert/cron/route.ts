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

function buildReminderEmail() {
  const loginUrl = "https://sualuma.online/login";

  const subject = "Você já pode tentar acessar novamente";

  const text = `Olá! O bloqueio temporário de login deve ter sido liberado. Você já pode tentar acessar novamente em ${loginUrl}.`;

  const html = `
  <div style="margin:0;padding:0;background:#070816;font-family:Arial,Helvetica,sans-serif;color:#ffffff;">
    <div style="max-width:620px;margin:0 auto;padding:34px 18px;">
      <div style="border:1px solid rgba(56,189,248,.35);background:linear-gradient(135deg,#111329,#080914);border-radius:24px;padding:30px;box-shadow:0 20px 70px rgba(0,0,0,.35);">
        <div style="font-size:13px;color:#38bdf8;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin-bottom:14px;">
          Sualuma • Acesso liberado
        </div>

        <h1 style="font-size:28px;line-height:1.15;margin:0 0 14px;color:#ffffff;">
          Você já pode tentar entrar novamente
        </h1>

        <p style="font-size:16px;line-height:1.7;color:#cbd5e1;margin:0 0 22px;">
          O bloqueio temporário por excesso de tentativas deve ter sido liberado.
          Tente entrar novamente pelo botão abaixo.
        </p>

        <a href="${loginUrl}" style="display:inline-block;background:linear-gradient(135deg,#2563eb,#7c3aed,#c026d3);color:#ffffff;text-decoration:none;font-weight:800;padding:15px 22px;border-radius:999px;">
          Acessar minha conta
        </a>

        <p style="font-size:13px;line-height:1.6;color:#94a3b8;margin:24px 0 0;">
          Caso ainda apareça a mensagem de limite, aguarde mais alguns minutos ou tente em uma aba anônima.
        </p>
      </div>
    </div>
  </div>`;

  return { subject, text, html };
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const key = url.searchParams.get("key") || request.headers.get("x-cron-key");
    const expectedKey = process.env.LOGIN_ALERT_CRON_KEY;

    if (!expectedKey || key !== expectedKey) {
      return NextResponse.json({ ok: false, error: "Não autorizado." }, { status: 401 });
    }

    const items = await readStore();
    const nowIso = new Date().toISOString();
    const results: any[] = [];

    for (const item of items) {
      const shouldSend =
        item.status === "pending" &&
        !item.reminderSentAt &&
        minutesAgo(item.lastInitialEmailAt) >= 20;

      if (!shouldSend) continue;

      try {
        const emailContent = buildReminderEmail();
        await sendBrevoEmail({
          to: item.email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        });

        item.reminderSentAt = nowIso;
        item.status = "reminded";

        results.push({
          email: item.email,
          ok: true,
          action: "reminder_sent",
        });
      } catch (error: any) {
        results.push({
          email: item.email,
          ok: false,
          error: error?.message || "Erro ao enviar lembrete.",
        });
      }
    }

    await writeStore(items);

    return NextResponse.json({
      ok: true,
      checked: items.length,
      results,
    });
  } catch (error: any) {
    console.error("[login-alert-cron] erro:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Erro no cron." },
      { status: 500 }
    );
  }
}
