"use client";

import { useEffect, useMemo, useState } from "react";
import UserAccessAgentPanel from "@/components/studio/UserAccessAgentPanel";

type Status = "ok" | "warn" | "danger" | "info";

type Check = {
  title: string;
  status: Status;
  detail: string;
  fix?: string;
};

type ChecklistGroup = {
  group: string;
  items: string[];
};

type DiagnosticData = {
  ok: boolean;
  generatedAt: string;
  envInfo: Record<string, any>;
  files: Record<string, boolean>;
  serverNames: string[];
  checks: Check[];
  checklist: ChecklistGroup[];
};

const statusLabel: Record<Status, string> = {
  ok: "OK",
  warn: "Atenção",
  danger: "Crítico",
  info: "Info",
};

export default function UsuariosDiagnosticoPage() {
  const [data, setData] = useState<DiagnosticData | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("sualuma-user-diagnostic-checklist");
    if (saved) {
      try {
        setChecked(JSON.parse(saved));
      } catch {}
    }

    fetch("/api/studio/user-auth-diagnostics", { cache: "no-store" })
      .then((response) => response.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "sualuma-user-diagnostic-checklist",
      JSON.stringify(checked)
    );
  }, [checked]);

  const summary = useMemo(() => {
    const checks = data?.checks || [];
    return {
      ok: checks.filter((check) => check.status === "ok").length,
      warn: checks.filter((check) => check.status === "warn").length,
      danger: checks.filter((check) => check.status === "danger").length,
      info: checks.filter((check) => check.status === "info").length,
    };
  }, [data]);

  function toggle(key: string) {
    setChecked((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  if (loading) {
    return (
      <main className="page">
        <div className="panel">Carregando diagnóstico de usuários...</div>
        <style jsx>{styles}</style>
      </main>
    );
  }

  if (!data?.ok) {
    return (
      <main className="page">
        <div className="panel danger">Não foi possível carregar o diagnóstico.</div>
        <style jsx>{styles}</style>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">Sualuma Studio</p>
          <h1>Diagnóstico de Usuários</h1>
          <p>
            Painel para investigar login, confirmação de e-mail, sessão entre
            subdomínios, pacotes IA/Serviços e checklist de correção.
          </p>
        </div>

        <div className="summary">
          <div>
            <strong>{summary.danger}</strong>
            <span>críticos</span>
          </div>
          <div>
            <strong>{summary.warn}</strong>
            <span>alertas</span>
          </div>
          <div>
            <strong>{summary.ok}</strong>
            <span>ok</span>
          </div>
        </div>
      </section>

      <section className="notice">
        <strong>Diagnóstico principal:</strong> seu problema tem cara de sessão
        quebrando entre subdomínios. A pessoa confirma o e-mail, mas quando troca
        de domínio/painel, o sistema não reconhece a sessão.
      </section>

      <UserAccessAgentPanel />

      <section className="grid">
        <article className="card">
          <p className="eyebrow">Ambiente</p>
          <h2>Configurações detectadas</h2>

          <div className="kv">
            {Object.entries(data.envInfo).map(([key, value]) => (
              <div key={key}>
                <span>{key}</span>
                <strong>{String(value ?? "vazio")}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="card">
          <p className="eyebrow">Domínios</p>
          <h2>Subdomínios no Nginx</h2>

          <div className="chips">
            {data.serverNames.length ? (
              data.serverNames.map((name) => <span key={name}>{name}</span>)
            ) : (
              <span>Nenhum domínio encontrado</span>
            )}
          </div>
        </article>
      </section>

      <section className="card">
        <p className="eyebrow">Análise automática</p>
        <h2>Problemas encontrados</h2>

        <div className="checks">
          {data.checks.map((check, index) => (
            <div className={`check ${check.status}`} key={`${check.title}-${index}`}>
              <div className="checkTop">
                <span className="pill">{statusLabel[check.status]}</span>
                <strong>{check.title}</strong>
              </div>
              <p>{check.detail}</p>
              {check.fix && <small>Como resolver: {check.fix}</small>}
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <p className="eyebrow">Checklist operacional</p>
        <h2>Lista do que precisa ficar redondinho</h2>

        <div className="todoGroups">
          {data.checklist.map((group) => (
            <div className="todoGroup" key={group.group}>
              <h3>{group.group}</h3>

              {group.items.map((item) => {
                const key = `${group.group}:${item}`;
                return (
                  <button
                    type="button"
                    key={key}
                    className={`todo ${checked[key] ? "done" : ""}`}
                    onClick={() => toggle(key)}
                  >
                    <span>{checked[key] ? "✓" : ""}</span>
                    <p>{item}</p>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      <style jsx>{styles}</style>
    </main>
  );
}

const styles = `
  .page {
    min-height: 100vh;
    padding: 32px;
    background:
      radial-gradient(circle at top left, rgba(124, 58, 237, .2), transparent 32%),
      radial-gradient(circle at top right, rgba(56, 189, 248, .16), transparent 30%),
      #060815;
    color: #f8fafc;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .hero {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 20px;
  }

  .hero h1 {
    margin: 8px 0;
    font-size: clamp(34px, 6vw, 68px);
    line-height: .92;
    letter-spacing: -0.07em;
  }

  .hero p {
    max-width: 820px;
    color: #aab4c8;
    font-size: 16px;
  }

  .eyebrow {
    margin: 0;
    color: #38bdf8;
    text-transform: uppercase;
    letter-spacing: .18em;
    font-size: 12px;
    font-weight: 900;
  }

  .summary {
    display: grid;
    grid-template-columns: repeat(3, 120px);
    gap: 12px;
  }

  .summary div,
  .card,
  .panel,
  .notice {
    border: 1px solid rgba(255,255,255,.11);
    background: rgba(13, 16, 36, .78);
    box-shadow: 0 24px 80px rgba(0,0,0,.24);
    backdrop-filter: blur(18px);
  }

  .summary div {
    border-radius: 24px;
    padding: 18px;
  }

  .summary strong {
    display: block;
    font-size: 38px;
    letter-spacing: -0.06em;
  }

  .summary span {
    color: #9ca8bf;
    font-size: 13px;
  }

  .notice {
    padding: 18px;
    border-radius: 22px;
    margin-bottom: 18px;
    color: #dbeafe;
  }

  .grid {
    display: grid;
    grid-template-columns: 1.2fr .8fr;
    gap: 18px;
    margin-bottom: 18px;
  }

  .card,
  .panel {
    border-radius: 28px;
    padding: 22px;
  }

  .card h2 {
    margin: 6px 0 18px;
    letter-spacing: -0.04em;
  }

  .kv {
    display: grid;
    gap: 10px;
  }

  .kv div {
    display: flex;
    justify-content: space-between;
    gap: 14px;
    padding: 12px;
    border-radius: 16px;
    background: rgba(255,255,255,.05);
  }

  .kv span {
    color: #8fa0bb;
    font-size: 12px;
  }

  .kv strong {
    max-width: 60%;
    overflow: hidden;
    text-overflow: ellipsis;
    color: #e5edff;
    font-size: 12px;
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .chips span {
    padding: 9px 12px;
    border-radius: 999px;
    background: rgba(56,189,248,.1);
    border: 1px solid rgba(56,189,248,.22);
    color: #bae6fd;
    font-size: 12px;
    font-weight: 800;
  }

  .checks {
    display: grid;
    gap: 12px;
  }

  .check {
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 20px;
    padding: 16px;
    background: rgba(255,255,255,.045);
  }

  .checkTop {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .check p {
    color: #b8c2d8;
    line-height: 1.5;
  }

  .check small {
    display: block;
    color: #e5edff;
    background: rgba(255,255,255,.05);
    border-radius: 14px;
    padding: 12px;
    line-height: 1.45;
  }

  .pill {
    padding: 6px 9px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 900;
  }

  .ok .pill {
    background: rgba(34,197,94,.16);
    color: #bbf7d0;
  }

  .warn .pill {
    background: rgba(245,158,11,.16);
    color: #fde68a;
  }

  .danger .pill {
    background: rgba(239,68,68,.16);
    color: #fecaca;
  }

  .info .pill {
    background: rgba(56,189,248,.16);
    color: #bae6fd;
  }

  .todoGroups {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
  }

  .todoGroup {
    padding: 16px;
    border-radius: 22px;
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(255,255,255,.08);
  }

  .todoGroup h3 {
    margin: 0 0 12px;
  }

  .todo {
    width: 100%;
    border: 0;
    padding: 12px;
    display: flex;
    gap: 12px;
    align-items: flex-start;
    background: transparent;
    color: #e5edff;
    text-align: left;
    cursor: pointer;
    border-radius: 14px;
  }

  .todo:hover {
    background: rgba(255,255,255,.05);
  }

  .todo span {
    width: 23px;
    height: 23px;
    border-radius: 7px;
    border: 1px solid rgba(255,255,255,.22);
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    color: white;
    font-weight: 900;
  }

  .todo p {
    margin: 0;
    color: #c7d2e8;
    line-height: 1.4;
  }

  .todo.done span {
    border-color: rgba(34,197,94,.4);
    background: rgba(34,197,94,.3);
  }

  .todo.done p {
    text-decoration: line-through;
    color: #7d8aa3;
  }

  @media (max-width: 900px) {
    .page {
      padding: 20px;
    }

    .hero {
      flex-direction: column;
    }

    .summary {
      grid-template-columns: repeat(3, 1fr);
    }

    .grid,
    .todoGroups {
      grid-template-columns: 1fr;
    }
  }
`;
