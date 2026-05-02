"use client";

import { useEffect, useMemo, useState } from "react";

type Settings = {
  display_name: string;
  business_name: string;
  business_segment: string;
  whatsapp: string;
  role_goal: string;
  default_workspace: string;

  notification_email: boolean;
  notification_whatsapp: boolean;
  notification_push: boolean;

  notify_new_user: boolean;
  notify_system_errors: boolean;
  notify_task_done: boolean;

  theme_mode: "system" | "light" | "dark";
  ai_tone: "direto" | "estrategico" | "didatico" | "executivo";
  ai_detail_level: "curto" | "medio" | "detalhado";

  allow_ai_personalization: boolean;
  allow_marketing_emails: boolean;
  onboarding_done: boolean;
};

const emptySettings: Settings = {
  display_name: "",
  business_name: "",
  business_segment: "",
  whatsapp: "",
  role_goal: "",
  default_workspace: "estudio",

  notification_email: true,
  notification_whatsapp: false,
  notification_push: true,

  notify_new_user: true,
  notify_system_errors: true,
  notify_task_done: true,

  theme_mode: "system",
  ai_tone: "direto",
  ai_detail_level: "medio",

  allow_ai_personalization: true,
  allow_marketing_emails: false,
  onboarding_done: false,
};

export default function ConfiguracoesUsuarioPage() {
  const [settings, setSettings] = useState<Settings>(emptySettings);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const completion = useMemo(() => {
    const items = [
      settings.display_name,
      settings.business_name,
      settings.business_segment,
      settings.whatsapp,
      settings.role_goal,
    ];

    const filled = items.filter(Boolean).length;
    return Math.round((filled / items.length) * 100);
  }, [settings]);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/usuario/configuracoes", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data.ok) {
          throw new Error(data.error || "Não foi possível carregar suas configurações.");
        }

        setEmail(data.user?.email || "");
        setSettings({
          ...emptySettings,
          ...data.settings,
        });
      } catch (err: any) {
        setError(err?.message || "Erro ao carregar configurações.");
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  function updateField<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function saveSettings() {
    try {
      setSaving(true);
      setMessage("");
      setError("");

      const response = await fetch("/api/usuario/configuracoes", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Não foi possível salvar.");
      }

      setSettings({
        ...emptySettings,
        ...data.settings,
      });

      setMessage("Configurações salvas com sucesso.");
    } catch (err: any) {
      setError(err?.message || "Erro ao salvar configurações.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="settings-page">
        <section className="loading-card">Carregando configurações...</section>
        <style jsx>{styles}</style>
      </main>
    );
  }

  return (
    <main className="settings-page">
      <section className="hero">
        <div>
          <p className="eyebrow">Sualuma Studio</p>
          <h1>Configurações do usuário</h1>
          <p>
            Aqui o usuário ajusta perfil, negócio, notificações, preferências da IA
            e permissões de privacidade.
          </p>
        </div>

        <div className="score-card">
          <span>Perfil completo</span>
          <strong>{completion}%</strong>
          <div className="bar">
            <div style={{ width: `${completion}%` }} />
          </div>
        </div>
      </section>

      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert success">{message}</div>}

      <section className="grid">
        <article className="card large">
          <div className="card-head">
            <div>
              <p className="eyebrow">Perfil</p>
              <h2>Dados principais</h2>
            </div>
            <span className="badge">{email || "usuário logado"}</span>
          </div>

          <label>
            Nome de exibição
            <input
              value={settings.display_name || ""}
              onChange={(event) => updateField("display_name", event.target.value)}
              placeholder="Ex: Luma"
            />
          </label>

          <label>
            WhatsApp
            <input
              value={settings.whatsapp || ""}
              onChange={(event) => updateField("whatsapp", event.target.value)}
              placeholder="Ex: +55 48 99999-9999"
            />
          </label>

          <label>
            Objetivo principal dentro da plataforma
            <textarea
              value={settings.role_goal || ""}
              onChange={(event) => updateField("role_goal", event.target.value)}
              placeholder="Ex: vender mais, organizar clientes, automatizar tarefas..."
            />
          </label>
        </article>

        <article className="card">
          <p className="eyebrow">Negócio</p>
          <h2>Informações da empresa</h2>

          <label>
            Nome do negócio
            <input
              value={settings.business_name || ""}
              onChange={(event) => updateField("business_name", event.target.value)}
              placeholder="Ex: Sualuma"
            />
          </label>

          <label>
            Segmento
            <input
              value={settings.business_segment || ""}
              onChange={(event) => updateField("business_segment", event.target.value)}
              placeholder="Ex: serviços digitais, loja, estética, moda..."
            />
          </label>

          <label>
            Área inicial padrão
            <select
              value={settings.default_workspace || "estudio"}
              onChange={(event) => updateField("default_workspace", event.target.value)}
            >
              <option value="estudio">Estúdio</option>
              <option value="clientes">Clientes</option>
              <option value="automacoes">Automações</option>
              <option value="tarefas">Tarefas</option>
              <option value="financeiro">Financeiro</option>
            </select>
          </label>
        </article>

        <article className="card">
          <p className="eyebrow">IA</p>
          <h2>Preferências da inteligência</h2>

          <label>
            Tom da IA
            <select
              value={settings.ai_tone}
              onChange={(event) => updateField("ai_tone", event.target.value as Settings["ai_tone"])}
            >
              <option value="direto">Direto</option>
              <option value="estrategico">Estratégico</option>
              <option value="didatico">Didático</option>
              <option value="executivo">Executivo</option>
            </select>
          </label>

          <label>
            Nível de detalhe
            <select
              value={settings.ai_detail_level}
              onChange={(event) =>
                updateField("ai_detail_level", event.target.value as Settings["ai_detail_level"])
              }
            >
              <option value="curto">Curto</option>
              <option value="medio">Médio</option>
              <option value="detalhado">Detalhado</option>
            </select>
          </label>

          <Toggle
            title="Permitir personalização da IA"
            description="A IA pode usar essas preferências para responder melhor ao usuário."
            checked={settings.allow_ai_personalization}
            onChange={(value) => updateField("allow_ai_personalization", value)}
          />
        </article>

        <article className="card">
          <p className="eyebrow">Notificações</p>
          <h2>Como deseja ser avisado</h2>

          <Toggle
            title="E-mail"
            description="Receber alertas importantes por e-mail."
            checked={settings.notification_email}
            onChange={(value) => updateField("notification_email", value)}
          />

          <Toggle
            title="WhatsApp"
            description="Reservado para alertas urgentes ou automações futuras."
            checked={settings.notification_whatsapp}
            onChange={(value) => updateField("notification_whatsapp", value)}
          />

          <Toggle
            title="Notificações internas"
            description="Mostrar avisos dentro do painel."
            checked={settings.notification_push}
            onChange={(value) => updateField("notification_push", value)}
          />
        </article>

        <article className="card">
          <p className="eyebrow">Alertas do sistema</p>
          <h2>O que o sistema deve avisar</h2>

          <Toggle
            title="Novo usuário"
            description="Avisar quando alguém novo entrar no sistema."
            checked={settings.notify_new_user}
            onChange={(value) => updateField("notify_new_user", value)}
          />

          <Toggle
            title="Erro no sistema"
            description="Avisar quando uma automação, página ou API falhar."
            checked={settings.notify_system_errors}
            onChange={(value) => updateField("notify_system_errors", value)}
          />

          <Toggle
            title="Tarefa concluída"
            description="Avisar quando copiloto/agente finalizar uma ação."
            checked={settings.notify_task_done}
            onChange={(value) => updateField("notify_task_done", value)}
          />
        </article>

        <article className="card">
          <p className="eyebrow">Privacidade</p>
          <h2>Permissões e LGPD</h2>

          <label>
            Aparência
            <select
              value={settings.theme_mode}
              onChange={(event) => updateField("theme_mode", event.target.value as Settings["theme_mode"])}
            >
              <option value="system">Automático</option>
              <option value="light">Claro</option>
              <option value="dark">Escuro</option>
            </select>
          </label>

          <Toggle
            title="Receber comunicações comerciais"
            description="Permite receber novidades, ofertas e atualizações da plataforma."
            checked={settings.allow_marketing_emails}
            onChange={(value) => updateField("allow_marketing_emails", value)}
          />

          <Toggle
            title="Onboarding concluído"
            description="Marca se o usuário já passou pela configuração inicial."
            checked={settings.onboarding_done}
            onChange={(value) => updateField("onboarding_done", value)}
          />
        </article>
      </section>

      <section className="actions">
        <button onClick={saveSettings} disabled={saving}>
          {saving ? "Salvando..." : "Salvar configurações"}
        </button>
      </section>

      <style jsx>{styles}</style>
    </main>
  );
}

function Toggle({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      className={`toggle ${checked ? "active" : ""}`}
      onClick={() => onChange(!checked)}
    >
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <i>{checked ? "Ativo" : "Off"}</i>
    </button>
  );
}

const styles = `
  .settings-page {
    min-height: 100vh;
    padding: 32px;
    background:
      radial-gradient(circle at top left, rgba(124, 58, 237, .22), transparent 34%),
      radial-gradient(circle at top right, rgba(56, 189, 248, .18), transparent 30%),
      #070814;
    color: #f8fafc;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .hero {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    align-items: stretch;
    margin-bottom: 24px;
  }

  .hero h1 {
    margin: 8px 0;
    font-size: clamp(32px, 5vw, 58px);
    line-height: .95;
    letter-spacing: -0.06em;
  }

  .hero p {
    max-width: 760px;
    color: #a7b0c4;
    font-size: 16px;
  }

  .eyebrow {
    margin: 0;
    color: #38bdf8;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: .18em;
    font-weight: 800;
  }

  .score-card,
  .loading-card {
    border: 1px solid rgba(255,255,255,.12);
    border-radius: 28px;
    background: rgba(255,255,255,.07);
    box-shadow: 0 24px 80px rgba(0,0,0,.28);
    backdrop-filter: blur(18px);
  }

  .score-card {
    min-width: 220px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 10px;
  }

  .score-card span {
    color: #a7b0c4;
    font-size: 13px;
  }

  .score-card strong {
    font-size: 42px;
    letter-spacing: -0.06em;
  }

  .bar {
    overflow: hidden;
    height: 10px;
    border-radius: 999px;
    background: rgba(255,255,255,.1);
  }

  .bar div {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, #7c3aed, #38bdf8);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
  }

  .card {
    padding: 22px;
    border-radius: 28px;
    border: 1px solid rgba(255,255,255,.11);
    background: rgba(13, 16, 36, .78);
    box-shadow: 0 24px 80px rgba(0,0,0,.22);
  }

  .card.large {
    grid-row: span 2;
  }

  .card h2 {
    margin: 6px 0 18px;
    letter-spacing: -0.04em;
  }

  .card-head {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: start;
  }

  .badge {
    max-width: 260px;
    padding: 8px 11px;
    border-radius: 999px;
    background: rgba(56,189,248,.1);
    color: #bae6fd;
    border: 1px solid rgba(56,189,248,.22);
    font-size: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 14px;
    color: #d7def0;
    font-size: 13px;
    font-weight: 700;
  }

  input,
  textarea,
  select {
    width: 100%;
    border: 1px solid rgba(255,255,255,.12);
    border-radius: 16px;
    background: rgba(255,255,255,.07);
    color: #ffffff;
    padding: 13px 14px;
    outline: none;
    font-size: 14px;
  }

  textarea {
    min-height: 130px;
    resize: vertical;
  }

  input::placeholder,
  textarea::placeholder {
    color: #69738d;
  }

  select option {
    background: #0b1022;
    color: #fff;
  }

  .toggle {
    width: 100%;
    margin-top: 12px;
    padding: 14px;
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 18px;
    background: rgba(255,255,255,.05);
    color: #fff;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    text-align: left;
    cursor: pointer;
  }

  .toggle span {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .toggle strong {
    font-size: 14px;
  }

  .toggle small {
    color: #8d98af;
    font-size: 12px;
    line-height: 1.35;
  }

  .toggle i {
    min-width: 54px;
    text-align: center;
    border-radius: 999px;
    padding: 7px 9px;
    background: rgba(255,255,255,.08);
    color: #8d98af;
    font-style: normal;
    font-size: 12px;
    font-weight: 800;
  }

  .toggle.active {
    border-color: rgba(56,189,248,.36);
    background: rgba(56,189,248,.08);
  }

  .toggle.active i {
    background: linear-gradient(90deg, #7c3aed, #38bdf8);
    color: white;
  }

  .alert {
    margin-bottom: 16px;
    padding: 14px 16px;
    border-radius: 18px;
    font-weight: 700;
  }

  .alert.error {
    color: #fecaca;
    background: rgba(239,68,68,.12);
    border: 1px solid rgba(239,68,68,.22);
  }

  .alert.success {
    color: #bbf7d0;
    background: rgba(34,197,94,.12);
    border: 1px solid rgba(34,197,94,.22);
  }

  .actions {
    position: sticky;
    bottom: 18px;
    margin-top: 22px;
    display: flex;
    justify-content: flex-end;
  }

  .actions button {
    border: 0;
    border-radius: 999px;
    padding: 15px 22px;
    color: #fff;
    font-weight: 900;
    cursor: pointer;
    box-shadow: 0 18px 60px rgba(56,189,248,.22);
    background: linear-gradient(90deg, #7c3aed, #38bdf8);
  }

  .actions button:disabled {
    opacity: .55;
    cursor: not-allowed;
  }

  .loading-card {
    padding: 32px;
  }

  @media (max-width: 860px) {
    .settings-page {
      padding: 20px;
    }

    .hero {
      flex-direction: column;
    }

    .score-card {
      min-width: 0;
    }

    .grid {
      grid-template-columns: 1fr;
    }

    .card.large {
      grid-row: auto;
    }

    .actions {
      justify-content: stretch;
    }

    .actions button {
      width: 100%;
    }
  }
`;
