"use client";

import { useState } from "react";

type AreaKey = "funil" | "precificacao" | "retencao" | "aquisicao";

const AREAS: Record<
  AreaKey,
  {
    icon: string;
    name: string;
    label: string;
    desc: string;
    sub: string;
  }
> = {
  funil: {
    icon: "🎯",
    name: "Funil de Vendas",
    label: "Funil de Vendas & Conversão",
    desc: "Conversão, jornada e pontos de fuga",
    sub: "Jornada do lead, pontos de fuga e taxa de fechamento",
  },
  precificacao: {
    icon: "💰",
    name: "Precificação",
    label: "Precificação & Planos",
    desc: "Planos, tickets e percepção de valor",
    sub: "Estrutura de preços, âncoras de valor e upsell",
  },
  retencao: {
    icon: "🔁",
    name: "Retenção & Churn",
    label: "Retenção & Churn",
    desc: "Engajamento, saída e LTV",
    sub: "Engajamento pós-compra, saída de usuários e LTV",
  },
  aquisicao: {
    icon: "📣",
    name: "Aquisição",
    label: "Aquisição & Marketing",
    desc: "Canais, conteúdo e captação de leads",
    sub: "Canais de entrada, conteúdo e captação de leads",
  },
};

type Result = {
  area: AreaKey;
  score: number;
  content: string;
  mode?: string;
};

function scoreClass(score: number) {
  if (score >= 70) return "high";
  if (score >= 45) return "mid";
  return "low";
}

function urgency(score: number) {
  if (score >= 70) return ["green", "✅ Bom"];
  if (score >= 45) return ["amber", "⚠ Atenção"];
  return ["red", "🔴 Crítico"];
}

function splitActions(content: string) {
  const index = content.indexOf("AÇÕES:");
  if (index === -1) {
    return {
      main: content,
      actions: [],
    };
  }

  const main = content.slice(0, index).trim();
  const rawActions = content.slice(index + 6).trim();

  const actions = rawActions
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^\d+\./.test(line))
    .map((line) => line.replace(/^\d+\.\s*/, ""));

  return { main, actions };
}

function formatBold(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    return <span key={index}>{part}</span>;
  });
}

