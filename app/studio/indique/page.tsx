"use client";

import { useEffect, useMemo, useState } from "react";

type ReferralLink = {
  id: string;
  code: string;
  link: string;
  fullUrl: string;
  destinationUrl: string;
  referrerName: string | null;
  referrerEmail: string | null;
  clicks: number;
  leads: number;
  conversions: number;
  revenueFormatted: string;
  payoutFormatted: string;
  active: boolean;
  createdAt: string;
};

type Campaign = {
  id: string;
  name: string;
  slug: string;
  reward_type: string;
  reward_percent: number | null;
  reward_cents: number | null;
  active: boolean;
};

export default function StudioIndiquePage() {
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [links, setLinks] = useState<ReferralLink[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [copied, setCopied] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    referrerName: "",
    referrerEmail: "",
    code: "",
    campaignSlug: "indique-sualuma",
    destinationUrl: "https://sualuma.online/cadastro",
  });

  const mainLink = useMemo(() => {
    return links[0]?.fullUrl || links[0]?.link || "";
  }, [links]);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/studio/servicos-e-indique/links", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.error || "Erro ao carregar links.");
      }

      setLinks(data.links || []);
      setCampaigns(data.campaigns || []);
      setSummary(data.summary || null);
    } catch (err: any) {
      setError(err?.message || "Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }

  async function createLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setError("");

    try {
      const res = await fetch("/api/studio/servicos-e-indique/links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.error || "Erro ao criar link.");
      }

      setForm((current) => ({
        ...current,
        referrerName: "",
        referrerEmail: "",
        code: "",
      }));

      await loadData();
      await copyToClipboard(data.link.fullUrl || data.link.link);
    } catch (err: any) {
      setError(err?.message || "Erro ao criar link.");
    } finally {
      setCreating(false);
    }
  }

  async function copyToClipboard(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(value);
      setTimeout(() => setCopied(""), 2500);
    } catch {
      setCopied("");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <main className="indique-page">
      <section className="hero">
        <div>
          <p className="eyebrow">STUDIO SUALUMA • INDIQUE</p>
          <h1>Links rastreados de indicação</h1>
          <p className="subtitle">
            Gere links para parceiros, clientes e prestadores indicarem a Sualuma. Aqui você acompanha cliques, leads, conversões, dinheiro gerado e valor a pagar.
          </p>
        </div>

        <button className="ghost-button" onClick={loadData} disabled={loading}>
          {loading ? "Atualizando..." : "Atualizar"}
        </button>
      </section>

      <section className="metrics">
        <div className="metric-card">
          <span>Links criados</span>
          <strong>{summary?.links ?? links.length}</strong>
        </div>
        <div className="metric-card">
          <span>Cliques</span>
          <strong>{summary?.clicks ?? 0}</strong>
        </div>
        <div className="metric-card">
          <span>Leads</span>
          <strong>{summary?.leads ?? 0}</strong>
        </div>
        <div className="metric-card">
          <span>Conversões</span>
          <strong>{summary?.conversions ?? 0}</strong>
        </div>
        <div className="metric-card">
          <span>Entrou por indicação</span>
          <strong>{summary?.revenueFormatted ?? "R$ 0,00"}</strong>
        </div>
        <div className="metric-card">
          <span>A pagar</span>
          <strong>{summary?.payoutFormatted ?? "R$ 0,00"}</strong>
        </div>
      </section>

      <section className="grid">
        <form className="panel" onSubmit={createLink}>
          <p className="panel-kicker">GERAR NOVO LINK</p>
          <h2>Criar indicação</h2>

          <label>
            Nome de quem indica
            <input
              value={form.referrerName}
              onChange={(e) => setForm({ ...form, referrerName: e.target.value })}
              placeholder="Ex: Amanda Peixoto"
              required
            />
          </label>

          <label>
            E-mail de quem indica
            <input
              value={form.referrerEmail}
              onChange={(e) => setForm({ ...form, referrerEmail: e.target.value })}
              placeholder="email@exemplo.com"
              type="email"
            />
          </label>

          <label>
            Código personalizado
            <input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="Ex: AMANDA10"
            />
          </label>

          <label>
            Campanha
            <select
              value={form.campaignSlug}
              onChange={(e) => setForm({ ...form, campaignSlug: e.target.value })}
            >
              {campaigns.length === 0 ? (
                <option value="indique-sualuma">Indique Sualuma</option>
              ) : (
                campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.slug}>
                    {campaign.name}
                  </option>
                ))
              )}
            </select>
          </label>

          <label>
            Página de destino
            <input
              value={form.destinationUrl}
              onChange={(e) => setForm({ ...form, destinationUrl: e.target.value })}
              placeholder="https://sualuma.online/cadastro"
              required
            />
          </label>

          {error ? <div className="error">{error}</div> : null}

          <button className="primary-button" type="submit" disabled={creating}>
            {creating ? "Criando..." : "Gerar link rastreado"}
          </button>

          {copied ? (
            <div className="success">
              Link criado e copiado.
            </div>
          ) : null}
        </form>

        <section className="panel">
          <p className="panel-kicker">ÚLTIMO LINK</p>
          <h2>Link pronto para divulgar</h2>

          {mainLink ? (
            <>
              <div className="link-box">{mainLink}</div>
              <button className="ghost-button full" onClick={() => copyToClipboard(mainLink)}>
                Copiar link
              </button>
            </>
          ) : (
            <p className="muted">Nenhum link criado ainda. Crie o primeiro pelo formulário.</p>
          )}
        </section>
      </section>

      <section className="panel links-panel">
        <div className="section-head">
          <div>
            <p className="panel-kicker">LISTA DE INDICAÇÕES</p>
            <h2>Links criados</h2>
          </div>
          <span className="badge">{links.length} links</span>
        </div>

        <div className="links-list">
          {loading ? (
            <p className="muted">Carregando links...</p>
          ) : links.length === 0 ? (
            <p className="muted">Nenhum link criado ainda.</p>
          ) : (
            links.map((item) => (
              <article className="link-card" key={item.id}>
                <div>
                  <strong>{item.referrerName || "Parceiro sem nome"}</strong>
                  <p>{item.referrerEmail || "Sem e-mail cadastrado"}</p>
                  <small>{item.fullUrl || item.link}</small>
                </div>

                <div className="stats">
                  <span>{item.code}</span>
                  <span>{item.clicks} cliques</span>
                  <span>{item.leads} leads</span>
                  <span>{item.conversions} vendas</span>
                  <span>Entrou: {item.revenueFormatted}</span>
                  <span>Pagar: {item.payoutFormatted}</span>
                </div>

                <button onClick={() => copyToClipboard(item.fullUrl || item.link)}>
                  Copiar
                </button>
              </article>
            ))
          )}
        </div>
      </section>

      <style>{`
        * {
          box-sizing: border-box;
        }

        .indique-page {
          min-height: 100vh;
          padding: 56px 6vw;
          background:
            radial-gradient(circle at 10% 10%, rgba(236, 72, 153, .18), transparent 26%),
            radial-gradient(circle at 90% 20%, rgba(56, 189, 248, .16), transparent 24%),
            linear-gradient(135deg, #070716, #08111f 55%, #020617);
          color: #f8fafc;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .hero {
          display: flex;
          justify-content: space-between;
          gap: 24px;
          align-items: flex-start;
          padding: 32px;
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 32px;
          background: rgba(10, 13, 30, .78);
          box-shadow: 0 24px 80px rgba(0,0,0,.32);
        }

        .eyebrow,
        .panel-kicker {
          color: #67e8f9;
          font-weight: 900;
          letter-spacing: .22em;
          font-size: 12px;
          text-transform: uppercase;
        }

        h1 {
          margin: 14px 0;
          font-size: clamp(38px, 7vw, 76px);
          line-height: .95;
          letter-spacing: -0.07em;
        }

        h2 {
          margin: 8px 0 18px;
          font-size: clamp(26px, 4vw, 42px);
          line-height: 1;
          letter-spacing: -0.05em;
        }

        .subtitle,
        .muted {
          color: #aab4c8;
          font-size: 18px;
          line-height: 1.65;
          max-width: 760px;
        }

        .metrics {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 16px;
          margin: 24px 0;
        }

        .metric-card,
        .panel {
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 28px;
          background: rgba(15, 23, 42, .72);
          box-shadow: 0 20px 60px rgba(0,0,0,.22);
        }

        .metric-card {
          padding: 20px;
        }

        .metric-card span {
          display: block;
          color: #98a2b3;
          font-size: 13px;
          margin-bottom: 10px;
        }

        .metric-card strong {
          font-size: 24px;
        }

        .grid {
          display: grid;
          grid-template-columns: 1.1fr .9fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        .panel {
          padding: 28px;
        }

        label {
          display: grid;
          gap: 10px;
          color: #dbeafe;
          font-weight: 800;
          margin: 16px 0;
        }

        input,
        select {
          width: 100%;
          border: 1px solid rgba(255,255,255,.14);
          border-radius: 20px;
          background: rgba(255,255,255,.06);
          color: #fff;
          padding: 18px 18px;
          font-size: 16px;
          outline: none;
        }

        select option {
          color: #020617;
        }

        .primary-button,
        .ghost-button,
        .link-card button {
          border: 0;
          cursor: pointer;
          color: #fff;
          font-weight: 950;
          border-radius: 999px;
          padding: 17px 22px;
          font-size: 16px;
        }

        .primary-button {
          width: 100%;
          margin-top: 10px;
          background: linear-gradient(135deg, #9333ea, #ec4899, #06b6d4);
          box-shadow: 0 20px 50px rgba(236,72,153,.28);
        }

        .ghost-button,
        .link-card button {
          background: rgba(255,255,255,.08);
          border: 1px solid rgba(255,255,255,.14);
        }

        .full {
          width: 100%;
          margin-top: 16px;
        }

        .link-box {
          overflow-wrap: anywhere;
          padding: 18px;
          border-radius: 20px;
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.1);
          color: #bae6fd;
          line-height: 1.5;
        }

        .success {
          margin-top: 14px;
          padding: 14px;
          border-radius: 16px;
          color: #bbf7d0;
          background: rgba(34, 197, 94, .12);
          border: 1px solid rgba(34, 197, 94, .22);
        }

        .error {
          margin-top: 14px;
          padding: 14px;
          border-radius: 16px;
          color: #fecaca;
          background: rgba(239, 68, 68, .12);
          border: 1px solid rgba(239, 68, 68, .22);
        }

        .section-head {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: flex-start;
        }

        .badge {
          padding: 10px 14px;
          border-radius: 999px;
          color: #fff;
          background: rgba(236, 72, 153, .22);
          border: 1px solid rgba(236, 72, 153, .35);
          font-weight: 900;
        }

        .links-list {
          display: grid;
          gap: 14px;
          margin-top: 20px;
        }

        .link-card {
          display: grid;
          grid-template-columns: 1.1fr 1.2fr auto;
          gap: 16px;
          align-items: center;
          padding: 18px;
          border-radius: 22px;
          background: rgba(255,255,255,.045);
          border: 1px solid rgba(255,255,255,.09);
        }

        .link-card p,
        .link-card small {
          margin: 6px 0 0;
          color: #94a3b8;
        }

        .link-card small {
          display: block;
          overflow-wrap: anywhere;
        }

        .stats {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .stats span {
          padding: 8px 10px;
          border-radius: 999px;
          background: rgba(255,255,255,.07);
          color: #dbeafe;
          font-size: 12px;
          font-weight: 800;
        }

        @media (max-width: 900px) {
          .indique-page {
            padding: 28px 18px 120px;
          }

          .hero,
          .grid {
            grid-template-columns: 1fr;
            display: grid;
          }

          .metrics {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .link-card {
            grid-template-columns: 1fr;
          }

          .hero {
            padding: 24px;
          }
        }
      `}</style>
    </main>
  );
}
