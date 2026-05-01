"use client";

import { useEffect, useMemo, useState } from "react";

type Tone = "purple" | "pink" | "blue" | "green" | "yellow";

type ServiceCard = {
  title: string;
  detail: string;
  value: string;
  orders: string;
  tone: Tone;
  icon: string;
};

type Activity = {
  title: string;
  detail: string;
  time: string;
  tone: Tone;
};

type Referral = {
  name: string;
  clients: string;
  value: string;
  tone: Tone;
};

const fallbackServices: ServiceCard[] = [
  {
    title: "Sites e Landing Pages",
    detail: "Páginas, sites institucionais e páginas de venda.",
    value: "a partir de R$ 500",
    orders: "128 pedidos",
    tone: "purple",
    icon: "🌐",
  },
  {
    title: "Automações e IA",
    detail: "Fluxos, agentes, atendimento e processos automáticos.",
    value: "a partir de R$ 790",
    orders: "84 pedidos",
    tone: "pink",
    icon: "🤖",
  },
  {
    title: "Conteúdo e Vídeos",
    detail: "Edição, cortes, scripts, capas e organização de conteúdo.",
    value: "a partir de R$ 450",
    orders: "67 pedidos",
    tone: "yellow",
    icon: "🎬",
  },
  {
    title: "Marketing e Estratégia",
    detail: "Linha editorial, campanhas, funis e crescimento orgânico.",
    value: "R$ 790/mês",
    orders: "51 pedidos",
    tone: "blue",
    icon: "📣",
  },
];

const fallbackActivities: Activity[] = [
  {
    title: "Novo cliente",
    detail: "Solicitou orçamento para site institucional.",
    time: "agora",
    tone: "green",
  },
  {
    title: "Novo pedido",
    detail: "Pedido de automação recebido pelo painel.",
    time: "2 min",
    tone: "blue",
  },
  {
    title: "Serviço em andamento",
    detail: "Prestador executando entrega de conteúdo.",
    time: "15 min",
    tone: "purple",
  },
  {
    title: "Indicação convertida",
    detail: "Uma indicação virou oportunidade comercial.",
    time: "25 min",
    tone: "yellow",
  },
];

const fallbackReferrals: Referral[] = [
  { name: "Lucas Andrade", clients: "23 clientes", value: "R$ 2.760", tone: "yellow" },
  { name: "Ana Clara", clients: "18 clientes", value: "R$ 1.980", tone: "purple" },
  { name: "Carlos Mendes", clients: "12 clientes", value: "R$ 1.320", tone: "blue" },
];

function findArray(payload: any): any[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;

  const keys = [
    "items",
    "data",
    "rows",
    "services",
    "servicos",
    "links",
    "pages",
    "produtos",
    "products",
    "records",
  ];

  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }

  if (payload?.result && Array.isArray(payload.result)) return payload.result;
  if (payload?.result && typeof payload.result === "object") return findArray(payload.result);

  return [];
}

function firstText(item: any, keys: string[], fallback: string): string {
  for (const key of keys) {
    const value = item?.[key];
    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value);
    }
  }
  return fallback;
}

function normalizeServices(payload: any): ServiceCard[] {
  const rows = findArray(payload);

  if (!rows.length) return fallbackServices;

  return rows.slice(0, 4).map((item: any, index: number) => {
    const fallback = fallbackServices[index] || fallbackServices[0];

    return {
      title: firstText(item, ["title", "name", "nome", "service", "servico"], fallback.title),
      detail: firstText(item, ["detail", "description", "descricao", "subtitle", "resumo"], fallback.detail),
      value: firstText(item, ["price", "valor", "value", "preco"], fallback.value),
      orders: firstText(item, ["orders", "pedidos", "count", "total"], fallback.orders),
      tone: fallback.tone,
      icon: fallback.icon,
    };
  });
}

function metricFromPayload(payload: any, key: string, fallback: string): string {
  const value =
    payload?.summary?.[key] ??
    payload?.metrics?.[key] ??
    payload?.[key];

  if (value === undefined || value === null || value === "") return fallback;
  return String(value);
}

