import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPLOAD_DIR = "/var/www/static-sites/meuservico/uploads/provider";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("photo");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "Nenhuma foto enviada." },
        { status: 400, headers: corsHeaders() }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { ok: false, error: "Envie apenas imagem." },
        { status: 400, headers: corsHeaders() }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { ok: false, error: "Imagem muito grande. Máximo 5MB." },
        { status: 400, headers: corsHeaders() }
      );
    }

    const ext =
      file.type.includes("png") ? "png" :
      file.type.includes("webp") ? "webp" :
      file.type.includes("gif") ? "gif" :
      "jpg";

    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `portfolio-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    await fs.writeFile(filepath, buffer);

    return NextResponse.json(
      {
        ok: true,
        url: `/uploads/provider/${filename}`,
      },
      { headers: corsHeaders() }
    );
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Erro ao enviar foto." },
      { status: 500, headers: corsHeaders() }
    );
  }
}
