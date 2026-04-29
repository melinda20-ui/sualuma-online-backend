"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const AUTO_REDIRECT_SECONDS = 15 * 60;
const CLICK_DELAY_SECONDS = 20;

function formatTime(total: number) {
  const min = Math.floor(total / 60);
  const sec = total % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export default function BemVindoPage() {
  const [autoSeconds, setAutoSeconds] = useState(AUTO_REDIRECT_SECONDS);
  const [starting, setStarting] = useState(false);
  const [startSeconds, setStartSeconds] = useState(CLICK_DELAY_SECONDS);

  const autoTime = useMemo(() => formatTime(autoSeconds), [autoSeconds]);

  useEffect(() => {
    if (starting) return;

    const timer = setInterval(() => {
      setAutoSeconds((prev) => {
        if (prev <= 1) {
          window.location.href = "/portal";
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [starting]);

  useEffect(() => {
    if (!starting) return;

    const timer = setInterval(() => {
      setStartSeconds((prev) => {
        if (prev <= 1) {
          window.location.href = "/portal";
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [starting]);

  function handleStart() {
    setStarting(true);
    setStartSeconds(CLICK_DELAY_SECONDS);
  }

  return (
    <main className="welcome-page">
      <section className="orb orb-one" />
      <section className="orb orb-two" />
      <section className="grid-bg" />

      <div className="shell">
        <div className="badge">Conta confirmada com sucesso</div>

        <section className="hero">
          <div className="copy">
            <p className="eyebrow">Sualuma OS</p>

            <h1>Bem-vindo à plataforma.</h1>

            <p className="subtitle">
              Seu acesso foi confirmado. Agora estamos preparando seu ambiente,
              seus painéis e os primeiros recursos do seu dashboard.
            </p>

            <div className="notice">
              <strong>Como funciona daqui pra frente:</strong>
              <ul>
                <li>Você será levado para sua página principal dentro da plataforma.</li>
                <li>Lá você poderá acessar dashboard, agentes, automações e áreas do sistema.</li>
                <li>Para liberar o uso completo dos robôs e recursos avançados, escolha um plano.</li>
                <li>Se você já escolheu um plano, basta seguir para o dashboard normalmente.</li>
              </ul>
            </div>

            <div className="actions">
              <button
                type="button"
                className="primary"
                onClick={handleStart}
                disabled={starting}
              >
                {starting
                  ? `Preparando seu acesso... ${startSeconds}s`
                  : "Vamos começar agora"}
              </button>

              <Link className="secondary" href="/plans">
                Ver planos disponíveis
              </Link>
            </div>

            <p className="small">
              Essa etapa é só para preparar sua entrada. Se você não clicar,
              enviaremos você automaticamente para o dashboard em {autoTime}.
            </p>
          </div>

          <div className="robot-card">
            <div className="robot">
              <div className="antenna" />
              <div className="head">
                <span className="eye" />
                <span className="eye" />
              </div>
              <div className="body">
                <div className="pulse-line" />
                <div className="pulse-line small-line" />
              </div>
            </div>

            <div className="loader">
              <span />
              <span />
              <span />
            </div>

            <p className="robot-title">
              Preparando seu sistema
            </p>

            <p className="robot-text">
              Organizando dashboard, planos, acessos e área inicial.
            </p>
          </div>
        </section>
      </div>

      <style>{`
        .welcome-page {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(circle at 20% 10%, rgba(124, 58, 237, 0.35), transparent 32%),
            radial-gradient(circle at 80% 20%, rgba(56, 189, 248, 0.24), transparent 28%),
            linear-gradient(135deg, #050816 0%, #090b1c 45%, #020617 100%);
          color: #ffffff;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          padding: 28px;
        }

        .grid-bg {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px);
          background-size: 52px 52px;
          mask-image: linear-gradient(to bottom, rgba(0,0,0,.9), transparent);
          pointer-events: none;
        }

        .orb {
          position: absolute;
          border-radius: 999px;
          filter: blur(10px);
          opacity: .55;
          animation: float 7s ease-in-out infinite;
        }

        .orb-one {
          width: 240px;
          height: 240px;
          background: rgba(124, 58, 237, .42);
          top: 8%;
          left: -80px;
        }

        .orb-two {
          width: 320px;
          height: 320px;
          background: rgba(56, 189, 248, .18);
          right: -120px;
          bottom: 5%;
          animation-delay: 1.5s;
        }

        .shell {
          position: relative;
          z-index: 2;
          width: min(1120px, 100%);
          margin: 0 auto;
          padding-top: 44px;
        }

        .badge {
          width: fit-content;
          margin-bottom: 20px;
          padding: 10px 14px;
          border: 1px solid rgba(255,255,255,.14);
          border-radius: 999px;
          background: rgba(255,255,255,.08);
          color: #c4b5fd;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: .02em;
        }

        .hero {
          display: grid;
          grid-template-columns: 1.15fr .85fr;
          gap: 28px;
          align-items: center;
        }

        .copy {
          padding: 34px;
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 34px;
          background: rgba(255,255,255,.07);
          box-shadow: 0 24px 80px rgba(0,0,0,.28);
        }

        .eyebrow {
          color: #38bdf8;
          font-weight: 800;
          letter-spacing: .16em;
          text-transform: uppercase;
          font-size: 12px;
          margin-bottom: 12px;
        }

        h1 {
          margin: 0;
          font-size: clamp(38px, 7vw, 76px);
          line-height: .92;
          letter-spacing: -0.07em;
        }

        .subtitle {
          margin: 22px 0;
          max-width: 700px;
          color: rgba(255,255,255,.76);
          font-size: 18px;
          line-height: 1.65;
        }

        .notice {
          margin-top: 24px;
          padding: 20px;
          border: 1px solid rgba(56, 189, 248, .18);
          border-radius: 24px;
          background: rgba(2, 6, 23, .46);
        }

        .notice strong {
          display: block;
          margin-bottom: 12px;
          color: #ffffff;
        }

        ul {
          margin: 0;
          padding-left: 20px;
          color: rgba(255,255,255,.72);
          line-height: 1.75;
        }

        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 26px;
        }

        .primary,
        .secondary {
          border: 0;
          border-radius: 999px;
          padding: 15px 22px;
          font-weight: 900;
          text-decoration: none;
          cursor: pointer;
          transition: transform .2s ease, opacity .2s ease;
        }

        .primary {
          background: linear-gradient(135deg, #8b5cf6, #38bdf8);
          color: #020617;
          box-shadow: 0 18px 42px rgba(56, 189, 248, .2);
        }

        .primary:disabled {
          opacity: .82;
          cursor: wait;
        }

        .secondary {
          background: rgba(255,255,255,.08);
          color: #ffffff;
          border: 1px solid rgba(255,255,255,.12);
        }

        .primary:hover,
        .secondary:hover {
          transform: translateY(-2px);
        }

        .small {
          margin-top: 18px;
          color: rgba(255,255,255,.58);
          font-size: 13px;
          line-height: 1.6;
        }

        .robot-card {
          min-height: 520px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 34px;
          background:
            radial-gradient(circle at 50% 20%, rgba(56, 189, 248, .15), transparent 36%),
            rgba(255,255,255,.06);
          box-shadow: 0 24px 80px rgba(0,0,0,.32);
          padding: 30px;
        }

        .robot {
          position: relative;
          width: 160px;
          height: 220px;
          animation: robotFloat 2.8s ease-in-out infinite;
        }

        .antenna {
          width: 4px;
          height: 30px;
          margin: 0 auto;
          background: #38bdf8;
          border-radius: 999px;
        }

        .antenna::before {
          content: "";
          display: block;
          width: 14px;
          height: 14px;
          background: #a78bfa;
          border-radius: 999px;
          transform: translate(-5px, -8px);
          box-shadow: 0 0 28px #a78bfa;
        }

        .head {
          width: 138px;
          height: 92px;
          margin: 0 auto;
          border-radius: 30px;
          background: linear-gradient(135deg, rgba(255,255,255,.95), rgba(203,213,225,.82));
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
          box-shadow: 0 18px 55px rgba(56,189,248,.18);
        }

        .eye {
          width: 18px;
          height: 18px;
          border-radius: 999px;
          background: #020617;
          box-shadow: 0 0 16px rgba(56,189,248,.9);
          animation: blink 3s infinite;
        }

        .body {
          width: 112px;
          height: 88px;
          margin: 12px auto 0;
          border-radius: 28px;
          background: linear-gradient(135deg, rgba(124,58,237,.9), rgba(56,189,248,.7));
          padding: 28px 22px;
        }

        .pulse-line {
          height: 8px;
          border-radius: 999px;
          background: rgba(255,255,255,.8);
          margin-bottom: 12px;
          animation: loadingLine 1.2s ease-in-out infinite;
        }

        .small-line {
          width: 64%;
          animation-delay: .25s;
        }

        .loader {
          display: flex;
          gap: 8px;
          margin-top: 18px;
        }

        .loader span {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: #38bdf8;
          animation: dot 1s infinite ease-in-out;
        }

        .loader span:nth-child(2) {
          animation-delay: .15s;
        }

        .loader span:nth-child(3) {
          animation-delay: .3s;
        }

        .robot-title {
          margin: 20px 0 6px;
          font-size: 24px;
          font-weight: 950;
        }

        .robot-text {
          margin: 0;
          max-width: 320px;
          color: rgba(255,255,255,.62);
          line-height: 1.6;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-18px); }
        }

        @keyframes robotFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }

        @keyframes blink {
          0%, 92%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(.15); }
        }

        @keyframes loadingLine {
          0%, 100% { opacity: .45; transform: scaleX(.72); transform-origin: left; }
          50% { opacity: 1; transform: scaleX(1); transform-origin: left; }
        }

        @keyframes dot {
          0%, 100% { transform: translateY(0); opacity: .45; }
          50% { transform: translateY(-8px); opacity: 1; }
        }

        @media (max-width: 880px) {
          .welcome-page {
            padding: 18px;
          }

          .shell {
            padding-top: 22px;
          }

          .hero {
            grid-template-columns: 1fr;
          }

          .copy {
            padding: 24px;
          }

          .robot-card {
            min-height: 390px;
          }

          .actions {
            flex-direction: column;
          }

          .primary,
          .secondary {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>
    </main>
  );
}
