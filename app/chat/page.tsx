"use client";

import { useEffect, useMemo, useState } from "react";

type Tab = "tudo" | "chats" | "agentes" | "automacoes";

type Thread = {
  id: string;
  title: string;
  agent_slug?: string;
  summary?: string;
  last_message?: string;
  messages_count?: number;
  created_at?: string;
  updated_at?: string;
};

type Message = {
  id: string;
  thread_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at?: string;
};

type Agent = {
  id: string;
  slug: string;
  name: string;
  subtitle?: string;
  badge?: string;
  is_active?: boolean;
};

type Automation = {
  id: string;
  slug: string;
  name: string;
  subtitle?: string;
  badge?: string;
  is_active?: boolean;
  status?: string;
};

type DashboardData = {
  ok: boolean;
  source?: string;
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
  generated_at?: string;
  error?: string;
};

function timeAgo(date?: string) {
  if (!date) return "agora";
  const diff = Date.now() - new Date(date).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

function Badge({ children, blue = false }: { children: React.ReactNode; blue?: boolean }) {
  return <span className={blue ? "badge blue" : "badge"}>{children}</span>;
}

export default function ChatPage() {
  const [tab, setTab] = useState<Tab>("tudo");
  const [data, setData] = useState<DashboardData | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const threads = data?.threads || [];
  const messages = data?.messages || [];
  const agents = data?.agents || [];
  const automations = data?.automations || [];

  const selectedThread = threads.find((thread) => thread.id === selectedThreadId) || threads[0];

  const currentTitle = useMemo(() => {
    return selectedThread?.title ? `Mia Brain — ${selectedThread.title}` : "Mia Brain — Novo chat";
  }, [selectedThread]);

  async function load(threadId?: string) {
    try {
      setLoading(true);
      const url = threadId
        ? `/api/studio/chat-dashboard?threadId=${encodeURIComponent(threadId)}`
        : "/api/studio/chat-dashboard";

      const res = await fetch(url, { cache: "no-store" });
      const json = await res.json();

      setData(json);

      if (!selectedThreadId && json?.selectedThreadId) {
        setSelectedThreadId(json.selectedThreadId);
      }
    } catch (error) {
      setData({ ok: false, error: "Falha ao carregar chat." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const timer = window.setInterval(() => {
      if (selectedThreadId) load(selectedThreadId);
    }, 30000);

    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedThreadId]);

  async function selectThread(threadId: string) {
    setSelectedThreadId(threadId);
    await load(threadId);
  }

  async function createThread() {
    const title = prompt("Nome do novo chat:", "Novo chat");
    if (!title) return;

    const res = await fetch("/api/studio/chat-dashboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create-thread", title }),
    });

    const json = await res.json();

    if (json?.ok && json?.thread?.id) {
      setSelectedThreadId(json.thread.id);
      await load(json.thread.id);
    } else {
      alert(json?.error || "Não consegui criar o chat.");
    }
  }

  async function sendMessage() {
    if (!message.trim() || !selectedThreadId || sending) return;

    const content = message.trim();
    setMessage("");
    setSending(true);

    try {
      const res = await fetch("/api/studio/chat-dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send-message",
          thread_id: selectedThreadId,
          content,
        }),
      });

      const json = await res.json();

      if (!json?.ok) {
        alert(json?.error || "Não consegui enviar a mensagem.");
      }

      await load(selectedThreadId);
    } finally {
      setSending(false);
    }
  }

  async function toggleAutomation(auto: Automation) {
    await fetch("/api/studio/chat-dashboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "toggle-automation",
        slug: auto.slug,
        is_active: !auto.is_active,
      }),
    });

    await load(selectedThreadId);
  }

  const visibleChats = tab === "tudo" || tab === "chats";
  const visibleAgents = tab === "tudo" || tab === "agentes";
  const visibleAutomations = tab === "tudo" || tab === "automacoes";

  return (
    <main className="chat-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">S</div>
          <div>
            <strong>sualuma</strong>
            <span>Seu universo de IA</span>
          </div>
          <button className="collapse">‹</button>
        </div>

        <button className="new-chat" onClick={createThread}>
          <span>＋</span>
          Novo chat
          <small>DB</small>
        </button>

        <div className="tabs">
          <button onClick={() => setTab("tudo")} className={tab === "tudo" ? "active" : ""}>Tudo</button>
          <button onClick={() => setTab("chats")} className={tab === "chats" ? "active" : ""}>Chats</button>
          <button onClick={() => setTab("agentes")} className={tab === "agentes" ? "active" : ""}>Agentes</button>
          <button onClick={() => setTab("automacoes")} className={tab === "automacoes" ? "active" : ""}>Automações</button>
        </div>

        <div className="sidebar-scroll">
          {visibleChats && (
            <section className="side-section">
              <div className="section-head">
                <span>Conversas</span>
                <button>{loading ? "..." : "⌃"}</button>
              </div>

              {threads.map((thread) => (
                <button
                  key={thread.id}
                  className={selectedThreadId === thread.id ? "side-item selected" : "side-item"}
                  onClick={() => selectThread(thread.id)}
                >
                  <span className="mini-icon">☰</span>
                  <strong>{thread.title}</strong>
                  <em>{timeAgo(thread.updated_at)}</em>
                </button>
              ))}

              {threads.length === 0 && <p className="empty">Nenhum chat ainda.</p>}
            </section>
          )}

          {visibleAgents && (
            <section className="side-section">
              <div className="section-head">
                <span>Agentes</span>
                <button>＋</button>
              </div>

              {agents.map((agent) => (
                <button key={agent.id} className="agent-item">
                  <span className="avatar">{agent.name.slice(0, 1)}</span>
                  <span>
                    <strong>{agent.name}</strong>
                    <small>{agent.subtitle || "Agente conectado"}</small>
                  </span>
                  <Badge blue={agent.badge === "Criado"}>{agent.badge || "Criado"}</Badge>
                  {agent.is_active && <i />}
                </button>
              ))}
            </section>
          )}

          {visibleAutomations && (
            <section className="side-section">
              <div className="section-head">
                <span>Automações</span>
                <button>＋</button>
              </div>

              {automations.map((auto) => (
                <button key={auto.id} className="agent-item" onClick={() => toggleAutomation(auto)}>
                  <span className="auto-icon">✦</span>
                  <span>
                    <strong>{auto.name}</strong>
                    <small>{auto.subtitle || "Automação conectada"}</small>
                  </span>
                  <Badge blue={auto.badge === "Criada"}>{auto.badge || "Criada"}</Badge>
                  {auto.is_active && <i />}
                </button>
              ))}
            </section>
          )}
        </div>

        <div className="profile">
          <div className="profile-photo">L</div>
          <div>
            <strong>Luma Studio</strong>
            <span>{data?.ok ? "Banco online" : "Banco offline"}</span>
          </div>
          <button>⋮</button>
        </div>
      </aside>

      <section className="main-chat">
        <header className="topbar">
          <div className="conversation-title">
            <div className="robot">◎</div>
            <h1>{currentTitle}</h1>
            <span>⌄</span>
          </div>

          <div className="top-actions">
            <button onClick={() => load(selectedThreadId)}>↻ Atualizar</button>
            <button>📎</button>
            <button>🎙</button>
            <button>⚙ Configurações</button>
          </div>
        </header>

        <div className="chat-body">
          <div className="messages">
            {messages.length === 0 && (
              <div className="welcome">
                <h2>💬 Chat conectado ao banco</h2>
                <p>Crie conversas, envie mensagens e acompanhe tudo salvo no PostgreSQL/Supabase.</p>
              </div>
            )}

            {messages.map((msg) =>
              msg.role === "user" ? (
                <div className="user-bubble" key={msg.id}>
                  <p>{msg.content}</p>
                  <span>{timeAgo(msg.created_at)} ✓✓</span>
                </div>
              ) : (
                <div className="assistant-row" key={msg.id}>
                  <div className="bot-avatar">🤖</div>
                  <div className="assistant-bubble">
                    <p className="intro">{msg.content}</p>
                    <div className="message-actions">
                      <button>⧉</button>
                      <button>👍</button>
                      <button>👎</button>
                      <button>🔖</button>
                      <span>{timeAgo(msg.created_at)}</span>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>

          <aside className="context-panel">
            <div className="context-card">
              <h3>Banco conectado</h3>
              <div className="quick-list">
                <p><span>Fonte</span><b>{data?.source || "postgres"}</b></p>
                <p><span>Conversas</span><b>{data?.metrics?.threads_total || 0}</b></p>
                <p><span>Mensagens</span><b>{data?.metrics?.messages_total || 0}</b></p>
                <p><span>Agentes ativos</span><b>{data?.metrics?.agents_active || 0}</b></p>
                <p><span>Automações ativas</span><b>{data?.metrics?.automations_active || 0}</b></p>
              </div>
            </div>

            <div className="context-card">
              <h3>Sobre este agente</h3>
              <div className="agent-feature">
                <div className="big-avatar">🤖</div>
                <div>
                  <strong>Mia Brain <Badge>Comprado</Badge></strong>
                  <p>Sua assistente inteligente para estratégia, planejamento e tomada de decisão.</p>
                </div>
              </div>
              <button className="outline-btn">Ver detalhes do agente ↗</button>
            </div>

            <div className="context-card">
              <div className="card-head">
                <h3>Automações relacionadas</h3>
                <button>Gerenciar</button>
              </div>

              {automations.slice(0, 4).map((auto) => (
                <div className="toggle-line" key={auto.id} onClick={() => toggleAutomation(auto)}>
                  <span>{auto.name}</span>
                  <b>{auto.is_active ? "Ativa" : "Pausada"}</b>
                  <i className={auto.is_active ? "on" : ""} />
                </div>
              ))}
            </div>

            <div className="pro-card">
              <h3>💎 Próximo nível</h3>
              <p>Agora o chat salva no banco. O próximo passo é ligar a resposta na Mia Brain real, usando Ollama/Gemini/OpenRouter.</p>
              <button>Conectar IA real ›</button>
            </div>
          </aside>
        </div>

        <div className="composer">
          <div className="input-wrap">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Mensagem para Mia Brain..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <div className="composer-actions">
              <button>📎 Anexar</button>
              <button>🎙 Falar</button>
            </div>
            <button className="send" onClick={sendMessage} disabled={sending}>
              {sending ? "..." : "➤"}
            </button>
          </div>

          <p>{data?.ok ? "Conectado ao banco vivo." : data?.error || "Carregando banco..."}</p>
        </div>
      </section>

      <style jsx global>{`
        *{box-sizing:border-box}
        body{margin:0;background:#030712;color:#f8fafc;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
        button,textarea{font:inherit}
        .chat-shell{min-height:100vh;display:grid;grid-template-columns:340px 1fr;background:radial-gradient(circle at 20% 0%,rgba(59,130,246,.2),transparent 32%),radial-gradient(circle at 70% 100%,rgba(147,51,234,.18),transparent 34%),linear-gradient(135deg,#020617,#050816 55%,#020617);padding:14px;gap:14px}
        .sidebar,.main-chat{border:1px solid rgba(148,163,184,.22);background:rgba(3,7,18,.76);box-shadow:0 24px 80px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.05);backdrop-filter:blur(18px);border-radius:22px;overflow:hidden}
        .sidebar{display:flex;flex-direction:column;padding:14px}
        .brand{display:flex;align-items:center;gap:12px;padding:4px 4px 12px}
        .brand-icon{width:44px;height:44px;display:grid;place-items:center;border-radius:14px;background:linear-gradient(135deg,rgba(34,211,238,.25),rgba(124,58,237,.25));color:#67e8f9;font-size:24px;font-weight:900;box-shadow:0 0 28px rgba(34,211,238,.35)}
        .brand strong{display:block;font-size:24px;letter-spacing:-.04em}.brand span{color:#94a3b8;font-size:12px}
        .collapse{margin-left:auto;width:30px;height:30px;border:1px solid rgba(148,163,184,.24);background:rgba(15,23,42,.65);color:white;border-radius:10px}
        .new-chat{height:56px;border:0;color:white;border-radius:12px;background:linear-gradient(135deg,#7c3aed,#2563eb);box-shadow:0 0 28px rgba(37,99,235,.35);display:flex;align-items:center;justify-content:center;gap:10px;font-weight:800;cursor:pointer}
        .new-chat span{font-size:24px}.new-chat small{margin-left:auto;margin-right:12px;color:rgba(255,255,255,.7)}
        .tabs{margin-top:12px;display:grid;grid-template-columns:repeat(4,1fr);gap:4px;padding:4px;background:rgba(15,23,42,.8);border:1px solid rgba(148,163,184,.14);border-radius:12px}
        .tabs button{border:0;background:transparent;color:#94a3b8;border-radius:9px;padding:8px 4px;cursor:pointer;font-size:12px}.tabs button.active{background:linear-gradient(135deg,rgba(124,58,237,.55),rgba(37,99,235,.35));color:white;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)}
        .sidebar-scroll{flex:1;overflow:auto;padding-right:2px}.side-section{padding-top:14px;border-bottom:1px solid rgba(148,163,184,.14);padding-bottom:10px}
        .section-head{display:flex;justify-content:space-between;align-items:center;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:.06em;margin:0 8px 8px}.section-head button{background:transparent;color:#94a3b8;border:0}
        .side-item,.agent-item{width:100%;min-height:36px;display:flex;align-items:center;gap:9px;border:0;background:transparent;color:#e5e7eb;border-radius:10px;padding:8px;cursor:pointer;text-align:left}
        .side-item:hover,.agent-item:hover{background:rgba(59,130,246,.08)}.side-item.selected{background:linear-gradient(135deg,rgba(124,58,237,.35),rgba(37,99,235,.18));outline:1px solid rgba(124,58,237,.75);box-shadow:0 0 20px rgba(124,58,237,.18)}
        .side-item strong{font-size:13px;flex:1}.side-item em{color:#94a3b8;font-size:11px;font-style:normal}.mini-icon{width:20px;color:#c4b5fd}
        .agent-item .avatar,.auto-icon{width:32px;height:32px;flex:0 0 32px;border-radius:10px;display:grid;place-items:center;background:linear-gradient(135deg,rgba(124,58,237,.55),rgba(34,211,238,.22));box-shadow:0 0 18px rgba(124,58,237,.22)}
        .auto-icon{background:linear-gradient(135deg,rgba(37,99,235,.65),rgba(16,185,129,.2))}
        .agent-item span:nth-child(2){min-width:0;flex:1}.agent-item strong{display:block;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.agent-item small{display:block;color:#94a3b8;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .badge{border:1px solid rgba(168,85,247,.5);background:rgba(124,58,237,.18);color:#c4b5fd;border-radius:999px;padding:4px 8px;font-size:10px;font-weight:700;white-space:nowrap}.badge.blue{border-color:rgba(59,130,246,.5);background:rgba(37,99,235,.18);color:#93c5fd}
        .agent-item i{width:7px;height:7px;border-radius:50%;background:#22c55e;box-shadow:0 0 10px rgba(34,197,94,.85)}
        .empty{color:#64748b;font-size:12px;padding:8px}
        .profile{margin-top:12px;border:1px solid rgba(148,163,184,.18);background:rgba(15,23,42,.55);border-radius:14px;padding:10px;display:flex;align-items:center;gap:10px}
        .profile-photo{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#f472b6,#60a5fa);font-weight:900}.profile strong{display:block;font-size:13px}.profile span{color:#94a3b8;font-size:11px}.profile button{margin-left:auto;border:0;background:transparent;color:#94a3b8;font-size:20px}
        .main-chat{display:flex;flex-direction:column}.topbar{height:58px;padding:0 22px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(148,163,184,.14);background:rgba(2,6,23,.64)}
        .conversation-title{display:flex;align-items:center;gap:12px}.conversation-title h1{font-size:18px;margin:0;letter-spacing:-.03em}.robot{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle,rgba(34,211,238,.45),rgba(124,58,237,.25));box-shadow:0 0 24px rgba(124,58,237,.45)}
        .top-actions{display:flex;gap:8px}.top-actions button{height:38px;border-radius:10px;border:1px solid rgba(148,163,184,.22);background:rgba(15,23,42,.62);color:#e5e7eb;padding:0 12px;cursor:pointer}
        .chat-body{flex:1;display:grid;grid-template-columns:minmax(0,1fr) 310px;gap:18px;padding:20px 26px 0;overflow:hidden}.messages{overflow:auto;padding:0 10px 18px 0}
        .welcome{border:1px solid rgba(148,163,184,.2);background:rgba(15,23,42,.72);border-radius:18px;padding:20px;color:#cbd5e1}.welcome h2{margin:0 0 8px;color:white}
        .user-bubble{width:min(520px,82%);margin:0 0 20px auto;border:1px solid rgba(124,58,237,.65);background:linear-gradient(135deg,rgba(88,28,135,.55),rgba(30,41,59,.72));padding:14px 16px;border-radius:18px;box-shadow:0 0 32px rgba(124,58,237,.18)}.user-bubble p{margin:0 0 8px;line-height:1.5}.user-bubble span{display:block;text-align:right;color:#93c5fd;font-size:12px}
        .assistant-row{margin:0 0 24px;display:flex;gap:14px;align-items:flex-start}.bot-avatar{width:54px;height:54px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle,rgba(34,211,238,.45),rgba(124,58,237,.2));border:1px solid rgba(96,165,250,.5);box-shadow:0 0 28px rgba(59,130,246,.35)}
        .assistant-bubble{width:min(620px,100%);border:1px solid rgba(148,163,184,.2);background:rgba(15,23,42,.72);border-radius:18px;padding:16px;box-shadow:0 22px 60px rgba(0,0,0,.35)}.intro{margin:0;color:#e5e7eb;line-height:1.55}
        .message-actions{display:flex;align-items:center;gap:8px;margin-top:12px}.message-actions button{border:0;background:transparent;color:#94a3b8;cursor:pointer}.message-actions span{margin-left:auto;color:#94a3b8;font-size:12px}
        .context-panel{overflow:auto;padding-bottom:18px}.context-card,.pro-card{border:1px solid rgba(148,163,184,.2);background:rgba(15,23,42,.68);border-radius:16px;padding:16px;margin-bottom:14px}.context-card h3,.pro-card h3{margin:0 0 14px;font-size:14px}
        .agent-feature{display:flex;gap:12px;align-items:center;border-top:1px solid rgba(148,163,184,.12);padding-top:14px}.big-avatar{width:54px;height:54px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle,rgba(96,165,250,.42),rgba(124,58,237,.24))}.agent-feature p{color:#94a3b8;font-size:12px;line-height:1.4;margin:6px 0 0}
        .outline-btn{width:100%;height:38px;margin-top:14px;border:1px solid rgba(148,163,184,.22);background:rgba(2,6,23,.35);color:#c4b5fd;border-radius:10px;cursor:pointer}
        .quick-list{display:grid;gap:12px}.quick-list p{margin:0;display:flex;justify-content:space-between;gap:10px;color:#94a3b8;font-size:12px}.quick-list b{color:#e5e7eb;font-weight:600;text-align:right}
        .card-head{display:flex;justify-content:space-between;align-items:center}.card-head button{border:0;background:transparent;color:#c084fc;cursor:pointer;font-size:12px}
        .toggle-line{display:flex;align-items:center;gap:8px;padding:9px 0;color:#e5e7eb;font-size:13px;cursor:pointer}.toggle-line span{flex:1}.toggle-line b{color:#94a3b8;font-size:11px;font-weight:500}.toggle-line i{width:30px;height:17px;border-radius:999px;background:#334155;position:relative}.toggle-line i:after{content:"";position:absolute;width:13px;height:13px;left:2px;top:2px;border-radius:50%;background:#94a3b8}.toggle-line i.on{background:#2563eb}.toggle-line i.on:after{left:15px;background:white}
        .pro-card{background:radial-gradient(circle at 90% 40%,rgba(59,130,246,.35),transparent 28%),linear-gradient(135deg,rgba(88,28,135,.7),rgba(15,23,42,.85));border-color:rgba(124,58,237,.7);box-shadow:0 0 32px rgba(124,58,237,.18)}.pro-card p{color:#cbd5e1;font-size:13px;line-height:1.45}.pro-card button{border:1px solid rgba(196,181,253,.45);background:rgba(124,58,237,.32);color:white;border-radius:10px;padding:10px 14px;cursor:pointer}
        .composer{padding:14px 26px 10px}.input-wrap{min-height:86px;border:1px solid rgba(96,165,250,.7);border-radius:24px;background:rgba(15,23,42,.82);box-shadow:0 0 38px rgba(37,99,235,.18),0 0 34px rgba(124,58,237,.18);display:grid;grid-template-columns:1fr auto;grid-template-rows:1fr auto;gap:8px;padding:14px}.input-wrap textarea{grid-column:1;border:0;outline:none;resize:none;color:white;min-height:34px;background:transparent}.input-wrap textarea::placeholder{color:#64748b}.composer-actions{display:flex;gap:8px}.composer-actions button{border:1px solid rgba(148,163,184,.22);background:rgba(2,6,23,.35);color:#e5e7eb;border-radius:10px;padding:8px 12px;cursor:pointer}.send{grid-column:2;grid-row:1/3;width:54px;height:54px;border-radius:50%;border:0;align-self:center;background:linear-gradient(135deg,#7c3aed,#2563eb);color:white;font-size:22px;cursor:pointer;box-shadow:0 0 28px rgba(37,99,235,.5)}.send:disabled{opacity:.6;cursor:not-allowed}.composer p{margin:6px 0 0;text-align:center;color:#64748b;font-size:11px}
        @media(max-width:1180px){.chat-shell{grid-template-columns:300px 1fr}.chat-body{grid-template-columns:1fr}.context-panel{display:none}}
        @media(max-width:820px){.chat-shell{grid-template-columns:1fr;padding:8px}.sidebar{max-height:48vh}.topbar{height:auto;padding:14px;align-items:flex-start;gap:12px;flex-direction:column}.top-actions{flex-wrap:wrap}.chat-body{padding:14px}.composer{padding:10px 14px}}
      `}</style>
    </main>
  );
}
