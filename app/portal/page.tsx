"use client";

import Link from "next/link";

const cards = [
  {
    title: "Cliente IA",
    desc: "Acessar agentes, Mia, automações e benefícios de IA.",
    href: "https://dashboardcliente.sualuma.online/member-user",
    tag: "Cliente IA",
    external: true,
  },
  {
    title: "Prestador",
    desc: "Gerenciar serviços, propostas, entregas e oportunidades.",
    href: "https://meuservico.sualuma.online/provider-services",
    tag: "Prestador",
    external: true,
  },
  {
    title: "FlowMind",
    desc: "Seu GPS Mental — rotina, empresa e metas num painel com IA e agentes que agem.",
    href: "https://app.sualuma.online/flowmind",
    tag: "FlowMind",
    external: true,
  },
  {
    title: "Comunidade",
    desc: "Participe do feed, publique trabalhos, comente e conecte-se com pessoas.",
    href: "https://trabalhosja.sualuma.online",
    tag: "Comunidade",
    external: true,
  },
  {
    title: "Chat Inteligente",
    desc: "Converse com a IA do sistema para planejar, pedir ajuda e acelerar tarefas.",
    href: "/chat",
    tag: "IA",
    external: false,
  },
  {
    title: "Edite Vídeos com IA",
    desc: "Acesse o editor com IA para transformar conteúdo em vídeos com mais agilidade.",
    href: "/video-editor",
    tag: "Vídeo",
    external: false,
  },
];

const systemModules = [
  "Core",
  "CRM",
  "Chat",
  "IA",
  "Mídia",
  "Leads",
  "Vídeos",
  "Ops",
];

const moneyParticles = new Array(14).fill(0);