function MetricCard({
  icon,
  title,
  value,
  detail,
  tone,
}: {
  icon: string;
  title: string;
  value: string;
  detail: string;
  tone: Tone;
}) {
  return (
    <article className={`metric-card tone-${tone}`}>
      <div className="metric-icon">{icon}</div>
      <div>
        <p>{title}</p>
        <strong>{value}</strong>
        <span>{detail}</span>
      </div>
      <div className="sparkline" />
    </article>
  );
}

function ServiceBox({ item }: { item: ServiceCard }) {
  return (
    <article className={`service-box tone-${item.tone}`}>
      <div className="service-icon">{item.icon}</div>
      <h3>{item.title}</h3>
      <p>{item.detail}</p>
      <strong>{item.value}</strong>
      <span>{item.orders}</span>
    </article>
  );
}

function Step({
  number,
  icon,
  title,
  detail,
  tone,
}: {
  number: number;
  icon: string;
  title: string;
  detail: string;
  tone: Tone;
}) {
  return (
    <div className={`flow-step tone-${tone}`}>
      <div className="step-number">{number}</div>
      <div className="step-icon">{icon}</div>
      <strong>{title}</strong>
      <p>{detail}</p>
    </div>
  );
}

export default function StudioServicosEIndiquePage() {
  const [servicePayload, setServicePayload] = useState<any>(null);
  const [linksPayload, setLinksPayload] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState("Carregando banco...");

  useEffect(() => {
    async function loadData() {
      try {
        const ts = Date.now();

        const [servicesRes, linksRes] = await Promise.allSettled([
          fetch(`/api/studio/servicos-e-indique?ts=${ts}`, { cache: "no-store" }),
          fetch(`/api/studio/servicos-e-indique/links?ts=${ts}`, { cache: "no-store" }),
        ]);

        if (servicesRes.status === "fulfilled" && servicesRes.value.ok) {
          const json = await servicesRes.value.json();
          setServicePayload(json);
        }

        if (linksRes.status === "fulfilled" && linksRes.value.ok) {
          const json = await linksRes.value.json();
          setLinksPayload(json);
        }

        setSource("Conectado às APIs do Studio");
      } catch (error) {
        console.error("[Studio Serviços e Indique] Erro ao carregar dados:", error);
        setSource("Visual com dados reserva");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const services = useMemo(() => normalizeServices(servicePayload), [servicePayload]);
  const linkRows = useMemo(() => findArray(linksPayload), [linksPayload]);

  const totalServices = String(services.length);
  const totalLinks = String(linkRows.length || metricFromPayload(linksPayload, "total", "0"));

  return (
    <main className="tdah-dashboard">
      <section className="hero">
        <div>
          <p className="eyebrow">Studio Sualuma • Economia interna</p>
          <h1>Serviços e Indicações</h1>
          <p className="hero-text">
            Aqui você entende, em poucos segundos, como clientes chegam, como serviços viram pedidos,
            como prestadores executam e como as indicações geram crescimento.
          </p>

          <div className="hero-actions">
            <a href="/studio/indique">Abrir Indicações</a>
            <a href="/studio/stripe-planos">Planos e Stripe</a>
            <a href="/studio/catalogo-paginas">Catálogo de Links</a>
          </div>
        </div>

        <aside className="mission-card">
          <span>🔥 Missão do dia</span>
          <strong>Responder 3 contatos</strong>
          <p>Foque no que traz dinheiro: proposta, indicação e follow-up.</p>
          <div className="progress">
            <i />
          </div>
          <small>2/3 concluído • +50 XP</small>
        </aside>
      </section>

      <section className="metrics-grid">
        <MetricCard
          icon="💼"
          title="Serviços mapeados"
          value={totalServices}
          detail={loading ? "Carregando..." : source}
          tone="purple"
        />
        <MetricCard
          icon="🔗"
          title="Links ativos"
          value={totalLinks}
          detail="Botões, páginas e rotas de indicação"
          tone="blue"
        />
        <MetricCard
          icon="💜"
          title="Taxa administrativa"
          value="8% a 12%"
          detail="Mantém operação, suporte e plataforma"
          tone="pink"
        />
        <MetricCard
          icon="🎁"
          title="Indicações"
          value="R$ 4.320"
          detail="Projeção visual de comissões"
          tone="green"
        />
      </section>

      <section className="main-grid">
        <article className="panel big">
          <div className="panel-title">
            <div>
              <p>Entenda o fluxo</p>
              <h2>Como o dinheiro circula aqui dentro?</h2>
            </div>
            <span>Simples assim</span>
          </div>

          <div className="flow">
            <Step number={1} icon="👥" title="Cliente chega" detail="Alguém precisa de um serviço." tone="purple" />
            <Step number={2} icon="📋" title="Pedido é criado" detail="A plataforma organiza a demanda." tone="pink" />
            <Step number={3} icon="🧑‍💻" title="Prestador executa" detail="Um profissional faz o trabalho." tone="blue" />
            <Step number={4} icon="🏛️" title="Plataforma recebe" detail="A taxa mantém tudo funcionando." tone="yellow" />
            <Step number={5} icon="🎁" title="Indicação ganha" detail="Quem indicou recebe comissão." tone="green" />
          </div>

          <div className="simple-note">
            ⭐ Todo mundo ganha quando o sistema fica organizado: cliente, prestador, plataforma e indicador.
          </div>
        </article>

        <article className="panel">
          <div className="panel-title">
            <div>
              <p>Tempo real</p>
              <h2>Atividades recentes</h2>
            </div>
            <span>ao vivo</span>
          </div>

          <div className="activity-list">
            {fallbackActivities.map((item) => (
              <div className={`activity tone-${item.tone}`} key={item.title}>
                <b />
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
                <small>{item.time}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="panel big">
          <div className="panel-title">
            <div>
              <p>Vitrine operacional</p>
              <h2>Principais serviços</h2>
            </div>
            <span>{source}</span>
          </div>

          <div className="services-grid">
            {services.map((item) => (
              <ServiceBox key={item.title} item={item} />
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-title">
            <div>
              <p>Ranking</p>
              <h2>Indicações em destaque</h2>
            </div>
            <span>top 3</span>
          </div>

          <div className="ranking-list">
            {fallbackReferrals.map((item, index) => (
              <div className={`ranking tone-${item.tone}`} key={item.name}>
                <span>{index + 1}</span>
                <div>
                  <strong>{item.name}</strong>
                  <p>{item.clients}</p>
                </div>
                <b>{item.value}</b>
              </div>
            ))}
          </div>
        </article>

        <article className="panel brain">
          <div className="brain-emoji">🧠</div>
          <div>
            <p>Explicação para cérebro TDAH</p>
            <h2>O que eu preciso olhar primeiro?</h2>
            <p>
              Primeiro veja se existem novos contatos. Depois veja os serviços com pedido.
              Depois veja se alguém indicou. O resto é relatório.
            </p>
          </div>
        </article>

        <article className="panel next-actions">
          <div className="panel-title">
            <div>
              <p>Checklist</p>
              <h2>Próximas ações</h2>
            </div>
            <span>execução</span>
          </div>

          <label><input type="checkbox" defaultChecked /> Responder mensagens do chat</label>
          <label><input type="checkbox" /> Revisar serviços mais vendidos</label>
          <label><input type="checkbox" /> Criar campanha de indicação</label>
          <label><input type="checkbox" /> Conferir links que mais convertem</label>
        </article>
      </section>

      <style>{`
        .tdah-dashboard {
          min-height: 100vh;
          padding: 34px;
          color: #fff;
          background:
            radial-gradient(circle at top left, rgba(168,85,247,.28), transparent 28%),
            radial-gradient(circle at top right, rgba(236,72,153,.18), transparent 25%),
            linear-gradient(135deg, #05030b 0%, #0b0618 45%, #120624 100%);
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .hero {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 22px;
          align-items: stretch;
          margin-bottom: 22px;
        }

        .eyebrow,
        .panel-title p,
        .brain p:first-child {
          color: #d8b4fe;
          text-transform: uppercase;
          letter-spacing: .12em;
          font-size: 12px;
          font-weight: 900;
          margin: 0 0 8px;
        }

        h1 {
          font-size: clamp(34px, 5vw, 64px);
          line-height: .92;
          margin: 0;
          letter-spacing: -0.06em;
        }

        .hero-text {
          max-width: 780px;
          color: #d6ccff;
          font-size: 18px;
          line-height: 1.7;
          margin: 18px 0 0;
        }

        .hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 24px;
        }

        .hero-actions a {
          color: #fff;
          text-decoration: none;
          border: 1px solid rgba(216,180,254,.28);
          background: linear-gradient(135deg, rgba(126,34,206,.86), rgba(76,29,149,.42));
          border-radius: 999px;
          padding: 12px 16px;
          font-weight: 900;
          box-shadow: 0 18px 50px rgba(126,34,206,.22);
        }

        .mission-card,
        .panel,
        .metric-card {
          border: 1px solid rgba(216,180,254,.18);
          background: linear-gradient(180deg, rgba(30,18,54,.88), rgba(10,6,24,.88));
          box-shadow: 0 24px 80px rgba(0,0,0,.38), inset 0 1px 0 rgba(255,255,255,.06);
          border-radius: 28px;
        }

        .mission-card {
          padding: 24px;
          position: relative;
          overflow: hidden;
        }

        .mission-card::after {
          content: "🚀";
          position: absolute;
          right: -4px;
          bottom: -18px;
          font-size: 92px;
          filter: drop-shadow(0 0 30px rgba(168,85,247,.8));
          animation: float 3.4s ease-in-out infinite;
        }

        .mission-card span {
          color: #facc15;
          font-weight: 900;
        }

        .mission-card strong {
          display: block;
          font-size: 24px;
          margin-top: 12px;
        }

        .mission-card p {
          color: #d6ccff;
          line-height: 1.6;
        }

        .progress {
          height: 10px;
          background: rgba(255,255,255,.1);
          border-radius: 999px;
          overflow: hidden;
          margin: 18px 0 10px;
        }

        .progress i {
          display: block;
          height: 100%;
          width: 66%;
          background: linear-gradient(90deg, #a855f7, #ec4899, #22d3ee);
          border-radius: inherit;
        }

        .mission-card small {
          color: #facc15;
          font-weight: 900;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 18px;
        }

        .metric-card {
          padding: 20px;
          position: relative;
          overflow: hidden;
          min-height: 150px;
        }

        .metric-card::after {
          content: "";
          position: absolute;
          inset: auto 18px 14px 18px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(90deg, transparent, currentColor, transparent);
          opacity: .2;
          filter: blur(10px);
        }

        .metric-icon {
          width: 58px;
          height: 58px;
          display: grid;
          place-items: center;
          border-radius: 20px;
          background: rgba(255,255,255,.08);
          font-size: 30px;
          margin-bottom: 14px;
        }

        .metric-card p {
          color: #c4b5fd;
          margin: 0 0 6px;
          font-weight: 800;
        }

        .metric-card strong {
          display: block;
          font-size: 30px;
          letter-spacing: -0.04em;
        }

        .metric-card span {
          display: block;
          color: #b9a8de;
          margin-top: 6px;
          font-size: 13px;
        }

        .main-grid {
          display: grid;
          grid-template-columns: 1.45fr .75fr;
          gap: 18px;
        }

        .panel {
          padding: 22px;
          overflow: hidden;
        }

        .panel.big {
          min-height: 300px;
        }

        .panel-title {
          display: flex;
          align-items: start;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 18px;
        }

        .panel-title h2,
        .brain h2 {
          margin: 0;
          font-size: 24px;
          letter-spacing: -0.04em;
        }

        .panel-title span {
          border: 1px solid rgba(216,180,254,.18);
          background: rgba(126,34,206,.28);
          color: #e9d5ff;
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 900;
          white-space: nowrap;
        }

        .flow {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 14px;
        }

        .flow-step {
          text-align: center;
          position: relative;
          padding: 14px 10px;
          border-radius: 22px;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.08);
        }

        .step-number {
          width: 30px;
          height: 30px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: currentColor;
          color: #fff;
          margin: 0 auto 10px;
          font-weight: 900;
        }

        .step-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 12px;
          display: grid;
          place-items: center;
          font-size: 30px;
          border-radius: 24px;
          background: rgba(255,255,255,.08);
          box-shadow: 0 0 35px currentColor;
        }

        .flow-step strong {
          display: block;
          margin-bottom: 8px;
        }

        .flow-step p {
          margin: 0;
          color: #d6ccff;
          font-size: 13px;
          line-height: 1.5;
        }

        .simple-note {
          margin-top: 18px;
          text-align: center;
          padding: 14px;
          border-radius: 18px;
          background: rgba(126,34,206,.18);
          border: 1px solid rgba(216,180,254,.14);
          color: #e9d5ff;
          font-weight: 800;
        }

        .services-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }

        .service-box {
          padding: 18px;
          border-radius: 24px;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.08);
        }

        .service-icon {
          width: 64px;
          height: 64px;
          display: grid;
          place-items: center;
          border-radius: 24px;
          background: rgba(255,255,255,.08);
          font-size: 32px;
          box-shadow: 0 0 35px currentColor;
          margin-bottom: 14px;
        }

        .service-box h3 {
          margin: 0;
          font-size: 17px;
        }

        .service-box p {
          min-height: 58px;
          color: #cfc4f4;
          line-height: 1.5;
          font-size: 13px;
        }

        .service-box strong,
        .service-box span {
          display: block;
        }

        .service-box strong {
          font-size: 18px;
          color: #fff;
        }

        .service-box span {
          color: #b9a8de;
          margin-top: 8px;
          font-size: 12px;
        }

        .activity-list,
        .ranking-list {
          display: grid;
          gap: 12px;
        }

        .activity,
        .ranking {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 12px;
          align-items: center;
          padding: 12px;
          border-radius: 18px;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.07);
        }

        .activity b {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: currentColor;
          box-shadow: 0 0 18px currentColor;
        }

        .activity strong,
        .ranking strong {
          display: block;
        }

        .activity p,
        .ranking p {
          margin: 4px 0 0;
          color: #cfc4f4;
          font-size: 13px;
        }

        .activity small {
          color: #b9a8de;
        }

        .ranking span {
          width: 34px;
          height: 34px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: currentColor;
          color: #fff;
          font-weight: 900;
        }

        .ranking b {
          color: #fff;
        }

        .brain {
          display: grid;
          grid-template-columns: 110px 1fr;
          gap: 18px;
          align-items: center;
        }

        .brain-emoji {
          width: 100px;
          height: 100px;
          display: grid;
          place-items: center;
          border-radius: 35px;
          background: linear-gradient(135deg, #7e22ce, #ec4899);
          font-size: 50px;
          box-shadow: 0 0 45px rgba(236,72,153,.4);
          animation: pulse 2s infinite;
        }

        .brain p {
          color: #d6ccff;
          line-height: 1.7;
        }

        .next-actions {
          display: grid;
          gap: 12px;
        }

        .next-actions label {
          display: flex;
          gap: 10px;
          align-items: center;
          padding: 12px;
          border-radius: 16px;
          background: rgba(255,255,255,.04);
          color: #e9d5ff;
          font-weight: 800;
        }

        .next-actions input {
          accent-color: #a855f7;
        }

        .tone-purple { color: #a855f7; }
        .tone-pink { color: #ec4899; }
        .tone-blue { color: #38bdf8; }
        .tone-green { color: #84cc16; }
        .tone-yellow { color: #facc15; }

        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(-8deg); }
          50% { transform: translateY(-12px) rotate(4deg); }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }

        @media (max-width: 1100px) {
          .hero,
          .main-grid {
            grid-template-columns: 1fr;
          }

          .metrics-grid,
          .services-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .flow {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 680px) {
          .tdah-dashboard {
            padding: 22px 14px;
          }

          .metrics-grid,
          .services-grid,
          .flow {
            grid-template-columns: 1fr;
          }

          .brain {
            grid-template-columns: 1fr;
          }

          .hero-actions a {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>
    </main>
  );
}
