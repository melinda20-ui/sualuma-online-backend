"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Severity = "alta" | "media" | "baixa" | string;

type CopilotTask = {
  id: string;
  title: string;
  area?: string;
  severity?: Severity;
  status?: string;
  laneId?: string;
  plain_explanation?: string;
  plainExplanation?: string;
  detail?: string;
  proof?: unknown;
  evidence?: unknown;
  source?: string;
};

type CopilotLane = {
  id: string;
  title: string;
  subtitle?: string;
};

type CopilotReport = {
  ok?: boolean;
  name?: string;
  generated_at?: string;
  score?: number;
  summary?: string;
  counts?: {
    total?: number;
    open?: number;
    high?: number;
    medium?: number;
    low?: number;
    validated?: number;
  };
  sections?: { title: string; lines: string[] }[];
  tasks?: CopilotTask[];
  lanes?: CopilotLane[];
  report?: CopilotReport;
};

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

const FALLBACK_LANES: CopilotLane[] = [
  { id: "urgent", title: "Urgente", subtitle: "Precisa resolver antes de receber usuários." },
  { id: "doing", title: "Em execução", subtitle: "Você ou a IA já estão mexendo nisso." },
  { id: "wait", title: "Pode esperar", subtitle: "Importante, mas não trava o lançamento." },
  { id: "review", title: "Verificar", subtitle: "Você mexeu e quer confirmação real." },
  { id: "validated", title: "Concluído", subtitle: "O Copiloto confirmou que resolveu." },
];

function normalizeSeverity(severity?: Severity) {
  const s = String(severity || "").toLowerCase();
  if (["alta", "high", "critical", "critica", "crítica"].includes(s)) return "alta";
  if (["media", "média", "medium", "moderate"].includes(s)) return "media";
  if (["baixa", "low"].includes(s)) return "baixa";
  return s || "media";
}

function getTaskLane(task: CopilotTask) {
  const raw = String(task.laneId || task.status || "").toLowerCase();

  if (["validated", "done", "concluido", "concluído", "ativado", "concluído e ativado"].includes(raw)) return "validated";
  if (["review", "verificar", "checking", "check"].includes(raw)) return "review";
  if (["doing", "andamento", "em andamento", "executando", "em execução"].includes(raw)) return "doing";
  if (["wait", "esperar", "pode esperar", "later"].includes(raw)) return "wait";
  if (["urgent", "todo", "pendente", "alta", "high"].includes(raw)) return "urgent";

  const sev = normalizeSeverity(task.severity);
  if (sev === "alta") return "urgent";
  return "wait";
}

