"use client";

import { useState } from "react";

type AnalysisResult = {
  ok: boolean;
  fileName: string;
  sizeMB: string;
  style: string;
  intention: string;
  analysis: {
    bpm: string;
    key: string;
    mood: string;
    structure: string[];
    chords: string[];
    drums: string[];
    bass: string[];
    instruments: string[];
    vocalEffects: string[];
    productionPlan: string[];
  };
};

export default function MusicProducerClient() {
  const [file, setFile] = useState<File | null>(null);
  const [style, setStyle] = useState("Trap R&B triste");
  const [intention, setIntention] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    setResult(null);

    if (!file) {
      setError("Envie uma gravação primeiro.");
      return;
    }

    const form = new FormData();
    form.append("audio", file);
    form.append("style", style);
    form.append("intention", intention);

    setLoading(true);

    try {
      const res = await fetch("/api/music-producer/analyze", {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao analisar áudio.");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="wrap">
      <section className="hero">
        <div className="badge">Sualuma Studio • privado</div>
        <h1>Produtor Musical IA</h1>
        <p>
          Envie uma gravação a capela ou uma ideia gravada no celular. A IA vai te devolver
          uma direção musical nova com acordes, instrumentos, baixo, bateria e efeitos de voz.
        </p>
      </section>

      <section className="grid">
        <div className="card">
          <h2>🎙️ Enviar gravação</h2>

          <label>Arquivo de áudio</label>
          <input
            type="file"
            accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />

          <label>Estilo desejado</label>
          <select value={style} onChange={(e) => setStyle(e.target.value)}>
            <option>Trap R&B triste</option>
            <option>Pop emocional</option>
            <option>Afrobeat leve</option>
            <option>Funk melody</option>
            <option>Gospel pop</option>
            <option>Reggaeton romântico</option>
            <option>Outro</option>
          </select>

          <label>O que você quer mudar?</label>
          <textarea
            value={intention}
            onChange={(e) => setIntention(e.target.value)}
            placeholder="Ex: quero deixar mais chique, menos genérico, mais triste, com cara de música pronta para lançar..."
          />

          <button onClick={submit} disabled={loading}>
            {loading ? "Analisando..." : "Criar direção musical"}
          </button>

          {error && <p className="error">{error}</p>}
        </div>

        <div className="card preview">
          <h2>🧠 Como ela vai trabalhar</h2>
          <ul>
            <li>Detectar a intenção da música.</li>
            <li>Sugerir BPM e tom provável.</li>
            <li>Criar acordes novos para não copiar beat.</li>
            <li>Indicar bateria, baixo, instrumentos e efeitos vocais.</li>
            <li>Gerar um plano para montar no BandLab ou FL Studio.</li>
          </ul>
        </div>
      </section>

      {result && (
        <section className="result">
          <div className="resultHead">
            <div>
              <span>Arquivo analisado</span>
              <h2>{result.fileName}</h2>
              <p>{result.sizeMB} MB • {result.style}</p>
            </div>
          </div>

          <div className="miniGrid">
            <Info title="BPM provável" value={result.analysis.bpm} />
            <Info title="Tom provável" value={result.analysis.key} />
            <Info title="Clima" value={result.analysis.mood} />
          </div>

          <Block title="🎼 Estrutura sugerida" items={result.analysis.structure} />
          <Block title="🎹 Acordes" items={result.analysis.chords} />
          <Block title="🥁 Bateria" items={result.analysis.drums} />
          <Block title="🔊 Baixo / 808" items={result.analysis.bass} />
          <Block title="✨ Instrumentos" items={result.analysis.instruments} />
          <Block title="🎤 Voz e efeitos" items={result.analysis.vocalEffects} />
          <Block title="📦 Plano de produção" items={result.analysis.productionPlan} />
        </section>
      )}

      <style jsx>{`
        .wrap {
          min-height: 100vh;
          padding: 42px 18px;
          background:
            radial-gradient(circle at top left, rgba(38, 97, 255, .25), transparent 35%),
            radial-gradient(circle at bottom right, rgba(168, 85, 247, .25), transparent 30%),
            #070914;
          color: white;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .hero, .grid, .result {
          max-width: 1120px;
          margin: 0 auto;
        }

        .hero {
          padding: 24px 0 32px;
        }

        .badge {
          display: inline-flex;
          padding: 8px 12px;
          border: 1px solid rgba(255,255,255,.16);
          border-radius: 999px;
          color: #a5b4fc;
          background: rgba(255,255,255,.06);
          margin-bottom: 18px;
          font-size: 13px;
        }

        h1 {
          font-size: clamp(36px, 7vw, 76px);
          line-height: .92;
          letter-spacing: -0.06em;
          margin: 0 0 18px;
        }

        .hero p {
          max-width: 760px;
          color: rgba(255,255,255,.72);
          font-size: 18px;
          line-height: 1.6;
        }

        .grid {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(280px, .8fr);
          gap: 18px;
        }

        .card, .result {
          border: 1px solid rgba(255,255,255,.12);
          background: rgba(255,255,255,.075);
          border-radius: 28px;
          padding: 24px;
          box-shadow: 0 20px 70px rgba(0,0,0,.28);
          backdrop-filter: blur(18px);
        }

        h2 {
          margin: 0 0 18px;
          font-size: 24px;
        }

        label {
          display: block;
          margin: 18px 0 8px;
          color: rgba(255,255,255,.72);
          font-size: 14px;
        }

        input, select, textarea {
          width: 100%;
          border: 1px solid rgba(255,255,255,.14);
          background: rgba(0,0,0,.35);
          color: white;
          border-radius: 16px;
          padding: 14px 15px;
          outline: none;
        }

        textarea {
          min-height: 110px;
          resize: vertical;
        }

        button {
          margin-top: 18px;
          width: 100%;
          border: none;
          border-radius: 18px;
          padding: 15px 18px;
          background: linear-gradient(135deg, #60a5fa, #a855f7);
          color: white;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 18px 36px rgba(96,165,250,.2);
        }

        button:disabled {
          opacity: .6;
          cursor: wait;
        }

        ul {
          padding-left: 18px;
          color: rgba(255,255,255,.74);
          line-height: 1.8;
        }

        .error {
          margin-top: 14px;
          color: #fecaca;
        }

        .result {
          margin-top: 18px;
        }

        .resultHead {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
        }

        .resultHead span {
          color: #a5b4fc;
          font-size: 13px;
        }

        .resultHead h2 {
          margin: 4px 0;
        }

        .resultHead p {
          color: rgba(255,255,255,.62);
          margin: 0;
        }

        .miniGrid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 14px;
        }

        .info, .block {
          border: 1px solid rgba(255,255,255,.1);
          background: rgba(0,0,0,.22);
          border-radius: 22px;
          padding: 18px;
        }

        .info span {
          display: block;
          color: rgba(255,255,255,.55);
          font-size: 12px;
          margin-bottom: 8px;
        }

        .info strong {
          font-size: 20px;
        }

        .block {
          margin-top: 12px;
        }

        .block h3 {
          margin: 0 0 12px;
        }

        .block li {
          margin-bottom: 6px;
        }

        @media (max-width: 820px) {
          .grid, .miniGrid {
            grid-template-columns: 1fr;
          }

          .wrap {
            padding-top: 24px;
          }
        }
      `}</style>
    </main>
  );
}

function Info({ title, value }: { title: string; value: string }) {
  return (
    <div className="info">
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Block({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="block">
      <h3>{title}</h3>
      <ul>
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
