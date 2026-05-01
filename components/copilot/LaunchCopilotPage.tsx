"use client";

import { useEffect, useMemo, useState } from "react";
import CopilotChatBox from "@/components/copilot/CopilotChatBox";

type Status = "todo" | "doing" | "ready" | "validated";

type Task = {
  id: string;
  title: string;
  area: string;
  severity: "alta" | "media" | "baixa";
  plain_explanation: string;
  technical_detail: string;
  evidence: string;
  impact: string;
  next_action: string;
  verify_hint: string;
  status: Status;
  resolved?: boolean;
  verification_message?: string;
  last_checked_at?: string;
};

type Report = {
  ok: boolean;
  name: string;
  generated_at: string;
  score: number;
  summary: string;
  counts: {
    total: number;
    open: number;
    high: number;
    medium: number;
    low: number;
    validated: number;
  };
  sections: { title: string; lines: string[] }[];
  tasks: Task[];
};

const columns: { id: Status; title: string; help: string }[] = [
  { id: "todo", title: "A fazer", help: "Problemas encontrados pelo copiloto." },
  { id: "doing", title: "Em andamento", help: "Itens que ainda precisam de correção." },
  { id: "ready", title: "Verificar", help: "Você marcou como resolvido. Agora o copiloto testa." },
  { id: "validated", title: "Concluído e ativado", help: "O copiloto validou que não encontrou mais o problema." },
];

function severityLabel(s: string) {
  if (s === "alta") return "Grave";
  if (s === "media") return "Atenção";
  return "Baixa";
}

function severityClass(s: string) {
  if (s === "alta") return "sev high";
  if (s === "media") return "sev mid";
  return "sev low";
}

