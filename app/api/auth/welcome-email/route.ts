import { NextResponse } from "next/server";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WelcomeLog = Record<string, { sentAt: string }>;

const DATA_DIR = path.join(process.cwd(), ".data");
const LOG_FILE = path.join(DATA_DIR, "welcome-emails.json");

function cleanEmail(email: unknown) {
  return String(email || "").trim().toLowerCase();
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function readLog(): Promise<WelcomeLog> {
  try {
    const raw = await readFile(LOG_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function saveLog(log: WelcomeLog) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(LOG_FILE, JSON.stringify(log, null, 2), "utf8");
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    const fromEmail = process.env.BREVO_FROM_EMAIL || "contato@sualuma.online";
    const fromName = process.env.BREVO_FROM_NAME || "Sualuma";

    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "BREVO_API_KEY não configurada." },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const email = cleanEmail(body.email);
    const name = String(body.name || "").trim();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { ok: false, error: "E-mail inválido." },
        { status: 400 }
      );
    }

    const log = await readLog();

    if (log[email]) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: "welcome_email_already_sent",
        sentAt: log[email].sentAt,
      });
    }

    const safeName = escapeHtml(name || "tudo bem");
    const loginUrl = "https://sualuma.online/login";
    const plansUrl = "https://sualuma.online/planos";
    const portalUrl = "https://sualuma.online/portal";
    const chatUrl = "https://chat.sualuma.online/chat";

    const subject = "Seu acesso à Sualuma está pronto";

    const textContent = `
Olá, ${name || "tudo bem"}.

Seu cadastro na Sualuma foi criado com sucesso.

Por onde começar:
1. Acesse sua conta: ${loginUrl}
2. Veja os planos disponíveis: ${plansUrl}
3. Depois de escolher seu plano, entre no portal: ${portalUrl}
4. Use o chat Mia para suporte e próximos passos: ${chatUrl}

Se você acabou de criar sua conta, use o mesmo e-mail e senha cadastrados.

Equipe Sualuma
`.trim();

    const htmlContent = `
<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;padding:0;background:#070a16;font-family:Arial,Helvetica,sans-serif;color:#ffffff;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#070a16;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:linear-gradient(145deg,#0d1228,#111739);border:1px solid rgba(148,163,184,.22);border-radius:24px;overflow:hidden;">
            <tr>
              <td style="padding:34px 30px 20px;">
                <div style="font-size:13px;letter-spacing:.16em;text-transform:uppercase;color:#7dd3fc;font-weight:700;">
                  Sualuma OS
                </div>

                <h1 style="margin:14px 0 10px;font-size:30px;line-height:1.15;color:#ffffff;">
                  Seu acesso está pronto.
                </h1>

                <p style="margin:0;color:#cbd5e1;font-size:16px;line-height:1.7;">
                  Olá, <strong style="color:#ffffff;">${safeName}</strong>. Seu cadastro foi criado com sucesso.
                  Agora você já pode acessar a plataforma, escolher seu plano e começar pelos primeiros passos.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:8px 30px 22px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.10);border-radius:18px;">
                  <tr>
                    <td style="padding:22px;">
                      <h2 style="margin:0 0 14px;font-size:18px;color:#ffffff;">
                        Comece por aqui:
                      </h2>

                      <p style="margin:0 0 10px;color:#dbeafe;font-size:15px;line-height:1.65;">
                        <strong>1.</strong> Acesse sua conta com o mesmo e-mail e senha cadastrados.
                      </p>

                      <p style="margin:0 0 10px;color:#dbeafe;font-size:15px;line-height:1.65;">
                        <strong>2.</strong> Vá para a página de planos e escolha o melhor acesso para sua fase.
                      </p>

                      <p style="margin:0;color:#dbeafe;font-size:15px;line-height:1.65;">
                        <strong>3.</strong> Depois, entre no portal e use a Mia para suporte, orientação e próximos passos.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:0 30px 30px;">
                <a href="${plansUrl}" style="display:block;text-align:center;text-decoration:none;background:linear-gradient(90deg,#0ea5e9,#9333ea);color:#ffffff;font-weight:800;font-size:16px;padding:16px 22px;border-radius:16px;">
                  Ver planos disponíveis
                </a>

                <p style="margin:18px 0 0;text-align:center;color:#94a3b8;font-size:13px;line-height:1.6;">
                  Também pode acessar diretamente:
                  <br />
                  <a href="${loginUrl}" style="color:#7dd3fc;text-decoration:none;">Login</a>
                  ·
                  <a href="${portalUrl}" style="color:#7dd3fc;text-decoration:none;">Portal</a>
                  ·
                  <a href="${chatUrl}" style="color:#7dd3fc;text-decoration:none;">Mia Chat</a>
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:20px 30px 30px;border-top:1px solid rgba(255,255,255,.08);">
                <p style="margin:0;color:#64748b;font-size:12px;line-height:1.6;text-align:center;">
                  Você recebeu este e-mail porque criou uma conta na Sualuma.
                  Se não foi você, ignore esta mensagem.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`.trim();

    const brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sender: {
          name: fromName,
          email: fromEmail,
        },
        to: [
          {
            email,
            name: name || email,
          },
        ],
        subject,
        htmlContent,
        textContent,
      }),
    });

    if (!brevoResponse.ok) {
      const errorText = await brevoResponse.text().catch(() => "");
      return NextResponse.json(
        {
          ok: false,
          error: "Falha ao enviar e-mail pela Brevo.",
          brevoStatus: brevoResponse.status,
          details: errorText.slice(0, 500),
        },
        { status: 502 }
      );
    }

    log[email] = { sentAt: new Date().toISOString() };
    await saveLog(log);

    return NextResponse.json({
      ok: true,
      sent: true,
      email,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Erro inesperado.",
      },
      { status: 500 }
    );
  }
}
