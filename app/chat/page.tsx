"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Tab = "chats" | "agentes" | "automacoes";

type Thread = {
  id: string;
  title: string;
  kind?: string;
  status?: string;
  summary?: string;
  last_message?: string;
  messages_count?: number;
  created_at?: string;
  updated_at?: string;
};

type Message = {
  id: string;
  thread_id: string;
  role: "user" | "assistant" | "system" | string;
  content: string;
  created_at?: string;
};

type Agent = {
  id: string;
  slug?: string;
  name: string;
  subtitle?: string;
  description?: string;
  status?: string;
  badge?: string;
  metadata?: any;
};

type Automation = {
  id: string;
  slug?: string;
  name: string;
  title?: string;
  description?: string;
  status?: string;
  frequency?: string;
  metadata?: any;
};

type ChatData = {
  ok: boolean;
  source?: string;
  generated_at?: string;
  selectedThreadId?: string;
  metrics?: {
    threads_total?: number;
    messages_total?: number;
    agents_active?: number;
    automations_active?: number;
  };
  threads?: Thread[];
  messages?: Message[];
  agents?: Agent[];
  automations?: Automation[];
  error?: string;
};

function shortTime(value?: string) {
  if (!value) return "agora";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "agora";
  }
}

export default function ChatPage() {
  const [data, setData] = useState<ChatData | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("chats");
  const [selectedThreadId, setSelectedThreadId] = useState<string>("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const threads = data?.threads || [];
  const messages = data?.messages || [];
  const agents = data?.agents || [];
  const automations = data?.automations || [];
  const metrics = data?.metrics || {};

  const selectedThread = useMemo(() => {
    return threads.find((thread) => thread.id === selectedThreadId) || threads[0];
  }, [threads, selectedThreadId]);

  async function loadDashboard(threadId?: string) {
    try {
      setLoading(true);
      const query = threadId ? `?threadId=${encodeURIComponent(threadId)}&t=${Date.now()}` : `?t=${Date.now()}`;
      const response = await fetch(`/api/studio/chat-dashboard${query}`, {
        cache: "no-store",
      });
      const json = await response.json();
      setData(json);

      if (!selectedThreadId && json?.selectedThreadId) {
        setSelectedThreadId(json.selectedThreadId);
      }
    } catch (error: any) {
      setData({
        ok: false,
        error: error?.message || "Erro ao carregar chat.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    const content = input.trim();
    if (!content || sending) return;

    setInput("");
    setSending(true);

    try {
      const response = await fetch("/api/studio/chat-dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          threadId: selectedThread?.id || selectedThreadId,
          content,
        }),
      });

      const json = await response.json();

      if (json?.threadId) {
        setSelectedThreadId(json.threadId);
        await loadDashboard(json.threadId);
      } else {
        await loadDashboard(selectedThread?.id || selectedThreadId);
      }
    } catch {
      await loadDashboard(selectedThread?.id || selectedThreadId);
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    loadDashboard();
    const timer = setInterval(() => {
      loadDashboard(selectedThreadId);
    }, 15000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, sending]);

  function openThread(id: string) {
    setSelectedThreadId(id);
    loadDashboard(id);
  }

  return (
    <main className="chat-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo">✦</div>
          <div>
            <strong>Sualuma Chat</strong>
            <span>Banco vivo + Mia Brain</span>
          </div>
        </div>

        <div className="metrics">
          <div>
            <strong>{metrics.threads_total ?? threads.length}</strong>
            <span>Chats</span>
          </div>
          <div>
            <strong>{metrics.agents_active ?? agents.length}</strong>
            <span>Agentes</span>
          </div>
          <div>
            <strong>{metrics.automations_active ?? automations.length}</strong>
            <span>Automações</span>
          </div>
        </div>

        <div className="tabs">
          <button className={activeTab === "chats" ? "active" : ""} onClick={() => setActiveTab("chats")}>
            Chats
          </button>
          <button className={activeTab === "agentes" ? "active" : ""} onClick={() => setActiveTab("agentes")}>
            Agentes
          </button>
          <button className={activeTab === "automacoes" ? "active" : ""} onClick={() => setActiveTab("automacoes")}>
            Automações
          </button>
        </div>

        <div className="list">
          {activeTab === "chats" &&
            threads.map((thread) => (
              <button
                key={thread.id}
                className={`list-card ${selectedThread?.id === thread.id ? "selected" : ""}`}
                onClick={() => openThread(thread.id)}
              >
                <strong>{thread.title}</strong>
                <span>{thread.last_message || thread.summary || "Sem mensagens ainda."}</span>
                <small>{thread.messages_count || 0} mensagens · {shortTime(thread.updated_at || thread.created_at)}</small>
              </button>
            ))}

          {activeTab === "agentes" &&
            agents.map((agent) => (
              <div key={agent.id} className="list-card static">
                <strong>{agent.name}</strong>
                <span>{agent.subtitle || agent.description || agent.slug || "Agente conectado ao sistema."}</span>
                <small>{agent.status || "ativo"}</small>
              </div>
            ))}

          {activeTab === "automacoes" &&
            automations.map((automation) => (
              <div key={automation.id} className="list-card static">
                <strong>{automation.name || automation.title}</strong>
                <span>{automation.description || automation.frequency || automation.slug || "Automação do sistema."}</span>
                <small>{automation.status || "ativa"}</small>
              </div>
            ))}

          {!loading && activeTab === "chats" && !threads.length && (
            <div className="empty">Nenhuma conversa encontrada no banco.</div>
          )}
        </div>

        <div className="source">
          <span>{data?.ok ? "● Online" : "● Erro"}</span>
          <small>{data?.source || "postgres-direct"} · {shortTime(data?.generated_at)}</small>
        </div>
      </aside>

      <section className="chat-area">
        <header className="topbar">
          <div>
            <span className="eyebrow">Conversa ativa</span>
            <h1>{selectedThread?.title || "Sualuma Chat"}</h1>
            <p>{selectedThread?.summary || "Converse com a Mia, seus agentes e automações."}</p>
          </div>

          <div className="status-pill">
            <span>Banco vivo</span>
            <strong>{data?.ok ? "Conectado" : "Erro"}</strong>
          </div>
        </header>

        <div className="messages">
          {loading && <div className="empty-message">Carregando dados do banco...</div>}

          {!loading && data?.error && (
            <div className="empty-message error">{data.error}</div>
          )}

          {!loading && !messages.length && !data?.error && (
            <div className="welcome">
              <div className="orb">✦</div>
              <h2>O chat já está conectado ao banco.</h2>
              <p>As conversas, agentes e automações vêm da API viva. Envie uma mensagem para registrar no banco.</p>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`message ${message.role === "user" ? "user" : "assistant"}`}>
              <div className="bubble">
                <small>{message.role === "user" ? "Você" : "Mia"}</small>
                <p>{message.content}</p>
                <span>{shortTime(message.created_at)}</span>
              </div>
            </div>
          ))}

          {sending && (
            <div className="message assistant">
              <div className="bubble typing">
                <small>Mia</small>
                <p>Processando pelo painel vivo...</p>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <footer className="composer">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Digite para a Mia..."
          />

          <button onClick={sendMessage} disabled={!input.trim() || sending}>
            {sending ? "Enviando..." : "Enviar"}
          </button>
        </footer>
      </section>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .chat-shell {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 390px minmax(0, 1fr);
          background:
            radial-gradient(circle at 25% 10%, rgba(255, 43, 122, 0.2), transparent 32%),
            radial-gradient(circle at 80% 0%, rgba(124, 58, 237, 0.18), transparent 34%),
            #050711;
          color: #fff;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          overflow: hidden;
        }

        .sidebar {
          height: 100vh;
          padding: 22px;
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(4, 7, 18, 0.78);
          backdrop-filter: blur(22px);
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .logo {
          width: 46px;
          height: 46px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #ff3478, #8b5cf6);
          box-shadow: 0 0 35px rgba(255, 52, 120, 0.42);
          font-size: 22px;
        }

        .brand strong {
          display: block;
          font-size: 17px;
        }

        .brand span,
        .source small,
        .list-card span,
        .list-card small,
        .topbar p,
        .eyebrow {
          color: rgba(255, 255, 255, 0.58);
        }

        .metrics {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .metrics div {
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.045);
          border-radius: 18px;
          padding: 14px 10px;
        }

        .metrics strong {
          display: block;
          font-size: 22px;
          color: #ff4f93;
        }

        .metrics span {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.58);
        }

        .tabs {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          padding: 5px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.05);
        }

        .tabs button {
          border: 0;
          border-radius: 14px;
          padding: 10px 8px;
          background: transparent;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          font-weight: 700;
        }

        .tabs button.active {
          color: #fff;
          background: linear-gradient(135deg, rgba(255, 52, 120, 0.9), rgba(124, 58, 237, 0.85));
          box-shadow: 0 10px 30px rgba(255, 52, 120, 0.2);
        }

        .list {
          flex: 1;
          overflow: auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-right: 3px;
        }

        .list-card {
          width: 100%;
          text-align: left;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.045);
          border-radius: 18px;
          color: #fff;
          padding: 14px;
          cursor: pointer;
        }

        .list-card.selected {
          border-color: rgba(255, 79, 147, 0.7);
          background: linear-gradient(135deg, rgba(255, 52, 120, 0.16), rgba(124, 58, 237, 0.12));
          box-shadow: inset 0 0 24px rgba(255, 52, 120, 0.12);
        }

        .list-card.static {
          cursor: default;
        }

        .list-card strong,
        .list-card span,
        .list-card small {
          display: block;
        }

        .list-card span {
          font-size: 13px;
          margin: 6px 0;
          line-height: 1.35;
        }

        .list-card small {
          font-size: 11px;
        }

        .source {
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.04);
          border-radius: 18px;
          padding: 13px;
        }

        .source span {
          color: #6ee7b7;
          display: block;
          font-size: 13px;
          font-weight: 800;
        }

        .chat-area {
          height: 100vh;
          display: grid;
          grid-template-rows: auto 1fr auto;
          position: relative;
        }

        .topbar {
          padding: 28px 34px 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(5, 7, 17, 0.58);
          backdrop-filter: blur(16px);
        }

        .eyebrow {
          display: block;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.14em;
          margin-bottom: 6px;
        }

        h1 {
          margin: 0;
          font-size: clamp(26px, 4vw, 42px);
          letter-spacing: -0.04em;
        }

        .topbar p {
          margin: 7px 0 0;
          max-width: 680px;
        }

        .status-pill {
          min-width: 140px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          border-radius: 18px;
          padding: 12px 14px;
        }

        .status-pill span,
        .status-pill strong {
          display: block;
        }

        .status-pill span {
          color: rgba(255, 255, 255, 0.55);
          font-size: 12px;
        }

        .status-pill strong {
          color: #6ee7b7;
          margin-top: 3px;
        }

        .messages {
          overflow: auto;
          padding: 28px 34px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .welcome,
        .empty-message {
          max-width: 620px;
          margin: auto;
          text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.045);
          border-radius: 28px;
          padding: 34px;
        }

        .welcome h2 {
          margin: 12px 0 8px;
        }

        .welcome p,
        .empty-message {
          color: rgba(255, 255, 255, 0.62);
        }

        .empty-message.error {
          color: #fecaca;
          border-color: rgba(248, 113, 113, 0.4);
        }

        .orb {
          width: 72px;
          height: 72px;
          margin: 0 auto;
          border-radius: 24px;
          display: grid;
          place-items: center;
          background: radial-gradient(circle, #ff4f93, #7c3aed);
          box-shadow: 0 0 50px rgba(255, 79, 147, 0.45);
          font-size: 30px;
        }

        .message {
          display: flex;
        }

        .message.user {
          justify-content: flex-end;
        }

        .message.assistant {
          justify-content: flex-start;
        }

        .bubble {
          width: min(720px, 82%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 15px 17px;
          background: rgba(255, 255, 255, 0.055);
        }

        .message.user .bubble {
          background: linear-gradient(135deg, rgba(255, 52, 120, 0.82), rgba(124, 58, 237, 0.82));
          border-color: rgba(255, 255, 255, 0.14);
        }

        .bubble small,
        .bubble span {
          display: block;
          color: rgba(255, 255, 255, 0.55);
          font-size: 11px;
          font-weight: 800;
        }

        .bubble p {
          margin: 7px 0;
          line-height: 1.55;
          white-space: pre-wrap;
        }

        .typing p {
          color: rgba(255, 255, 255, 0.62);
        }

        .composer {
          padding: 18px 34px 24px;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(5, 7, 17, 0.72);
          backdrop-filter: blur(16px);
        }

        textarea {
          min-height: 56px;
          max-height: 150px;
          resize: vertical;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.06);
          color: #fff;
          padding: 17px;
          outline: none;
          font: inherit;
        }

        textarea::placeholder {
          color: rgba(255, 255, 255, 0.42);
        }

        .composer button {
          border: 0;
          border-radius: 20px;
          padding: 0 24px;
          min-width: 120px;
          color: #fff;
          font-weight: 900;
          background: linear-gradient(135deg, #ff3478, #8b5cf6);
          cursor: pointer;
          box-shadow: 0 18px 42px rgba(255, 52, 120, 0.25);
        }

        .composer button:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .empty {
          padding: 16px;
          color: rgba(255, 255, 255, 0.55);
          text-align: center;
        }

        @media (max-width: 980px) {
          .chat-shell {
            grid-template-columns: 1fr;
          }

          .sidebar {
            height: auto;
            max-height: 48vh;
          }

          .chat-area {
            height: auto;
            min-height: 100vh;
          }

          .topbar {
            align-items: flex-start;
            flex-direction: column;
            gap: 14px;
          }

          .composer {
            grid-template-columns: 1fr;
          }

          .composer button {
            min-height: 54px;
          }
        }
      `}</style>
    </main>
  );
}