export default function AgenteCrescimentoPage() {
  const [selected, setSelected] = useState<AreaKey[]>([
    "funil",
    "precificacao",
    "retencao",
    "aquisicao",
  ]);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);

  function toggleArea(area: AreaKey) {
    setSelected((current) =>
      current.includes(area)
        ? current.filter((item) => item !== area)
        : [...current, area]
    );
  }

  async function runDiagnosis() {
    if (selected.length === 0) {
      alert("Selecione ao menos uma área.");
      return;
    }

    setLoading(true);
    setResults([]);

    const responses = await Promise.all(
      selected.map(async (area) => {
        const res = await fetch("/api/agente-crescimento", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ area }),
        });

        const data = await res.json();

        return {
          area,
          score: data.score || 0,
          content:
            data.content ||
            "Não foi possível gerar a análise desta área agora.",
          mode: data.mode,
        } as Result;
      })
    );

    setResults(responses);
    setLoading(false);
  }

  return (
    <main className="growth-page">
      <header className="growth-header">
        <div className="logo">
          <div className="logoIcon">🌸</div>
          <span>Sualuma</span>
        </div>

        <div className="headerBadge">
          <div className="pulseDot" />
          Agente de Crescimento · MicroSaaS
        </div>
      </header>

      <section className="hero">
        <div className="eyebrow">⚡ Diagnóstico inteligente</div>
        <h1>
          O que vai fazer você <br />
          <span>vender mais</span> no Sualuma?
        </h1>
        <p>
          Selecione as áreas que quer analisar e o agente faz um diagnóstico
          completo do seu ecossistema — com scores, pontos críticos e ações
          prioritárias.
        </p>
      </section>

      <section className="areas">
        {(Object.keys(AREAS) as AreaKey[]).map((area) => {
          const item = AREAS[area];
          const isSelected = selected.includes(area);

          return (
            <button
              key={area}
              className={`areaCard ${isSelected ? "selected" : ""}`}
              onClick={() => toggleArea(area)}
              type="button"
            >
              <div className="areaCheck">✓</div>
              <div className="areaIcon">{item.icon}</div>
              <div className="areaName">{item.name}</div>
              <div className="areaDesc">{item.desc}</div>
            </button>
          );
        })}
      </section>

      <section className="analyzeWrap">
        <button
          className="analyzeBtn"
          onClick={runDiagnosis}
          disabled={loading}
          type="button"
        >
          <span>{loading ? "⏳" : "⚡"}</span>
          {loading ? "Analisando…" : results.length ? "Reanalisar" : "Gerar Diagnóstico Completo"}
        </button>
      </section>

      <section className="results">
        {(loading || results.length > 0) && (
          <div className="scoreOverview">
            <div className="scoreTitle">
              📊 Score Geral do Ecossistema <span>SUALUMA</span>
            </div>

            <div className="scoresGrid">
              {(loading ? selected : results.map((r) => r.area)).map((area) => {
                const result = results.find((r) => r.area === area);
                const score = result?.score || 0;
                const cls = result ? scoreClass(score) : "";

                return (
                  <div className="scoreItem" key={area}>
                    <div className="scoreTop">
                      <div className="scoreLabel">
                        {AREAS[area].icon} {AREAS[area].name}
                      </div>
                      <div className={`scoreVal ${cls}`}>
                        {result ? `${score}/100` : "—"}
                      </div>
                    </div>

                    <div className="barBg">
                      <div
                        className={`bar ${cls}`}
                        style={{ width: result ? `${score}%` : "0%" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {loading &&
          selected.map((area) => (
            <div className="loadingCard" key={area}>
              <div className="loadingTop">
                <div className="loadingIcon">{AREAS[area].icon}</div>
                <div>
                  <strong>{AREAS[area].label}</strong>
                  <small>Analisando…</small>
                </div>
              </div>
              <div className="sk sk1" />
              <div className="sk sk2" />
              <div className="sk sk3" />
              <div className="sk sk4" />
            </div>
          ))}

        {!loading &&
          results.map((result) => {
            const area = AREAS[result.area];
            const [badgeColor, badgeText] = urgency(result.score);
            const { main, actions } = splitActions(result.content);

            return (
              <article className="sectionCard" key={result.area}>
                <div className="sectionHeader">
                  <div className="sectionIcon">{area.icon}</div>
                  <div className="sectionMeta">
                    <h2>{area.label}</h2>
                    <p>{area.sub}</p>
                  </div>
                  <div className={`sectionBadge ${badgeColor}`}>
                    {badgeText}
                  </div>
                </div>

                <div className="sectionBody">
                  <div className="aiContent">{main}</div>

                  {actions.length > 0 && (
                    <>
                      <div className="actionsTitle">Ações prioritárias</div>
                      {actions.map((action, index) => (
                        <div className="actionItem" key={index}>
                          <div className="actionNum">{index + 1}</div>
                          <div className="actionText">{formatBold(action)}</div>
                        </div>
                      ))}
                    </>
                  )}

                  {result.mode && result.mode !== "ai" && (
                    <div className="fallbackNotice">
                      Rodando em modo seguro sem IA externa. Para ativar análise
                      completa, configure ANTHROPIC_API_KEY no servidor.
                    </div>
                  )}
                </div>
              </article>
            );
          })}
      </section>

      <footer className="growthFooter">
        <span>Agente conectado ao ecossistema Sualuma</span>
        <span>Estúdio interno · Growth Intelligence</span>
      </footer>

      <style jsx>{`
        .growth-page {
          --bg: #faf5ff;
          --surface: #ffffff;
          --surface2: #fdf0f8;
          --border: #f0d6ea;
          --rose: #e91e8c;
          --rose2: #ff6bb5;
          --roseDark: #b5156d;
          --plum: #6b1f5e;
          --text: #1a0a14;
          --muted: #9c6e8a;
          --success: #10b981;
          --warn: #f59e0b;
          --danger: #ef4444;
          min-height: 100vh;
          background:
            radial-gradient(ellipse 80% 40% at 50% -10%, rgba(233, 30, 140, 0.1), transparent 60%),
            radial-gradient(ellipse 40% 30% at 90% 80%, rgba(255, 107, 181, 0.08), transparent 55%),
            var(--bg);
          color: var(--text);
          font-family: "Plus Jakarta Sans", Inter, system-ui, sans-serif;
        }

        .growth-header {
          padding: 18px 36px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border);
          background: rgba(250, 245, 255, 0.92);
          backdrop-filter: blur(12px);
          position: sticky;
          top: 0;
          z-index: 20;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 18px;
          font-weight: 900;
          color: var(--roseDark);
        }

        .logoIcon {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: linear-gradient(135deg, var(--rose), var(--plum));
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(233, 30, 140, 0.35);
        }

        .headerBadge {
          display: flex;
          align-items: center;
          gap: 7px;
          background: linear-gradient(135deg, rgba(233, 30, 140, 0.1), rgba(107, 31, 94, 0.08));
          border: 1px solid rgba(233, 30, 140, 0.22);
          border-radius: 20px;
          padding: 7px 14px;
          font-size: 11px;
          font-weight: 700;
          color: var(--roseDark);
          letter-spacing: 0.04em;
        }

        .pulseDot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--rose);
          box-shadow: 0 0 8px var(--rose);
          animation: pulse 1.8s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(0.8); }
        }

        .hero {
          text-align: center;
          padding: 56px 24px 30px;
        }

        .eyebrow {
          display: inline-flex;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--rose);
          background: rgba(233, 30, 140, 0.07);
          border: 1px solid rgba(233, 30, 140, 0.18);
          border-radius: 20px;
          padding: 6px 14px;
          margin-bottom: 18px;
        }

        .hero h1 {
          font-size: clamp(30px, 4vw, 50px);
          line-height: 1.08;
          font-weight: 950;
          letter-spacing: -0.04em;
          margin-bottom: 14px;
        }

        .hero h1 span {
          color: var(--rose);
        }

        .hero p {
          font-size: 15px;
          color: var(--muted);
          max-width: 620px;
          margin: 0 auto;
          line-height: 1.7;
        }

        .areas {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          max-width: 920px;
          margin: 0 auto 28px;
          padding: 0 24px;
        }

        .areaCard {
          border-radius: 16px;
          padding: 15px;
          border: 1.5px solid var(--border);
          background: var(--surface);
          cursor: pointer;
          transition: 0.2s ease;
          text-align: left;
          position: relative;
          box-shadow: 0 10px 28px rgba(107, 31, 94, 0.04);
        }

        .areaCard:hover {
          border-color: rgba(233, 30, 140, 0.35);
          transform: translateY(-2px);
          box-shadow: 0 14px 34px rgba(233, 30, 140, 0.1);
        }

        .areaCard.selected {
          border-color: var(--rose);
          box-shadow: 0 0 0 3px rgba(233, 30, 140, 0.1);
        }

        .areaCheck {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--rose);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          opacity: 0;
        }

        .areaCard.selected .areaCheck {
          opacity: 1;
        }

        .areaIcon {
          font-size: 22px;
          margin-bottom: 8px;
        }

        .areaName {
          font-size: 12px;
          font-weight: 850;
          color: var(--text);
        }

        .areaDesc {
          font-size: 11px;
          color: var(--muted);
          margin-top: 4px;
          line-height: 1.4;
        }

        .analyzeWrap {
          text-align: center;
          margin-bottom: 38px;
        }

        .analyzeBtn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: linear-gradient(135deg, var(--rose), var(--plum));
          color: white;
          border: none;
          border-radius: 16px;
          padding: 15px 32px;
          font-size: 14px;
          font-weight: 850;
          cursor: pointer;
          box-shadow: 0 8px 26px rgba(233, 30, 140, 0.38);
          transition: 0.2s ease;
        }

        .analyzeBtn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 36px rgba(233, 30, 140, 0.48);
        }

        .analyzeBtn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .results {
          max-width: 920px;
          margin: 0 auto 60px;
          padding: 0 24px;
        }

        .scoreOverview,
        .sectionCard,
        .loadingCard {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 22px;
          box-shadow: 0 18px 45px rgba(107, 31, 94, 0.06);
        }

        .scoreOverview {
          padding: 28px 32px;
          margin-bottom: 20px;
        }

        .scoreTitle {
          font-size: 20px;
          font-weight: 900;
          margin-bottom: 20px;
        }

        .scoreTitle span {
          font-size: 11px;
          font-weight: 900;
          background: rgba(233, 30, 140, 0.1);
          color: var(--rose);
          border: 1px solid rgba(233, 30, 140, 0.2);
          padding: 4px 10px;
          border-radius: 20px;
          margin-left: 8px;
        }

        .scoresGrid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }

        .scoreItem {
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 15px 16px;
        }

        .scoreTop {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 10px;
        }

        .scoreLabel {
          font-size: 12px;
          font-weight: 850;
        }

        .scoreVal {
          font-size: 20px;
          font-weight: 950;
        }

        .scoreVal.high { color: var(--success); }
        .scoreVal.mid { color: var(--warn); }
        .scoreVal.low { color: var(--danger); }

        .barBg {
          height: 6px;
          background: var(--border);
          border-radius: 999px;
          overflow: hidden;
        }

        .bar {
          height: 100%;
          border-radius: 999px;
          transition: width 0.8s ease;
        }

        .bar.high { background: linear-gradient(90deg, #10b981, #34d399); }
        .bar.mid { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
        .bar.low { background: linear-gradient(90deg, #ef4444, #f87171); }

        .sectionCard,
        .loadingCard {
          margin-bottom: 18px;
          overflow: hidden;
        }

        .sectionHeader {
          padding: 20px 24px 16px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .sectionIcon,
        .loadingIcon {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          background: rgba(233, 30, 140, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }

        .sectionMeta {
          flex: 1;
        }

        .sectionMeta h2 {
          font-size: 15px;
          margin: 0 0 3px;
        }

        .sectionMeta p {
          font-size: 11px;
          color: var(--muted);
          margin: 0;
        }

        .sectionBadge {
          font-size: 10px;
          font-weight: 900;
          padding: 5px 10px;
          border-radius: 999px;
          white-space: nowrap;
        }

        .sectionBadge.red {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .sectionBadge.amber {
          background: rgba(245, 158, 11, 0.1);
          color: #d97706;
          border: 1px solid rgba(245, 158, 11, 0.2);
        }

        .sectionBadge.green {
          background: rgba(16, 185, 129, 0.1);
          color: #059669;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .sectionBody {
          padding: 22px 24px;
        }

        .aiContent {
          font-size: 13.5px;
          line-height: 1.75;
          color: #2d1a28;
          white-space: pre-wrap;
        }

        .actionsTitle {
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--muted);
          margin: 20px 0 10px;
        }

        .actionItem {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 11px 12px;
          border-radius: 12px;
          background: var(--surface2);
          border: 1px solid var(--border);
          margin-bottom: 8px;
        }

        .actionNum {
          width: 22px;
          height: 22px;
          border-radius: 7px;
          background: linear-gradient(135deg, var(--rose), var(--plum));
          color: white;
          font-size: 11px;
          font-weight: 900;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .actionText {
          font-size: 12.8px;
          line-height: 1.55;
        }

        .actionText strong {
          color: var(--roseDark);
        }

        .fallbackNotice {
          margin-top: 18px;
          padding: 10px 12px;
          border-radius: 12px;
          background: rgba(245, 158, 11, 0.1);
          color: #92400e;
          border: 1px solid rgba(245, 158, 11, 0.25);
          font-size: 12px;
          line-height: 1.5;
        }

        .loadingCard {
          padding: 24px;
        }

        .loadingTop {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-bottom: 16px;
        }

        .loadingTop small {
          display: block;
          color: var(--muted);
          margin-top: 3px;
        }

        .sk {
          height: 12px;
          margin-bottom: 10px;
          border-radius: 8px;
          background: linear-gradient(90deg, var(--border), #fff, var(--border));
          background-size: 200% 100%;
          animation: shimmer 1.4s ease-in-out infinite;
        }

        .sk1 { width: 90%; }
        .sk2 { width: 75%; }
        .sk3 { width: 83%; }
        .sk4 { width: 60%; }

        @keyframes shimmer {
          from { background-position: 200% 0; }
          to { background-position: -200% 0; }
        }

        .growthFooter {
          padding: 16px 36px;
          border-top: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11px;
          color: var(--muted);
          background: rgba(250, 245, 255, 0.8);
        }

        @media (max-width: 860px) {
          .areas,
          .scoresGrid {
            grid-template-columns: repeat(2, 1fr);
          }

          .growth-header,
          .growthFooter {
            padding-left: 18px;
            padding-right: 18px;
          }
        }

        @media (max-width: 560px) {
          .growth-header {
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
          }

          .areas,
          .scoresGrid {
            grid-template-columns: 1fr;
          }

          .sectionHeader {
            align-items: flex-start;
            flex-wrap: wrap;
          }

          .growthFooter {
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
          }
        }
      `}</style>
    </main>
  );
}
