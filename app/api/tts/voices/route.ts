import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const VOICES_FILE = path.join(process.cwd(), "storage", "piper-voices", "pt_BR", "voices.json");

export async function GET() {
  try {
    const raw = await fs.readFile(VOICES_FILE, "utf8");
    const voices = JSON.parse(raw);

    return NextResponse.json({
      ok: true,
      engine: "piper",
      voices: Array.isArray(voices)
        ? voices.map((voice) => ({
            id: voice.id,
            name: voice.name,
            lang: voice.lang,
            quality: voice.quality,
          }))
        : [],
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      engine: "piper",
      voices: [],
      error: error instanceof Error ? error.message : "Erro ao carregar vozes.",
    });
  }
}
