"use client";

import { useState } from "react";

type AgentButton = {
  area: string;
  title: string;
  emoji: string;
  desc: string;
  message: string;
};

const agents: AgentButton[] = [
  {
    area: "usuarios",
    title: "Usuários",
    emoji: "👥",
    desc: "Login, permissões, acesso e problemas de usuário.",
    message: "Analise problemas de login, usuários, permissões, acesso ao Studio, dashboards e riscos de suporte."
  },
  {
    area: "google",
    title: "Google / SEO",
    emoji: "🔎",
    desc: "SEO, tráfego, ranking, blog e presença no Google.",
    message: "Analise SEO, Google, ranking, busca, blog, tráfego orgânico e oportunidades de crescimento."
  },
  {
    area: "cnpj",
    title: "CNPJ / MEI",
    emoji: "📄",
    desc: "Pendências, obrigações, riscos administrativos e fiscal.",
    message: "Analise CNPJ, MEI, obrigações, riscos administrativos, pendências e próximos cuidados."
  },
  {
    area: "loja",
    title: "Loja / Stripe",
    emoji: "🛒",
    desc: "Produtos, checkout, ofertas, upsell e entrega na Mia.",
    message: "Analise loja de agentes, Stripe, checkout, produtos, ofertas, entrega e liberação na Mia."
  },
  {
    area: "saude",
    title: "Saúde do Sistema",
    emoji: "🩺",
    desc: "VPS, Nginx, PM2, estabilidade e riscos técnicos.",
    message: "Analise saúde do sistema, VPS, Nginx, PM2, logs, estabilidade, memória, disco e riscos de queda."
  },
  {
    area: "crescimento",
    title: "Crescimento",
    emoji: "🚀",
    desc: "Vendas, lançamento, aquisição e campanhas.",
    message: "Analise crescimento, vendas, lançamento, aquisição de clientes, funil e campanhas para vender ainda hoje."
  },
  {
    area: "comunidade",
    title: "Comunidade",
    emoji: "🛡️",
    desc: "Moderação, regras, denúncias e comportamento.",
    message: "Analise comunidade, moderação, denúncias, regras, riscos e como manter a plataforma segura."
  },
  {
    area: "automacoes",
    title: "Automações",
    emoji: "⚙️",
    desc: "n8n, fluxos, tarefas e automações internas.",
    message: "Analise automações, n8n, fluxos internos, tarefas automáticas e oportunidades de melhoria."
  }
];

function listItems(value: any) {
  if (!Array.isArray(value) || value.length === 0) return null;

  return (
    <ul className="resultList">
      {value.map((item, index) => (
        <li key={`${item}-${index}`}>{String(item)}</li>
      ))}
    </ul>
  );
}

