"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type StripeProduct = {
  id: string;
  productId: string;
  priceId: string;
  name: string;
  title: string;
  description: string;
  active: boolean;
  priceActive: boolean;
  amountNumber: number;
  amountCents: number;
  currency: string;
  price: string;
  priceFormatted: string;
  interval: string | null;
  type: string;
  category?: string;
  features?: string[];
  checkoutPath?: string;
};

const emptyForm = {
  name: "",
  category: "servicos",
  amount: "",
  interval: "month",
  description: "",
  features: "",
};

function intervalLabel(interval?: string | null) {
  if (interval === "month") return "Mensal";
  if (interval === "year") return "Anual";
  if (interval === "week") return "Semanal";
  if (interval === "day") return "Diário";
  return "Único";
}

function categoryLabel(category?: string) {
  const cat = String(category || "geral").toLowerCase();

  if (cat === "ia") return "IA";
  if (cat === "servicos" || cat === "serviços") return "Serviços";
  if (cat === "cursos") return "Cursos";
  if (cat === "agentes") return "Agentes";

  return "Geral";
}

export default function StudioStripePlanosPage() {
  const [adminKey, setAdminKey] = useState("");
  const [products, setProducts] = useState<StripeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("todos");
  const [form, setForm] = useState(emptyForm);

  const isEmbed =
    typeof window !== "undefined" && window.location.search.includes("embed=1");

  async function loadProducts() {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`/api/studio/stripe/products?ts=${Date.now()}`, {
        cache: "no-store",
      });

      const json = await res.json();

      if (!json.ok) {
        throw new Error(json.error || "Não consegui carregar os produtos.");
      }

      setProducts(json.products || []);
    } catch (error: any) {
      setMessage(`Erro ao carregar: ${error?.message || "erro desconhecido"}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const savedKey = localStorage.getItem("studio_admin_key") || "";
    setAdminKey(savedKey);
    loadProducts();
  }, []);

  function saveKey() {
    localStorage.setItem("studio_admin_key", adminKey.trim());
    setMessage("Chave salva neste navegador.");
  }

  async function createProduct(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setMessage("");

    try {
      const res = await fetch("/api/studio/stripe/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-studio-admin-key": adminKey.trim(),
        },
        body: JSON.stringify({
          name: form.name,
          category: form.category,
          amount: Number(form.amount.replace(",", ".")),
          interval: form.interval,
          description: form.description,
          features: form.features,
        }),
      });

      const json = await res.json();

      if (!json.ok) {
        throw new Error(json.error || "Não foi possível criar o plano.");
      }

      setMessage(`Plano criado com sucesso. Price ID: ${json.priceId}`);
      setForm(emptyForm);
      await loadProducts();
    } catch (error: any) {
      setMessage(`Erro ao criar: ${error?.message || "erro desconhecido"}`);
    } finally {
      setCreating(false);
    }
  }

  const filteredProducts = useMemo(() => {
    if (filter === "todos") return products;

    return products.filter((item) => {
      const cat = String(item.category || "geral").toLowerCase();
      return cat === filter;
    });
  }, [products, filter]);

  const serviceCount = products.filter((item) =>
    ["servicos", "serviços"].includes(String(item.category || "").toLowerCase())
  ).length;

  const iaCount = products.filter(
    (item) => String(item.category || "").toLowerCase() === "ia"
  ).length;

  return (
    <main className={isEmbed ? "studio-page embed" : "studio-page"}>
      <section className="hero">
        <p className="eyebrow">Studio Sualuma • Stripe</p>
        <h1>Planos, produtos e serviços</h1>
        <p>
          Crie produtos, preços mensais e links de checkout direto pela Stripe.
          Abaixo você vê tudo que já existe na sua conta.
        </p>

        <div className="hero-actions">
          <a href="/services/plans" target="_blank">
            Ver página pública
          </a>
          <button type="button" onClick={loadProducts}>
            Atualizar lista
          </button>
        </div>
      </section>

      <section className="stats-grid">
        <article>
          <span>Total</span>
          <strong>{products.length}</strong>
          <small>produtos/preços cadastrados</small>
        </article>

        <article>
          <span>Serviços</span>
          <strong>{serviceCount}</strong>
          <small>produtos marcados como serviços</small>
        </article>

        <article>
          <span>IA</span>
          <strong>{iaCount}</strong>
          <small>planos e produtos de IA</small>
        </article>
      </section>

      <section className="panel">
        <div>
          <p className="eyebrow">Chave admin</p>
          <h2>Segurança para criar planos</h2>
          <p className="muted">
            Para criar produto novo, cole a STUDIO_ADMIN_KEY do servidor. A lista
            aparece mesmo sem criar nada.
          </p>
        </div>

        <div className="key-row">
          <input
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            placeholder="Cole a STUDIO_ADMIN_KEY"
          />
          <button type="button" onClick={saveKey}>
            Salvar chave
          </button>
        </div>

        {message ? <p className="message">{message}</p> : null}
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Produtos cadastrados</p>
            <h2>Lista real da Stripe</h2>
            <p className="muted">
              Aqui aparecem os produtos e serviços já criados na sua Stripe.
            </p>
          </div>

          <button type="button" onClick={loadProducts}>
            Atualizar
          </button>
        </div>

        <div className="filters">
          <button
            type="button"
            className={filter === "todos" ? "active" : ""}
            onClick={() => setFilter("todos")}
          >
            Todos ({products.length})
          </button>
          <button
            type="button"
            className={filter === "servicos" ? "active" : ""}
            onClick={() => setFilter("servicos")}
          >
            Serviços ({serviceCount})
          </button>
          <button
            type="button"
            className={filter === "ia" ? "active" : ""}
            onClick={() => setFilter("ia")}
          >
            IA ({iaCount})
          </button>
        </div>

        {loading ? (
          <p className="empty">Carregando produtos da Stripe...</p>
        ) : filteredProducts.length === 0 ? (
          <p className="empty">
            Nenhum produto encontrado neste filtro. Troque para “Todos” ou crie
            um novo plano.
          </p>
        ) : (
          <div className="product-grid">
            {filteredProducts.map((item) => (
              <article className="product-card" key={item.priceId}>
                <div className="product-top">
                  <span>{categoryLabel(item.category)}</span>
                  <strong>{item.priceFormatted || item.price}</strong>
                </div>

                <h3>{item.name}</h3>

                <p>{item.description || "Sem descrição cadastrada."}</p>

                <div className="chips">
                  <small>{intervalLabel(item.interval)}</small>
                  <small>{item.active ? "Produto ativo" : "Produto pausado"}</small>
                  <small>{item.priceActive ? "Preço ativo" : "Preço pausado"}</small>
                </div>

                {item.features && item.features.length > 0 ? (
                  <ul>
                    {item.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                ) : null}

                <div className="ids">
                  <code>{item.productId}</code>
                  <code>{item.priceId}</code>
                </div>

                <form method="POST" action="/api/stripe/checkout-price">
                  <input type="hidden" name="priceId" value={item.priceId} />
                  <button type="submit">Gerar checkout</button>
                </form>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <p className="eyebrow">Criar novo plano</p>
        <h2>Novo produto + preço na Stripe</h2>

        <form className="create-form" onSubmit={createProduct}>
          <label>
            Nome do plano
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Prime Serviços"
              required
            />
          </label>

          <label>
            Categoria
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="servicos">Serviços</option>
              <option value="ia">IA</option>
              <option value="agentes">Agentes</option>
              <option value="cursos">Cursos</option>
              <option value="geral">Geral</option>
            </select>
          </label>

          <label>
            Valor mensal
            <input
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="Ex: 147"
              inputMode="decimal"
              required
            />
          </label>

          <label>
            Intervalo
            <select
              value={form.interval}
              onChange={(e) => setForm({ ...form, interval: e.target.value })}
            >
              <option value="month">Mensal</option>
              <option value="year">Anual</option>
              <option value="week">Semanal</option>
              <option value="day">Diário</option>
            </select>
          </label>

          <label className="wide">
            Descrição
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Explique para quem é esse plano."
            />
          </label>

          <label className="wide">
            Benefícios
            <textarea
              value={form.features}
              onChange={(e) => setForm({ ...form, features: e.target.value })}
              placeholder={"Um benefício por linha\nDashboard de serviços\nAgentes liberados\nSuporte prioritário"}
            />
          </label>

          <button className="main-btn" type="submit" disabled={creating}>
            {creating ? "Criando na Stripe..." : "Criar produto + preço na Stripe"}
          </button>
        </form>
      </section>

      <style jsx>{`
        .studio-page {
          min-height: 100vh;
          padding: 48px 18px;
          color: white;
          background:
            radial-gradient(circle at top left, rgba(124, 58, 237, 0.22), transparent 32%),
            radial-gradient(circle at top right, rgba(34, 211, 238, 0.18), transparent 30%),
            #050816;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .studio-page.embed {
          padding: 18px 12px;
          background: transparent;
        }

        .hero,
        .panel,
        .stats-grid article {
          max-width: 1120px;
          margin: 0 auto 22px;
          border: 1px solid rgba(148, 163, 184, 0.22);
          background: rgba(15, 23, 42, 0.74);
          border-radius: 32px;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.28);
        }

        .hero {
          padding: 42px;
        }

        .embed .hero {
          display: none;
        }

        .eyebrow {
          margin: 0 0 12px;
          color: #67e8f9;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.22em;
          text-transform: uppercase;
        }

        h1,
        h2,
        h3,
        p {
          margin-top: 0;
        }

        h1 {
          max-width: 760px;
          margin-bottom: 18px;
          font-size: clamp(42px, 8vw, 78px);
          line-height: 0.98;
          letter-spacing: -0.08em;
        }

        h2 {
          margin-bottom: 8px;
          font-size: clamp(26px, 4vw, 40px);
          letter-spacing: -0.05em;
        }

        h3 {
          margin-bottom: 10px;
          font-size: 24px;
          letter-spacing: -0.04em;
        }

        .hero p,
        .muted,
        .product-card p,
        .empty {
          color: rgba(226, 232, 240, 0.72);
          line-height: 1.7;
        }

        .hero-actions,
        .key-row,
        .section-head,
        .filters {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
        }

        .hero-actions {
          justify-content: flex-start;
          margin-top: 28px;
        }

        a,
        button {
          border: 0;
          border-radius: 999px;
          padding: 14px 20px;
          color: white;
          background: rgba(255, 255, 255, 0.1);
          font-weight: 900;
          text-decoration: none;
          cursor: pointer;
        }

        button:hover,
        a:hover {
          transform: translateY(-1px);
        }

        .stats-grid {
          max-width: 1120px;
          margin: 0 auto 22px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .stats-grid article {
          margin: 0;
          padding: 24px;
        }

        .stats-grid span,
        .stats-grid small {
          display: block;
          color: rgba(226, 232, 240, 0.66);
        }

        .stats-grid strong {
          display: block;
          margin: 8px 0;
          font-size: 42px;
        }

        .panel {
          padding: 28px;
        }

        input,
        select,
        textarea {
          width: 100%;
          border: 1px solid rgba(148, 163, 184, 0.28);
          border-radius: 22px;
          padding: 17px 18px;
          color: white;
          background: rgba(15, 23, 42, 0.92);
          font: inherit;
          outline: none;
        }

        textarea {
          min-height: 132px;
          resize: vertical;
        }

        label {
          color: rgba(226, 232, 240, 0.82);
          font-weight: 800;
        }

        .key-row input {
          flex: 1;
          min-width: 220px;
        }

        .message {
          margin-top: 14px;
          color: #67e8f9;
          font-weight: 800;
        }

        .filters {
          justify-content: flex-start;
          margin: 22px 0;
        }

        .filters button.active {
          background: linear-gradient(135deg, #7c3aed, #06b6d4);
        }

        .product-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .product-card {
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 28px;
          padding: 22px;
          background: rgba(2, 6, 23, 0.58);
        }

        .product-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 18px;
        }

        .product-top span,
        .chips small {
          border-radius: 999px;
          padding: 8px 10px;
          color: #a5f3fc;
          background: rgba(34, 211, 238, 0.1);
          font-size: 12px;
          font-weight: 900;
        }

        .product-top strong {
          font-size: 24px;
        }

        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 16px 0;
        }

        ul {
          margin: 12px 0;
          padding-left: 18px;
          color: rgba(226, 232, 240, 0.78);
        }

        .ids {
          display: grid;
          gap: 8px;
          margin: 14px 0;
        }

        code {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          border-radius: 14px;
          padding: 10px;
          color: #c4b5fd;
          background: rgba(255, 255, 255, 0.06);
          font-size: 11px;
        }

        .create-form {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-top: 22px;
        }

        .wide,
        .main-btn {
          grid-column: 1 / -1;
        }

        .main-btn {
          padding: 18px;
          background: linear-gradient(135deg, #7c3aed, #06b6d4);
          font-size: 18px;
        }

        @media (max-width: 820px) {
          .studio-page {
            padding: 28px 12px;
          }

          .hero,
          .panel {
            padding: 24px;
            border-radius: 28px;
          }

          .stats-grid,
          .product-grid,
          .create-form {
            grid-template-columns: 1fr;
          }

          .section-head {
            align-items: flex-start;
          }

          h1 {
            font-size: 52px;
          }
        }
      `}</style>
    </main>
  );
}
