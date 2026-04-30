"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type StripePlan = {
  productId: string;
  productName: string;
  description: string;
  priceId: string;
  amount: number;
  amountFormatted: string;
  interval: string;
  trialDays: number;
  area: string;
  features: string[];
};

const emptyForm = {
  name: "",
  amount: "97",
  interval: "month",
  trialDays: "0",
  description: "",
  features: "",
};

export default function StudioStripePlanosPage() {
  const [adminKey, setAdminKey] = useState("");
  const [plans, setPlans] = useState<StripePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(emptyForm);

  const activePlans = useMemo(() => plans.filter((plan) => plan.area === "services"), [plans]);

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
      setMessage(`Erro: ${error?.message || "não foi possível carregar os planos."}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setAdminKey(localStorage.getItem("studio-admin-key") || "");
    loadPlans();
  }, []);

  function updateForm(field: keyof typeof emptyForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function saveAdminKey() {
    localStorage.setItem("studio-admin-key", adminKey.trim());
    setMessage("Chave admin salva neste navegador.");
  }

  async function createPlan(event: FormEvent) {
    event.preventDefault();

    if (!adminKey.trim()) {
      setMessage("Cole a STUDIO_ADMIN_KEY para criar planos.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/studio/stripe/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-studio-admin-key": adminKey.trim(),
        },
        body: JSON.stringify({
          area: "services",
          name: form.name,
          amount: Number(form.amount),
          interval: form.interval,
          trialDays: Number(form.trialDays),
          description: form.description,
          features: form.features,
        }),
      });

      const payload = await response.json();

      if (!payload.ok) {
        throw new Error(payload.error || "Erro ao criar plano.");
      }

      setMessage(`Plano criado: ${payload.productName} • ${payload.amountFormatted}`);
      setForm(emptyForm);
      await loadPlans();
    } catch (error: any) {
      setMessage(`Erro: ${error?.message || "não foi possível criar o plano."}`);
    } finally {
      setSaving(false);
    }
  }

  async function openCheckout(priceId: string) {
    setMessage("Criando checkout...");

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
        throw new Error(payload.error || "Erro ao criar checkout.");
      }

      window.open(payload.checkoutUrl, "_blank");
      setMessage("Checkout aberto em nova aba.");
    } catch (error: any) {
      setMessage(`Erro: ${error?.message || "não foi possível abrir checkout."}`);
    }
  }

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    setMessage("Copiado.");
  }

  return (
    <main className="stripeStudioPage">
      <section className="hero">
        <div>
          <p className="eyebrow">Studio Sualuma • Stripe</p>
          <h1>Planos e produtos dos serviços</h1>
          <p>
            Crie produtos, preços mensais, testes grátis e links de checkout direto pela Stripe,
            sem abrir o painel da Stripe toda hora.
          </p>
        </div>

        <a href="/services/plans" target="_blank" className="ghostButton">
          Ver página pública
        </a>
      </section>

      <section className="adminKeyBox">
        <div>
          <strong>Chave admin</strong>
          <span>
            Para segurança, criar plano exige a STUDIO_ADMIN_KEY do servidor.
          </span>
        </div>

        <div className="keyActions">
          <input
            type="password"
            value={adminKey}
            onChange={(event) => setAdminKey(event.target.value)}
            placeholder="Cole a STUDIO_ADMIN_KEY"
          />
          <button type="button" onClick={saveAdminKey}>
            Salvar chave
          </button>
        </div>
      </section>

      {message ? <div className="message">{message}</div> : null}

      <section className="grid">
        <form className="card formCard" onSubmit={createPlan}>
          <p className="eyebrow">Criar novo plano</p>
          <h2>Novo plano de serviço</h2>

          <label>
            Nome do plano
            <input
              value={form.name}
              onChange={(event) => updateForm("name", event.target.value)}
              placeholder="Ex: IA Prime"
              required
            />
          </label>

          <div className="twoCols">
            <label>
              Valor mensal
              <input
                value={form.amount}
                onChange={(event) => updateForm("amount", event.target.value)}
                placeholder="97"
                type="number"
                min="1"
                step="1"
                required
              />
            </label>

            <label>
              Intervalo
              <select
                value={form.interval}
                onChange={(event) => updateForm("interval", event.target.value)}
              >
                <option value="month">Mensal</option>
                <option value="year">Anual</option>
              </select>
            </label>
          </div>

          <label>
            Dias de teste grátis
            <input
              value={form.trialDays}
              onChange={(event) => updateForm("trialDays", event.target.value)}
              placeholder="0"
              type="number"
              min="0"
              step="1"
            />
          </label>

          <label>
            Descrição
            <textarea
              value={form.description}
              onChange={(event) => updateForm("description", event.target.value)}
              placeholder="Explique para quem é esse plano."
              rows={3}
            />
          </label>

          <label>
            Benefícios
            <textarea
              value={form.features}
              onChange={(event) => updateForm("features", event.target.value)}
              placeholder={"Um benefício por linha\nDashboard de serviços\nAgentes liberados\nSuporte prioritário"}
              rows={5}
            />
          </label>

          <button className="mainButton" disabled={saving} type="submit">
            {saving ? "Criando..." : "Criar produto + preço na Stripe"}
          </button>
        </form>

        <section className="card">
          <div className="listHeader">
            <div>
              <p className="eyebrow">Planos cadastrados</p>
              <h2>Serviços</h2>
            </div>
            <button type="button" onClick={loadPlans}>
              Atualizar
            </button>
          </div>

          {loading ? (
            <p className="muted">Carregando planos...</p>
          ) : activePlans.length === 0 ? (
            <p className="muted">
              Nenhum plano de serviços encontrado. Crie o primeiro pelo formulário.
            </p>
          ) : (
            <div className="plansList">
              {activePlans.map((plan) => (
                <article key={plan.priceId} className="planItem">
                  <div>
                    <strong>{plan.productName}</strong>
                    <span>{plan.description || "Sem descrição cadastrada."}</span>
                  </div>

                  <div className="priceLine">
                    <b>{plan.amountFormatted}</b>
                    <small>
                      /{plan.interval === "year" ? "ano" : "mês"}
                      {plan.trialDays > 0 ? ` • ${plan.trialDays} dias grátis` : ""}
                    </small>
                  </div>

                  {plan.features?.length ? (
                    <ul>
                      {plan.features.map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>
                  ) : null}

                  <div className="itemActions">
                    <button type="button" onClick={() => openCheckout(plan.priceId)}>
                      Testar checkout
                    </button>
                    <button type="button" onClick={() => copy(plan.priceId)}>
                      Copiar Price ID
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

      <style>{`
        .stripeStudioPage {
          min-height: 100vh;
          padding: 32px;
          background:
            radial-gradient(circle at top left, rgba(124, 58, 237, .20), transparent 34%),
            radial-gradient(circle at bottom right, rgba(56, 189, 248, .18), transparent 30%),
            #070816;
          color: #f8fafc;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .hero, .adminKeyBox, .card {
          border: 1px solid rgba(255,255,255,.11);
          background: rgba(10, 12, 28, .78);
          box-shadow: 0 24px 90px rgba(0,0,0,.25);
          backdrop-filter: blur(18px);
          border-radius: 28px;
        }

        .hero {
          display: flex;
          justify-content: space-between;
          gap: 24px;
          align-items: center;
          padding: 30px;
          margin-bottom: 18px;
        }

        .hero h1, .card h2 {
          margin: 0;
          letter-spacing: -0.04em;
        }

        .hero h1 {
          font-size: clamp(34px, 5vw, 62px);
          max-width: 780px;
        }

        .hero p {
          max-width: 720px;
          color: #cbd5e1;
          line-height: 1.7;
        }

        .eyebrow {
          margin: 0 0 10px;
          color: #67e8f9;
          text-transform: uppercase;
          font-size: 12px;
          letter-spacing: .18em;
          font-weight: 800;
        }

        .adminKeyBox {
          padding: 18px;
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: center;
          margin-bottom: 18px;
        }

        .adminKeyBox span, .muted {
          display: block;
          color: #94a3b8;
          font-size: 14px;
          margin-top: 4px;
        }

        .keyActions {
          display: flex;
          gap: 10px;
          width: min(100%, 560px);
        }

        .grid {
          display: grid;
          grid-template-columns: minmax(320px, 480px) 1fr;
          gap: 18px;
          align-items: start;
        }

        .card {
          padding: 24px;
        }

        .formCard {
          display: grid;
          gap: 14px;
        }

        label {
          display: grid;
          gap: 7px;
          color: #dbeafe;
          font-weight: 700;
          font-size: 13px;
        }

        input, textarea, select {
          width: 100%;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,.14);
          background: rgba(255,255,255,.06);
          color: #fff;
          padding: 13px 14px;
          outline: none;
        }

        textarea {
          resize: vertical;
        }

        input::placeholder, textarea::placeholder {
          color: #64748b;
        }

        select option {
          color: #0f172a;
        }

        button, .ghostButton, .mainButton {
          border: 0;
          border-radius: 999px;
          padding: 12px 16px;
          font-weight: 900;
          cursor: pointer;
          text-decoration: none;
          text-align: center;
        }

        button {
          background: rgba(255,255,255,.10);
          color: #fff;
          border: 1px solid rgba(255,255,255,.13);
        }

        .mainButton {
          background: linear-gradient(135deg, #7c3aed, #06b6d4);
          color: #fff;
          box-shadow: 0 18px 50px rgba(6, 182, 212, .18);
        }

        .ghostButton {
          color: #fff;
          border: 1px solid rgba(255,255,255,.18);
          background: rgba(255,255,255,.06);
          white-space: nowrap;
        }

        button:disabled {
          opacity: .55;
          cursor: not-allowed;
        }

        .twoCols {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .message {
          border-radius: 18px;
          background: rgba(103, 232, 249, .12);
          border: 1px solid rgba(103, 232, 249, .25);
          color: #e0f2fe;
          padding: 14px 16px;
          margin-bottom: 18px;
        }

        .listHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 18px;
        }

        .plansList {
          display: grid;
          gap: 14px;
        }

        .planItem {
          border: 1px solid rgba(255,255,255,.10);
          border-radius: 22px;
          padding: 18px;
          background: rgba(255,255,255,.05);
        }

        .planItem strong {
          display: block;
          font-size: 20px;
        }

        .planItem span {
          display: block;
          color: #94a3b8;
          margin-top: 4px;
          line-height: 1.5;
        }

        .priceLine {
          margin-top: 14px;
          display: flex;
          align-items: baseline;
          gap: 8px;
        }

        .priceLine b {
          font-size: 28px;
          letter-spacing: -0.04em;
        }

        .priceLine small {
          color: #93c5fd;
        }

        .planItem ul {
          margin: 14px 0 0;
          padding-left: 18px;
          color: #dbeafe;
        }

        .planItem li {
          margin: 6px 0;
        }

        .itemActions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 16px;
        }

        @media (max-width: 900px) {
          .stripeStudioPage {
            padding: 18px;
          }

          .hero, .adminKeyBox, .grid, .twoCols, .keyActions {
            grid-template-columns: 1fr;
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
    </main>
  );
}