export default function MiaOrchestratorPanel() {
  const [loadingArea, setLoadingArea] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  async function runAgent(agent: AgentButton) {
    setLoadingArea(agent.area);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/studio/orchestrator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          area: agent.area,
          message: agent.message
        })
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "A Mia não conseguiu chamar esse agente agora.");
      }

      setResult(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido.");
    } finally {
      setLoadingArea(null);
    }
  }

  const data = result?.data || {};

  return (
    <section className="wrap">
      <div className="hero">
        <p className="eyebrow">Studio Sualuma • Mia Orquestradora</p>
        <h1>Mia conectada ao Cérebro Azul</h1>
        <p>
          Escolha uma área do Studio. A Mia decide o agente certo, chama o Cérebro Azul
          e devolve diagnóstico, riscos e próximos passos.
        </p>
      </div>

      <div className="grid">
        {agents.map((agent) => (
          <button
            key={agent.area}
            className="card"
            onClick={() => runAgent(agent)}
            disabled={loadingArea !== null}
          >
            <span className="emoji">{agent.emoji}</span>
            <strong>{agent.title}</strong>
            <small>{agent.desc}</small>
            <em>{loadingArea === agent.area ? "Analisando..." : "Rodar agente"}</em>
          </button>
        ))}
      </div>

      {error && <div className="error">⚠️ {error}</div>}

      {result && (
        <article className="result">
          <p className="eyebrow">Resposta da Mia</p>
          <h2>{result.skill_label}</h2>
          <p className="answer">{result.answer}</p>

          <div className="meta">
            <span>Skill: {result.skill}</span>
            <span>Fonte: {result.source}</span>
            <span>{data.needs_human_approval ? "Precisa aprovação humana" : "Pode seguir sem aprovação"}</span>
          </div>

          {data.risk && (
            <div className="block">
              <h3>Risco</h3>
              <p>{String(data.risk)}</p>
            </div>
          )}

          {(data.risks || data.user_risks || data.blockers) && (
            <div className="block">
              <h3>Riscos / bloqueios</h3>
              {listItems(data.risks || data.user_risks || data.blockers)}
            </div>
          )}

          {(data.next_actions || data.recommended_actions) && (
            <div className="block">
              <h3>Próximas ações</h3>
              {listItems(data.next_actions || data.recommended_actions)}
            </div>
          )}

          {data.checklist && (
            <div className="block">
              <h3>Checklist</h3>
              {listItems(data.checklist)}
            </div>
          )}

          {data.opportunities && (
            <div className="block">
              <h3>Oportunidades</h3>
              {listItems(data.opportunities)}
            </div>
          )}

          {data.campaign_ideas && (
            <div className="block">
              <h3>Ideias de campanha</h3>
              {listItems(data.campaign_ideas)}
            </div>
          )}
        </article>
      )}

      <style jsx>{`
        .wrap {
          min-height: 100vh;
          padding: 32px;
          background:
            radial-gradient(circle at top left, rgba(45, 212, 191, .18), transparent 34%),
            radial-gradient(circle at top right, rgba(255, 79, 163, .18), transparent 32%),
            #050711;
          color: white;
          font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .hero {
          max-width: 920px;
          margin: 0 auto 28px;
          border: 1px solid rgba(255,255,255,.12);
          background: rgba(255,255,255,.06);
          border-radius: 28px;
          padding: 28px;
          box-shadow: 0 24px 90px rgba(0,0,0,.35);
        }

        .eyebrow {
          color: #67e8f9;
          text-transform: uppercase;
          letter-spacing: .12em;
          font-size: 12px;
          font-weight: 900;
          margin: 0 0 10px;
        }

        h1 {
          font-size: clamp(32px, 6vw, 68px);
          line-height: .95;
          margin: 0 0 16px;
        }

        .hero p {
          color: rgba(255,255,255,.68);
          max-width: 720px;
          line-height: 1.7;
          margin: 0;
        }

        .grid {
          max-width: 1120px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }

        .card {
          text-align: left;
          min-height: 190px;
          border: 1px solid rgba(255,255,255,.12);
          background: rgba(255,255,255,.07);
          color: white;
          border-radius: 24px;
          padding: 20px;
          cursor: pointer;
          transition: transform .2s ease, border-color .2s ease, background .2s ease;
        }

        .card:hover {
          transform: translateY(-3px);
          border-color: rgba(103,232,249,.5);
          background: rgba(103,232,249,.1);
        }

        .card:disabled {
          opacity: .65;
          cursor: wait;
        }

        .emoji {
          display: block;
          font-size: 34px;
          margin-bottom: 16px;
        }

        .card strong {
          display: block;
          font-size: 18px;
          margin-bottom: 8px;
        }

        .card small {
          display: block;
          color: rgba(255,255,255,.62);
          line-height: 1.5;
          min-height: 42px;
        }

        .card em {
          display: inline-flex;
          margin-top: 16px;
          color: #67e8f9;
          font-style: normal;
          font-weight: 900;
        }

        .error,
        .result {
          max-width: 920px;
          margin: 22px auto 0;
          border-radius: 26px;
          padding: 24px;
        }

        .error {
          background: rgba(239,68,68,.12);
          border: 1px solid rgba(239,68,68,.35);
        }

        .result {
          background: rgba(255,255,255,.08);
          border: 1px solid rgba(255,255,255,.14);
          box-shadow: 0 24px 90px rgba(0,0,0,.35);
        }

        .result h2 {
          margin: 0 0 12px;
          font-size: 28px;
        }

        .answer {
          color: rgba(255,255,255,.8);
          line-height: 1.7;
          font-size: 16px;
        }

        .meta {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin: 20px 0;
        }

        .meta span {
          border: 1px solid rgba(103,232,249,.24);
          background: rgba(103,232,249,.08);
          color: #cffafe;
          border-radius: 999px;
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 800;
        }

        .block {
          margin-top: 18px;
          border-top: 1px solid rgba(255,255,255,.1);
          padding-top: 18px;
        }

        .block h3 {
          margin: 0 0 10px;
          color: #f9a8d4;
        }

        .resultList {
          margin: 0;
          padding-left: 18px;
          color: rgba(255,255,255,.76);
          line-height: 1.7;
        }

        @media (max-width: 900px) {
          .wrap {
            padding: 18px;
          }

          .grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 560px) {
          .grid {
            grid-template-columns: 1fr;
          }

          .hero,
          .result {
            padding: 20px;
          }
        }
      `}</style>
    </section>
  );
}
