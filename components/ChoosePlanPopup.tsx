"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function ChoosePlanPopup() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    function check() {
      const url = new URL(window.location.href);
      const isPortal = url.pathname === "/portal";
      const choosePlan = url.searchParams.get("choosePlan") === "1";

      if (choosePlan) {
        window.localStorage.setItem("sualuma_needs_plan_choice", "1");
      }

      const needsPlan =
        window.localStorage.getItem("sualuma_needs_plan_choice") === "1";

      setShow(isPortal && (choosePlan || needsPlan));
    }

    check();

    window.addEventListener("popstate", check);
    window.addEventListener("sualuma-check-plan-popup", check as EventListener);

    return () => {
      window.removeEventListener("popstate", check);
      window.removeEventListener("sualuma-check-plan-popup", check as EventListener);
    };
  }, []);

  function continueAnyway() {
    window.localStorage.removeItem("sualuma_needs_plan_choice");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="plan-gate">
      <div className="plan-card">
        <div className="plan-orb" />

        <span className="eyebrow">Primeiro passo</span>

        <h2>Escolha seu plano antes de usar o dashboard.</h2>

        <p>
          Para liberar sua experiência na Sualuma, selecione o acesso ideal.
          Depois disso, você poderá usar seu painel, serviços, agentes e automações.
        </p>

        <div className="plan-actions">
          <Link href="/plans" className="primary">
            Escolher meu plano
          </Link>

          <button type="button" onClick={continueAnyway}>
            Já tenho plano / continuar
          </button>
        </div>

        <small>
          Depois podemos transformar isso em uma validação automática pelo banco:
          quem ainda não tem plano ativo não acessa o dashboard.
        </small>
      </div>

      <style>{`
        .plan-gate {
          position: fixed;
          inset: 0;
          z-index: 99999;
          display: grid;
          place-items: center;
          padding: 22px;
          background:
            radial-gradient(circle at 20% 20%, rgba(14,165,233,.24), transparent 32%),
            radial-gradient(circle at 80% 20%, rgba(168,85,247,.28), transparent 32%),
            rgba(2,6,23,.78);
          backdrop-filter: blur(18px);
        }

        .plan-card {
          position: relative;
          width: min(560px, 100%);
          overflow: hidden;
          padding: 34px;
          color: white;
          border-radius: 30px;
          background:
            linear-gradient(145deg, rgba(15,23,42,.96), rgba(30,27,75,.94)),
            rgba(255,255,255,.08);
          border: 1px solid rgba(148,163,184,.24);
          box-shadow: 0 40px 120px rgba(0,0,0,.48);
        }

        .plan-orb {
          position: absolute;
          top: -110px;
          right: -90px;
          width: 230px;
          height: 230px;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(56,189,248,.46), rgba(168,85,247,.12), transparent 70%);
          pointer-events: none;
        }

        .eyebrow {
          display: inline-flex;
          padding: 9px 12px;
          border-radius: 999px;
          color: #7dd3fc;
          background: rgba(14,165,233,.12);
          border: 1px solid rgba(125,211,252,.28);
          text-transform: uppercase;
          letter-spacing: .14em;
          font-size: 12px;
          font-weight: 900;
          margin-bottom: 16px;
        }

        .plan-card h2 {
          position: relative;
          z-index: 2;
          margin: 0 0 14px;
          font-size: clamp(30px, 5vw, 46px);
          line-height: 1.02;
          letter-spacing: -0.05em;
        }

        .plan-card p {
          position: relative;
          z-index: 2;
          margin: 0;
          color: #cbd5e1;
          line-height: 1.65;
          font-size: 16px;
        }

        .plan-actions {
          position: relative;
          z-index: 2;
          display: grid;
          gap: 12px;
          margin: 26px 0 16px;
        }

        .plan-actions a,
        .plan-actions button {
          border: 0;
          border-radius: 18px;
          padding: 16px 18px;
          text-align: center;
          text-decoration: none;
          font-weight: 900;
          font-size: 15px;
          cursor: pointer;
        }

        .plan-actions .primary {
          color: white;
          background: linear-gradient(90deg, #0ea5e9, #8b5cf6, #d946ef);
          box-shadow: 0 20px 50px rgba(139,92,246,.28);
        }

        .plan-actions button {
          color: #e0f2fe;
          background: rgba(255,255,255,.07);
          border: 1px solid rgba(255,255,255,.14);
        }

        .plan-card small {
          display: block;
          color: #94a3b8;
          line-height: 1.55;
        }
      `}</style>
    </div>
  );
}
