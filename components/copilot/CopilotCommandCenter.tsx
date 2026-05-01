"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Lane = {
  id: string;
  title: string;
};

type Task = {
  id: string;
  title: string;
  area: string;
  severity: string;
  lane: string;
  plain_explanation: string;
  evidence: string;
  source: string;
  updated_at?: string;
};

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
};

type BoardData = {
  ok: boolean;
  report: {
    name: string;
    generated_at: string | null;
    score: number;
    summary: string;
    counts?: any;
    sections?: any[];
  };
  lanes: Lane[];
  tasks: Task[];
  memory: {
    messages: ChatMessage[];
    lessons: string[];
  };
};

const API = "/api/estudio-lab/copilot-action";

export default function CopilotCommandCenter() {
  const [data, setData] = useState<BoardData | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(API, { cache: "no-store" });
      const json = await res.json();
      setData(json);
      setMessages(json?.memory?.messages || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || sending) return;

    const optimistic: ChatMessage = {
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimistic]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const json = await res.json();
      if (json?.board) setData(json.board);
      if (json?.memory?.messages) setMessages(json.memory.messages);
      else if (json?.answer) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: json.answer, created_at: new Date().toISOString() },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Tive erro ao executar a ação. O Kanban não foi alterado.",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  async function moveTask(taskId: string, lane: string) {
    setSending(true);
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "moveTask", taskId, lane }),
      });
      const json = await res.json();
      if (json?.board) setData(json.board);
      if (json?.memory?.messages) setMessages(json.memory.messages);
    } finally {
      setSending(false);
    }
  }

  async function verifyTask(taskId: string) {
    setSending(true);
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "verifyTask", taskId }),
      });
      const json = await res.json();
      if (json?.board) setData(json.board);
      if (json?.memory?.messages) setMessages(json.memory.messages);
    } finally {
      setSending(false);
    }
  }

  const grouped = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const lane of data?.lanes || []) map[lane.id] = [];
    for (const task of data?.tasks || []) {
      if (!map[task.lane]) map[task.lane] = [];
      map[task.lane].push(task);
    }
    return map;
  }, [data]);

  const counts = useMemo(() => {
    const tasks = data?.tasks || [];
    return {
      total: tasks.length,
      urgent: tasks.filter((t) => t.lane === "urgent").length,
      doing: tasks.filter((t) => t.lane === "doing").length,
      validated: tasks.filter((t) => t.lane === "validated").length,
    };
  }, [data]);

  return (
    <main className="copilot-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Studio Sualuma • Copiloto de Lançamento</p>
          <h1>Kanban inteligente com memória</h1>
          <p className="subtitle">
            Converse com o Copiloto, peça para criar categorias, mover cards, verificar tarefas e guardar aprendizados.
          </p>
        </div>

        <div className="score-card">
          <span>Score</span>
          <strong>{data?.report?.score ?? "..."}/100</strong>
          <small>{data?.report?.summary || "Carregando relatório..."}</small>
        </div>
      </section>

      <section className="metrics">
        <div>
          <strong>{counts.total}</strong>
          <span>Tarefas totais</span>
        </div>
        <div>
          <strong>{counts.urgent}</strong>
          <span>Urgentes</span>
        </div>
        <div>
          <strong>{counts.doing}</strong>
          <span>Em andamento</span>
        </div>
        <div>
          <strong>{counts.validated}</strong>
          <span>Concluídas</span>
        </div>
      </section>

      <section className="layout">
        <div className="board">
          <div className="board-head">
            <div>
              <p className="eyebrow">Kanban operacional</p>
              <h2>O que falta para lançar com segurança</h2>
            </div>
            <button onClick={load} disabled={loading}>
              {loading ? "Atualizando..." : "Atualizar"}
            </button>
          </div>

          <div className="lanes">
            {(data?.lanes || []).map((lane) => (
              <div className="lane" key={lane.id}>
                <div className="lane-title">
                  <strong>{lane.title}</strong>
                  <span>{grouped[lane.id]?.length || 0}</span>
                </div>

                <div className="cards">
                  {(grouped[lane.id] || []).map((task) => (
                    <article className="task-card" key={task.id}>
                      <div className="task-top">
                        <span className={`severity ${String(task.severity).toLowerCase()}`}>{task.severity}</span>
                        <span>{task.area}</span>
                      </div>

                      <h3>{task.title}</h3>
                      <p>{task.plain_explanation}</p>

                      {task.evidence ? (
                        <details>
                          <summary>Prova encontrada</summary>
                          <pre>{task.evidence}</pre>
                        </details>
                      ) : null}

                      <div className="task-actions">
                        <button onClick={() => moveTask(task.id, "urgent")}>Urgente</button>
                        <button onClick={() => moveTask(task.id, "doing")}>Fazendo</button>
                        <button onClick={() => moveTask(task.id, "wait")}>Esperar</button>
                        <button onClick={() => verifyTask(task.id)}>Verificar</button>
                        <button onClick={() => moveTask(task.id, "validated")}>Concluir</button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="chat">
          <div className="chat-head">
            <div>
              <p className="eyebrow">Chat com memória</p>
              <h2>Fale com o Copiloto</h2>
            </div>
            <button onClick={load}>Recarregar</button>
          </div>

          <div className="lessons">
            <strong>Aprendizados salvos</strong>
            {data?.memory?.lessons?.length ? (
              <ul>
                {data.memory.lessons.slice(-4).map((lesson, index) => (
                  <li key={index}>{lesson}</li>
                ))}
              </ul>
            ) : (
              <p>Nenhum aprendizado salvo ainda. Escreva “não esqueça...” para salvar.</p>
            )}
          </div>

          <div className="messages">
            {messages.map((msg, index) => (
              <div className={`msg ${msg.role}`} key={`${msg.created_at}-${index}`}>
                <span>{msg.role === "user" ? "Você" : "Copiloto"}</span>
                <pre>{msg.content}</pre>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="composer">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='Ex: "move a tarefa do Stripe para urgente" ou "cria uma categoria chamada Pós-lançamento"'
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) sendMessage();
              }}
            />
            <button className="send-main-button" type="button" onClick={sendMessage} disabled={sending || !input.trim()}>
              {sending ? "Enviando..." : "Enviar mensagem"}
            </button>
          </div>

          <div className="examples">
            <strong>Comandos que ele entende:</strong>
            <code>cria uma categoria chamada Urgente jurídico</code>
            <code>move a tarefa do Stripe para urgente</code>
            <code>verifica a tarefa de usuários</code>
            <code>não esqueça que confirmação de e-mail é prioridade</code>
          </div>
        </aside>
      </section>

      <style jsx>{`
        .copilot-shell {
          min-height: 100vh;
          padding: 32px;
          background:
            radial-gradient(circle at top left, rgba(124, 58, 237, 0.25), transparent 34%),
            radial-gradient(circle at top right, rgba(56, 189, 248, 0.18), transparent 32%),
            #070814;
          color: #fff;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .hero {
          display: flex;
          justify-content: space-between;
          gap: 24px;
          align-items: stretch;
          margin-bottom: 22px;
        }

        .eyebrow {
          margin: 0 0 8px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-size: 11px;
          color: #8bdcff;
          font-weight: 800;
        }

        h1,
        h2,
        h3,
        p {
          margin: 0;
        }

        h1 {
          font-size: clamp(30px, 4vw, 58px);
          letter-spacing: -0.06em;
          line-height: 0.95;
        }

        .subtitle {
          margin-top: 12px;
          max-width: 740px;
          color: rgba(255, 255, 255, 0.68);
          line-height: 1.55;
        }

        .score-card {
          width: min(320px, 100%);
          padding: 22px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.07);
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.25);
        }

        .score-card span,
        .score-card small {
          display: block;
          color: rgba(255, 255, 255, 0.62);
        }

        .score-card strong {
          display: block;
          font-size: 44px;
          margin: 8px 0;
        }

        .metrics {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 22px;
        }

        .metrics div {
          padding: 18px;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.06);
        }

        .metrics strong {
          display: block;
          font-size: 28px;
        }

        .metrics span {
          color: rgba(255, 255, 255, 0.6);
          font-size: 13px;
        }

        .layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 430px;
          gap: 18px;
          align-items: start;
        }

        .board,
        .chat {
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 26px;
          background: rgba(255, 255, 255, 0.06);
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.24);
          overflow: hidden;
        }

        .board-head,
        .chat-head {
          padding: 20px;
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .board-head h2,
        .chat-head h2 {
          font-size: 20px;
        }

        button {
          border: 0;
          border-radius: 999px;
          padding: 10px 14px;
          font-weight: 800;
          color: #06111f;
          background: linear-gradient(135deg, #8bdcff, #d8b4fe);
          cursor: pointer;
        }

        button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .lanes {
          display: grid;
          grid-template-columns: repeat(5, minmax(260px, 1fr));
          gap: 14px;
          padding: 18px;
          overflow-x: auto;
        }

        .lane {
          min-height: 520px;
          border-radius: 22px;
          background: rgba(0, 0, 0, 0.18);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 12px;
        }

        .lane-title {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: center;
          padding: 8px 8px 14px;
        }

        .lane-title strong {
          font-size: 14px;
        }

        .lane-title span {
          min-width: 28px;
          height: 28px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.72);
          font-size: 12px;
          font-weight: 900;
        }

        .cards {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .task-card {
          padding: 14px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .task-top {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          align-items: center;
          margin-bottom: 10px;
          color: rgba(255, 255, 255, 0.58);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 800;
        }

        .severity {
          border-radius: 999px;
          padding: 4px 8px;
          background: rgba(255, 255, 255, 0.12);
        }

        .severity.alta,
        .severity.high {
          background: rgba(248, 113, 113, 0.22);
          color: #fecaca;
        }

        .severity.media,
        .severity.medium {
          background: rgba(251, 191, 36, 0.18);
          color: #fde68a;
        }

        .task-card h3 {
          font-size: 15px;
          line-height: 1.3;
          margin-bottom: 8px;
        }

        .task-card p {
          color: rgba(255, 255, 255, 0.66);
          font-size: 13px;
          line-height: 1.45;
        }

        details {
          margin-top: 10px;
          color: rgba(255, 255, 255, 0.68);
          font-size: 12px;
        }

        summary {
          cursor: pointer;
          font-weight: 800;
        }

        pre {
          white-space: pre-wrap;
          word-break: break-word;
          margin: 8px 0 0;
          font-family: inherit;
        }

        details pre {
          max-height: 160px;
          overflow: auto;
          padding: 10px;
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.22);
          color: rgba(255, 255, 255, 0.72);
          font-size: 11px;
        }

        .task-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 12px;
        }

        .task-actions button {
          padding: 7px 9px;
          font-size: 11px;
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .chat {
          position: sticky;
          top: 18px;
          max-height: calc(100vh - 36px);
          display: flex;
          flex-direction: column;
        }

        .lessons {
          margin: 14px;
          padding: 14px;
          border-radius: 18px;
          background: rgba(139, 220, 255, 0.08);
          border: 1px solid rgba(139, 220, 255, 0.12);
        }

        .lessons strong {
          display: block;
          margin-bottom: 8px;
        }

        .lessons p,
        .lessons li {
          color: rgba(255, 255, 255, 0.62);
          font-size: 12px;
          line-height: 1.4;
        }

        .messages {
          flex: 1;
          overflow: auto;
          padding: 0 14px 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-height: 260px;
        }

        .msg {
          padding: 12px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .msg.user {
          background: rgba(216, 180, 254, 0.12);
        }

        .msg span {
          display: block;
          margin-bottom: 6px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #8bdcff;
          font-weight: 900;
        }

        .msg pre {
          margin: 0;
          color: rgba(255, 255, 255, 0.78);
          font-size: 13px;
          line-height: 1.45;
        }

        .composer {
          padding: 14px;
          display: grid;
          gap: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        textarea {
          width: 100%;
          min-height: 92px;
          resize: vertical;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(0, 0, 0, 0.22);
          color: #fff;
          padding: 12px;
          outline: none;
          font: inherit;
        }

        .examples {
          display: grid;
          gap: 8px;
          padding: 0 14px 14px;
        }

        .examples strong {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.66);
        }

        .examples code {
          display: block;
          padding: 8px 10px;
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.24);
          color: rgba(255, 255, 255, 0.65);
          font-size: 11px;
          white-space: normal;
        }


        /* FIX: botão enviar sempre visível no chat do Copiloto */
        .composer {
          position: sticky;
          bottom: 0;
          z-index: 50;
          background: rgba(7, 8, 20, 0.96);
          backdrop-filter: blur(14px);
          border-top: 1px solid rgba(255, 255, 255, 0.14);
        }

        .send-main-button {
          display: flex !important;
          width: 100%;
          min-height: 56px;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          font-size: 15px;
          font-weight: 950;
          background: linear-gradient(135deg, #38bdf8, #d946ef) !important;
          color: #ffffff !important;
          box-shadow: 0 16px 34px rgba(56, 189, 248, 0.22);
          border: 1px solid rgba(255, 255, 255, 0.18);
        }

        .send-main-button:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          filter: grayscale(0.2);
        }

        
        /* ==================================================
           FIX VISUAL: chat do Copiloto mais legível
        ================================================== */

        .chat-shell,
        .chat-card,
        .chat-panel,
        .chat-box,
        .memory-panel,
        [class*="chat" i] {
          color: #ffffff;
        }

        .chat-card,
        .chat-panel,
        .memory-panel,
        [class*="chat" i][class*="card" i],
        [class*="chat" i][class*="panel" i] {
          background: rgba(5, 10, 30, 0.92) !important;
          border: 1px solid rgba(125, 211, 252, 0.28) !important;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.32) !important;
        }

        .chat-card h2,
        .chat-card h3,
        .chat-panel h2,
        .chat-panel h3,
        [class*="chat" i] h2,
        [class*="chat" i] h3 {
          font-size: 24px !important;
          line-height: 1.18 !important;
          color: #ffffff !important;
          letter-spacing: -0.03em !important;
        }

        .chat-card p,
        .chat-panel p,
        .memory-panel p,
        [class*="chat" i] p,
        [class*="message" i],
        [class*="bubble" i],
        [class*="msg" i] {
          font-size: 15.5px !important;
          line-height: 1.62 !important;
          color: rgba(255, 255, 255, 0.94) !important;
          text-shadow: none !important;
        }

        [class*="message" i],
        [class*="bubble" i],
        [class*="msg" i],
        [class*="learning" i],
        [class*="memory" i] {
          background: rgba(20, 36, 90, 0.82) !important;
          border: 1px solid rgba(255, 255, 255, 0.16) !important;
          border-radius: 18px !important;
        }

        [class*="message" i] strong,
        [class*="bubble" i] strong,
        [class*="msg" i] strong,
        [class*="chat" i] strong {
          color: #7dd3fc !important;
          font-size: 13px !important;
          letter-spacing: 0.08em !important;
          text-transform: uppercase !important;
        }

        [class*="messages" i],
        [class*="conversation" i],
        [class*="chat-log" i],
        [class*="history" i] {
          max-height: 560px !important;
          overflow-y: auto !important;
          padding-right: 10px !important;
          scroll-behavior: smooth !important;
        }

        [class*="messages" i]::-webkit-scrollbar,
        [class*="conversation" i]::-webkit-scrollbar,
        [class*="chat-log" i]::-webkit-scrollbar,
        [class*="history" i]::-webkit-scrollbar {
          width: 10px;
        }

        [class*="messages" i]::-webkit-scrollbar-thumb,
        [class*="conversation" i]::-webkit-scrollbar-thumb,
        [class*="chat-log" i]::-webkit-scrollbar-thumb,
        [class*="history" i]::-webkit-scrollbar-thumb {
          background: rgba(56, 189, 248, 0.55);
          border-radius: 999px;
        }

        textarea,
        .composer textarea,
        [class*="chat" i] textarea {
          min-height: 118px !important;
          font-size: 16px !important;
          line-height: 1.55 !important;
          color: #ffffff !important;
          background: rgba(3, 7, 18, 0.82) !important;
          border: 1px solid rgba(125, 211, 252, 0.38) !important;
          border-radius: 18px !important;
          padding: 18px !important;
          outline: none !important;
        }

        textarea::placeholder,
        [class*="chat" i] textarea::placeholder {
          color: rgba(255, 255, 255, 0.68) !important;
        }

        .send-main-button {
          min-height: 58px !important;
          font-size: 16px !important;
          font-weight: 950 !important;
          letter-spacing: -0.01em !important;
          color: #ffffff !important;
          opacity: 1 !important;
        }

        .send-main-button:disabled {
          opacity: 0.52 !important;
          color: rgba(255,255,255,0.9) !important;
        }

        @media (max-width: 1280px) {
          [class*="grid" i],
          [class*="layout" i],
          [class*="workspace" i] {
            grid-template-columns: 1fr !important;
          }

          .chat-card,
          .chat-panel,
          .memory-panel,
          [class*="chat" i][class*="card" i],
          [class*="chat" i][class*="panel" i] {
            width: 100% !important;
            max-width: none !important;
          }

          [class*="messages" i],
          [class*="conversation" i],
          [class*="chat-log" i],
          [class*="history" i] {
            max-height: 620px !important;
          }
        }

        @media (max-width: 720px) {
          .chat-card h2,
          .chat-card h3,
          .chat-panel h2,
          .chat-panel h3,
          [class*="chat" i] h2,
          [class*="chat" i] h3 {
            font-size: 21px !important;
          }

          .chat-card p,
          .chat-panel p,
          [class*="chat" i] p,
          [class*="message" i],
          [class*="bubble" i],
          [class*="msg" i] {
            font-size: 15px !important;
          }

          textarea,
          .composer textarea,
          [class*="chat" i] textarea {
            min-height: 105px !important;
          }
        }

        @media (max-width: 1180px) {
          .layout {
            grid-template-columns: 1fr;
          }

          .chat {
            position: relative;
            top: 0;
            max-height: none;
          }
        }

        @media (max-width: 760px) {
          .copilot-shell {
            padding: 18px;
          }

          .hero {
            flex-direction: column;
          }

          .metrics {
            grid-template-columns: repeat(2, 1fr);
          }

          .lanes {
            grid-template-columns: repeat(5, 82vw);
          }
        }
      `}</style>
    </main>
  );
}
