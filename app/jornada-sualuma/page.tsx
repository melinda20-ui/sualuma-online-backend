"use client";

import { useMemo, useState } from "react";

const paths = [
  {
    id: "vendas",
    color: "Dourado",
    emoji: "💰",
    title: "Quero mais dinheiro e vendas, mas não tenho time pra me ajudar",
    diagnosis: "Você precisa transformar sua presença digital em uma máquina simples de vendas.",
    offer: "Site profissional, landing page, funil, microSaaS sob medida ou campanha de lançamento.",
    cta: "Quero vender melhor com a Sualuma"
  },
  {
    id: "solo",
    color: "Azul",
    emoji: "🤖",
    title: "Quero empreender sozinha, mas não sei o que fazer para conseguir",
    diagnosis: "Você precisa de direção, IA e um sistema que trabalhe junto com você.",
    offer: "Mia, agentes de IA, automações, templates e plano de execução guiado.",
    cta: "Quero meu sistema IA"
  },
  {
    id: "rotina",
    color: "Roxo",
    emoji: "🧠",
    title: "Tenho tudo, mas minha rotina está confusa na hora de trabalhar",
    diagnosis: "Você não precisa de mais ideias agora. Precisa transformar caos em execução.",
    offer: "FlowMind, painel de tarefas, automações e organização da rotina empreendedora.",
    cta: "Quero organizar minha rotina"
  },
  {
    id: "inicio",
    color: "Verde",
    emoji: "🌱",
    title: "Estou começando agora a empreender",
    diagnosis: "Você precisa começar com uma estrutura simples, sem tentar fazer tudo ao mesmo tempo.",
    offer: "Cursos profissionalizantes, templates, trilhas práticas e primeira presença digital.",
    cta: "Quero começar do jeito certo"
  },
  {
    id: "time",
    color: "Laranja",
    emoji: "🧩",
    title: "Preciso de gente para me ajudar, mas não quero ou não consigo contratar CLT",
    diagnosis: "Você precisa de apoio sob demanda, sem peso de contratação fixa.",
    offer: "Marketplace de prestadores, serviços internos, SOS Publicidade e time por projeto.",
    cta: "Quero encontrar ajuda"
  }
];