export default function PortalPage() {
  return (
    <div className="portal-page">
      <div className="ambient ambient-1" />
      <div className="ambient ambient-2" />
      <div className="ambient ambient-3" />
      <div className="mesh" />
      <div className="gridLines" />

      <main className="shell">
        <section className="hero">
          <div className="heroBadge">PORTAL INTELIGENTE • SUALUMA</div>

          <h1>
            Escolha para onde
            <span> você quer ir</span>
          </h1>

          <p className="heroText">
            Uma central elegante e inteligente para acessar seus dashboards,
            sua empresa, a comunidade, o chat e as ferramentas de vídeo com IA.
          </p>
        </section>

        <section className="cardsGrid">
          {cards.map((card) => {
            const content = (
              <>
                <div className="cardTop">
                  <span className="cardTag">{card.tag}</span>
                  <span className="cardArrow">↗</span>
                </div>

                <h3>{card.title}</h3>
                <p>{card.desc}</p>

                <div className="cardFooter">
                  <span>Acessar agora</span>
                </div>
              </>
            );

            return card.external ? (
              <a
                key={card.title}
                href={card.href}
                target="_blank"
                rel="noreferrer"
                className="card"
              >
                {content}
              </a>
            ) : (
              <Link key={card.title} href={card.href} className="card">
                {content}
              </Link>
            );
          })}
        </section>

        <section className="sceneSection">
          <div className="sceneInfo">
            <div className="sceneMini">AUTOMAÇÃO VISUAL</div>
            <h2>Seu sistema sendo montado em tempo real</h2>
            <p>
              Enquanto você escolhe para onde ir, o sistema aparece sendo
              construído, os módulos se encaixam e, quando o dinheiro entra, o
              robô comemora feliz antes de reiniciar a cena.
            </p>

            <div className="scenePills">
              <span>Mais profissional</span>
              <span>Mais legível</span>
              <span>Mais fluido</span>
              <span>Mais vivo</span>
            </div>
          </div>

          <div className="sceneStage">
            <div className="stageGlow" />
            <div className="stageFloor" />
            <div className="stageFrame">
              <div className="systemArea">
                <div className="systemHeader">
                  <span className="dot red" />
                  <span className="dot yellow" />
                  <span className="dot green" />
                  <div className="systemLabel">Construindo sistema...</div>
                </div>

                <div className="systemBoard">
                  {systemModules.map((item, index) => (
                    <div
                      key={item}
                      className="module"
                      style={{ ["--delay" as any]: `${index * 0.16}s` }}
                    >
                      {item}
                    </div>
                  ))}

                  <div className="beam beamA" />
                  <div className="beam beamB" />
                  <div className="beam beamC" />
                </div>

                <div className="systemFooter">
                  <span>status: online</span>
                  <span>build: premium v1</span>
                </div>
              </div>

              <div className="robotArea">
                <div className="speechBubble">
                  Sistema montado. Receita entrando!
                </div>

                <div className="robotWrap">
                  <div className="robot">
                    <div className="robotAntenna" />
                    <div className="robotHead">
                      <div className="robotEyes">
                        <span className="eye left" />
                        <span className="eye right" />
                      </div>
                      <div className="robotMouth" />
                    </div>

                    <div className="robotBody">
                      <div className="robotCore" />
                    </div>

                    <div className="arm leftArm">
                      <span className="forearm" />
                    </div>
                    <div className="arm rightArm">
                      <span className="forearm" />
                    </div>

                    <div className="leg leftLeg" />
                    <div className="leg rightLeg" />
                  </div>
                </div>

                <div className="moneyBurst">
                  {moneyParticles.map((_, i) => (
                    <span
                      key={i}
                      className="money"
                      style={{ ["--i" as any]: i }}
                    >
                      $
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <style jsx>{`
        .portal-page {
          position: relative;
          min-height: 100vh;
          overflow: hidden;
          color: #f8fafc;
          background:
            radial-gradient(circle at 15% 20%, rgba(59, 130, 246, 0.18), transparent 30%),
            radial-gradient(circle at 85% 15%, rgba(236, 72, 153, 0.16), transparent 28%),
            radial-gradient(circle at 70% 78%, rgba(34, 197, 94, 0.14), transparent 30%),
            linear-gradient(180deg, #07111f 0%, #081423 38%, #050911 100%);
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .ambient {
          position: absolute;
          border-radius: 999px;
          filter: blur(70px);
          opacity: 0.85;
          pointer-events: none;
        }

        .ambient-1 {
          width: 360px;
          height: 360px;
          top: -80px;
          left: -80px;
          background: rgba(37, 99, 235, 0.28);
          animation: floatGlow 14s ease-in-out infinite;
        }

        .ambient-2 {
          width: 300px;
          height: 300px;
          top: 20%;
          right: -80px;
          background: rgba(236, 72, 153, 0.2);
          animation: floatGlow 16s ease-in-out infinite reverse;
        }

        .ambient-3 {
          width: 340px;
          height: 340px;
          bottom: -120px;
          left: 32%;
          background: rgba(34, 197, 94, 0.18);
          animation: floatGlow 18s ease-in-out infinite;
        }

        .mesh {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 38px 38px;
          mask-image: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent 92%);
          opacity: 0.28;
          pointer-events: none;
        }

        .gridLines {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.025) 45%, transparent 100%);
          pointer-events: none;
        }

        .shell {
          position: relative;
          z-index: 2;
          width: min(1220px, calc(100% - 32px));
          margin: 0 auto;
          padding: 54px 0 70px;
        }

        .hero {
          text-align: center;
          max-width: 860px;
          margin: 0 auto 34px;
        }

        .heroBadge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 9px 16px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.06);
          color: #a5d8ff;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.14em;
          margin-bottom: 18px;
          backdrop-filter: blur(14px);
          text-transform: uppercase;
        }

        .hero h1 {
          margin: 0;
          font-size: clamp(2.2rem, 4vw, 4.3rem);
          line-height: 1.03;
          letter-spacing: -0.04em;
          font-weight: 900;
        }

        .hero h1 span {
          display: block;
          background: linear-gradient(90deg, #8b5cf6 0%, #38bdf8 30%, #22c55e 65%, #f59e0b 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .heroText {
          margin: 18px auto 0;
          font-size: clamp(1rem, 1.35vw, 1.12rem);
          line-height: 1.75;
          color: rgba(226, 232, 240, 0.86);
          max-width: 760px;
        }

        .cardsGrid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-top: 28px;
        }

        .card {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 212px;
          padding: 20px;
          border-radius: 24px;
          text-decoration: none;
          color: #f8fafc;
          background:
            linear-gradient(180deg, rgba(15, 23, 42, 0.84), rgba(9, 15, 28, 0.92));
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow:
            0 18px 60px rgba(0,0,0,0.30),
            inset 0 1px 0 rgba(255,255,255,0.06);
          transition:
            transform 0.28s ease,
            border-color 0.28s ease,
            box-shadow 0.28s ease,
            background 0.28s ease;
          overflow: hidden;
          backdrop-filter: blur(14px);
        }

        .card::before {
          content: "";
          position: absolute;
          inset: -1px;
          border-radius: inherit;
          padding: 1px;
          background: linear-gradient(135deg, rgba(56,189,248,0.28), rgba(168,85,247,0.2), rgba(34,197,94,0.22));
          -webkit-mask:
            linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0.85;
          pointer-events: none;
        }

        .card:hover {
          transform: translateY(-6px);
          border-color: rgba(255,255,255,0.14);
          box-shadow:
            0 24px 80px rgba(0,0,0,0.34),
            0 0 30px rgba(59, 130, 246, 0.08),
            inset 0 1px 0 rgba(255,255,255,0.08);
          background:
            linear-gradient(180deg, rgba(18, 28, 52, 0.92), rgba(8, 14, 26, 0.96));
        }

        .cardTop {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .cardTag {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 7px 12px;
          border-radius: 999px;
          background: rgba(255,255,255,0.07);
          color: #bfdbfe;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.04em;
        }

        .cardArrow {
          font-size: 1.2rem;
          color: rgba(255,255,255,0.7);
        }

        .card h3 {
          margin: 0 0 12px;
          font-size: 1.2rem;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .card p {
          margin: 0;
          color: rgba(226,232,240,0.82);
          line-height: 1.65;
          font-size: 0.97rem;
        }

        .cardFooter {
          margin-top: 22px;
          padding-top: 16px;
          border-top: 1px solid rgba(255,255,255,0.08);
          color: #c4b5fd;
          font-weight: 700;
          font-size: 0.96rem;
        }

        .sceneSection {
          margin-top: 30px;
          display: grid;
          grid-template-columns: 0.95fr 1.25fr;
          gap: 18px;
          align-items: stretch;
        }

        .sceneInfo,
        .sceneStage {
          border-radius: 28px;
          border: 1px solid rgba(255,255,255,0.08);
          background:
            linear-gradient(180deg, rgba(10,16,30,0.88), rgba(6,11,20,0.95));
          box-shadow:
            0 18px 60px rgba(0,0,0,0.3),
            inset 0 1px 0 rgba(255,255,255,0.05);
          backdrop-filter: blur(14px);
          overflow: hidden;
        }

        .sceneInfo {
          padding: 28px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .sceneMini {
          color: #67e8f9;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          margin-bottom: 14px;
        }

        .sceneInfo h2 {
          margin: 0;
          font-size: clamp(1.55rem, 2.4vw, 2.25rem);
          line-height: 1.1;
          font-weight: 900;
          letter-spacing: -0.03em;
        }

        .sceneInfo p {
          margin: 16px 0 0;
          color: rgba(226,232,240,0.82);
          line-height: 1.75;
          font-size: 1rem;
        }

        .scenePills {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 22px;
        }

        .scenePills span {
          padding: 10px 14px;
          border-radius: 999px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
          color: #e2e8f0;
          font-size: 0.92rem;
          font-weight: 700;
        }

        .sceneStage {
          position: relative;
          min-height: 460px;
          padding: 26px;
        }

        .stageGlow {
          position: absolute;
          width: 400px;
          height: 220px;
          background: radial-gradient(circle, rgba(59,130,246,0.20), transparent 70%);
          top: 28px;
          left: 50%;
          transform: translateX(-50%);
          filter: blur(20px);
          pointer-events: none;
        }

        .stageFloor {
          position: absolute;
          left: 26px;
          right: 26px;
          bottom: 22px;
          height: 100px;
          border-radius: 24px;
          background:
            linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)),
            radial-gradient(circle at 50% 40%, rgba(59,130,246,0.16), transparent 60%);
          border: 1px solid rgba(255,255,255,0.05);
          opacity: 0.85;
        }

        .stageFrame {
          position: relative;
          z-index: 2;
          height: 100%;
          display: grid;
          grid-template-columns: 1.15fr 0.95fr;
          gap: 18px;
          align-items: center;
        }

        .systemArea {
          position: relative;
          border-radius: 22px;
          background:
            linear-gradient(180deg, rgba(8,13,24,0.95), rgba(4,8,15,0.96));
          border: 1px solid rgba(255,255,255,0.07);
          overflow: hidden;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
        }

        .systemHeader,
        .systemFooter {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 14px;
          background: rgba(255,255,255,0.03);
        }

        .systemFooter {
          justify-content: space-between;
          color: rgba(191, 219, 254, 0.82);
          font-size: 12px;
          letter-spacing: 0.03em;
        }

        .dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          display: inline-block;
        }

        .red { background: #fb7185; }
        .yellow { background: #fbbf24; }
        .green { background: #4ade80; }

        .systemLabel {
          margin-left: 6px;
          color: #dbeafe;
          font-size: 0.94rem;
          font-weight: 700;
        }

        .systemBoard {
          position: relative;
          min-height: 270px;
          padding: 18px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          align-content: start;
        }

        .module {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 58px;
          border-radius: 16px;
          background:
            linear-gradient(180deg, rgba(30,41,59,0.95), rgba(15,23,42,0.95));
          border: 1px solid rgba(148,163,184,0.16);
          color: #f8fafc;
          font-size: 0.96rem;
          font-weight: 800;
          letter-spacing: 0.02em;
          opacity: 0;
          transform: translateY(12px) scale(0.95);
          animation: moduleIn 6s ease-in-out infinite;
          animation-delay: var(--delay);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.05),
            0 10px 20px rgba(0,0,0,0.18);
        }

        .beam {
          position: absolute;
          height: 2px;
          border-radius: 999px;
          background: linear-gradient(90deg, transparent, rgba(56,189,248,0.9), transparent);
          box-shadow: 0 0 18px rgba(56,189,248,0.55);
          opacity: 0;
          animation: beamPulse 6s linear infinite;
        }

        .beamA {
          width: 58%;
          left: 18%;
          top: 36%;
          animation-delay: 1.1s;
        }

        .beamB {
          width: 62%;
          left: 14%;
          top: 54%;
          animation-delay: 2s;
        }

        .beamC {
          width: 48%;
          left: 24%;
          top: 72%;
          animation-delay: 3s;
        }

        .robotArea {
          position: relative;
          min-height: 360px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .speechBubble {
          position: absolute;
          top: 22px;
          right: 28px;
          max-width: 240px;
          padding: 14px 16px;
          border-radius: 18px;
          background: rgba(10,16,28,0.92);
          border: 1px solid rgba(255,255,255,0.08);
          color: #e2e8f0;
          font-size: 0.95rem;
          line-height: 1.5;
          box-shadow: 0 16px 40px rgba(0,0,0,0.22);
          animation: speechSwap 6s ease-in-out infinite;
          z-index: 4;
        }

        .speechBubble::after {
          content: "";
          position: absolute;
          left: 26px;
          bottom: -8px;
          width: 18px;
          height: 18px;
          background: rgba(10,16,28,0.92);
          border-right: 1px solid rgba(255,255,255,0.08);
          border-bottom: 1px solid rgba(255,255,255,0.08);
          transform: rotate(45deg);
        }

        .robotWrap {
          position: relative;
          width: 170px;
          height: 235px;
          animation: robotTravel 6s ease-in-out infinite;
          z-index: 3;
        }

        .robot {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 116px;
          height: 178px;
          transform: translate(-50%, -50%);
          animation: robotBounce 1.8s ease-in-out infinite;
        }

        .robotAntenna {
          position: absolute;
          top: -18px;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 18px;
          background: linear-gradient(180deg, #94a3b8, #e2e8f0);
          border-radius: 999px;
        }

        .robotAntenna::before {
          content: "";
          position: absolute;
          top: -7px;
          left: 50%;
          transform: translateX(-50%);
          width: 12px;
          height: 12px;
          border-radius: 999px;
          background: #38bdf8;
          box-shadow: 0 0 14px rgba(56,189,248,0.75);
        }

        .robotHead {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100px;
          height: 74px;
          border-radius: 24px;
          background:
            linear-gradient(180deg, #dfe9f6 0%, #b7c8df 100%);
          box-shadow:
            inset 0 2px 0 rgba(255,255,255,0.6),
            0 10px 20px rgba(0,0,0,0.16);
        }

        .robotEyes {
          position: absolute;
          top: 24px;
          left: 50%;
          transform: translateX(-50%);
          width: 58px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .eye {
          width: 14px;
          height: 14px;
          border-radius: 999px;
          background: #0f172a;
          box-shadow: inset 0 0 0 4px #22d3ee;
          animation: blink 6s infinite;
        }

        .robotMouth {
          position: absolute;
          left: 50%;
          bottom: 14px;
          transform: translateX(-50%);
          width: 30px;
          height: 10px;
          border-bottom: 4px solid #0f172a;
          border-radius: 0 0 24px 24px;
          animation: smileBoost 6s ease-in-out infinite;
        }

        .robotBody {
          position: absolute;
          top: 82px;
          left: 50%;
          transform: translateX(-50%);
          width: 92px;
          height: 66px;
          border-radius: 22px;
          background:
            linear-gradient(180deg, #dbe6f3 0%, #aebfd8 100%);
          box-shadow:
            inset 0 2px 0 rgba(255,255,255,0.55),
            0 10px 20px rgba(0,0,0,0.14);
        }

        .robotCore {
          position: absolute;
          inset: 18px 24px;
          border-radius: 14px;
          background: linear-gradient(180deg, #0ea5e9, #2563eb);
          box-shadow:
            0 0 18px rgba(37,99,235,0.4),
            inset 0 1px 0 rgba(255,255,255,0.35);
          animation: coreGlow 2.2s ease-in-out infinite;
        }

        .arm {
          position: absolute;
          top: 92px;
          width: 18px;
          height: 54px;
          border-radius: 999px;
          background: linear-gradient(180deg, #dbe6f3 0%, #afc0d6 100%);
          transform-origin: top center;
        }

        .arm .forearm {
          position: absolute;
          bottom: -16px;
          left: 50%;
          transform: translateX(-50%);
          width: 16px;
          height: 28px;
          border-radius: 999px;
          background: linear-gradient(180deg, #dbe6f3 0%, #afc0d6 100%);
        }

        .leftArm {
          left: 2px;
          animation: leftArmWave 6s ease-in-out infinite;
        }

        .rightArm {
          right: 2px;
          animation: rightArmWave 6s ease-in-out infinite;
        }

        .leg {
          position: absolute;
          top: 144px;
          width: 18px;
          height: 42px;
          border-radius: 999px;
          background: linear-gradient(180deg, #dbe6f3 0%, #afc0d6 100%);
          transform-origin: top center;
        }

        .leftLeg {
          left: 31px;
          animation: leftLegMove 6s ease-in-out infinite;
        }

        .rightLeg {
          right: 31px;
          animation: rightLegMove 6s ease-in-out infinite;
        }

        .moneyBurst {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .money {
          --x: calc((var(--i) - 7) * 16px);
          position: absolute;
          left: 54%;
          top: 52%;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 999px;
          background: linear-gradient(180deg, #fde68a, #f59e0b);
          color: #2b1600;
          font-weight: 900;
          font-size: 14px;
          box-shadow:
            0 10px 24px rgba(245,158,11,0.3),
            inset 0 1px 0 rgba(255,255,255,0.45);
          opacity: 0;
          animation: moneyBurst 6s ease-in-out infinite;
          animation-delay: calc(var(--i) * 0.05s);
        }

        @keyframes floatGlow {
          0%, 100% { transform: translate3d(0,0,0) scale(1); }
          50% { transform: translate3d(12px, -18px, 0) scale(1.08); }
        }

        @keyframes moduleIn {
          0%, 8% {
            opacity: 0;
            transform: translateY(14px) scale(0.94);
          }
          14%, 58% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          72%, 100% {
            opacity: 0.85;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes beamPulse {
          0%, 16% {
            opacity: 0;
            transform: scaleX(0.3);
          }
          24%, 42% {
            opacity: 1;
            transform: scaleX(1);
          }
          55%, 100% {
            opacity: 0;
            transform: scaleX(1.08);
          }
        }

        @keyframes robotTravel {
          0%, 18% {
            transform: translateX(0) translateY(0);
          }
          32% {
            transform: translateX(-10px) translateY(-2px);
          }
          44% {
            transform: translateX(-8px) translateY(-10px);
          }
          56% {
            transform: translateX(20px) translateY(-2px);
          }
          68% {
            transform: translateX(34px) translateY(0);
          }
          82% {
            transform: translateX(0) translateY(0);
          }
          100% {
            transform: translateX(0) translateY(0);
          }
        }

        @keyframes robotBounce {
          0%, 100% { transform: translate(-50%, -50%) translateY(0); }
          50% { transform: translate(-50%, -50%) translateY(-6px); }
        }

        @keyframes blink {
          0%, 41%, 46%, 100% {
            transform: scaleY(1);
          }
          43% {
            transform: scaleY(0.12);
          }
        }

        @keyframes smileBoost {
          0%, 32% {
            width: 30px;
          }
          40%, 58% {
            width: 38px;
          }
          70%, 100% {
            width: 30px;
          }
        }

        @keyframes coreGlow {
          0%, 100% {
            box-shadow:
              0 0 18px rgba(37,99,235,0.35),
              inset 0 1px 0 rgba(255,255,255,0.35);
          }
          50% {
            box-shadow:
              0 0 30px rgba(14,165,233,0.55),
              inset 0 1px 0 rgba(255,255,255,0.45);
          }
        }

        @keyframes leftArmWave {
          0%, 18% {
            transform: rotate(16deg);
          }
          25%, 38% {
            transform: rotate(-30deg);
          }
          45%, 56% {
            transform: rotate(-68deg);
          }
          64% {
            transform: rotate(10deg);
          }
          100% {
            transform: rotate(16deg);
          }
        }

        @keyframes rightArmWave {
          0%, 24% {
            transform: rotate(-16deg);
          }
          36%, 56% {
            transform: rotate(38deg);
          }
          68% {
            transform: rotate(60deg);
          }
          82%, 100% {
            transform: rotate(-16deg);
          }
        }

        @keyframes leftLegMove {
          0%, 38% {
            transform: rotate(8deg);
          }
          48%, 66% {
            transform: rotate(-20deg);
          }
          76%, 100% {
            transform: rotate(8deg);
          }
        }

        @keyframes rightLegMove {
          0%, 38% {
            transform: rotate(-8deg);
          }
          48%, 66% {
            transform: rotate(20deg);
          }
          76%, 100% {
            transform: rotate(-8deg);
          }
        }

        @keyframes moneyBurst {
          0%, 38% {
            opacity: 0;
            transform: translate(0, 0) scale(0.4);
          }
          44% {
            opacity: 1;
            transform: translate(calc((var(--i) - 7) * 4px), -10px) scale(1);
          }
          58% {
            opacity: 1;
            transform: translate(calc((var(--i) - 7) * 14px), calc((var(--i) % 2 == 0 ? -1 : 1) * -46px)) scale(1);
          }
          72% {
            opacity: 0;
            transform: translate(calc((var(--i) - 7) * 19px), -86px) scale(0.8);
          }
          100% {
            opacity: 0;
            transform: translate(calc((var(--i) - 7) * 19px), -86px) scale(0.8);
          }
        }

        @keyframes speechSwap {
          0%, 30% {
            opacity: 0.86;
            transform: translateY(0);
          }
          42%, 60% {
            opacity: 1;
            transform: translateY(-5px);
          }
          74%, 100% {
            opacity: 0.86;
            transform: translateY(0);
          }
        }

        @media (max-width: 1100px) {
          .cardsGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .sceneSection {
            grid-template-columns: 1fr;
          }

          .stageFrame {
            grid-template-columns: 1fr;
          }

          .robotArea {
            min-height: 280px;
          }
        }

        @media (max-width: 720px) {
          .shell {
            width: min(100%, calc(100% - 18px));
            padding: 24px 0 40px;
          }

          .hero {
            margin-bottom: 22px;
          }

          .heroBadge {
            font-size: 11px;
            padding: 8px 12px;
          }

          .heroText {
            font-size: 0.96rem;
            line-height: 1.65;
          }

          .cardsGrid {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .card {
            min-height: 186px;
            border-radius: 20px;
            padding: 18px;
          }

          .sceneInfo,
          .sceneStage {
            border-radius: 22px;
          }

          .sceneInfo {
            padding: 22px;
          }

          .sceneStage {
            padding: 18px;
            min-height: 520px;
          }

          .systemBoard {
            min-height: 250px;
            grid-template-columns: 1fr 1fr;
          }

          .module {
            min-height: 52px;
            font-size: 0.88rem;
          }

          .speechBubble {
            top: 10px;
            right: 10px;
            left: 10px;
            max-width: none;
            font-size: 0.9rem;
          }

          .robotWrap {
            transform: scale(0.92);
          }
        }
      `}</style>
    </div>
  );
}
