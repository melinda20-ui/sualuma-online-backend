"use client";

import { useEffect, useState } from "react";

type StripePlan = {
  productId: string;
  productName: string;
  description: string;
  priceId: string;
  amountFormatted: string;
  interval: string;
  trialDays: number;
  features: string[];
};

export default function ServicePlansPage() {
  const [plans, setPlans] = useState<StripePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadPlans() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/studio/stripe/products?area=services", {
        cache: "no-store",
      });

      const payload = await response.json();

      if (!payload.ok) {
        throw new Error(payload.error || "Erro ao carregar planos.");
      }

      setPlans(payload.products || []);
    } catch (error: any) {
      setMessage(error?.message || "Não foi possível carregar os planos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlans();
  }, []);

  async function checkout(priceId: string) {
    setMessage("Abrindo checkout seguro...");

    try {
      const response = await fetch("/api/stripe/checkout-price", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priceId }),
      });

      const payload = await response.json();

      if (!payload.ok) {
        throw new Error(payload.error || "Erro ao abrir checkout.");
      }

      window.location.href = payload.checkoutUrl;
    } catch (error: any) {
      setMessage(error?.message || "Não foi possível abrir o checkout.");
    }
  }

  return (
    <main className="servicePlansPage">
      <section className="hero">
        <p className="eyebrow">Sualuma Serviços</p>
        <h1>Escolha o plano ideal para acelerar sua empresa com IA</h1>
        <p>
          Planos para organizar operação, atendimento, automações, presença digital e crescimento
          com uma estrutura mais inteligente.
        </p>
      </section>

      {message ? <div className="message">{message}</div> : null}

      {loading ? (
        <p className="loading">Carregando planos...</p>
      ) : plans.length === 0 ? (
        <section className="empty">
          <h2>Planos em preparação</h2>
          <p>Os planos de serviços ainda serão publicados.</p>
        </section>
      ) : (
        <section className="plansGrid">
          {plans.map((plan) => (
            <article key={plan.priceId} className="planCard">
              <div>
                <p className="tag">Plano mensal</p>
                <h2>{plan.productName}</h2>
                <p>{plan.description || "Plano para serviços e automações da Sualuma."}</p>
              </div>

              <div className="price">
                <strong>{plan.amountFormatted}</strong>
                <span>/{plan.interval === "year" ? "ano" : "mês"}</span>
              </div>

              {plan.trialDays > 0 ? (
                <div className="trial">{plan.trialDays} dias de teste grátis</div>
              ) : null}

              {plan.features?.length ? (
                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              ) : (
                <ul>
                  <li>Checkout seguro pela Stripe</li>
                  <li>Acesso aos recursos do plano</li>
                  <li>Suporte conforme disponibilidade</li>
                </ul>
              )}

              <button type="button" onClick={() => checkout(plan.priceId)}>
                Assinar agora
              </button>
            </article>
          ))}
        </section>
      )}

      <style>{`
        .servicePlansPage {
          min-height: 100vh;
          padding: 34px;
          background:
            radial-gradient(circle at top left, rgba(124,58,237,.22), transparent 34%),
            radial-gradient(circle at bottom right, rgba(6,182,212,.20), transparent 28%),
            #070816;
          color: #f8fafc;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .hero {
          max-width: 980px;
          margin: 0 auto 28px;
          text-align: center;
        }

        .eyebrow, .tag {
          color: #67e8f9;
          text-transform: uppercase;
          font-size: 12px;
          letter-spacing: .18em;
          font-weight: 900;
        }

        .hero h1 {
          margin: 0;
          font-size: clamp(36px, 7vw, 76px);
          letter-spacing: -0.06em;
          line-height: .94;
        }

        .hero p {
          color: #cbd5e1;
          line-height: 1.7;
          max-width: 760px;
          margin: 20px auto 0;
        }

        .message, .loading, .empty {
          max-width: 980px;
          margin: 0 auto 18px;
          border-radius: 22px;
          padding: 18px;
          border: 1px solid rgba(255,255,255,.12);
          background: rgba(255,255,255,.06);
          color: #e0f2fe;
        }

        .plansGrid {
          max-width: 1180px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }

        .planCard {
          min-height: 520px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border-radius: 30px;
          padding: 26px;
          border: 1px solid rgba(255,255,255,.12);
          background: rgba(10,12,28,.78);
          box-shadow: 0 24px 90px rgba(0,0,0,.25);
          backdrop-filter: blur(18px);
        }

        .planCard h2 {
          margin: 8px 0 8px;
          font-size: 32px;
          letter-spacing: -0.04em;
        }

        .planCard p {
          color: #cbd5e1;
          line-height: 1.6;
        }

        .price {
          margin: 22px 0 8px;
          display: flex;
          align-items: baseline;
          gap: 8px;
        }

        .price strong {
          font-size: 38px;
          letter-spacing: -0.05em;
        }

        .price span {
          color: #93c5fd;
          font-weight: 800;
        }

        .trial {
          display: inline-flex;
          width: fit-content;
          border-radius: 999px;
          padding: 8px 12px;
          background: rgba(34,197,94,.14);
          border: 1px solid rgba(34,197,94,.28);
          color: #bbf7d0;
          font-size: 13px;
          font-weight: 900;
        }

        ul {
          padding-left: 18px;
          color: #e0f2fe;
          line-height: 1.7;
        }

        button {
          width: 100%;
          border: 0;
          border-radius: 999px;
          padding: 15px 18px;
          background: linear-gradient(135deg, #7c3aed, #06b6d4);
          color: white;
          font-weight: 950;
          cursor: pointer;
          box-shadow: 0 18px 50px rgba(6,182,212,.20);
        }

        @media (max-width: 980px) {
          .servicePlansPage {
            padding: 20px;
          }

          .plansGrid {
            grid-template-columns: 1fr;
          }

          .planCard {
            min-height: auto;
          }
        }
      `}</style>
    </main>
  );
}
