"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useState } from "react";

type ChatMessage = {
  from: "user" | "agent";
  text: string;
  time: string;
  provider?: string;
  model?: string;
};

type AgentStatus = {
  ok: boolean;
  agent: {
    name: string;
    publicName?: string;
    role: string;
    mission: string;
    rules: string[];
    currentFocus?: {
      phase?: string;
      priority?: string;
      launchGoal?: string;
    };
    officialAccessIds?: string[];
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

function now() {
  return new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function UserAccessAgentPanel() {
  const [data, setData] = useState<AgentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [lastProvider, setLastProvider] = useState("Ollama / Qwen");

  async function load() {
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
    try {
      const saved = localStorage.getItem("sualuma-user-guard-chat-v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setChatMessages(parsed);
        }
      }
    } catch {}

    load();

    const interval = window.setInterval(() => {
      load();
    }, 15000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "sualuma-user-guard-chat-v1",
        JSON.stringify(chatMessages.slice(-30))
      );
    } catch {}
  }, [chatMessages]);

  const grouped = useMemo(() => {
    const groups: Record<string, AgentStatus["checklist"]> = {};

    for (const item of data?.checklist || []) {
      const group = item.group || "Geral";
      groups[group] ||= [];
      groups[group].push(item);
    }

    return groups;
  }, [data]);

  async function sendChat(event?: FormEvent) {
    event?.preventDefault();

    const text = chatInput.trim();

    if (!text || chatLoading) return;

    const userMessage: ChatMessage = {
      from: "user",
      text,
      time: now(),
    };

    const nextMessages = [...chatMessages, userMessage];

    setChatMessages(nextMessages);
    setChatInput("");
    setChatLoading(true);

    try {
      const response = await fetch("/api/studio/user-agent/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: nextMessages.map((message) => ({
            role: message.from === "user" ? "user" : "assistant",
            content: message.text,
          })),
        }),
      });

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(json?.error || "Erro ao falar com o User Guard.");
      }

      const reply =
        typeof json.reply === "string" && json.reply.trim()
          ? json.reply.trim()
          : "Não consegui gerar uma resposta agora.";

      const provider =
        typeof json.provider === "string" ? json.provider : "ollama-qwen";

      const model =
        typeof json.model === "string" ? json.model : "qwen2.5:7b-instruct";

      setLastProvider(`${provider} · ${model}`);

      const agentMessage: ChatMessage = {
        from: "agent",
        text: reply,
        time: now(),
        provider,
        model,
      };

      setChatMessages((current) => [...current, agentMessage]);
      await load();
    } catch (error) {
      const agentMessage: ChatMessage = {
        from: "agent",
        text:
          error instanceof Error
            ? `⚠️ Não consegui falar com o User Guard agora: ${error.message}`
            : "⚠️ Não consegui falar com o User Guard agora.",
        time: now(),
        provider: "erro-local",
      };

      setChatMessages((current) => [...current, agentMessage]);
    } finally {
      setChatLoading(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendChat();
    }
  }

  if (loading) {
    return (
      <section className="agentBox">
        <p>Carregando User Guard...</p>
        <style jsx>{styles}</style>
      </section>
    );
  }

  if (!data?.ok) {
    return (
      <section className="agentBox danger">
        <p>User Guard restrito ao administrador.</p>
        <style jsx>{styles}</style>
      </section>
    );
  }

  const rules = data.agent.rules || [];
  const officialAccessIds = data.agent.officialAccessIds || [];

  return (
    <section className="agentBox">
      <div className="agentHeader">
        <div>
          <p className="agentEyebrow">Modo automático · Qwen/Ollama</p>
          <h2>{data.agent.publicName || data.agent.name}</h2>
          <p>{data.agent.mission}</p>

          {data.agent.currentFocus?.phase && (
            <div className="focusBox">
              <strong>{data.agent.currentFocus.phase}</strong>
              {data.agent.currentFocus.priority && (
                <span>{data.agent.currentFocus.priority}</span>
              )}
            </div>
          )}
        </div>

        <div className="statusStack">
          <div className="modelBadge">
            <strong>Modelo do chat</strong>
            <span>{lastProvider}</span>
          </div>

          <div className={`whatsapp ${data.whatsapp.connected ? "on" : "off"}`}>
            <strong>
              {data.whatsapp.connected ? "WhatsApp conectado" : "WhatsApp pendente"}
            </strong>
            <span>
              {data.whatsapp.connected
                ? "Avisos automáticos ativos"
                : "WhatsApp fica para depois"}
            </span>
          </div>
        </div>
      </div>

      <article className="chatCard">
        <div className="chatTop">
          <div>
            <p className="agentEyebrow">Chat do agente</p>
            <h3>Converse com o User Guard</h3>
          </div>

          <button
            type="button"
            className="clearBtn"
            onClick={() => setChatMessages([])}
          >
            Limpar conversa
          </button>
        </div>

        <div className="chatWindow">
          {chatMessages.length === 0 ? (
            <div className="emptyChat">
              <strong>User Guard pronto.</strong>
              <p>
                Pergunte sobre acessos, planos, bloqueios, Stripe, comunidade,
                rotas privadas ou o que falta para lançar.
              </p>
            </div>
          ) : (
            chatMessages.map((message, index) => (
              <div className={`msg ${message.from}`} key={`${message.time}-${index}`}>
                <div>
                  <p>{message.text}</p>
                  <small>
                    {message.time}
                    {message.provider ? ` · ${message.provider}` : ""}
                  </small>
                </div>
              </div>
            ))
          )}

          {chatLoading && (
            <div className="msg agent thinking">
              <div>
                <p>Consultando Qwen/Ollama...</p>
                <small>pode levar alguns segundos</small>
              </div>
            </div>
          )}
        </div>

        <form className="chatForm" onSubmit={sendChat}>
          <textarea
            value={chatInput}
            onChange={(event) => setChatInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ex: User Guard, qual é o próximo passo para configurar empresa_contratante_servicos_free?"
            rows={3}
          />

          <button type="submit" disabled={chatLoading || !chatInput.trim()}>
            {chatLoading ? "Pensando..." : "Enviar"}
          </button>
        </form>
      </article>

      <div className="agentGrid">
        <article>
          <h3>IDs oficiais</h3>

          {officialAccessIds.length ? (
            <div className="chips">
              {officialAccessIds.map((id) => (
                <span key={id}>{id}</span>
              ))}
            </div>
          ) : (
            <p className="muted">IDs oficiais ainda não foram carregados.</p>
          )}

          <h3 className="mt">O que este agente aprendeu</h3>
          <ul>
            {rules.slice(0, 10).map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </article>

        <article>
          <h3>Checklist automático</h3>

          {Object.entries(grouped).length === 0 ? (
            <p className="muted">Nenhum item registrado ainda.</p>
          ) : (
            Object.entries(grouped).map(([group, items]) => (
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
            ))
          )}
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

  .focusBox {
    margin-top: 14px;
    border: 1px solid rgba(56,189,248,.18);
    background: rgba(56,189,248,.07);
    border-radius: 18px;
    padding: 12px;
    max-width: 760px;
  }

  .focusBox strong,
  .focusBox span {
    display: block;
  }

  .focusBox span {
    margin-top: 4px;
    color: #dbeafe;
    font-size: 13px;
  }

  .statusStack {
    display: grid;
    gap: 10px;
    min-width: 240px;
  }

  .modelBadge,
  .whatsapp {
    border-radius: 20px;
    padding: 14px;
    border: 1px solid rgba(255,255,255,.1);
    background: rgba(255,255,255,.05);
  }

  .modelBadge strong,
  .modelBadge span,
  .whatsapp strong,
  .whatsapp span {
    display: block;
  }

  .modelBadge span,
  .whatsapp span {
    margin-top: 4px;
    color: #9ca8bf;
    font-size: 12px;
  }

  .modelBadge {
    border-color: rgba(56,189,248,.28);
    background: rgba(56,189,248,.08);
  }

  .whatsapp.on {
    border-color: rgba(34,197,94,.35);
    background: rgba(34,197,94,.08);
  }

  .whatsapp.off {
    border-color: rgba(245,158,11,.35);
    background: rgba(245,158,11,.08);
  }

  .chatCard {
    margin-top: 18px;
    border: 1px solid rgba(255,255,255,.09);
    border-radius: 24px;
    padding: 16px;
    background:
      radial-gradient(circle at top right, rgba(124,58,237,.14), transparent 34%),
      rgba(255,255,255,.04);
  }

  .chatTop {
    display: flex;
    justify-content: space-between;
    gap: 14px;
    align-items: flex-start;
    margin-bottom: 12px;
  }

  .clearBtn {
    border: 1px solid rgba(255,255,255,.12);
    background: rgba(255,255,255,.05);
    color: #e5edff;
    border-radius: 999px;
    padding: 9px 12px;
    cursor: pointer;
    font-weight: 800;
  }

  .chatWindow {
    min-height: 260px;
    max-height: 420px;
    overflow: auto;
    display: grid;
    align-content: start;
    gap: 10px;
    border-radius: 20px;
    padding: 14px;
    background: rgba(3,7,18,.42);
    border: 1px solid rgba(255,255,255,.08);
  }

  .emptyChat {
    border: 1px dashed rgba(56,189,248,.24);
    background: rgba(56,189,248,.06);
    border-radius: 18px;
    padding: 14px;
  }

  .emptyChat p {
    margin-bottom: 0;
  }

  .msg {
    display: flex;
  }

  .msg.user {
    justify-content: flex-end;
  }

  .msg.agent {
    justify-content: flex-start;
  }

  .msg > div {
    max-width: min(760px, 92%);
    border-radius: 18px;
    padding: 12px 14px;
    border: 1px solid rgba(255,255,255,.09);
  }

  .msg.user > div {
    background: rgba(56,189,248,.16);
    border-color: rgba(56,189,248,.24);
  }

  .msg.agent > div {
    background: rgba(255,255,255,.06);
  }

  .msg.thinking > div {
    border-color: rgba(245,158,11,.28);
    background: rgba(245,158,11,.08);
  }

  .msg p {
    white-space: pre-wrap;
    margin: 0;
    color: #e5edff;
  }

  .msg small {
    display: block;
    margin-top: 7px;
    font-size: 11px;
    color: #8fa0bb;
  }

  .chatForm {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 10px;
    margin-top: 12px;
  }

  .chatForm textarea {
    width: 100%;
    resize: vertical;
    min-height: 76px;
    border-radius: 18px;
    border: 1px solid rgba(255,255,255,.11);
    background: rgba(3,7,18,.52);
    color: #f8fafc;
    padding: 13px;
    outline: none;
    font: inherit;
  }

  .chatForm textarea:focus {
    border-color: rgba(56,189,248,.42);
    box-shadow: 0 0 0 4px rgba(56,189,248,.08);
  }

  .chatForm button {
    border: 0;
    border-radius: 18px;
    padding: 0 20px;
    background: linear-gradient(135deg, #38bdf8, #7c3aed);
    color: white;
    font-weight: 950;
    cursor: pointer;
    min-width: 110px;
  }

  .chatForm button:disabled {
    opacity: .55;
    cursor: not-allowed;
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

  .mt {
    margin-top: 20px;
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .chips span {
    border: 1px solid rgba(56,189,248,.22);
    background: rgba(56,189,248,.08);
    color: #bae6fd;
    border-radius: 999px;
    padding: 8px 10px;
    font-size: 12px;
    font-weight: 900;
  }

  .group {
    display: grid;
    gap: 10px;
    margin-bottom: 14px;
  }

  .group > strong {
    color: #e5edff;
  }

  .doneItem,
  .event {
    display: grid;
    grid-template-columns: 28px 1fr;
    gap: 10px;
    padding: 10px;
    border-radius: 16px;
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(255,255,255,.07);
  }

  .doneItem span,
  .event span {
    width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    border-radius: 10px;
    background: rgba(34,197,94,.16);
    color: #bbf7d0;
    font-weight: 900;
  }

  .doneItem b,
  .event b {
    color: #e5edff;
  }

  .doneItem p,
  .event p {
    margin: 4px 0 0;
  }

  .events {
    margin-top: 18px;
  }

  .muted {
    color: #8fa0bb;
  }

  @media (max-width: 900px) {
    .agentHeader,
    .chatTop {
      flex-direction: column;
    }

    .statusStack {
      width: 100%;
    }

    .agentGrid,
    .chatForm {
      grid-template-columns: 1fr;
    }

    .chatForm button {
      min-height: 48px;
    }
  }
`;