export default function JornadaSualumaPage() {
  const [selected, setSelected] = useState<(typeof paths)[number] | null>(null);

  const progress = useMemo(() => (selected ? 100 : 25), [selected]);

  return (
    <main className="page">
      <section className="hero">
        <div className="robotWrap" aria-hidden="true">
          <div className="orb" />
          <div className="robot">
            <div className="antenna" />
            <div className="face">
              <span />
              <span />
            </div>
            <div className="mouth" />
          </div>
        </div>

        <p className="eyebrow">Jornada Sualuma</p>
        <h1>Descubra sua cor empreendedora</h1>
        <p className="subtitle">
          Escolha o caminho que mais parece com você hoje. A Mia vai te mostrar qual próximo passo faz mais sentido:
          vender mais, organizar rotina, usar IA, estudar ou montar um time sob demanda.
        </p>

        <div className="progress">
          <div style={{ width: `${progress}%` }} />
        </div>
      </section>

      {!selected ? (
        <section className="choices">
          <div className="sectionTitle">
            <p>Primeira escolha</p>
            <h2>Qual caminho vamos seguir?</h2>
          </div>

          <div className="grid">
            {paths.map((item) => (
              <button className="choice" key={item.id} onClick={() => setSelected(item)}>
                <span className="emoji">{item.emoji}</span>
                <strong>{item.title}</strong>
                <small>Toque para descobrir sua cor</small>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section className="result">
          <button className="back" onClick={() => setSelected(null)}>← Trocar caminho</button>

          <article className="resultCard">
            <p className="eyebrow">Resultado inicial</p>
            <h2>
              Sua cor é <span>{selected.color}</span>
            </h2>
            <p className="diagnosis">{selected.diagnosis}</p>

            <div className="offer">
              <strong>Próximo passo recomendado</strong>
              <p>{selected.offer}</p>
            </div>

            <form className="leadBox">
              <p>Quer receber seu plano completo?</p>
              <div>
                <input placeholder="Seu nome" />
                <input placeholder="Seu WhatsApp ou e-mail" />
              </div>
              <button type="button">{selected.cta}</button>
            </form>
          </article>
        </section>
      )}

      <style jsx>{`
        .page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(124, 58, 237, .28), transparent 34%),
            radial-gradient(circle at top right, rgba(14, 165, 233, .2), transparent 32%),
            #070816;
          color: white;
          padding: 32px;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .hero {
          max-width: 980px;
          margin: 0 auto;
          text-align: center;
          padding: 42px 0 20px;
          position: relative;
        }

        .eyebrow {
          text-transform: uppercase;
          letter-spacing: .16em;
          font-size: 12px;
          color: #9cc9ff;
          font-weight: 800;
        }

        h1 {
          font-size: clamp(38px, 8vw, 86px);
          line-height: .9;
          margin: 12px 0 18px;
        }

        .subtitle {
          max-width: 780px;
          margin: 0 auto;
          color: #c7d2fe;
          font-size: 18px;
          line-height: 1.7;
        }

        .progress {
          max-width: 520px;
          height: 10px;
          border-radius: 999px;
          margin: 28px auto 0;
          background: rgba(255,255,255,.1);
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.12);
        }

        .progress div {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #38bdf8, #a78bfa, #facc15);
          transition: width .4s ease;
        }

        .robotWrap {
          width: 126px;
          height: 126px;
          margin: 0 auto 18px;
          position: relative;
          display: grid;
          place-items: center;
        }

        .orb {
          position: absolute;
          inset: 0;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(56,189,248,.25), rgba(167,139,250,.08), transparent);
          animation: pulse 2.4s ease-in-out infinite;
        }

        .robot {
          width: 84px;
          height: 74px;
          border-radius: 28px;
          background: linear-gradient(145deg, #111827, #312e81);
          border: 1px solid rgba(255,255,255,.22);
          box-shadow: 0 0 42px rgba(124,58,237,.55);
          position: relative;
          animation: float 3s ease-in-out infinite;
        }

        .antenna {
          position: absolute;
          top: -24px;
          left: 50%;
          width: 2px;
          height: 22px;
          background: #93c5fd;
        }

        .antenna:after {
          content: "";
          position: absolute;
          top: -8px;
          left: -5px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #facc15;
          box-shadow: 0 0 18px #facc15;
        }

        .face {
          display: flex;
          justify-content: center;
          gap: 14px;
          padding-top: 24px;
        }

        .face span {
          width: 13px;
          height: 13px;
          border-radius: 50%;
          background: #67e8f9;
          box-shadow: 0 0 14px #67e8f9;
        }

        .mouth {
          width: 30px;
          height: 6px;
          border-radius: 999px;
          background: rgba(255,255,255,.75);
          margin: 14px auto 0;
        }

        .choices,
        .result {
          max-width: 1180px;
          margin: 0 auto;
        }

        .sectionTitle {
          text-align: center;
          margin: 28px 0;
        }

        .sectionTitle p {
          color: #93c5fd;
          font-weight: 800;
        }

        .sectionTitle h2 {
          font-size: clamp(28px, 5vw, 54px);
          margin: 4px 0;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 16px;
        }

        .choice {
          min-height: 230px;
          border: 1px solid rgba(255,255,255,.14);
          background: rgba(255,255,255,.06);
          color: white;
          border-radius: 30px;
          padding: 22px;
          text-align: left;
          cursor: pointer;
          backdrop-filter: blur(18px);
          transition: transform .2s ease, border-color .2s ease, background .2s ease;
        }

        .choice:hover {
          transform: translateY(-6px);
          border-color: rgba(125, 211, 252, .8);
          background: rgba(255,255,255,.1);
        }

        .emoji {
          font-size: 34px;
          display: block;
          margin-bottom: 18px;
        }

        .choice strong {
          display: block;
          font-size: 18px;
          line-height: 1.25;
        }

        .choice small {
          display: block;
          margin-top: 18px;
          color: #c4b5fd;
        }

        .back {
          background: transparent;
          color: #bfdbfe;
          border: 1px solid rgba(255,255,255,.18);
          border-radius: 999px;
          padding: 12px 18px;
          cursor: pointer;
          margin-bottom: 18px;
        }

        .resultCard {
          max-width: 820px;
          margin: 0 auto;
          padding: 34px;
          border-radius: 36px;
          border: 1px solid rgba(255,255,255,.16);
          background: linear-gradient(145deg, rgba(255,255,255,.12), rgba(255,255,255,.05));
          box-shadow: 0 28px 100px rgba(0,0,0,.35);
        }

        .resultCard h2 {
          font-size: clamp(34px, 7vw, 72px);
          margin: 4px 0 14px;
        }

        .resultCard h2 span {
          color: #facc15;
        }

        .diagnosis {
          color: #dbeafe;
          font-size: 20px;
          line-height: 1.6;
        }

        .offer,
        .leadBox {
          margin-top: 22px;
          padding: 22px;
          border-radius: 24px;
          background: rgba(0,0,0,.22);
          border: 1px solid rgba(255,255,255,.1);
        }

        .offer p,
        .leadBox p {
          color: #e0e7ff;
        }

        .leadBox div {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin: 14px 0;
        }

        input {
          width: 100%;
          border: 1px solid rgba(255,255,255,.16);
          background: rgba(255,255,255,.08);
          color: white;
          border-radius: 16px;
          padding: 14px;
        }

        .leadBox button {
          border: 0;
          border-radius: 999px;
          padding: 14px 20px;
          font-weight: 900;
          color: #08111f;
          background: linear-gradient(90deg, #67e8f9, #facc15);
          cursor: pointer;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(.96); opacity: .7; }
          50% { transform: scale(1.08); opacity: 1; }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @media (max-width: 980px) {
          .grid {
            grid-template-columns: 1fr;
          }

          .choice {
            min-height: auto;
          }

          .leadBox div {
            grid-template-columns: 1fr;
          }

          .page {
            padding: 20px;
          }
        }
      `}</style>
    </main>
  );
}