export default function LaunchCopilotPage() {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string>("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/estudio-lab/copilot", { cache: "no-store" });
    const json = await res.json();
    setReport(json);
    setLoading(false);
  }

  async function action(payload: any, label = "Atualizando...") {
    setBusy(label);
    const res = await fetch("/api/estudio-lab/copilot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setReport(json);
    setBusy("");
  }

  useEffect(() => {
    load();
  }, []);

  const tasksByColumn = useMemo(() => {
    const base: Record<Status, Task[]> = {
      todo: [],
      doing: [],
      ready: [],
      validated: [],
    };

    for (const task of report?.tasks || []) {
      const status = task.status || "todo";
      base[status]?.push(task);
    }

    return base;
  }, [report]);

  return (
    <main className="copilot-page">
      <section className="hero">
        <div>
          <p className="eyebrow">Sualuma Launch Auditor</p>
          <h1>Copiloto de Lançamento</h1>
          <p className="subtitle">
            Auditor inteligente que olha servidor, banco, usuários, dashboards, Supabase, Stripe, rotas e segurança antes do lançamento.
          </p>
        </div>

        <div className="score-card">
          <span>Score do sistema</span>
          <strong>{report?.score ?? "--"}/100</strong>
          <small>{report?.summary || "Carregando auditoria..."}</small>
        </div>
      </section>

      <section className="actions">
        <button onClick={() => action({ action: "refresh" }, "Rodando auditoria...")} disabled={!!busy}>
          {busy || "Rodar auditoria agora"}
        </button>
        <button onClick={load} disabled={loading || !!busy}>
          Recarregar painel
        </button>
        <span>
          Última análise: {report?.generated_at ? new Date(report.generated_at).toLocaleString("pt-BR") : "ainda não carregou"}
        </span>
      </section>

      {loading && <div className="loading">Carregando copiloto...</div>}

      {!loading && report && (
        <>
          <section className="cards">
            <div className="mini-card">
              <span>Tarefas abertas</span>
              <strong>{report.counts?.open ?? 0}</strong>
              <small>O que ainda precisa atenção.</small>
            </div>
            <div className="mini-card">
              <span>Graves</span>
              <strong>{report.counts?.high ?? 0}</strong>
              <small>Podem travar lançamento.</small>
            </div>
            <div className="mini-card">
              <span>Validadas</span>
              <strong>{report.counts?.validated ?? 0}</strong>
              <small>O copiloto já confirmou.</small>
            </div>
          </section>

          <section className="explain">
            {(report.sections || []).map((section) => (
              <div key={section.title}>
                <h2>{section.title}</h2>
                {section.lines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            ))}
          </section>

          <section className="kanban">
            {columns.map((column) => (
              <div className="column" key={column.id}>
                <div className="column-head">
                  <h2>{column.title}</h2>
                  <span>{tasksByColumn[column.id].length}</span>
                </div>
                <p className="column-help">{column.help}</p>

                <div className="task-list">
                  {tasksByColumn[column.id].map((task) => (
                    <article className="task" key={task.id}>
                      <div className="task-top">
                        <span className={severityClass(task.severity)}>{severityLabel(task.severity)}</span>
                        <span className="area">{task.area}</span>
                      </div>

                      <h3>{task.title}</h3>

                      <div className="block">
                        <strong>O que significa:</strong>
                        <p>{task.plain_explanation}</p>
                      </div>

                      <div className="block">
                        <strong>Impacto:</strong>
                        <p>{task.impact}</p>
                      </div>

                      <div className="block">
                        <strong>O que fazer agora:</strong>
                        <p>{task.next_action}</p>
                      </div>

                      {task.evidence && (
                        <details>
                          <summary>Ver prova encontrada</summary>
                          <pre>{task.evidence}</pre>
                        </details>
                      )}

                      {task.technical_detail && (
                        <details>
                          <summary>Detalhe técnico</summary>
                          <pre>{task.technical_detail}</pre>
                        </details>
                      )}

                      {task.verification_message && (
                        <div className={task.status === "validated" ? "verification ok" : "verification bad"}>
                          {task.verification_message}
                        </div>
                      )}

                      <div className="task-actions">
                        {task.status === "todo" && (
                          <button onClick={() => action({ action: "move", id: task.id, status: "doing" }, "Movendo...")}>
                            Começar
                          </button>
                        )}

                        {task.status === "doing" && (
                          <button onClick={() => action({ action: "move", id: task.id, status: "ready" }, "Marcando...")}>
                            Marcar como finalizado
                          </button>
                        )}

                        {task.status === "ready" && (
                          <button className="verify" onClick={() => action({ action: "verify", id: task.id }, "Verificando de verdade...")}>
                            Verificar agora
                          </button>
                        )}

                        {task.status !== "validated" && task.status !== "ready" && (
                          <button className="ghost" onClick={() => action({ action: "verify", id: task.id }, "Verificando de verdade...")}>
                            Verificar mesmo assim
                          </button>
                        )}

                        {task.status === "validated" && <span className="done">Validado</span>}
                      </div>
                    </article>
                  ))}

                  {tasksByColumn[column.id].length === 0 && (
                    <div className="empty">Nada aqui por enquanto.</div>
                  )}
                </div>
              </div>
            ))}
          </section>
        </>
      )}

      <style jsx>{`
        .copilot-page {
          min-height: 100vh;
          padding: 32px;
          background:
            radial-gradient(circle at top left, rgba(124, 58, 237, .22), transparent 34%),
            radial-gradient(circle at top right, rgba(56, 189, 248, .18), transparent 28%),
            #070812;
          color: #fff;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .hero {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 280px;
          gap: 24px;
          align-items: stretch;
          margin-bottom: 22px;
        }

        .eyebrow {
          color: #38bdf8;
          text-transform: uppercase;
          letter-spacing: .14em;
          font-size: 12px;
          font-weight: 800;
          margin: 0 0 10px;
        }

        h1 {
          font-size: clamp(32px, 5vw, 62px);
          line-height: .92;
          margin: 0;
          letter-spacing: -0.06em;
        }

        .subtitle {
          max-width: 780px;
          color: rgba(255,255,255,.68);
          line-height: 1.6;
          margin-top: 16px;
        }

        .score-card,
        .mini-card,
        .explain,
        .column,
        .task {
          background: rgba(255,255,255,.07);
          border: 1px solid rgba(255,255,255,.12);
          box-shadow: 0 22px 80px rgba(0,0,0,.24);
          backdrop-filter: blur(16px);
          border-radius: 24px;
        }

        .score-card {
          padding: 22px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .score-card span,
        .mini-card span {
          color: rgba(255,255,255,.55);
          font-size: 13px;
        }

        .score-card strong {
          font-size: 48px;
          margin: 8px 0;
        }

        .score-card small,
        .mini-card small,
        .column-help {
          color: rgba(255,255,255,.58);
          line-height: 1.45;
        }

        .actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          align-items: center;
          margin-bottom: 22px;
        }

        button {
          border: 0;
          border-radius: 999px;
          padding: 11px 16px;
          font-weight: 800;
          color: #050816;
          background: linear-gradient(135deg, #38bdf8, #c084fc);
          cursor: pointer;
        }

        button:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        button.ghost {
          background: rgba(255,255,255,.09);
          color: #fff;
          border: 1px solid rgba(255,255,255,.14);
        }

        button.verify {
          background: linear-gradient(135deg, #22c55e, #38bdf8);
        }

        .actions span {
          color: rgba(255,255,255,.58);
          font-size: 13px;
        }

        .loading {
          padding: 24px;
          border-radius: 18px;
          background: rgba(255,255,255,.08);
        }

        .cards {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 18px;
        }

        .mini-card {
          padding: 18px;
        }

        .mini-card strong {
          display: block;
          font-size: 34px;
          margin: 4px 0;
        }

        .explain {
          padding: 20px;
          margin-bottom: 20px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .explain h2 {
          margin: 0 0 8px;
        }

        .explain p {
          color: rgba(255,255,255,.65);
          line-height: 1.5;
          margin: 6px 0;
        }

        .kanban {
          display: grid;
          grid-template-columns: repeat(4, minmax(280px, 1fr));
          gap: 16px;
          align-items: start;
          overflow-x: auto;
          padding-bottom: 20px;
        }

        .column {
          padding: 14px;
          min-height: 340px;
        }

        .column-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .column h2 {
          font-size: 18px;
          margin: 0;
        }

        .column-head span {
          width: 32px;
          height: 32px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: rgba(255,255,255,.11);
          color: #38bdf8;
          font-weight: 900;
        }

        .task-list {
          display: grid;
          gap: 12px;
          margin-top: 14px;
        }

        .task {
          padding: 16px;
          border-radius: 20px;
        }

        .task-top {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: center;
          margin-bottom: 10px;
        }

        .sev,
        .area {
          font-size: 11px;
          border-radius: 999px;
          padding: 6px 9px;
          font-weight: 900;
        }

        .sev.high {
          background: rgba(248, 113, 113, .18);
          color: #fca5a5;
        }

        .sev.mid {
          background: rgba(250, 204, 21, .18);
          color: #fde68a;
        }

        .sev.low {
          background: rgba(34, 197, 94, .18);
          color: #86efac;
        }

        .area {
          color: rgba(255,255,255,.6);
          background: rgba(255,255,255,.08);
        }

        .task h3 {
          font-size: 16px;
          line-height: 1.25;
          margin: 0 0 12px;
        }

        .block {
          margin: 10px 0;
        }

        .block strong {
          color: #fff;
          font-size: 13px;
        }

        .block p {
          color: rgba(255,255,255,.64);
          font-size: 13px;
          line-height: 1.45;
          margin: 4px 0 0;
        }

        details {
          margin-top: 10px;
          border-radius: 14px;
          background: rgba(0,0,0,.22);
          padding: 10px;
        }

        summary {
          cursor: pointer;
          color: #93c5fd;
          font-size: 13px;
          font-weight: 800;
        }

        pre {
          white-space: pre-wrap;
          word-break: break-word;
          color: rgba(255,255,255,.72);
          font-size: 12px;
          line-height: 1.45;
        }

        .verification {
          margin-top: 12px;
          padding: 10px;
          border-radius: 14px;
          font-size: 13px;
          line-height: 1.45;
        }

        .verification.ok {
          background: rgba(34,197,94,.14);
          color: #bbf7d0;
        }

        .verification.bad {
          background: rgba(250,204,21,.14);
          color: #fde68a;
        }

        .task-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
          margin-top: 14px;
        }

        .done {
          color: #86efac;
          font-weight: 900;
        }

        .empty {
          color: rgba(255,255,255,.45);
          font-size: 13px;
          padding: 18px;
          border-radius: 18px;
          background: rgba(255,255,255,.05);
        }

        @media (max-width: 900px) {
          .copilot-page {
            padding: 18px;
          }

          .hero,
          .cards,
          .explain {
            grid-template-columns: 1fr;
          }

          .kanban {
            grid-template-columns: 1fr;
            overflow-x: visible;
          }
        }
      `}</style>
    
      <CopilotChatBox />
</main>
  );
}