"use client";

import { useEffect, useMemo, useState } from "react";

type AgentStatus = {
  ok: boolean;
  agent: {
    name: string;
    role: string;
    mission: string;
    rules: string[];
  };
  whatsapp: {
    connected: boolean;
    status: string;
  };
  checklist: Array<{
    code: string;
    group: string;
    title: string;
    description?: string;
    status: string;
    completedAt?: string;
    source?: string;
  }>;
  events: Array<{
    id: string;
    title: string;
    description?: string;
    createdAt: string;
    source?: string;
    whatsapp?: {
      status: string;
      sent: boolean;
    };
  }>;
};

export default function UserAccessAgentPanel() {
  const [data, setData] = useState<AgentStatus | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/studio/user-agent/status", {
        cache: "no-store",
      });
      const json = await response.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const grouped = useMemo(() => {
    const groups: Record<string, AgentStatus["checklist"]> = {};

    for (const item of data?.checklist || []) {
      const group = item.group || "Geral";
      groups[group] ||= [];
      groups[group].push(item);
    }

    return groups;
  }, [data]);

  if (loading) {
    return (
      <section className="agentBox">
        <p>Carregando Agente Usuários...</p>
        <style jsx>{styles}</style>
      </section>
    );
  }

  if (!data?.ok) {
    return (
      <section className="agentBox danger">
        <p>Agente Usuários restrito ao administrador.</p>
        <style jsx>{styles}</style>
      </section>
    );
  }

  return (
    <section className="agentBox">
      <div className="agentHeader">
        <div>
          <p className="agentEyebrow">Modo automático</p>
          <h2>{data.agent.name}</h2>
          <p>{data.agent.mission}</p>
        </div>

        <div className={`whatsapp ${data.whatsapp.connected ? "on" : "off"}`}>
          <strong>{data.whatsapp.connected ? "WhatsApp conectado" : "WhatsApp pendente"}</strong>
          <span>
            {data.whatsapp.connected
              ? "Avisos automáticos ativos"
              : "Configure SUALUMA_WHATSAPP_WEBHOOK_URL para ativar"}
          </span>
        </div>
      </div>

      <div className="agentGrid">
        <article>
          <h3>O que este agente aprendeu</h3>
          <ul>
            {data.agent.rules.slice(0, 8).map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </article>

        <article>
          <h3>Checklist automático</h3>

          {Object.entries(grouped).map(([group, items]) => (
            <div className="group" key={group}>
              <strong>{group}</strong>

              {items.map((item) => (
                <div className="doneItem" key={item.code}>
                  <span>✓</span>
                  <div>
                    <b>{item.title}</b>
                    {item.description && <p>{item.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </article>
      </div>

      <article className="events">
        <h3>Últimas atualizações</h3>

        {(data.events || []).length === 0 ? (
          <p className="muted">Nenhuma atualização automática registrada ainda.</p>
        ) : (
          data.events.slice(0, 8).map((event) => (
            <div className="event" key={event.id}>
              <span>✅</span>
              <div>
                <b>{event.title}</b>
                {event.description && <p>{event.description}</p>}
                <small>
                  {event.createdAt} · {event.source || "sistema"} · WhatsApp:{" "}
                  {event.whatsapp?.status || "não enviado"}
                </small>
              </div>
            </div>
          ))
        )}
      </article>

      <style jsx>{styles}</style>
    </section>
  );
}

const styles = `
  .agentBox {
    border: 1px solid rgba(56,189,248,.22);
    background:
      radial-gradient(circle at top left, rgba(56,189,248,.13), transparent 28%),
      rgba(13,16,36,.82);
    border-radius: 28px;
    padding: 22px;
    margin: 18px 0;
    box-shadow: 0 24px 80px rgba(0,0,0,.24);
  }

  .danger {
    border-color: rgba(239,68,68,.35);
  }

  .agentHeader {
    display: flex;
    justify-content: space-between;
    gap: 18px;
    align-items: flex-start;
  }

  .agentEyebrow {
    margin: 0;
    color: #38bdf8;
    text-transform: uppercase;
    letter-spacing: .18em;
    font-size: 12px;
    font-weight: 900;
  }

  h2 {
    margin: 6px 0;
    font-size: clamp(28px, 4vw, 44px);
    letter-spacing: -.05em;
  }

  h3 {
    margin: 0 0 12px;
  }

  p, li, small {
    color: #aab4c8;
    line-height: 1.5;
  }

  .whatsapp {
    min-width: 220px;
    border-radius: 20px;
    padding: 14px;
    border: 1px solid rgba(255,255,255,.1);
    background: rgba(255,255,255,.05);
  }

  .whatsapp strong,
  .whatsapp span {
    display: block;
  }

  .whatsapp span {
    margin-top: 4px;
    color: #9ca8bf;
    font-size: 12px;
  }

  .whatsapp.on {
    border-color: rgba(34,197,94,.35);
    background: rgba(34,197,94,.08);
  }

  .whatsapp.off {
    border-color: rgba(245,158,11,.35);
    background: rgba(245,158,11,.08);
  }

  .agentGrid {
    display: grid;
    grid-template-columns: .9fr 1.1fr;
    gap: 18px;
    margin-top: 18px;
  }

  article {
    border: 1px solid rgba(255,255,255,.09);
    border-radius: 22px;
    padding: 16px;
    background: rgba(255,255,255,.04);
  }

  ul {
    padding-left: 18px;
    margin: 0;
  }

  li + li {
    margin-top: 8px;
  }

  .group + .group {
    margin-top: 14px;
  }

  .group > strong {
    display: block;
    margin-bottom: 10px;
    color: #e5edff;
  }

  .doneItem,
  .event {
    display: flex;
    gap: 10px;
    padding: 10px;
    border-radius: 14px;
    background: rgba(255,255,255,.045);
  }

  .doneItem + .doneItem,
  .event + .event {
    margin-top: 8px;
  }

  .doneItem span,
  .event span {
    width: 24px;
    height: 24px;
    border-radius: 8px;
    display: grid;
    place-items: center;
    background: rgba(34,197,94,.2);
    color: #bbf7d0;
    flex: 0 0 auto;
  }

  .doneItem b,
  .event b {
    color: #f8fafc;
  }

  .doneItem p,
  .event p {
    margin: 4px 0 0;
  }

  .events {
    margin-top: 18px;
  }

  .muted {
    color: #7f8ca5;
  }

  @media (max-width: 900px) {
    .agentHeader,
    .agentGrid {
      grid-template-columns: 1fr;
      flex-direction: column;
    }

    .whatsapp {
      width: 100%;
    }
  }
`;
