import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";

function cleanFileName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .slice(0, 90);
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();

    const audio = form.get("audio");
    const style = String(form.get("style") || "Trap R&B triste");
    const intention = String(form.get("intention") || "Transformar em uma produção nova e autoral.");

    if (!(audio instanceof File)) {
      return NextResponse.json({ error: "Nenhum áudio foi enviado." }, { status: 400 });
    }

    const maxSize = 50 * 1024 * 1024;

    if (audio.size > maxSize) {
      return NextResponse.json({ error: "Arquivo muito grande. Envie até 50MB por enquanto." }, { status: 413 });
    }

    const allowed = ["audio/", "application/octet-stream"];

    if (audio.type && !allowed.some((prefix) => audio.type.startsWith(prefix))) {
      return NextResponse.json({ error: "Envie um arquivo de áudio válido." }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), "data", "music-producer", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const safeName = cleanFileName(audio.name || "audio");
    const id = crypto.randomUUID();
    const filePath = path.join(uploadsDir, `${id}-${safeName}`);

    const bytes = await audio.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    return NextResponse.json({
      ok: true,
      fileName: safeName,
      sizeMB: (audio.size / 1024 / 1024).toFixed(2),
      style,
      intention,
      analysis: {
        bpm: "A definir na Fase 2 com análise real de áudio",
        key: "A definir na Fase 2 com detecção de tom",
        mood: style,
        structure: [
          "Intro com textura curta para preparar a entrada da voz.",
          "Verso com poucos elementos para deixar a voz respirar.",
          "Pré-refrão com pad crescendo e mais movimento nos hats.",
          "Refrão com bateria completa, baixo mais presente e dobra vocal.",
          "Ponte reduzida com piano/pad e efeito de voz mais íntimo.",
        ],
        chords: [
          "Opção 1: F#m7 - Dmaj7 - Aadd9 - E",
          "Opção 2: Am7 - Fmaj7 - C - G",
          "Opção 3: C#m7 - Amaj7 - E - B",
        ],
        drums: [
          "Clap ou snare no tempo 2 e 4.",
          "Kick grave marcando o início do compasso e respondendo à melodia.",
          "Hi-hat em 1/16 com rolls curtos antes do refrão.",
          "Percussões leves para criar movimento sem competir com a voz.",
        ],
        bass: [
          "808 seguindo a nota raiz dos acordes.",
          "Notas longas no verso e variações curtas no refrão.",
          "Evitar excesso de grave enquanto a voz principal estiver baixa.",
        ],
        instruments: [
          "Piano elétrico escuro para sustentar a emoção.",
          "Pad atmosférico bem baixo no fundo.",
          "Pluck suave respondendo frases da voz.",
          "Texturas reversas antes das viradas.",
        ],
        vocalEffects: [
          "Afinação leve, sem deixar robótico demais.",
          "Compressor para nivelar a gravação de celular.",
          "Reverb plate curto no verso e maior no refrão.",
          "Delay 1/4 ou 1/8 ping-pong em finais de frase.",
          "Dobra vocal no refrão e harmonias em pontos emocionais.",
        ],
        productionPlan: [
          "Importar a voz no BandLab ou FL Studio.",
          "Definir BPM manualmente ouvindo o pulso da voz.",
          "Testar uma das progressões de acordes acima.",
          "Montar bateria simples primeiro, depois adicionar baixo.",
          "Adicionar instrumentos só onde a voz deixa espaço.",
          "Exportar uma demo e comparar com a intenção original.",
        ],
      },
    });
  } catch (error) {
    console.error("MUSIC_PRODUCER_ANALYZE_ERROR", error);
    return NextResponse.json({ error: "Erro interno ao processar áudio." }, { status: 500 });
  }
}