function safeText(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function shortDate(value?: string) {
  if (!value) return "Ainda não carregou";
  try {
    const d = new Date(value);
    return d.toLocaleString("pt-BR");
  } catch {
    return value;
  }
}

export default function CopilotCommandCenter() {
  const [report, setReport] = useState<CopilotReport | null>(null);
  const [tasks, setTasks] = useState<CopilotTask[]>([]);
  const [lanes, setLanes] = useState<CopilotLane[]>(FALLBACK_LANES);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [chat, setChat] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Oi, Luma. Eu sou o Copiloto de Lançamento. Posso explicar o relatório, organizar o Kanban, criar categorias e te ajudar a decidir o que resolve primeiro.",
    },
  ]);

  async function loadReport() {
    try {
      setLoading(true);

      const urls = [
        "/api/estudio-lab/copilot-action",
        "/api/studio-lab/copilot-action",
        "/api/estudio-lab/copilot",
        "/api/studio-lab/copilot",
      ];

      let json: CopilotReport | null = null;

      for (const url of urls) {
        try {
          const res = await fetch(url, { cache: "no-store" });
          if (!res.ok) continue;
          json = await res.json();
          break;
        } catch {
          continue;
        }
      }

      if (!json) throw new Error("Não consegui carregar relatório.");

      const root = json.report || json;
      setReport(root);

      const nextTasks = Array.isArray(json.tasks)
        ? json.tasks
        : Array.isArray(root.tasks)
        ? root.tasks
        : [];

      const nextLanes = Array.isArray(json.lanes)
        ? json.lanes
        : Array.isArray(root.lanes)
        ? root.lanes
        : FALLBACK_LANES;

      setTasks(nextTasks);
      setLanes(nextLanes.length ? nextLanes : FALLBACK_LANES);
    } catch (error) {
      setChat((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Não consegui carregar o relatório agora. O layout abriu, mas a API do Copiloto não respondeu corretamente.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function refreshAudit() {
    setRefreshing(true);
    try {
      await fetch("/api/estudio-lab/copilot-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "refresh" }),
      }).catch(() => null);

      await loadReport();
    } finally {
      setRefreshing(false);
    }
  }

  async function sendToCopilot(customMessage?: string) {
    const text = (customMessage || message).trim();
    if (!text) return;

    setSending(true);
    setChatOpen(true);

    if (!customMessage) setMessage("");

    setChat((prev) => [...prev, { role: "user", content: text }]);

    try {
      const res = await fetch("/api/estudio-lab/copilot-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, content: text }),
      });

      const json = await res.json();
      const answer =
        json.answer ||
        json.message ||
        json.response ||
        "Recebi o comando. Vou atualizar o Kanban com base nisso.";

      setChat((prev) => [...prev, { role: "assistant", content: answer }]);

      await loadReport();
    } catch {
      setChat((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Tentei falar com a API do chat, mas ela não respondeu. O comando ficou visível aqui, mas pode não ter sido salvo.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  function submitChat(event: FormEvent) {
    event.preventDefault();
    sendToCopilot();
  }

  function quickCommand(task: CopilotTask, action: string) {
    if (action === "doing") {
      sendToCopilot(`Mover a tarefa "${task.title}" para "Em execução" no Kanban.`);
      return;
    }

    if (action === "review") {
      sendToCopilot(`Verificar se a tarefa "${task.title}" já foi resolvida de verdade. Se resolveu, marque como concluído. Se não resolveu, volte para em execução e me explique o que falta.`);
      return;
    }

    if (action === "urgent") {
      sendToCopilot(`Mover a tarefa "${task.title}" para "Urgente" e explicar por que ela trava ou não trava o lançamento.`);
      return;
    }
  }

  const score = report?.score ?? 0;
  const generatedAt = report?.generated_at;
  const summary = report?.summary || "Carregando leitura do Copiloto...";

  const groupedTasks = useMemo(() => {
    const map: Record<string, CopilotTask[]> = {};
    lanes.forEach((lane) => {
      map[lane.id] = [];
    });

    tasks.forEach((task) => {
      const lane = getTaskLane(task);
      if (!map[lane]) map[lane] = [];
      map[lane].push(task);
    });

    return map;
  }, [lanes, tasks]);

  const urgentCount = groupedTasks.urgent?.length || 0;
  const reviewCount = groupedTasks.review?.length || 0;
  const doneCount = groupedTasks.validated?.length || 0;

  useEffect(() => {
    loadReport();
  }, []);

  return (
    <main className="war-page">
      <section className="hero">
        <div>
          <p className="eyebrow">Studio Sualuma • Copiloto de Lançamento</p>
          <h1>Central de lançamento</h1>
          <p className="hero-text">
            O Kanban ocupa a tela principal. O chat fica em uma gaveta lateral para você conversar, pedir mudanças e manter o raciocínio salvo.
          </p>
        </div>

        <div className="score-card">
          <span>Score</span>
          <strong>{loading ? "--" : score}/100</strong>
          <p>{summary}</p>
        </div>
      </section>

      <section className="toolbar">
        <div className="status-pill">
          <span className="dot" />
          Última leitura: {shortDate(generatedAt)}
        </div>

        <div className="toolbar-actions">
          <button type="button" onClick={refreshAudit} disabled={refreshing}>
            {refreshing ? "Atualizando..." : "Atualizar auditoria"}
          </button>

          <button type="button" className="chat-button" onClick={() => setChatOpen(true)}>
            Abrir chat com memória
          </button>
        </div>
      </section>

      <section className="metrics">
        <div>
          <span>Total</span>
          <strong>{tasks.length}</strong>
          <p>Tarefas mapeadas</p>
        </div>
        <div>
          <span>Urgente</span>
          <strong>{urgentCount}</strong>
          <p>Antes de receber usuários</p>
        </div>
        <div>
          <span>Verificar</span>
          <strong>{reviewCount}</strong>
          <p>Você mexeu e quer confirmação</p>
        </div>
        <div>
          <span>Concluído</span>
          <strong>{doneCount}</strong>
          <p>Validado pelo Copiloto</p>
        </div>
      </section>

      <section className="command-hint">
        <div>
          <strong>Como usar agora</strong>
          <p>
            Abra o chat e peça em linguagem natural: “cria uma categoria chamada Pós-lançamento”, “move Stripe para urgente”,
            “verifica a tarefa de usuários”, ou “me explica o que impede o lançamento”.
          </p>
        </div>
        <button type="button" onClick={() => setChatOpen(true)}>Conversar com o Copiloto</button>
      </section>

      <section className="kanban-shell">
        <div className="section-head">
          <div>
            <p className="eyebrow">Kanban operacional</p>
            <h2>O que falta para lançar com segurança</h2>
          </div>
          <button type="button" onClick={loadReport}>Recarregar dados</button>
        </div>

        {loading ? (
          <div className="loading-box">Carregando relatório inteligente...</div>
        ) : (
          <div className="kanban-track">
            {lanes.map((lane) => {
              const list = groupedTasks[lane.id] || [];

              return (
                <div className="lane" key={lane.id}>
                  <div className="lane-head">
                    <div>
                      <h3>{lane.title}</h3>
                      {lane.subtitle && <p>{lane.subtitle}</p>}
                    </div>
                    <span>{list.length}</span>
                  </div>

                  <div className="cards">
                    {list.length === 0 ? (
                      <div className="empty-card">Nada aqui agora.</div>
                    ) : (
                      list.map((task) => {
                        const severity = normalizeSeverity(task.severity);
                        const explanation =
                          task.plain_explanation ||
                          task.plainExplanation ||
                          task.detail ||
                          "Sem explicação detalhada ainda.";

                        const proof = safeText(task.proof || task.evidence || task.source);

                        return (
                          <article className="task-card" key={task.id}>
                            <div className="tags">
                              <span className={`severity ${severity}`}>{severity}</span>
                              <span>{task.area || "Sistema"}</span>
                            </div>

                            <h4>{task.title}</h4>
                            <p>{explanation}</p>

                            {proof && (
                              <details>
                                <summary>Prova encontrada</summary>
                                <pre>{proof}</pre>
                              </details>
                            )}

                            <div className="card-actions">
                              <button type="button" onClick={() => quickCommand(task, "doing")}>Executando</button>
                              <button type="button" onClick={() => quickCommand(task, "review")}>Verificar</button>
                              <button type="button" onClick={() => quickCommand(task, "urgent")}>Urgente</button>
                            </div>
                          </article>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <button type="button" className="floating-chat" onClick={() => setChatOpen(true)}>
        💬 Copiloto
      </button>

      {chatOpen && (
        <div className="chat-overlay">
          <button type="button" className="overlay-bg" onClick={() => setChatOpen(false)} aria-label="Fechar chat" />

          <aside className="chat-drawer">
            <header>
              <div>
                <p className="eyebrow">Chat com memória</p>
                <h2>Fale com o Copiloto</h2>
              </div>
              <button type="button" onClick={() => setChatOpen(false)}>Fechar</button>
            </header>

            <div className="memory-box">
              <strong>Aprendizado salvo</strong>
              <p>
                Continuar o raciocínio da última conversa e operar o Kanban quando você pedir.
              </p>
            </div>

            <div className="chat-messages">
              {chat.map((item, index) => (
                <div className={`bubble ${item.role}`} key={`${item.role}-${index}`}>
                  <span>{item.role === "user" ? "Você" : "Copiloto"}</span>
                  <p>{item.content}</p>
                </div>
              ))}
            </div>

            <form className="composer" onSubmit={submitChat}>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder='Ex: "organiza tudo por urgente, pode esperar e em execução"'
                rows={3}
              />

              <button type="submit" disabled={sending || !message.trim()}>
                {sending ? "Enviando..." : "Enviar"}
              </button>
            </form>
          </aside>
        </div>
      )}

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .war-page {
          min-height: 100vh;
          padding: 28px;
          color: #ffffff;
          background:
            radial-gradient(circle at top left, rgba(56, 189, 248, 0.28), transparent 34%),
            radial-gradient(circle at top right, rgba(168, 85, 247, 0.28), transparent 36%),
            linear-gradient(135deg, #060919 0%, #0a102c 48%, #11104a 100%);
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .hero {
          display: grid;
          grid-template-columns: 1fr 260px;
          gap: 20px;
          align-items: stretch;
          margin-bottom: 18px;
        }

        .eyebrow {
          margin: 0 0 8px;
          color: #67e8f9;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        h1,
        h2,
        h3,
        h4,
        p {
          margin: 0;
        }

        h1 {
          font-size: clamp(34px, 4vw, 64px);
          line-height: 0.95;
          letter-spacing: -0.06em;
        }

        .hero-text {
          max-width: 760px;
          margin-top: 14px;
          color: rgba(255, 255, 255, 0.72);
          font-size: 16px;
          line-height: 1.55;
        }

        .score-card,
        .metrics div,
        .command-hint,
        .kanban-shell,
        .chat-drawer,
        .task-card,
        .lane,
        .memory-box {
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.07);
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.22);
          backdrop-filter: blur(18px);
        }

        .score-card {
          padding: 22px;
          border-radius: 26px;
        }

        .score-card span,
        .metrics span {
          display: block;
          color: rgba(255, 255, 255, 0.66);
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .score-card strong {
          display: block;
          margin: 8px 0;
          font-size: 42px;
          line-height: 1;
        }

        .score-card p {
          color: rgba(255, 255, 255, 0.72);
          font-size: 13px;
          line-height: 1.45;
        }

        .toolbar {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: center;
          margin-bottom: 16px;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.78);
          font-size: 13px;
        }

        .dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: #22c55e;
          box-shadow: 0 0 18px rgba(34, 197, 94, 0.75);
        }

        .toolbar-actions {
          display: flex;
          gap: 10px;
        }

        button {
          border: 0;
          cursor: pointer;
          border-radius: 999px;
          padding: 12px 16px;
          color: #050816;
          background: linear-gradient(135deg, #67e8f9, #a78bfa);
          font-weight: 900;
          transition: transform 0.18s ease, opacity 0.18s ease;
        }

        button:hover {
          transform: translateY(-1px);
        }

        button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          transform: none;
        }

        .chat-button {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.18);
        }

        .metrics {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 16px;
        }

        .metrics div {
          border-radius: 22px;
          padding: 18px;
        }

        .metrics strong {
          display: block;
          margin: 8px 0 4px;
          font-size: 34px;
          line-height: 1;
        }

        .metrics p {
          color: rgba(255, 255, 255, 0.62);
          font-size: 12px;
        }

        .command-hint {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: center;
          margin-bottom: 18px;
          padding: 18px;
          border-radius: 24px;
        }

        .command-hint strong {
          display: block;
          margin-bottom: 6px;
          font-size: 16px;
        }

        .command-hint p {
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.45;
          font-size: 14px;
        }

        .kanban-shell {
          border-radius: 28px;
          overflow: hidden;
        }

        .section-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          padding: 18px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .section-head h2 {
          font-size: 24px;
          letter-spacing: -0.04em;
        }

        .loading-box {
          padding: 38px;
          color: rgba(255, 255, 255, 0.75);
        }

        .kanban-track {
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: minmax(285px, 1fr);
          gap: 14px;
          overflow-x: auto;
          padding: 18px;
          min-height: 430px;
        }

        .lane {
          border-radius: 22px;
          padding: 14px;
          min-width: 285px;
          background: rgba(5, 9, 32, 0.44);
        }

        .lane-head {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: flex-start;
          padding: 4px 4px 14px;
        }

        .lane-head h3 {
          font-size: 15px;
        }

        .lane-head p {
          margin-top: 4px;
          color: rgba(255, 255, 255, 0.52);
          font-size: 11px;
          line-height: 1.35;
        }

        .lane-head span {
          display: grid;
          place-items: center;
          min-width: 28px;
          height: 28px;
          border-radius: 999px;
          background: rgba(103, 232, 249, 0.18);
          color: #67e8f9;
          font-weight: 900;
        }

        .cards {
          display: grid;
          gap: 12px;
        }

        .task-card {
          padding: 14px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.085);
        }

        .tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 10px;
        }

        .tags span {
          padding: 6px 8px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.82);
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .severity.alta {
          background: rgba(248, 113, 113, 0.18);
          color: #fecaca;
        }

        .severity.media {
          background: rgba(251, 191, 36, 0.18);
          color: #fde68a;
        }

        .severity.baixa {
          background: rgba(34, 197, 94, 0.18);
          color: #bbf7d0;
        }

        .task-card h4 {
          margin-bottom: 8px;
          font-size: 15px;
          line-height: 1.25;
        }

        .task-card p {
          color: rgba(255, 255, 255, 0.68);
          font-size: 13px;
          line-height: 1.45;
        }

        details {
          margin-top: 10px;
          color: rgba(255, 255, 255, 0.65);
          font-size: 12px;
        }

        summary {
          cursor: pointer;
          font-weight: 800;
          color: #67e8f9;
        }

        pre {
          max-height: 120px;
          overflow: auto;
          white-space: pre-wrap;
          margin: 8px 0 0;
          padding: 10px;
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.25);
          font-size: 11px;
          line-height: 1.35;
        }

        .card-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }

        .card-actions button {
          padding: 8px 10px;
          font-size: 11px;
          color: #ffffff;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        .empty-card {
          padding: 18px;
          border-radius: 16px;
          color: rgba(255, 255, 255, 0.48);
          border: 1px dashed rgba(255, 255, 255, 0.16);
          text-align: center;
          font-size: 13px;
        }

        .floating-chat {
          position: fixed;
          right: 22px;
          bottom: 22px;
          z-index: 30;
          padding: 15px 18px;
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35);
        }

        .chat-overlay {
          position: fixed;
          inset: 0;
          z-index: 50;
          display: flex;
          justify-content: flex-end;
        }

        .overlay-bg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border-radius: 0;
          background: rgba(0, 0, 0, 0.42);
        }

        .chat-drawer {
          position: relative;
          z-index: 2;
          width: min(560px, calc(100vw - 24px));
          height: calc(100vh - 24px);
          margin: 12px;
          border-radius: 28px;
          overflow: hidden;
          display: grid;
          grid-template-rows: auto auto 1fr auto;
          background:
            radial-gradient(circle at top left, rgba(56, 189, 248, 0.18), transparent 42%),
            linear-gradient(180deg, rgba(12, 16, 46, 0.96), rgba(8, 10, 26, 0.98));
        }

        .chat-drawer header {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .chat-drawer h2 {
          font-size: 26px;
          letter-spacing: -0.04em;
        }

        .chat-drawer header button {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.11);
          border: 1px solid rgba(255, 255, 255, 0.14);
        }

        .memory-box {
          margin: 16px 16px 0;
          padding: 16px;
          border-radius: 20px;
          background: rgba(56, 189, 248, 0.1);
        }

        .memory-box strong {
          display: block;
          margin-bottom: 6px;
          color: #67e8f9;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .memory-box p {
          color: rgba(255, 255, 255, 0.76);
          font-size: 14px;
          line-height: 1.45;
        }

        .chat-messages {
          overflow: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .bubble {
          max-width: 92%;
          padding: 14px 15px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .bubble.user {
          align-self: flex-end;
          background: rgba(103, 232, 249, 0.14);
        }

        .bubble.assistant {
          align-self: flex-start;
          background: rgba(167, 139, 250, 0.14);
        }

        .bubble span {
          display: block;
          margin-bottom: 6px;
          color: #67e8f9;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .bubble p {
          white-space: pre-wrap;
          color: rgba(255, 255, 255, 0.86);
          font-size: 14px;
          line-height: 1.5;
        }

        .composer {
          padding: 14px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(5, 9, 32, 0.72);
        }

        .composer textarea {
          width: 100%;
          height: 86px;
          resize: vertical;
          border: 1px solid rgba(255, 255, 255, 0.16);
          outline: none;
          border-radius: 18px;
          padding: 14px;
          color: #ffffff;
          background: rgba(255, 255, 255, 0.08);
          font: inherit;
          font-size: 14px;
          line-height: 1.45;
        }

        .composer textarea::placeholder {
          color: rgba(255, 255, 255, 0.45);
        }

        .composer button {
          width: 100%;
          margin-top: 10px;
          height: 48px;
        }

        @media (max-width: 980px) {
          .war-page {
            padding: 18px;
          }

          .hero {
            grid-template-columns: 1fr;
          }

          .metrics {
            grid-template-columns: repeat(2, 1fr);
          }

          .toolbar,
          .command-hint {
            flex-direction: column;
            align-items: stretch;
          }

          .toolbar-actions {
            flex-direction: column;
          }

          .kanban-track {
            grid-auto-columns: minmax(270px, 82vw);
          }
        }

        @media (max-width: 620px) {
          .metrics {
            grid-template-columns: 1fr;
          }

          .chat-drawer {
            width: calc(100vw - 12px);
            height: calc(100vh - 12px);
            margin: 6px;
            border-radius: 22px;
          }
        }
      `}</style>
    </main>
  );
}
