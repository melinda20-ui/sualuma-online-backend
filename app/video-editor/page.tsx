"use client";

import Link from "next/link";

export const dynamic = "force-dynamic";

const particles = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  size: 3 + (i % 5),
  top: 8 + ((i * 17) % 82),
  left: 5 + ((i * 23) % 90),
  delay: (i % 7) * 0.45,
  duration: 7 + (i % 5),
}));

export default function VideoEditorPage() {
  return (
    <main className="page">
      <div className="versionMarker">video-editor-visual-v2-sem-joinha-robo-visivel</div>

      <div className="glow glowOne" />
      <div className="glow glowTwo" />
      <div className="grid" />

      {particles.map((p) => (
        <span
          key={p.id}
          className="particle"
          style={{
            width: p.size,
            height: p.size,
            top: `${p.top}%`,
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}

      <header className="topbar">
        <Link href="/portal" className="backButton">
          ← Voltar ao portal
        </Link>
        <div className="brand">sualuma<span>.</span></div>
      </header>

      <section className="hero">
        <article className="copyCard">
          <div className="badge">
            <span />
            Em testes
          </div>

          <h1>Editor de vídeo IA</h1>

          <h2>
            Seu novo espaço para transformar ideias em vídeos com o apoio da inteligência artificial.
          </h2>

          <p>
            Em breve, você poderá criar, organizar e otimizar vídeos com muito mais rapidez dentro da Sualuma.
            Estamos preparando essa área para ajudar empreendedores, prestadores e criadores a produzirem conteúdos
            incríveis com facilidade e eficiência. O recurso está em testes e será lançado muito em breve!
          </p>

          <button className="soonButton" type="button">
            <span>⏳</span>
            Lançamento em breve
          </button>
        </article>

        <aside className="visualArea">
          <div className="robot">
            <div className="antenna" />
            <div className="head">
              <div className="visor">
                <span className="eye left" />
                <span className="eye right" />
                <span className="smile" />
              </div>
            </div>
            <div className="body">
              <div className="core" />
            </div>
            <div className="arm armLeft" />
            <div className="arm armRight" />
          </div>

          <div className="videoCard">
            <div className="windowDots">
              <span />
              <span />
              <span />
            </div>

            <div className="aiPill">IA</div>

            <div className="screen">
              <div className="play">▶</div>
              <div className="scanLine" />
            </div>

            <div className="timeline">
              <span className="lineOne" />
              <span className="lineTwo" />
            </div>
          </div>
        </aside>
      </section>

      <style>{`
        * {
          box-sizing: border-box;
        }

        .versionMarker {
          display: none;
        }

        .page {
          min-height: 100vh;
          overflow: hidden;
          position: relative;
          color: #fff;
          background:
            radial-gradient(circle at 78% 18%, rgba(217,70,239,.22), transparent 34%),
            radial-gradient(circle at 15% 82%, rgba(34,211,238,.13), transparent 34%),
            #070817;
          font-family: Inter, Arial, sans-serif;
        }

        .grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px);
          background-size: 58px 58px;
          mask-image: radial-gradient(circle at center, black, transparent 82%);
          pointer-events: none;
        }

        .glow {
          position: absolute;
          border-radius: 999px;
          filter: blur(100px);
          pointer-events: none;
        }

        .glowOne {
          width: 440px;
          height: 440px;
          right: -120px;
          top: -120px;
          background: rgba(217,70,239,.25);
        }

        .glowTwo {
          width: 360px;
          height: 360px;
          left: -80px;
          bottom: -120px;
          background: rgba(34,211,238,.14);
        }

        .particle {
          position: absolute;
          border-radius: 999px;
          background: rgba(217,70,239,.7);
          box-shadow: 0 0 18px rgba(217,70,239,.5);
          animation: floatUp linear infinite;
          opacity: .35;
        }

        @keyframes floatUp {
          from {
            transform: translateY(80px);
            opacity: 0;
          }
          20% {
            opacity: .55;
          }
          to {
            transform: translateY(-140px) translateX(24px);
            opacity: 0;
          }
        }

        .topbar {
          position: relative;
          z-index: 5;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 22px clamp(18px, 4vw, 54px);
          border-bottom: 1px solid rgba(255,255,255,.08);
          backdrop-filter: blur(18px);
        }

        .brand {
          font-size: 22px;
          font-weight: 900;
          letter-spacing: -.05em;
        }

        .brand span {
          color: #d946ef;
        }

        .backButton {
          color: rgba(255,255,255,.78);
          text-decoration: none;
          border: 1px solid rgba(255,255,255,.12);
          background: rgba(255,255,255,.05);
          padding: 10px 16px;
          border-radius: 999px;
          font-size: 13px;
        }

        .hero {
          position: relative;
          z-index: 2;
          width: min(1180px, calc(100% - 32px));
          min-height: calc(100vh - 78px);
          margin: 0 auto;
          display: grid;
          grid-template-columns: minmax(0, .95fr) minmax(390px, 1fr);
          align-items: center;
          gap: 48px;
          padding: 42px 0;
        }

        .copyCard {
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(217,70,239,.20);
          background:
            linear-gradient(135deg, rgba(255,255,255,.07), rgba(255,255,255,.025)),
            rgba(10,12,28,.72);
          box-shadow:
            0 30px 90px rgba(0,0,0,.45),
            inset 0 1px 0 rgba(255,255,255,.08);
          border-radius: 30px;
          padding: clamp(28px, 5vw, 50px);
          backdrop-filter: blur(22px);
        }

        .copyCard::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, rgba(217,70,239,.10), transparent 54%);
          pointer-events: none;
        }

        .badge {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 24px;
          border: 1px solid rgba(34,211,238,.45);
          color: #67e8f9;
          background: rgba(34,211,238,.08);
          padding: 8px 14px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: .14em;
          text-transform: uppercase;
        }

        .badge span {
          width: 7px;
          height: 7px;
          border-radius: 99px;
          background: #67e8f9;
          box-shadow: 0 0 14px rgba(34,211,238,.9);
        }

        h1 {
          position: relative;
          margin: 0;
          max-width: 100%;
          word-break: break-word;
                    font-size: clamp(34px, 5vw, 64px);
          line-height: .95;
          letter-spacing: -.075em;
          font-weight: 950;
        }

        h2 {
          position: relative;
          margin: 22px 0 0;
          max-width: 620px;
          color: #c084fc;
          font-size: clamp(17px, 2.1vw, 23px);
          line-height: 1.45;
          font-weight: 800;
        }

        p {
          position: relative;
          margin: 22px 0 0;
          max-width: 650px;
          color: rgba(255,255,255,.66);
          font-size: 15px;
          line-height: 1.8;
        }

        .soonButton {
          position: relative;
          margin-top: 34px;
          border: 1px solid rgba(217,70,239,.42);
          background: rgba(217,70,239,.11);
          color: white;
          border-radius: 999px;
          padding: 14px 22px;
          font-weight: 900;
          font-size: 14px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 0 34px rgba(217,70,239,.14);
        }

        .visualArea {
          position: relative;
          min-height: 520px;
          display: grid;
          place-items: center;
        }

        .robot {
          position: absolute;
          z-index: 1;
          top: 18px;
          left: 50%;
          transform: translateX(-50%);
          width: 210px;
          height: 260px;
          filter: drop-shadow(0 28px 36px rgba(217,70,239,.32));
        }

        .antenna {
          position: absolute;
          left: 50%;
          top: 0;
          width: 4px;
          height: 34px;
          border-radius: 999px;
          background: #f0abfc;
          transform: translateX(-50%);
        }

        .antenna::before {
          content: "";
          position: absolute;
          top: -12px;
          left: 50%;
          width: 18px;
          height: 18px;
          border-radius: 99px;
          transform: translateX(-50%);
          background: #ec4899;
          box-shadow: 0 0 24px rgba(236,72,153,.9);
        }

        .head {
          position: absolute;
          top: 28px;
          left: 50%;
          width: 142px;
          height: 112px;
          transform: translateX(-50%);
          border-radius: 32px;
          background: linear-gradient(145deg, #f0abfc, #a855f7 62%, #7e22ce);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.28);
        }

        .visor {
          position: absolute;
          inset: 22px 18px 24px;
          border-radius: 19px;
          background:
            radial-gradient(circle at 35% 30%, rgba(34,211,238,.18), transparent 42%),
            #0f1027;
          border: 1px solid rgba(255,255,255,.12);
        }

        .eye {
          position: absolute;
          top: 25px;
          width: 17px;
          height: 17px;
          border-radius: 99px;
          background: #67e8f9;
          box-shadow: 0 0 18px rgba(34,211,238,.9);
        }

        .eye.left {
          left: 26px;
        }

        .eye.right {
          right: 26px;
        }

        .smile {
          position: absolute;
          left: 50%;
          bottom: 17px;
          width: 34px;
          height: 14px;
          border-bottom: 3px solid #67e8f9;
          border-radius: 0 0 999px 999px;
          transform: translateX(-50%);
        }

        .body {
          position: absolute;
          top: 142px;
          left: 50%;
          width: 116px;
          height: 88px;
          transform: translateX(-50%);
          border-radius: 28px;
          background: linear-gradient(180deg, #a855f7, #701a75);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.18);
        }

        .core {
          position: absolute;
          left: 50%;
          top: 32px;
          width: 22px;
          height: 22px;
          border-radius: 99px;
          transform: translateX(-50%);
          background: #67e8f9;
          box-shadow: 0 0 28px rgba(34,211,238,.9);
        }

        .arm {
          position: absolute;
          top: 158px;
          width: 54px;
          height: 18px;
          border-radius: 999px;
          background: #9333ea;
        }

        .armLeft {
          left: 8px;
          transform: rotate(-16deg);
        }

        .armRight {
          right: 8px;
          transform: rotate(16deg);
        }

        .videoCard {
          position: relative;
          z-index: 3;
          width: min(430px, 92vw);
          margin-top: 175px;
          border-radius: 28px;
          border: 1px solid rgba(139,92,246,.38);
          background:
            linear-gradient(145deg, rgba(255,255,255,.095), rgba(255,255,255,.035)),
            rgba(12,10,34,.86);
          box-shadow:
            0 34px 100px rgba(0,0,0,.55),
            0 0 70px rgba(217,70,239,.12),
            inset 0 1px 0 rgba(255,255,255,.10);
          padding: 22px;
          backdrop-filter: blur(22px);
        }

        .windowDots {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }

        .windowDots span {
          width: 11px;
          height: 11px;
          border-radius: 99px;
          background: rgba(255,255,255,.26);
        }

        .windowDots span:nth-child(1) { background: #fb7185; }
        .windowDots span:nth-child(2) { background: #fbbf24; }
        .windowDots span:nth-child(3) { background: #34d399; }

        .aiPill {
          position: absolute;
          right: 20px;
          top: 18px;
          width: 46px;
          height: 46px;
          display: grid;
          place-items: center;
          border-radius: 16px;
          background: linear-gradient(135deg, #ec4899, #8b5cf6);
          font-size: 13px;
          font-weight: 950;
          box-shadow: 0 0 28px rgba(236,72,153,.45);
        }

        .screen {
          height: 210px;
          position: relative;
          overflow: hidden;
          border-radius: 22px;
          border: 1px solid rgba(255,255,255,.10);
          background:
            radial-gradient(circle at center, rgba(34,211,238,.16), transparent 32%),
            linear-gradient(135deg, rgba(34,211,238,.08), rgba(217,70,239,.12)),
            #0b1027;
        }

        .screen::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(90deg, transparent, rgba(255,255,255,.05), transparent),
            repeating-linear-gradient(0deg, rgba(255,255,255,.045) 0 1px, transparent 1px 10px);
          opacity: .75;
        }

        .play {
          position: absolute;
          left: 50%;
          top: 50%;
          z-index: 2;
          transform: translate(-50%, -50%);
          width: 72px;
          height: 72px;
          display: grid;
          place-items: center;
          border-radius: 99px;
          color: white;
          background: linear-gradient(135deg, #22d3ee, #2dd4bf);
          box-shadow: 0 0 45px rgba(34,211,238,.48);
          font-size: 26px;
          padding-left: 4px;
        }

        .scanLine {
          position: absolute;
          left: 0;
          right: 0;
          height: 2px;
          top: 24%;
          background: linear-gradient(90deg, transparent, rgba(103,232,249,.95), transparent);
          box-shadow: 0 0 26px rgba(103,232,249,.9);
          animation: scan 3.2s ease-in-out infinite;
        }

        @keyframes scan {
          0%, 100% { top: 18%; opacity: .35; }
          50% { top: 82%; opacity: 1; }
        }

        .timeline {
          display: grid;
          gap: 10px;
          margin-top: 18px;
        }

        .timeline span {
          height: 9px;
          border-radius: 999px;
          background: rgba(255,255,255,.09);
          overflow: hidden;
          position: relative;
        }

        .timeline span::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
        }

        .lineOne::before {
          width: 76%;
          background: linear-gradient(90deg, #22d3ee, #2dd4bf);
        }

        .lineTwo::before {
          width: 54%;
          background: linear-gradient(90deg, #8b5cf6, #ec4899);
        }

        @media (max-width: 900px) {
          .hero {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .visualArea {
            min-height: 460px;
          }

          h1 {
            font-size: clamp(35px, 11vw, 50px);
          }

          .copyCard {
            padding: 28px;
          }

          .topbar {
            padding: 16px;
          }
        }
      `}</style>
    </main>
  );
}
