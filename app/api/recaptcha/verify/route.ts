import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { ok: false, error: "Token do reCAPTCHA não enviado." },
        { status: 400 }
      );
    }

    const secret = process.env.RECAPTCHA_SECRET_KEY;

    if (!secret) {
      return NextResponse.json(
        { ok: false, error: "RECAPTCHA_SECRET_KEY não configurada." },
        { status: 500 }
      );
    }

    const formData = new FormData();
    formData.append("secret", secret);
    formData.append("response", token);

    const ip =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

    if (ip) {
      formData.append("remoteip", ip);
    }

    const verifyRes = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      body: formData,
    });

    const data = await verifyRes.json();

    if (!data.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Confirmação reCAPTCHA falhou. Tente novamente.",
          details: data["error-codes"] || [],
        },
        { status: 403 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Erro ao verificar reCAPTCHA.",
      },
      { status: 500 }
    );
  }
}
