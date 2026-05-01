import fs from "fs/promises";
import os from "os";
import path from "path";
import { spawn } from "child_process";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type PiperVoice = {
  id: string;
  name: string;
  lang: string;
  quality: string;
  model: string;
  config: string;
};

const PIPER_BIN = process.env.PIPER_BIN || "/usr/local/bin/piper-tts-local";
const VOICES_FILE = path.join(process.cwd(), "storage", "piper-voices", "pt_BR", "voices.json");

async function loadVoices(): Promise<PiperVoice[]> {
  const raw = await fs.readFile(VOICES_FILE, "utf8");
  const voices = JSON.parse(raw);

  if (!Array.isArray(voices)) return [];

  return voices.filter((voice) => {
    return voice?.id && voice?.model && voice?.config;
  });
}

function runPiper(params: {
  text: string;
  model: string;
  config: string;
  outputFile: string;
}) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(PIPER_BIN, [
      "--model",
      params.model,
      "--config",
      params.config,
      "--output_file",
      params.outputFile,
    ]);

    let stderr = "";

    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error("Piper demorou demais para responder."));
    }, 60000);

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    child.on("close", (code) => {
      clearTimeout(timeout);

      if (code === 0) {
        resolve();
      } else {
        reject(new Error(stderr || `Piper finalizou com código ${code}`));
      }
    });

    child.stdin.write(params.text);
    child.stdin.end();
  });
}

export async function POST(request: NextRequest) {
  let tempDir = "";

  try {
    const body = await request.json();

    const text = typeof body.text === "string" ? body.text.trim().slice(0, 2200) : "";
    const voiceId = typeof body.voiceId === "string" ? body.voiceId : "pt_BR-cadu-medium";

    if (!text) {
      return NextResponse.json({ error: "Texto vazio." }, { status: 400 });
    }

    const voices = await loadVoices();
    const voice = voices.find((item) => item.id === voiceId) || voices[0];

    if (!voice) {
      return NextResponse.json({ error: "Nenhuma voz Piper instalada." }, { status: 500 });
    }

    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "sualuma-piper-"));
    const outputFile = path.join(tempDir, `${randomUUID()}.wav`);

    await runPiper({
      text,
      model: voice.model,
      config: voice.config,
      outputFile,
    });

    const audio = await fs.readFile(outputFile);

    return new NextResponse(audio, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "no-store",
        "X-Sualuma-TTS-Engine": "piper",
        "X-Sualuma-TTS-Voice": voice.id,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erro ao gerar áudio.",
      },
      { status: 500 }
    );
  } finally {
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}
