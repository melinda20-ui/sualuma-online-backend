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
  ok: "Resolvido",
  warn: "Atenção",
  danger: "Crítico",
  info: "Info",
};

const statusTone: Record<Status, string> = {
  ok: "Tudo certo",
  warn: "Precisa revisar",
  danger: "Resolver primeiro",
  info: "Monitorar",
};

function shortValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "vazio";
  if (typeof value === "boolean") return value ? "sim" : "não";
  return String(value);
}

function formatDate(value?: string) {
  if (!value) return "agora";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function UsuariosDiagnosticoPage() {
  const [data, setData] = useState<DiagnosticData | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

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
      .catch((error) => {
        setLoadError(error?.message || "Falha ao carregar diagnóstico.");
      })
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
      total: checks.length,
    };
  }, [data]);

  const todoStats = useMemo(() => {
    const total = (data?.checklist || []).reduce(
      (sum, group) => sum + group.items.length,
      0
    );

    const done = Object.values(checked).filter(Boolean).length;
    const percent = total ? Math.round((done / total) * 100) : 0;

    return { total, done, percent };
  }, [data, checked]);

  const priorityChecks = useMemo(() => {
    const checks = data?.checks || [];
    return checks
      .filter((check) => check.status === "danger" || check.status === "warn")
      .slice(0, 4);
  }, [data]);

  const envEntries = useMemo(() => {
    return Object.entries(data?.envInfo || {});
  }, [data]);

  const fileEntries = useMemo(() => {
    return Object.entries(data?.files || {});
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
        <section className="loadingCard">
          <div className="loader" />
          <p className="eyebrow">Sualuma Studio</p>
          <h1>Carregando central de usuários...</h1>
          <p>Estou lendo sessão, subdomínios, ambiente e checklist do agente.</p>
        </section>
        <style jsx>{styles}</style>
      </main>
    );
  }

  if (!data?.ok) {
    return (
      <main className="page">
        <section className="loadingCard dangerCard">
          <p className="eyebrow">Erro</p>
          <h1>Não foi possível carregar o diagnóstico.</h1>
          <p>{loadError || "A API de diagnóstico não respondeu como esperado."}</p>
        </section>
        <style jsx>{styles}</style>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">Sualuma Studio</p>
            <h1>Central de Usuários</h1>
            <p className="subtitle">
              Painel de comando para login, sessão, pacotes, subdomínios,
              permissões e alertas do agente.
            </p>
          </div>

          <div className="topActions">
            <a href="/studio">Studio</a>
            <a href="/admin">Admin</a>
            <a href="/studio/usuarios">Usuários</a>
          </div>
        </header>

        <section className="heroGrid">
          <article className="heroCard mainHero">
            <div className="heroGlow" />
            <p className="eyebrow">Diagnóstico principal</p>
            <h2>Sessão entre subdomínios é o ponto que merece atenção.</h2>
            <p>
              Se a pessoa confirma e-mail, entra no painel e depois troca para
              outro subdomínio, o sistema precisa reconhecer a mesma sessão. Essa
              tela mostra onde está saudável e onde precisa ajuste.
            </p>

            <div className="heroMeta">
              <span>Atualizado: {formatDate(data.generatedAt)}</span>
              <span>{data.serverNames.length} subdomínios detectados</span>
            </div>
          </article>

          <article className="scoreCard danger">
            <span>Críticos</span>
            <strong>{summary.danger}</strong>
            <small>Resolver primeiro</small>
          </article>

          <article className="scoreCard warn">
            <span>Alertas</span>
            <strong>{summary.warn}</strong>
            <small>Revisar antes do lançamento</small>
          </article>

          <article className="scoreCard ok">
            <span>Saudáveis</span>
            <strong>{summary.ok}</strong>
            <small>Funcionando</small>
          </article>
        </section>

        <section className="agentWrap">
          <div className="sectionTitle">
            <div>
              <p className="eyebrow">Agente operacional</p>
              <h2>Guardião de usuários e acessos</h2>
            </div>
            <span className="liveBadge">Ativo</span>
          </div>

          <UserAccessAgentPanel />
        </section>

        <section className="commandGrid">
          <article className="card priorityCard">
            <div className="sectionTitle compact">
              <div>
                <p className="eyebrow">Prioridade</p>
                <h2>Fila do que mexer primeiro</h2>
              </div>
              <span className="counter">{priorityChecks.length}</span>
            </div>

            {priorityChecks.length ? (
              <div className="priorityList">
                {priorityChecks.map((check, index) => (
                  <div className={`priorityItem ${check.status}`} key={check.title}>
                    <div className="priorityIndex">{index + 1}</div>
                    <div>
                      <div className="checkTop">
                        <span className="pill">{statusLabel[check.status]}</span>
                        <strong>{check.title}</strong>
                      </div>
                      <p>{check.detail}</p>
                      {check.fix && <small>{check.fix}</small>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="emptyState">
                Nenhum risco crítico ou alerta principal agora.
              </div>
            )}
          </article>

          <article className="card progressCard">
            <p className="eyebrow">Checklist</p>
            <h2>Progresso operacional</h2>

            <div className="progressCircle">
              <strong>{todoStats.percent}%</strong>
              <span>{todoStats.done}/{todoStats.total} tarefas</span>
            </div>

            <div className="progressBar">
              <i style={{ width: `${todoStats.percent}%` }} />
            </div>

            <p className="muted">
              Marque cada item conforme for resolvendo. Esse progresso fica salvo
              no navegador.
            </p>
          </article>
        </section>

        <section className="card">
          <div className="sectionTitle">
            <div>
              <p className="eyebrow">Análise automática</p>
              <h2>Mapa completo de problemas e confirmações</h2>
            </div>
            <span className="counter">{summary.total}</span>
          </div>

          <div className="checks">
            {data.checks.map((check, index) => (
              <div className={`check ${check.status}`} key={`${check.title}-${index}`}>
                <div className="checkTop">
                  <span className="pill">{statusLabel[check.status]}</span>
                  <strong>{check.title}</strong>
                  <em>{statusTone[check.status]}</em>
                </div>
                <p>{check.detail}</p>
                {check.fix && (
                  <small>
                    <b>Próximo passo:</b> {check.fix}
                  </small>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="twoCols">
          <article className="card">
            <div className="sectionTitle compact">
              <div>
                <p className="eyebrow">Ambiente</p>
                <h2>Configurações detectadas</h2>
              </div>
            </div>

            <div className="kv">
              {envEntries.map(([key, value]) => (
                <div key={key}>
                  <span>{key}</span>
                  <strong>{shortValue(value)}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="card">
            <div className="sectionTitle compact">
              <div>
                <p className="eyebrow">Arquivos</p>
                <h2>Peças encontradas no código</h2>
              </div>
            </div>

            <div className="fileGrid">
              {fileEntries.map(([key, value]) => (
                <div className={value ? "file ok" : "file missing"} key={key}>
                  <span>{value ? "✓" : "!"}</span>
                  <p>{key}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="card">
          <div className="sectionTitle">
            <div>
              <p className="eyebrow">Domínios</p>
              <h2>Subdomínios encontrados no Nginx</h2>
            </div>
            <span className="counter">{data.serverNames.length}</span>
          </div>

          <div className="chips">
            {data.serverNames.length ? (
              data.serverNames.map((name) => <span key={name}>{name}</span>)
            ) : (
              <span>Nenhum domínio encontrado</span>
            )}
          </div>
        </section>

        <section className="card">
          <div className="sectionTitle">
            <div>
              <p className="eyebrow">Checklist operacional</p>
              <h2>Lista prática para deixar usuários redondinho</h2>
            </div>
            <span className="counter">{todoStats.percent}%</span>
          </div>

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
      </section>

      <style jsx>{styles}</style>
    </main>
  );
}

const styles = `
  .page {
    min-height: 100vh;
    padding: 28px;
    background:
      radial-gradient(circle at 8% 0%, rgba(56, 189, 248, .22), transparent 32%),
      radial-gradient(circle at 92% 4%, rgba(168, 85, 247, .24), transparent 30%),
      radial-gradient(circle at 50% 100%, rgba(14, 165, 233, .10), transparent 34%),
      #050716;
    color: #f8fafc;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .shell {
    max-width: 1400px;
    margin: 0 auto;
  }

  .topbar {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;
    margin-bottom: 22px;
  }

  .topbar h1 {
    margin: 6px 0;
    font-size: clamp(38px, 6vw, 76px);
    line-height: .88;
    letter-spacing: -0.08em;
  }

  .subtitle {
    max-width: 820px;
    margin: 0;
    color: #aeb9cf;
    font-size: 16px;
    line-height: 1.6;
  }

  .topActions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .topActions a {
    padding: 11px 14px;
    border-radius: 999px;
    text-decoration: none;
    color: #e0f2fe;
    font-size: 12px;
    font-weight: 900;
    border: 1px solid rgba(255,255,255,.12);
    background: rgba(255,255,255,.07);
  }

  .eyebrow {
    margin: 0;
    color: #38bdf8;
    text-transform: uppercase;
    letter-spacing: .18em;
    font-size: 11px;
    font-weight: 950;
  }

  .heroGrid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 160px 160px 160px;
    gap: 14px;
    margin-bottom: 18px;
  }

  .heroCard,
  .scoreCard,
  .card,
  .loadingCard,
  .agentWrap {
    position: relative;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,.11);
    background: linear-gradient(145deg, rgba(15, 23, 42, .86), rgba(10, 12, 30, .74));
    box-shadow: 0 26px 90px rgba(0,0,0,.32);
    backdrop-filter: blur(18px);
  }

  .mainHero {
    min-height: 260px;
    border-radius: 34px;
    padding: 28px;
  }

  .heroGlow {
    position: absolute;
    width: 260px;
    height: 260px;
    right: -90px;
    top: -90px;
    border-radius: 999px;
    background: radial-gradient(circle, rgba(56,189,248,.24), transparent 67%);
    pointer-events: none;
  }

  .mainHero h2 {
    position: relative;
    max-width: 860px;
    margin: 10px 0 12px;
    font-size: clamp(30px, 4vw, 54px);
    line-height: .96;
    letter-spacing: -0.06em;
  }

  .mainHero p {
    position: relative;
    max-width: 850px;
    color: #b8c5da;
    line-height: 1.65;
    font-size: 15px;
  }

  .heroMeta {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 22px;
  }

  .heroMeta span,
  .liveBadge,
  .counter {
    padding: 9px 12px;
    border-radius: 999px;
    background: rgba(56,189,248,.11);
    border: 1px solid rgba(56,189,248,.18);
    color: #bae6fd;
    font-size: 12px;
    font-weight: 900;
  }

  .scoreCard {
    border-radius: 28px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 160px;
  }

  .scoreCard span {
    color: #9fb0c9;
    font-size: 12px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: .12em;
  }

  .scoreCard strong {
    font-size: 58px;
    line-height: 1;
    letter-spacing: -0.08em;
  }

  .scoreCard small {
    color: #aab7ce;
    line-height: 1.35;
  }

  .scoreCard.danger {
    background: linear-gradient(145deg, rgba(127, 29, 29, .35), rgba(15, 23, 42, .72));
  }

  .scoreCard.warn {
    background: linear-gradient(145deg, rgba(120, 53, 15, .35), rgba(15, 23, 42, .72));
  }

  .scoreCard.ok {
    background: linear-gradient(145deg, rgba(20, 83, 45, .35), rgba(15, 23, 42, .72));
  }

  .agentWrap,
  .card {
    border-radius: 30px;
    padding: 22px;
    margin-bottom: 18px;
  }

  .sectionTitle {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 18px;
    margin-bottom: 18px;
  }

  .sectionTitle.compact {
    margin-bottom: 14px;
  }

  .sectionTitle h2 {
    margin: 5px 0 0;
    font-size: clamp(22px, 3vw, 34px);
    letter-spacing: -0.05em;
    line-height: 1;
  }

  .commandGrid,
  .twoCols {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(320px, .8fr);
    gap: 18px;
  }

  .priorityList {
    display: grid;
    gap: 12px;
  }

  .priorityItem {
    display: grid;
    grid-template-columns: 38px 1fr;
    gap: 12px;
    padding: 15px;
    border-radius: 22px;
    background: rgba(255,255,255,.045);
    border: 1px solid rgba(255,255,255,.08);
  }

  .priorityIndex {
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    border-radius: 14px;
    background: rgba(255,255,255,.08);
    color: #e0f2fe;
    font-weight: 950;
  }

  .priorityItem p,
  .check p,
  .muted {
    color: #aebbd2;
    line-height: 1.58;
    margin: 10px 0;
  }

  .priorityItem small,
  .check small {
    display: block;
    padding: 12px;
    border-radius: 16px;
    color: #e8eefc;
    background: rgba(255,255,255,.055);
    line-height: 1.5;
  }

  .checkTop {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 9px;
  }

  .checkTop strong {
    color: #f8fafc;
  }

  .checkTop em {
    margin-left: auto;
    color: #7dd3fc;
    font-style: normal;
    font-size: 12px;
    font-weight: 900;
  }

  .pill {
    padding: 6px 9px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 950;
    text-transform: uppercase;
    letter-spacing: .08em;
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

  .progressCard {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .progressCircle {
    width: 190px;
    height: 190px;
    margin: 8px auto 18px;
    display: grid;
    place-items: center;
    text-align: center;
    border-radius: 999px;
    background:
      radial-gradient(circle at center, rgba(15,23,42,.95) 56%, transparent 57%),
      conic-gradient(from 180deg, #38bdf8, #a855f7, #22c55e, rgba(255,255,255,.08));
    border: 1px solid rgba(255,255,255,.14);
  }

  .progressCircle strong {
    display: block;
    font-size: 46px;
    letter-spacing: -0.08em;
  }

  .progressCircle span {
    display: block;
    color: #aab7ce;
    font-size: 12px;
    font-weight: 800;
  }

  .progressBar {
    height: 10px;
    overflow: hidden;
    border-radius: 999px;
    background: rgba(255,255,255,.08);
  }

  .progressBar i {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #38bdf8, #a855f7);
  }

  .checks {
    display: grid;
    gap: 12px;
  }

  .check {
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 22px;
    padding: 16px;
    background: rgba(255,255,255,.045);
  }

  .kv {
    display: grid;
    gap: 10px;
  }

  .kv div {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 14px;
    padding: 12px;
    border-radius: 16px;
    background: rgba(255,255,255,.05);
  }

  .kv span {
    color: #8fa0bb;
    font-size: 12px;
    font-weight: 850;
  }

  .kv strong {
    max-width: 58%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #e5edff;
    font-size: 12px;
  }

  .fileGrid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .file {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px;
    border-radius: 16px;
    background: rgba(255,255,255,.045);
    border: 1px solid rgba(255,255,255,.08);
  }

  .file span {
    width: 25px;
    height: 25px;
    display: grid;
    place-items: center;
    border-radius: 9px;
    font-weight: 950;
  }

  .file.ok span {
    background: rgba(34,197,94,.18);
    color: #bbf7d0;
  }

  .file.missing span {
    background: rgba(239,68,68,.18);
    color: #fecaca;
  }

  .file p {
    margin: 0;
    color: #dbe7fb;
    font-size: 12px;
    font-weight: 800;
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
    font-weight: 900;
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
    font-size: 16px;
    letter-spacing: -0.03em;
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
    font-weight: 950;
  }

  .todo p {
    margin: 0;
    color: #c7d2e8;
    line-height: 1.42;
    font-size: 13px;
  }

  .todo.done span {
    border-color: rgba(34,197,94,.4);
    background: rgba(34,197,94,.3);
  }

  .todo.done p {
    text-decoration: line-through;
    color: #7d8aa3;
  }

  .loadingCard {
    max-width: 680px;
    margin: 18vh auto;
    border-radius: 34px;
    padding: 32px;
    text-align: center;
  }

  .loadingCard h1 {
    margin: 10px 0;
    font-size: clamp(32px, 6vw, 56px);
    letter-spacing: -0.07em;
    line-height: .94;
  }

  .loadingCard p {
    color: #aebbd2;
  }

  .dangerCard {
    border-color: rgba(239,68,68,.25);
  }

  .loader {
    width: 44px;
    height: 44px;
    margin: 0 auto 18px;
    border-radius: 999px;
    border: 3px solid rgba(255,255,255,.14);
    border-top-color: #38bdf8;
    animation: spin 1s linear infinite;
  }

  .emptyState {
    padding: 18px;
    border-radius: 18px;
    background: rgba(34,197,94,.08);
    border: 1px solid rgba(34,197,94,.15);
    color: #bbf7d0;
    font-weight: 850;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @media (max-width: 1080px) {
    .heroGrid,
    .commandGrid,
    .twoCols {
      grid-template-columns: 1fr;
    }

    .scoreCard {
      min-height: auto;
    }
  }

  @media (max-width: 760px) {
    .page {
      padding: 18px;
    }

    .topbar,
    .sectionTitle {
      flex-direction: column;
    }

    .topActions {
      justify-content: flex-start;
    }

    .mainHero {
      min-height: auto;
      padding: 22px;
    }

    .todoGroups,
    .fileGrid {
      grid-template-columns: 1fr;
    }

    .checkTop em {
      width: 100%;
      margin-left: 0;
    }

    .kv div {
      align-items: flex-start;
      flex-direction: column;
    }

    .kv strong {
      max-width: 100%;
      white-space: normal;
    }
  }
`;
