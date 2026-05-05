"use client";

import { useEffect, useMemo, useState } from "react";

type AnyObj = Record<string, any>;

const swotLabels: AnyObj = {
  strengths: "Forças",
  weaknesses: "Fraquezas",
  opportunities: "Oportunidades",
  threats: "Ameaças"
};

export default function CanvasEmpresaPage() {
  const [data, setData] = useState<AnyObj | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/studio/canvas-empresa", { cache: "no-store" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Erro ao carregar canvas.");
      setData(json);
    } catch (err: any) {
      setError(err?.message || "Erro ao carregar canvas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const canvas = data?.canvas || {};
  const metrics = data?.metrics || {};
  const productFunnel = Array.isArray(canvas.productFunnel) ? canvas.productFunnel : [];
  const funnelThinking = Array.isArray(canvas.funnelThinking) ? canvas.funnelThinking : [];
  const decisionRules = Array.isArray(canvas.decisionRules) ? canvas.decisionRules : [];
  const supervisors = Array.isArray(data?.supervisors) ? data?.supervisors : [];
  const execution = Array.isArray(data?.execution) ? data?.execution : [];
  const swot = data?.swot || {};

  const mainOffer = useMemo(() => {
    return productFunnel.find((item: AnyObj) => item.pillar === "Serviço de Sites") || productFunnel[0] || {};
  }, [productFunnel]);

  return (
    <main className="canvasPage">
      <section className="hero">
        <div>
          <p className="eyebrow">Studio / Estratégia / Canvas da Empresa</p>
          <h1>Canvas da Empresa Sualuma</h1>
          <p className="lead">
            Um mapa vivo para vender sites, microSaaS, agentes, prestadores, templates e sistemas em harmonia,
            sem confundir o cliente.
          </p>

          <div className="heroActions">
            <button onClick={load} disabled={loading}>
              {loading ? "Atualizando..." : "Atualizar leitura"}
            </button>
            <a href="/studio/agentesadms">Ver tarefas</a>
            <a href="/studio/metas-financeiras">Ver metas</a>
          </div>
        </div>

        <aside className="northCard">
          <span>Decisão principal</span>
          <strong>{canvas.mainDecision || "Carregando decisão principal..."}</strong>
          <small>Supervisão: Growth + Lançamento + UX + Tarefas</small>
        </aside>
      </section>

      {error && <div className="alert error">{error}</div>}

      <section className="metrics">
        <article>
          <span>Saúde do sistema</span>
          <strong>{metrics.health ?? "--"}%</strong>
          <small>{metrics.downTargets || 0} pontos com problema</small>
        </article>
        <article>
          <span>Tarefas abertas</span>
          <strong>{metrics.openTasks ?? "--"}</strong>
          <small>Agente de tarefas acompanhando</small>
        </article>
        <article>
          <span>Produtos no funil</span>
          <strong>{productFunnel.length}</strong>
          <small>Organizados por pilar</small>
        </article>
        <article>
          <span>Oferta de caixa rápido</span>
          <strong>{mainOffer.pillar || "Sites"}</strong>
          <small>{mainOffer.entryPage || "/site-service"}</small>
        </article>
      </section>

      <section className="section">
        <div className="sectionHead">
          <p className="eyebrow">Funil mestre</p>
          <h2>Pensamento do funil</h2>
          <p>Cada etapa precisa levar o cliente para a próxima ação certa, sem mostrar tudo ao mesmo tempo.</p>
        </div>

        <div className="funnelGrid">
          {funnelThinking.map((item: AnyObj) => (
            <article key={item.stage} className="funnelCard">
              <strong>{item.stage}</strong>
              <p>{item.goal}</p>
              <div>
                {(item.assets || []).map((asset: string) => (
                  <span key={asset}>{asset}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="sectionHead">
          <p className="eyebrow">Produtos em harmonia</p>
          <h2>Mapa dos sistemas e ofertas</h2>
          <p>O cliente deve entrar por uma dor clara e receber a oferta adequada ao momento dele.</p>
        </div>

        <div className="productGrid">
          {productFunnel.map((item: AnyObj) => (
            <article key={item.pillar} className="productCard">
              <div className="productTop">
                <span>{item.status}</span>
                <h3>{item.pillar}</h3>
              </div>

              <p className="offer">{item.offer}</p>
              <p>{item.mainAudience}</p>

              <div className="routeBox">
                <small>Entrada</small>
                <code>{item.entryPage}</code>
                <small>Interativo</small>
                <code>{item.interactivePage}</code>
                <small>Sucesso</small>
                <code>{item.successPage}</code>
              </div>

              <footer>
                <b>CTA:</b> {item.cta}
              </footer>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="sectionHead">
          <p className="eyebrow">SWOT automática</p>
          <h2>Análise estratégica</h2>
          <p>Gerada com base no canvas, nas tarefas e no diagnóstico atual.</p>
        </div>

        <div className="swotGrid">
          {Object.keys(swotLabels).map((key) => (
            <article key={key} className={`swotCard ${key}`}>
              <h3>{swotLabels[key]}</h3>
              <ul>
                {(swot[key] || []).map((item: string) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="sectionHead">
          <p className="eyebrow">5W2H</p>
          <h2>Plano de execução</h2>
          <p>Essas ações são sincronizadas com o agente de tarefas para virar execução real.</p>
        </div>

        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Prioridade</th>
                <th>O quê</th>
                <th>Por quê</th>
                <th>Quem</th>
                <th>Onde</th>
                <th>Quando</th>
                <th>Como</th>
                <th>Custo</th>
              </tr>
            </thead>
            <tbody>
              {execution.map((item: AnyObj) => (
                <tr key={item.title}>
                  <td><span className="pill">{item.priority}</span></td>
                  <td><b>{item.title}</b><br />{item.what}</td>
                  <td>{item.why}</td>
                  <td>{item.who}</td>
                  <td>{item.where}</td>
                  <td>{item.when}</td>
                  <td>{item.how}</td>
                  <td>{item.howMuch}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section split">
        <article className="rules">
          <p className="eyebrow">Regras de decisão</p>
          <h2>Para vender sem confusão</h2>
          <ul>
            {decisionRules.map((rule: string) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </article>

        <article className="supervisors">
          <p className="eyebrow">Agentes supervisores</p>
          <h2>Equipe estratégica</h2>
          <div>
            {supervisors.map((agent: AnyObj) => (
              <section key={agent.name}>
                <strong>{agent.name}</strong>
                <p>{agent.role}</p>
              </section>
            ))}
          </div>
        </article>
      </section>

      <style>{`
        .canvasPage {
          min-height: 100vh;
          padding: 32px;
          background:
            radial-gradient(circle at 10% 0%, rgba(124, 58, 237, .22), transparent 32%),
            radial-gradient(circle at 90% 10%, rgba(14, 165, 233, .18), transparent 30%),
            #050712;
          color: #f8fafc;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .hero {
          display: grid;
          grid-template-columns: minmax(0, 1.5fr) minmax(280px, .75fr);
          gap: 24px;
          align-items: stretch;
          max-width: 1420px;
          margin: 0 auto 24px;
        }

        .hero > div,
        .northCard,
        .metrics article,
        .funnelCard,
        .productCard,
        .swotCard,
        .rules,
        .supervisors {
          border: 1px solid rgba(148, 163, 184, .18);
          background: rgba(15, 23, 42, .72);
          box-shadow: 0 24px 80px rgba(0, 0, 0, .28);
          backdrop-filter: blur(16px);
          border-radius: 28px;
        }

        .hero > div {
          padding: 34px;
        }

        .eyebrow {
          margin: 0 0 10px;
          color: #a78bfa;
          text-transform: uppercase;
          letter-spacing: .16em;
          font-size: 12px;
          font-weight: 800;
        }

        h1 {
          margin: 0;
          max-width: 920px;
          font-size: clamp(36px, 6vw, 74px);
          letter-spacing: -.06em;
          line-height: .92;
        }

        h2 {
          margin: 0;
          font-size: clamp(26px, 3vw, 42px);
          letter-spacing: -.04em;
        }

        h3 {
          margin: 0;
          font-size: 20px;
        }

        .lead {
          max-width: 780px;
          margin: 18px 0 0;
          color: #cbd5e1;
          font-size: 18px;
          line-height: 1.7;
        }

        .heroActions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 24px;
        }

        button,
        .heroActions a {
          border: 0;
          border-radius: 999px;
          padding: 13px 18px;
          color: white;
          text-decoration: none;
          font-weight: 900;
          background: linear-gradient(135deg, #7c3aed, #06b6d4);
          cursor: pointer;
        }

        .heroActions a {
          background: rgba(255, 255, 255, .08);
          border: 1px solid rgba(255, 255, 255, .12);
        }

        .northCard {
          padding: 28px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 18px;
        }

        .northCard span,
        .metrics span,
        .routeBox small {
          color: #94a3b8;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: .12em;
          font-weight: 800;
        }

        .northCard strong {
          font-size: 24px;
          line-height: 1.25;
        }

        .northCard small,
        .metrics small {
          color: #93c5fd;
        }

        .metrics {
          max-width: 1420px;
          margin: 0 auto 26px;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }

        .metrics article {
          padding: 22px;
        }

        .metrics strong {
          display: block;
          margin: 8px 0;
          font-size: 32px;
          letter-spacing: -.04em;
        }

        .section {
          max-width: 1420px;
          margin: 0 auto 28px;
        }

        .sectionHead {
          margin-bottom: 16px;
        }

        .sectionHead p:not(.eyebrow) {
          color: #cbd5e1;
          max-width: 850px;
          line-height: 1.6;
        }

        .funnelGrid,
        .productGrid,
        .swotGrid {
          display: grid;
          gap: 16px;
        }

        .funnelGrid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .productGrid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .swotGrid {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }

        .funnelCard,
        .productCard,
        .swotCard {
          padding: 22px;
        }

        .funnelCard p,
        .productCard p,
        .swotCard li,
        .rules li,
        .supervisors p {
          color: #cbd5e1;
          line-height: 1.55;
        }

        .funnelCard div {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 14px;
        }

        .funnelCard span,
        .pill,
        .productTop span {
          display: inline-flex;
          border-radius: 999px;
          padding: 7px 10px;
          background: rgba(124, 58, 237, .16);
          color: #ddd6fe;
          font-size: 12px;
          font-weight: 800;
        }

        .productTop {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: flex-start;
        }

        .offer {
          color: #f8fafc !important;
          font-size: 18px;
          font-weight: 900;
        }

        .routeBox {
          display: grid;
          gap: 6px;
          margin: 18px 0;
          padding: 14px;
          border-radius: 18px;
          background: rgba(2, 6, 23, .5);
          border: 1px solid rgba(148, 163, 184, .14);
        }

        code {
          color: #67e8f9;
          white-space: normal;
          word-break: break-word;
        }

        .productCard footer {
          color: #e0e7ff;
          padding-top: 12px;
          border-top: 1px solid rgba(148, 163, 184, .14);
        }

        .swotCard ul,
        .rules ul {
          padding-left: 18px;
        }

        .swotCard.strengths {
          border-color: rgba(34, 197, 94, .25);
        }

        .swotCard.weaknesses {
          border-color: rgba(251, 191, 36, .25);
        }

        .swotCard.opportunities {
          border-color: rgba(14, 165, 233, .25);
        }

        .swotCard.threats {
          border-color: rgba(248, 113, 113, .25);
        }

        .tableWrap {
          overflow-x: auto;
          border-radius: 24px;
          border: 1px solid rgba(148, 163, 184, .16);
          background: rgba(15, 23, 42, .72);
        }

        table {
          width: 100%;
          min-width: 1180px;
          border-collapse: collapse;
        }

        th,
        td {
          padding: 16px;
          text-align: left;
          vertical-align: top;
          border-bottom: 1px solid rgba(148, 163, 184, .12);
        }

        th {
          color: #93c5fd;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: .12em;
        }

        td {
          color: #cbd5e1;
          line-height: 1.45;
        }

        td b {
          color: #fff;
        }

        .split {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 18px;
        }

        .rules,
        .supervisors {
          padding: 26px;
        }

        .supervisors div {
          display: grid;
          gap: 12px;
        }

        .supervisors section {
          padding: 14px;
          border-radius: 18px;
          background: rgba(255, 255, 255, .05);
          border: 1px solid rgba(255, 255, 255, .1);
        }

        .supervisors strong {
          color: #fff;
        }

        .alert {
          max-width: 1420px;
          margin: 0 auto 20px;
          padding: 14px 18px;
          border-radius: 18px;
        }

        .alert.error {
          color: #fecaca;
          background: rgba(127, 29, 29, .35);
          border: 1px solid rgba(248, 113, 113, .3);
        }

        @media (max-width: 980px) {
          .canvasPage {
            padding: 18px;
          }

          .hero,
          .metrics,
          .funnelGrid,
          .productGrid,
          .swotGrid,
          .split {
            grid-template-columns: 1fr;
          }

          .hero > div,
          .northCard,
          .funnelCard,
          .productCard,
          .swotCard,
          .rules,
          .supervisors {
            border-radius: 22px;
          }

          .hero > div {
            padding: 24px;
          }

          .lead {
            font-size: 16px;
          }
        }
      `}</style>
    </main>
  );
}
