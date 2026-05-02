"use client";

import Link from "next/link";

const cards = [
  {
    title: "Dashboard do Cliente",
    desc: "Acompanhe projetos, entregas, mensagens e andamento do seu serviço.",
    href: "/member-services",
    tag: "Cliente",
    external: false,
  },
  {
    title: "Dashboard do Prestador",
    desc: "Gerencie oportunidades, reuniões, portfólio e entregas em um só lugar.",
    href: "/provider-services",
    tag: "Prestador",
    external: false,
  },
  {
    title: "Minha Empresa",
    desc: "Entre no seu app principal e acesse a operação central da sua empresa.",
    href: "https://app.sualuma.online",
    tag: "App",
    external: true,
  },
  {
    title: "Comunidade",
    desc: "Conecte-se com pessoas, descubra oportunidades e acompanhe novidades.",
    href: "/marketplace",
    tag: "Comunidade",
    external: false,
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

const moneyParticles = [
  { symbol: "💸", x: "-190px", y: "-120px", r: "-28deg", s: "1.15", d: "0s" },
  { symbol: "💵", x: "-145px", y: "-165px", r: "18deg", s: "1.05", d: ".03s" },
  { symbol: "💰", x: "-95px", y: "-135px", r: "-12deg", s: "1.2", d: ".06s" },
  { symbol: "💸", x: "-45px", y: "-185px", r: "24deg", s: "1.1", d: ".09s" },
  { symbol: "💵", x: "15px", y: "-155px", r: "-18deg", s: "1.2", d: ".12s" },
  { symbol: "💰", x: "70px", y: "-195px", r: "16deg", s: "1.05", d: ".15s" },
  { symbol: "💸", x: "125px", y: "-145px", r: "-26deg", s: "1.25", d: ".18s" },
  { symbol: "💵", x: "180px", y: "-115px", r: "22deg", s: "1.05", d: ".21s" },

  { symbol: "💸", x: "-210px", y: "-40px", r: "12deg", s: "1.15", d: ".24s" },
  { symbol: "💵", x: "-155px", y: "-70px", r: "-16deg", s: "1.08", d: ".27s" },
  { symbol: "💰", x: "-105px", y: "-45px", r: "20deg", s: "1.18", d: ".3s" },
  { symbol: "💸", x: "-50px", y: "-85px", r: "-12deg", s: "1.3", d: ".33s" },
  { symbol: "💵", x: "20px", y: "-58px", r: "18deg", s: "1.14", d: ".36s" },
  { symbol: "💰", x: "85px", y: "-88px", r: "-18deg", s: "1.22", d: ".39s" },
  { symbol: "💸", x: "145px", y: "-52px", r: "26deg", s: "1.08", d: ".42s" },
  { symbol: "💵", x: "210px", y: "-35px", r: "-22deg", s: "1.18", d: ".45s" },

  { symbol: "💸", x: "-175px", y: "35px", r: "-20deg", s: "1.06", d: ".48s" },
  { symbol: "💵", x: "-115px", y: "60px", r: "15deg", s: "1.18", d: ".51s" },
  { symbol: "💰", x: "-52px", y: "42px", r: "-12deg", s: "1.12", d: ".54s" },
  { symbol: "💸", x: "25px", y: "62px", r: "20deg", s: "1.24", d: ".57s" },
  { symbol: "💵", x: "92px", y: "38px", r: "-18deg", s: "1.1", d: ".6s" },
  { symbol: "💰", x: "155px", y: "55px", r: "16deg", s: "1.22", d: ".63s" },

  { symbol: "💸", x: "-90px", y: "-225px", r: "30deg", s: "1.18", d: ".66s" },
  { symbol: "💵", x: "-15px", y: "-245px", r: "-22deg", s: "1.12", d: ".69s" },
  { symbol: "💰", x: "65px", y: "-235px", r: "18deg", s: "1.16", d: ".72s" },
  { symbol: "💸", x: "135px", y: "-215px", r: "-28deg", s: "1.1", d: ".75s" }
];

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
            <div className="sceneMini">PORTAL SUALUMA</div>
            <h2>Escolha sua área de acesso</h2>
            <p>
                Acesse seus ambientes principais em um só lugar: dashboards,
                comunidade, chat inteligente, automações, serviços e ferramentas
                de criação. Escolha a área que deseja abrir e continue sua jornada
                dentro da plataforma Sualuma.
              </p>

            <div className="scenePills">
              <span>Dashboard</span>
              <span>Chat IA</span>
              <span>Automações</span>
              <span>Ferramentas</span>
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
                  <div className="systemLabel">Ambientes disponíveis</div>
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
                  <span>status: pronto</span>
                  <span>acesso: plataforma Sualuma</span>
                </div>
              </div>

              <div className="robotArea">
                <div className="speechBubble">
                  Tudo pronto para começar.
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
                  {moneyParticles.map((particle, i) => (
                    <span
                      key={i}
                      className="money"
                      style={
                        {
                          "--x": particle.x,
                          "--y": particle.y,
                          "--r": particle.r,
                          "--s": particle.s,
                          "--d": particle.d,
                        } as any
                      }
                    >
                      {particle.symbol}
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

        /* MOBILE: colocar seção do robô/sistema acima dos botões */
        @media (max-width: 720px) {
          .shell {
            display: flex;
            flex-direction: column;
          }

          .hero {
            order: 1;
          }

          .sceneSection {
            order: 2;
            margin-top: 6px;
            margin-bottom: 18px;
          }

          .cardsGrid {
            order: 3;
            margin-top: 0;
          }
        }


        /* ORDEM GLOBAL: robô/sistema acima dos botões no desktop e celular */
        .shell {
          display: flex;
          flex-direction: column;
        }

        .hero {
          order: 1;
        }

        .sceneSection {
          order: 2;
          margin-top: 30px;
          margin-bottom: 30px;
        }

        .cardsGrid {
          order: 3;
          margin-top: 0;
        }

        /* MAIS DINHEIRO: explosão maior, mais visível e mais divertida */
        .sceneStage,
        .robotArea {
          overflow: visible !important;
        }

        .moneyBurst {
          z-index: 5;
          overflow: visible;
        }

        .money {
          position: absolute;
          left: 50%;
          top: 52%;
          width: auto !important;
          height: auto !important;
          border-radius: 0 !important;
          background: transparent !important;
          color: inherit !important;
          font-size: 34px !important;
          box-shadow: none !important;
          filter:
            drop-shadow(0 14px 18px rgba(0,0,0,0.32))
            drop-shadow(0 0 12px rgba(250, 204, 21, 0.38));
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.25) rotate(0deg);
          animation: moneyExplosionPremium 6s ease-in-out infinite !important;
          animation-delay: var(--d);
          will-change: transform, opacity;
        }

        @keyframes moneyExplosionPremium {
          0%, 36% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.25) rotate(0deg);
          }

          42% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.15) rotate(8deg);
          }

          54% {
            opacity: 1;
            transform:
              translate(calc(-50% + var(--x)), calc(-50% + var(--y)))
              scale(var(--s))
              rotate(var(--r));
          }

          72% {
            opacity: 0.95;
            transform:
              translate(calc(-50% + var(--x)), calc(-50% + var(--y)))
              scale(calc(var(--s) * 0.96))
              rotate(var(--r));
          }

          86%, 100% {
            opacity: 0;
            transform:
              translate(calc(-50% + var(--x)), calc(-50% + var(--y) - 45px))
              scale(0.7)
              rotate(var(--r));
          }
        }

        /* Robô mais feliz no momento que o dinheiro entra */
        .robot {
          animation: robotHappyBounce 6s ease-in-out infinite !important;
        }

        @keyframes robotHappyBounce {
          0%, 34%, 78%, 100% {
            transform: translate(-50%, -50%) translateY(0) rotate(0deg) scale(1);
          }

          42% {
            transform: translate(-50%, -50%) translateY(-14px) rotate(-4deg) scale(1.06);
          }

          50% {
            transform: translate(-50%, -50%) translateY(-4px) rotate(4deg) scale(1.04);
          }

          58% {
            transform: translate(-50%, -50%) translateY(-16px) rotate(-3deg) scale(1.07);
          }

          66% {
            transform: translate(-50%, -50%) translateY(-2px) rotate(2deg) scale(1.02);
          }
        }

        .robotMouth {
          animation: robotBigSmile 6s ease-in-out infinite !important;
        }

        @keyframes robotBigSmile {
          0%, 35%, 78%, 100% {
            width: 30px;
            height: 10px;
            border-bottom-width: 4px;
          }

          42%, 66% {
            width: 46px;
            height: 16px;
            border-bottom-width: 5px;
          }
        }

        .robotCore {
          animation: robotCoreMoney 6s ease-in-out infinite !important;
        }

        @keyframes robotCoreMoney {
          0%, 36%, 78%, 100% {
            box-shadow:
              0 0 18px rgba(37,99,235,0.35),
              inset 0 1px 0 rgba(255,255,255,0.35);
          }

          42%, 66% {
            box-shadow:
              0 0 34px rgba(34,197,94,0.78),
              0 0 55px rgba(250,204,21,0.32),
              inset 0 1px 0 rgba(255,255,255,0.45);
          }
        }

        @media (max-width: 720px) {
          .sceneSection {
            margin-top: 10px;
            margin-bottom: 20px;
          }

          .money {
            font-size: 27px !important;
          }
        }

      `}</style>
    </div>
  );
}
