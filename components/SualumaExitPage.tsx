"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient as createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function SualumaExitPage() {
  const [signedOut, setSignedOut] = useState(false);

  useEffect(() => {
    let active = true;

    async function logout() {
      try {
        const supabase = createBrowserSupabaseClient();
        await supabase.auth.signOut();
      } catch {
        // Mesmo se não tiver sessão, a página continua funcionando.
      }

      if (active) setSignedOut(true);
    }

    logout();

    return () => {
      active = false;
    };
  }, []);

  const shareHref = useMemo(() => {
    const text =
      "Conhece a Sualuma? É uma plataforma com IA, automações, comunidade e ferramentas para negócios crescerem online. Dá uma olhada: https://sualuma.online";
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }, []);

  return (
    <main className="exit-page">
      <div className="bg-orb orb-one" />
      <div className="bg-orb orb-two" />
      <div className="bg-grid" />
      <div className="money-field" aria-hidden="true">
        {["R$", "$", "R$", "$", "R$", "$", "R$", "$", "R$", "$", "R$", "$"].map((coin, i) => (
          <span key={i} className={`coin coin-${i + 1}`}>
            {coin}
          </span>
        ))}
      </div>

      <section className="exit-shell">
        <div className="copy-area">
          <div className="status-pill">
            <span className={signedOut ? "dot ok" : "dot"} />
            {signedOut ? "Sessão encerrada com segurança" : "Encerrando sua sessão..."}
          </div>

          <h1>Você saiu.</h1>

          <p className="subtitle">
            O robô guardou seus créditos, organizou o painel e está esperando você voltar para continuar
            construindo seu império digital.
          </p>

          <div className="cta-row">
            <Link href="/login" className="primary-btn">
              Voltar para o login
            </Link>

            <a href={shareHref} target="_blank" rel="noreferrer" className="gift-btn">
              Ei, me mostra para um amigo que eu te mando um cupom
              <span className="mini-bot-wrap" aria-hidden="true">
                <span className="heart h1">♥</span>
                <span className="heart h2">♥</span>
                <span className="heart h3">♥</span>
                <span className="mini-bot">
                  <span className="mini-head">
                    <span className="mini-eye" />
                    <span className="mini-eye" />
                  </span>
                  <span className="mini-arm" />
                </span>
              </span>
            </a>
          </div>

          <div className="note-card">
            <strong>Presente inteligente:</strong>
            <span>
              indique alguém que precise de site, automação ou IA para negócios. Depois você pode transformar isso
              em cupom, bônus ou comissão dentro da plataforma.
            </span>
          </div>
        </div>

        <div className="robot-stage" aria-label="Robô guardando dinheiro">
          <div className="terminal-card">
            <div className="terminal-top">
              <span />
              <span />
              <span />
            </div>
            <div className="terminal-lines">
              <i />
              <i />
              <i />
            </div>
            <div className="revenue-bar">
              <span />
            </div>
          </div>

          <div className="safe-box">
            <span className="safe-glow" />
            <span className="safe-door">
              <b>R$</b>
            </span>
          </div>

          <div className="main-robot">
            <div className="robot-antenna" />
            <div className="robot-head">
              <div className="robot-face">
                <span className="eye left" />
                <span className="eye right" />
                <span className="sad-mouth" />
              </div>
            </div>
            <div className="robot-neck" />
            <div className="robot-body">
              <span className="screen-line a" />
              <span className="screen-line b" />
              <span className="screen-line c" />
            </div>
            <div className="robot-arm arm-left" />
            <div className="robot-arm arm-right">
              <span className="hand-coin">R$</span>
            </div>
            <div className="robot-leg leg-left" />
            <div className="robot-leg leg-right" />
          </div>

          <div className="speech">
            Tô esperando você voltar, tá?
          </div>
        </div>
      </section>

      <style>{`
        .exit-page {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 42px 20px;
          color: #f8fbff;
          background:
            radial-gradient(circle at 18% 15%, rgba(147, 51, 234, .38), transparent 28%),
            radial-gradient(circle at 84% 18%, rgba(56, 189, 248, .30), transparent 30%),
            radial-gradient(circle at 50% 85%, rgba(236, 72, 153, .18), transparent 36%),
            linear-gradient(135deg, #050510 0%, #090820 45%, #020617 100%);
          isolation: isolate;
        }

        .bg-grid {
          position: absolute;
          inset: 0;
          z-index: -4;
          opacity: .36;
          background-image:
            linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px);
          background-size: 54px 54px;
          transform: perspective(900px) rotateX(62deg) translateY(-120px) scale(1.55);
          transform-origin: top;
          animation: gridMove 12s linear infinite;
        }

        .bg-orb {
          position: absolute;
          width: 480px;
          height: 480px;
          border-radius: 42%;
          z-index: -5;
          filter: blur(26px);
          opacity: .75;
          animation: floatOrb 8s ease-in-out infinite alternate;
        }

        .orb-one {
          left: -170px;
          top: -150px;
          background: rgba(124, 58, 237, .65);
        }

        .orb-two {
          right: -170px;
          bottom: -150px;
          background: rgba(14, 165, 233, .45);
          animation-delay: -3s;
        }

        .money-field {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: -1;
        }

        .coin {
          position: absolute;
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          color: #1a1200;
          font-weight: 900;
          font-size: 13px;
          background: linear-gradient(135deg, #fff2a6, #fbbf24, #f59e0b);
          box-shadow: 0 0 25px rgba(251, 191, 36, .45);
          opacity: 0;
          animation: coinFly 5.8s ease-in-out infinite;
        }

        .coin-1 { left: 10%; top: 18%; animation-delay: .2s; }
        .coin-2 { left: 18%; top: 70%; animation-delay: 1.2s; }
        .coin-3 { left: 30%; top: 28%; animation-delay: 2.1s; }
        .coin-4 { left: 45%; top: 78%; animation-delay: .7s; }
        .coin-5 { left: 58%; top: 18%; animation-delay: 1.7s; }
        .coin-6 { left: 72%; top: 66%; animation-delay: 2.7s; }
        .coin-7 { left: 82%; top: 24%; animation-delay: 3.2s; }
        .coin-8 { left: 88%; top: 82%; animation-delay: .9s; }
        .coin-9 { left: 8%; top: 48%; animation-delay: 3.8s; }
        .coin-10 { left: 38%; top: 12%; animation-delay: 4.1s; }
        .coin-11 { left: 64%; top: 48%; animation-delay: 4.6s; }
        .coin-12 { left: 76%; top: 8%; animation-delay: 5s; }

        .exit-shell {
          width: min(1180px, 100%);
          display: grid;
          grid-template-columns: 1fr .92fr;
          gap: 34px;
          align-items: center;
          padding: 34px;
          border: 1px solid rgba(255,255,255,.13);
          border-radius: 34px;
          background:
            linear-gradient(135deg, rgba(255,255,255,.10), rgba(255,255,255,.04)),
            rgba(2, 6, 23, .78);
          box-shadow:
            0 30px 90px rgba(0,0,0,.44),
            inset 0 1px 0 rgba(255,255,255,.12);
        }

        .copy-area {
          position: relative;
          z-index: 2;
        }

        .status-pill {
          width: fit-content;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border: 1px solid rgba(255,255,255,.13);
          border-radius: 999px;
          background: rgba(255,255,255,.08);
          color: #dbeafe;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: .02em;
        }

        .dot {
          width: 9px;
          height: 9px;
          border-radius: 999px;
          background: #facc15;
          box-shadow: 0 0 16px rgba(250, 204, 21, .9);
          animation: pulse 1.2s infinite;
        }

        .dot.ok {
          background: #22c55e;
          box-shadow: 0 0 16px rgba(34, 197, 94, .9);
        }

        h1 {
          margin: 24px 0 14px;
          font-size: clamp(44px, 7vw, 92px);
          line-height: .86;
          letter-spacing: -.08em;
          color: #ffffff;
          text-shadow: 0 0 30px rgba(56,189,248,.18);
        }

        .subtitle {
          max-width: 650px;
          color: #cbd5e1;
          font-size: clamp(16px, 2.2vw, 21px);
          line-height: 1.65;
          margin: 0 0 26px;
        }

        .cta-row {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          align-items: center;
        }

        .primary-btn,
        .gift-btn {
          min-height: 56px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          border-radius: 18px;
          font-weight: 950;
          letter-spacing: -.02em;
          transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
        }

        .primary-btn {
          padding: 0 22px;
          color: #020617;
          background: linear-gradient(135deg, #38bdf8, #a78bfa, #f0abfc);
          box-shadow: 0 16px 36px rgba(56,189,248,.25);
        }

        .gift-btn {
          position: relative;
          padding: 0 78px 0 20px;
          color: #fff;
          border: 1px solid rgba(244, 114, 182, .42);
          background: linear-gradient(135deg, rgba(236,72,153,.26), rgba(124,58,237,.24));
          box-shadow: 0 18px 44px rgba(236,72,153,.14);
        }

        .primary-btn:hover,
        .gift-btn:hover {
          transform: translateY(-2px);
        }

        .mini-bot-wrap {
          position: absolute;
          right: 13px;
          top: 50%;
          width: 54px;
          height: 54px;
          transform: translateY(-50%);
        }

        .mini-bot {
          position: absolute;
          right: 0;
          bottom: 2px;
          width: 36px;
          height: 40px;
          border-radius: 14px 14px 10px 10px;
          background: linear-gradient(180deg, #e0f2fe, #93c5fd);
          box-shadow: 0 0 18px rgba(56,189,248,.5);
          animation: miniDance 1.7s ease-in-out infinite;
        }

        .mini-head {
          position: absolute;
          left: 5px;
          top: 5px;
          width: 26px;
          height: 18px;
          border-radius: 10px;
          background: #111827;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
        }

        .mini-eye {
          width: 4px;
          height: 4px;
          border-radius: 999px;
          background: #22d3ee;
        }

        .mini-arm {
          position: absolute;
          left: -11px;
          top: 18px;
          width: 15px;
          height: 5px;
          border-radius: 99px;
          background: #bfdbfe;
          transform-origin: right;
          animation: pointBtn 1.1s ease-in-out infinite;
        }

        .heart {
          position: absolute;
          color: #fb7185;
          font-size: 14px;
          opacity: 0;
          animation: heartRise 2s ease-in-out infinite;
        }

        .h1 { left: 0; top: 22px; animation-delay: .1s; }
        .h2 { left: 15px; top: 8px; animation-delay: .5s; }
        .h3 { left: 30px; top: 18px; animation-delay: .9s; }

        .note-card {
          margin-top: 22px;
          max-width: 670px;
          display: grid;
          gap: 7px;
          padding: 18px;
          border-radius: 22px;
          border: 1px solid rgba(255,255,255,.12);
          background: rgba(15, 23, 42, .68);
          color: #cbd5e1;
          line-height: 1.5;
        }

        .note-card strong {
          color: #fff;
        }

        .robot-stage {
          min-height: 520px;
          position: relative;
          border-radius: 30px;
          background:
            radial-gradient(circle at 45% 35%, rgba(56,189,248,.25), transparent 34%),
            radial-gradient(circle at 62% 70%, rgba(251,191,36,.15), transparent 30%),
            linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.02));
          border: 1px solid rgba(255,255,255,.12);
          overflow: hidden;
        }

        .terminal-card {
          position: absolute;
          left: 36px;
          top: 42px;
          width: 260px;
          height: 162px;
          border-radius: 22px;
          background: rgba(3, 7, 18, .80);
          border: 1px solid rgba(125, 211, 252, .22);
          box-shadow: 0 24px 55px rgba(0,0,0,.35);
          animation: terminalFloat 3.2s ease-in-out infinite;
        }

        .terminal-top {
          height: 34px;
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 0 14px;
          border-bottom: 1px solid rgba(255,255,255,.08);
        }

        .terminal-top span {
          width: 9px;
          height: 9px;
          border-radius: 999px;
          background: #38bdf8;
        }

        .terminal-top span:nth-child(2) { background: #f472b6; }
        .terminal-top span:nth-child(3) { background: #facc15; }

        .terminal-lines {
          padding: 18px 15px 0;
          display: grid;
          gap: 10px;
        }

        .terminal-lines i {
          height: 8px;
          border-radius: 999px;
          background: linear-gradient(90deg, #38bdf8, transparent);
          opacity: .8;
          animation: lineLoad 2s ease-in-out infinite;
        }

        .terminal-lines i:nth-child(2) {
          width: 70%;
          animation-delay: .35s;
        }

        .terminal-lines i:nth-child(3) {
          width: 52%;
          animation-delay: .7s;
        }

        .revenue-bar {
          position: absolute;
          left: 16px;
          right: 16px;
          bottom: 16px;
          height: 13px;
          border-radius: 999px;
          background: rgba(255,255,255,.08);
          overflow: hidden;
        }

        .revenue-bar span {
          display: block;
          height: 100%;
          width: 68%;
          border-radius: 999px;
          background: linear-gradient(90deg, #22c55e, #facc15);
          animation: revenuePulse 2.8s ease-in-out infinite;
        }

        .safe-box {
          position: absolute;
          right: 54px;
          bottom: 70px;
          width: 154px;
          height: 134px;
          border-radius: 26px;
          background: linear-gradient(145deg, #1e293b, #020617);
          border: 1px solid rgba(255,255,255,.13);
          box-shadow: 0 26px 60px rgba(0,0,0,.45);
        }

        .safe-glow {
          position: absolute;
          inset: -20px;
          border-radius: 34px;
          background: radial-gradient(circle, rgba(250,204,21,.24), transparent 60%);
          animation: safeGlow 2.8s ease-in-out infinite;
        }

        .safe-door {
          position: absolute;
          inset: 18px;
          border-radius: 22px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #0f172a, #334155);
          border: 1px solid rgba(250,204,21,.28);
        }

        .safe-door b {
          width: 54px;
          height: 54px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: #facc15;
          color: #111827;
          box-shadow: 0 0 22px rgba(250,204,21,.45);
        }

        .main-robot {
          position: absolute;
          left: 52%;
          top: 52%;
          width: 190px;
          height: 282px;
          transform: translate(-50%, -50%);
          animation: robotMood 3.5s ease-in-out infinite;
        }

        .robot-antenna {
          position: absolute;
          left: 50%;
          top: 0;
          width: 4px;
          height: 28px;
          background: #93c5fd;
          transform: translateX(-50%);
        }

        .robot-antenna::after {
          content: "";
          position: absolute;
          left: 50%;
          top: -11px;
          width: 17px;
          height: 17px;
          border-radius: 999px;
          background: #f472b6;
          transform: translateX(-50%);
          box-shadow: 0 0 22px rgba(244,114,182,.8);
        }

        .robot-head {
          position: absolute;
          left: 29px;
          top: 27px;
          width: 132px;
          height: 96px;
          border-radius: 34px;
          background: linear-gradient(145deg, #e0f2fe, #93c5fd 55%, #60a5fa);
          box-shadow: 0 18px 40px rgba(56,189,248,.25);
        }

        .robot-face {
          position: absolute;
          inset: 19px 18px;
          border-radius: 24px;
          background: #06111f;
          display: flex;
          justify-content: center;
          gap: 28px;
          align-items: center;
        }

        .eye {
          width: 13px;
          height: 13px;
          border-radius: 999px;
          background: #38bdf8;
          box-shadow: 0 0 14px rgba(56,189,248,.9);
          animation: blinkSad 3.5s ease-in-out infinite;
        }

        .sad-mouth {
          position: absolute;
          left: 50%;
          bottom: 12px;
          width: 32px;
          height: 15px;
          border-top: 3px solid #fca5a5;
          border-radius: 50% 50% 0 0;
          transform: translateX(-50%);
        }

        .robot-neck {
          position: absolute;
          left: 74px;
          top: 119px;
          width: 42px;
          height: 20px;
          border-radius: 8px;
          background: #60a5fa;
        }

        .robot-body {
          position: absolute;
          left: 39px;
          top: 136px;
          width: 112px;
          height: 98px;
          border-radius: 30px;
          background: linear-gradient(145deg, #bfdbfe, #60a5fa);
          box-shadow: 0 20px 40px rgba(59,130,246,.18);
        }

        .screen-line {
          position: absolute;
          left: 24px;
          height: 8px;
          border-radius: 999px;
          background: rgba(15,23,42,.55);
        }

        .screen-line.a { top: 25px; width: 64px; }
        .screen-line.b { top: 43px; width: 46px; }
        .screen-line.c { top: 61px; width: 70px; }

        .robot-arm {
          position: absolute;
          top: 150px;
          width: 24px;
          height: 82px;
          border-radius: 999px;
          background: linear-gradient(180deg, #93c5fd, #3b82f6);
        }

        .arm-left {
          left: 16px;
          transform-origin: top;
          animation: sadArm 3.5s ease-in-out infinite;
        }

        .arm-right {
          right: 15px;
          transform-origin: top;
          animation: saveMoneyArm 3.5s ease-in-out infinite;
        }

        .hand-coin {
          position: absolute;
          left: -8px;
          bottom: -18px;
          width: 38px;
          height: 38px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #fff2a6, #f59e0b);
          color: #111827;
          font-size: 12px;
          font-weight: 950;
          animation: coinToSafe 3.5s ease-in-out infinite;
        }

        .robot-leg {
          position: absolute;
          top: 229px;
          width: 28px;
          height: 45px;
          border-radius: 999px;
          background: #3b82f6;
        }

        .leg-left { left: 60px; }
        .leg-right { right: 60px; }

        .speech {
          position: absolute;
          right: 54px;
          top: 70px;
          max-width: 230px;
          padding: 15px 17px;
          border-radius: 22px 22px 22px 6px;
          background: #ffffff;
          color: #0f172a;
          font-weight: 950;
          line-height: 1.35;
          box-shadow: 0 20px 45px rgba(0,0,0,.28);
          animation: speechPop 3.5s ease-in-out infinite;
        }

        @keyframes gridMove {
          from { background-position: 0 0; }
          to { background-position: 0 108px; }
        }

        @keyframes floatOrb {
          from { transform: translate3d(0,0,0) rotate(0deg); }
          to { transform: translate3d(30px,24px,0) rotate(12deg); }
        }

        @keyframes coinFly {
          0%, 100% { opacity: 0; transform: translate3d(0, 28px, 0) scale(.65) rotate(0deg); }
          18%, 72% { opacity: .9; }
          48% { transform: translate3d(16px, -34px, 0) scale(1) rotate(180deg); }
          80% { opacity: 0; transform: translate3d(-10px, -80px, 0) scale(.8) rotate(280deg); }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.35); }
        }

        @keyframes miniDance {
          0%, 100% { transform: translateY(0) rotate(-3deg); }
          50% { transform: translateY(-5px) rotate(4deg); }
        }

        @keyframes pointBtn {
          0%, 100% { transform: rotate(14deg); }
          50% { transform: rotate(-22deg); }
        }

        @keyframes heartRise {
          0% { opacity: 0; transform: translateY(12px) scale(.7); }
          30% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-18px) scale(1.2); }
        }

        @keyframes terminalFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-9px); }
        }

        @keyframes lineLoad {
          0%, 100% { opacity: .35; transform: scaleX(.72); transform-origin: left; }
          50% { opacity: 1; transform: scaleX(1); transform-origin: left; }
        }

        @keyframes revenuePulse {
          0%, 100% { width: 52%; }
          50% { width: 86%; }
        }

        @keyframes safeGlow {
          0%, 100% { opacity: .45; }
          50% { opacity: .95; }
        }

        @keyframes robotMood {
          0%, 100% { transform: translate(-50%, -50%) rotate(-1deg); }
          45% { transform: translate(-50%, -53%) rotate(1.5deg); }
          70% { transform: translate(-50%, -50%) rotate(-2deg); }
        }

        @keyframes blinkSad {
          0%, 86%, 100% { transform: scaleY(1); }
          90% { transform: scaleY(.1); }
        }

        @keyframes sadArm {
          0%, 100% { transform: rotate(18deg); }
          50% { transform: rotate(8deg); }
        }

        @keyframes saveMoneyArm {
          0%, 100% { transform: rotate(-8deg); }
          45% { transform: rotate(-44deg) translateX(20px); }
          70% { transform: rotate(-18deg); }
        }

        @keyframes coinToSafe {
          0%, 100% { opacity: 1; transform: translate(0,0) scale(1); }
          45% { opacity: 1; transform: translate(120px, 36px) scale(.75); }
          60% { opacity: 0; transform: translate(135px, 50px) scale(.35); }
          78% { opacity: 0; transform: translate(0,0) scale(.35); }
        }

        @keyframes speechPop {
          0%, 100% { opacity: .88; transform: translateY(0) scale(1); }
          50% { opacity: 1; transform: translateY(-7px) scale(1.02); }
        }

        @media (max-width: 900px) {
          .exit-page {
            padding: 22px 12px;
            align-items: flex-start;
          }

          .exit-shell {
            grid-template-columns: 1fr;
            padding: 20px;
            gap: 20px;
            border-radius: 26px;
          }

          .copy-area {
            order: 1;
          }

          .robot-stage {
            order: 2;
            min-height: 430px;
          }

          .cta-row {
            display: grid;
            grid-template-columns: 1fr;
          }

          .primary-btn,
          .gift-btn {
            width: 100%;
          }

          .gift-btn {
            padding-left: 16px;
            padding-right: 76px;
            text-align: left;
          }

          .terminal-card {
            left: 16px;
            top: 24px;
            width: 215px;
            height: 138px;
          }

          .speech {
            right: 18px;
            top: 34px;
            max-width: 160px;
            font-size: 13px;
          }

          .safe-box {
            right: 24px;
            bottom: 42px;
            width: 126px;
            height: 112px;
          }

          .main-robot {
            left: 46%;
            top: 57%;
            transform: translate(-50%, -50%) scale(.82);
          }

          h1 {
            letter-spacing: -.06em;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
    </main>
  );
}
