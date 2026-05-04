"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

type Step = {
  delayDays: number;
  subject: string;
  html: string;
};

type Funil = {
  id: string;
  name: string;
  status: "rascunho" | "ativo";
  steps: Step[];
  createdAt: string;
  updatedAt: string;
  source?: string;
};

type Lead = {
  id?: string;
  email?: string;
  status?: string;
};

const emptyStep: Step = {
  delayDays: 0,
  subject: "Novo e-mail da sequência",
  html: "<p>Oi {{nome}},</p>\n<p>Escreva aqui o conteúdo do e-mail.</p>",
};

function safeDate(value?: string) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("pt-BR").format(new Date(value));
  } catch {
    return "-";
  }
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button className={`tab-button ${active ? "active" : ""}`} onClick={onClick} type="button">
      {children}
    </button>
  );
}

export default function AdminEmailsPage() {
  const [tab, setTab] = useState<"leads" | "campanha" | "automatico" | "funis">("funis");
  const [funis, setFunis] = useState<Funil[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedId, setSelectedId] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"rascunho" | "ativo">("rascunho");
  const [steps, setSteps] = useState<Step[]>([{ ...emptyStep }]);
  const [editingIndex, setEditingIndex] = useState(0);

  const [campaignSubject, setCampaignSubject] = useState("");
  const [campaignHtml, setCampaignHtml] = useState("<h1>Olá!</h1><p>Escreva aqui sua campanha.</p>");
  const [campaignSending, setCampaignSending] = useState(false);
  const [notice, setNotice] = useState("");

  const currentStep = steps[editingIndex] || steps[0] || emptyStep;

  const selectedFunil = useMemo(
    () => funis.find((item) => item.id === selectedId) || null,
    [funis, selectedId]
  );

  const totalLeads = leads.length;
  const newLeads = leads.filter((lead) => !lead.status || lead.status === "novo").length;

  async function loadData() {
    setLoading(true);
    setNotice("");

    try {
      const [funisRes, leadsRes] = await Promise.allSettled([
        fetch("/api/funis", { cache: "no-store" }),
        fetch("/api/leads", { cache: "no-store" }),
      ]);

      if (funisRes.status === "fulfilled" && funisRes.value.ok) {
        const data = await funisRes.value.json();
        setFunis(Array.isArray(data) ? data : []);
      }

      if (leadsRes.status === "fulfilled" && leadsRes.value.ok) {
        const data = await leadsRes.value.json();
        if (Array.isArray(data)) setLeads(data);
        else if (Array.isArray(data?.leads)) setLeads(data.leads);
        else if (Array.isArray(data?.items)) setLeads(data.items);
        else setLeads([]);
      }
    } catch (error) {
      console.error(error);
      setNotice("Não consegui carregar todos os dados agora.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function newFunil() {
    setSelectedId("");
    setName("");
    setStatus("rascunho");
    setSteps([{ ...emptyStep }]);
    setEditingIndex(0);
    setNotice("Novo funil em branco aberto.");
  }

  function selectFunil(funil: Funil) {
    setSelectedId(funil.id);
    setName(funil.name || "");
    setStatus(funil.status === "ativo" ? "ativo" : "rascunho");
    setSteps(Array.isArray(funil.steps) && funil.steps.length > 0 ? funil.steps : [{ ...emptyStep }]);
    setEditingIndex(0);
    setTab("funis");
    setNotice(`Funil "${funil.name}" carregado para edição.`);
  }

  function updateCurrentStep(field: keyof Step, value: string | number) {
    setSteps((current) =>
      current.map((step, index) =>
        index === editingIndex
          ? {
              ...step,
              [field]: field === "delayDays" ? Number(value || 0) : String(value),
            }
          : step
      )
    );
  }

  function addStep() {
    setSteps((current) => {
      const next = [...current, { ...emptyStep }];
      setEditingIndex(next.length - 1);
      return next;
    });
  }

  function removeStep(index: number) {
    if (steps.length <= 1) {
      setNotice("O funil precisa ter pelo menos um e-mail.");
      return;
    }

    setSteps((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setEditingIndex((current) => Math.max(0, Math.min(current - 1, steps.length - 2)));
  }

  async function saveFunil() {
    setNotice("");

    const cleanName = name.trim();

    if (!cleanName) {
      setNotice("Dê um nome para o funil antes de salvar.");
      return;
    }

    const cleanSteps = steps
      .map((step) => ({
        delayDays: Number(step.delayDays || 0),
        subject: String(step.subject || "").trim(),
        html: String(step.html || "").trim(),
      }))
      .filter((step) => step.subject || step.html);

    if (cleanSteps.length === 0) {
      setNotice("Crie pelo menos um e-mail com assunto ou conteúdo.");
      return;
    }

    setSaving(true);

    try {
      const method = selectedId ? "PUT" : "POST";
      const res = await fetch("/api/funis", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedId || undefined,
          name: cleanName,
          status,
          steps: cleanSteps,
          source: selectedFunil?.source || "admin-emails",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao salvar funil.");
      }

      await loadData();
      setSelectedId(data.id);
      setName(data.name);
      setStatus(data.status);
      setSteps(data.steps);
      setEditingIndex(0);
      setNotice("Funil salvo com sucesso.");
    } catch (error: any) {
      console.error(error);
      setNotice(error?.message || "Erro ao salvar funil.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteFunil() {
    if (!selectedId) {
      setNotice("Selecione um funil para excluir.");
      return;
    }

    const ok = window.confirm("Tem certeza que deseja excluir este funil?");
    if (!ok) return;

    setSaving(true);

    try {
      const res = await fetch(`/api/funis?id=${encodeURIComponent(selectedId)}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao excluir funil.");
      }

      await loadData();
      newFunil();
      setNotice("Funil excluído.");
    } catch (error: any) {
      console.error(error);
      setNotice(error?.message || "Erro ao excluir funil.");
    } finally {
      setSaving(false);
    }
  }

  async function sendCampaign() {
    setNotice("");

    if (!campaignSubject.trim()) {
      setNotice("Informe o assunto da campanha.");
      return;
    }

    if (!campaignHtml.trim()) {
      setNotice("Informe o conteúdo da campanha.");
      return;
    }

    setCampaignSending(true);

    try {
      const res = await fetch("/api/send-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: campaignSubject,
          html: campaignHtml,
          content: campaignHtml,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao enviar campanha.");
      }

      setNotice("Campanha enviada/chamada com sucesso.");
    } catch (error: any) {
      console.error(error);
      setNotice(error?.message || "Erro ao enviar campanha.");
    } finally {
      setCampaignSending(false);
    }
  }

  return (
    <main className="page">
      <section className="top-grid">
        <div className="stat-card">
          <span>Total Leads</span>
          <strong>{loading ? "..." : totalLeads}</strong>
        </div>
        <div className="stat-card">
          <span>Novos</span>
          <strong>{loading ? "..." : newLeads}</strong>
        </div>
        <div className="stat-card">
          <span>Funis</span>
          <strong>{loading ? "..." : funis.length}</strong>
        </div>
      </section>

      <section className="tabs">
        <TabButton active={tab === "leads"} onClick={() => setTab("leads")}>
          Leads
        </TabButton>
        <TabButton active={tab === "campanha"} onClick={() => setTab("campanha")}>
          Nova Campanha
        </TabButton>
        <TabButton active={tab === "automatico"} onClick={() => setTab("automatico")}>
          Email Automático
        </TabButton>
        <TabButton active={tab === "funis"} onClick={() => setTab("funis")}>
          Funis de Email
        </TabButton>
      </section>

      {notice && <div className="notice">{notice}</div>}

      {tab === "leads" && (
        <section className="panel">
          <h1>Leads</h1>
          <p>Resumo simples dos leads carregados pela API atual.</p>

          <div className="lead-list">
            {leads.length === 0 ? (
              <div className="empty">Nenhum lead carregado agora.</div>
            ) : (
              leads.slice(0, 50).map((lead, index) => (
                <div className="lead-row" key={lead.id || `${lead.email}-${index}`}>
                  <strong>{lead.email || "Lead sem e-mail"}</strong>
                  <span>{lead.status || "novo"}</span>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {tab === "campanha" && (
        <section className="panel">
          <h1>Nova campanha manual</h1>
          <p>Envia para sua API atual <code>/api/send-campaign</code>.</p>

          <label>Assunto</label>
          <input
            value={campaignSubject}
            onChange={(event) => setCampaignSubject(event.target.value)}
            placeholder="Assunto da campanha"
          />

          <label>HTML / Conteúdo</label>
          <textarea
            value={campaignHtml}
            onChange={(event) => setCampaignHtml(event.target.value)}
            rows={12}
          />

          <button className="primary" onClick={sendCampaign} disabled={campaignSending}>
            {campaignSending ? "Enviando..." : "Enviar campanha"}
          </button>
        </section>
      )}

      {tab === "automatico" && (
        <section className="panel">
          <h1>Email automático</h1>
          <p>
            O Campaign Agent já está criando um funil rascunho automático. Para revisar,
            abrir e editar, entre na aba <strong>Funis de Email</strong>.
          </p>
        </section>
      )}

      {tab === "funis" && (
        <section className="funil-layout">
          <div className="panel editor-panel">
            <div className="section-head">
              <div>
                <h1>Construtor de funil de e-mails</h1>
                <p>
                  Clique em um funil salvo, escolha um e-mail da sequência, edite e salve.
                </p>
              </div>

              <button className="ghost" onClick={newFunil} type="button">
                + Novo funil
              </button>
            </div>

            <label>Nome do funil</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex: Funil de boas-vindas"
            />

            <div className="status-row">
              <label>Status</label>
              <select value={status} onChange={(event) => setStatus(event.target.value as "rascunho" | "ativo")}>
                <option value="rascunho">Rascunho</option>
                <option value="ativo">Ativo</option>
              </select>
            </div>

            <div className="email-nav">
              {steps.map((step, index) => (
                <button
                  key={`${step.subject}-${index}`}
                  type="button"
                  className={`email-chip ${editingIndex === index ? "active" : ""}`}
                  onClick={() => setEditingIndex(index)}
                >
                  Email {index + 1}
                  <small>{step.delayDays} dia(s)</small>
                </button>
              ))}

              <button className="email-chip add" type="button" onClick={addStep}>
                + Adicionar e-mail
              </button>
            </div>

            <div className="email-editor">
              <div className="email-editor-head">
                <h2>Email {editingIndex + 1}</h2>
                <button className="danger" type="button" onClick={() => removeStep(editingIndex)}>
                  Remover este e-mail
                </button>
              </div>

              <div className="fields-grid">
                <div>
                  <label>Delay em dias após cadastro</label>
                  <input
                    type="number"
                    min={0}
                    value={currentStep.delayDays}
                    onChange={(event) => updateCurrentStep("delayDays", event.target.value)}
                  />
                </div>

                <div>
                  <label>Assunto</label>
                  <input
                    value={currentStep.subject}
                    onChange={(event) => updateCurrentStep("subject", event.target.value)}
                    placeholder="Assunto do e-mail"
                  />
                </div>
              </div>

              <label>HTML / Conteúdo</label>
              <textarea
                value={currentStep.html}
                onChange={(event) => updateCurrentStep("html", event.target.value)}
                rows={14}
                placeholder="<p>Oi {{nome}}, escreva aqui...</p>"
              />

              <div className="actions">
                <button className="primary" onClick={saveFunil} disabled={saving} type="button">
                  {saving ? "Salvando..." : selectedId ? "Salvar alterações" : "Salvar novo funil"}
                </button>

                {selectedId && (
                  <button className="danger-outline" onClick={deleteFunil} disabled={saving} type="button">
                    Excluir funil
                  </button>
                )}
              </div>
            </div>
          </div>

          <aside className="panel saved-panel">
            <h2>Funis salvos</h2>
            <p className="small">Clique em um funil para abrir e editar.</p>

            <div className="saved-list">
              {funis.length === 0 ? (
                <div className="empty">Nenhum funil salvo ainda.</div>
              ) : (
                funis.map((funil) => (
                  <button
                    key={funil.id}
                    type="button"
                    className={`saved-card ${selectedId === funil.id ? "active" : ""}`}
                    onClick={() => selectFunil(funil)}
                  >
                    <strong>{funil.name}</strong>
                    <span>{funil.steps?.length || 0} e-mail(s) · {funil.status}</span>
                    <small>
                      Criado em {safeDate(funil.createdAt)}
                      {funil.source ? ` · ${funil.source}` : ""}
                    </small>
                    <em>Ver / editar e-mails</em>
                  </button>
                ))
              )}
            </div>
          </aside>
        </section>
      )}

      <style>{`
        * {
          box-sizing: border-box;
        }

        .page {
          min-height: 100vh;
          padding: 32px;
          color: #fff;
          background:
            radial-gradient(circle at top left, rgba(14, 165, 233, .26), transparent 34%),
            radial-gradient(circle at top right, rgba(168, 85, 247, .24), transparent 30%),
            linear-gradient(135deg, #050816, #101039 52%, #09091d);
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .top-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(180px, 1fr));
          gap: 18px;
          margin-bottom: 24px;
        }

        .stat-card,
        .panel {
          border: 1px solid rgba(148, 163, 184, .22);
          background: rgba(15, 23, 42, .64);
          border-radius: 28px;
          box-shadow: 0 24px 80px rgba(0, 0, 0, .28);
          backdrop-filter: blur(16px);
        }

        .stat-card {
          padding: 26px;
        }

        .stat-card span {
          display: block;
          color: rgba(226, 232, 240, .82);
          font-weight: 700;
          margin-bottom: 16px;
        }

        .stat-card strong {
          font-size: 44px;
          line-height: 1;
        }

        .tabs {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }

        .tab-button {
          border: 1px solid rgba(148, 163, 184, .25);
          background: rgba(255, 255, 255, .08);
          color: rgba(255, 255, 255, .86);
          border-radius: 999px;
          padding: 14px 22px;
          font-weight: 900;
          cursor: pointer;
        }

        .tab-button.active {
          border-color: rgba(34, 211, 238, .8);
          background: linear-gradient(135deg, #2563eb, #06b6d4);
          color: #fff;
          box-shadow: 0 18px 44px rgba(6, 182, 212, .22);
        }

        .notice {
          border: 1px solid rgba(34, 211, 238, .35);
          background: rgba(8, 47, 73, .62);
          color: #cffafe;
          padding: 14px 18px;
          border-radius: 18px;
          margin-bottom: 18px;
          font-weight: 800;
        }

        .panel {
          padding: 24px;
        }

        .funil-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 330px;
          gap: 20px;
          align-items: start;
        }

        .section-head,
        .email-editor-head,
        .actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        h1,
        h2 {
          margin: 0;
        }

        p {
          color: rgba(226, 232, 240, .78);
          line-height: 1.6;
        }

        label {
          display: block;
          margin: 18px 0 8px;
          font-size: 13px;
          font-weight: 900;
          color: rgba(226, 232, 240, .94);
        }

        input,
        textarea,
        select {
          width: 100%;
          border: 1px solid rgba(148, 163, 184, .26);
          background: rgba(15, 23, 42, .78);
          color: #fff;
          border-radius: 18px;
          padding: 14px 16px;
          outline: none;
          font-weight: 700;
        }

        textarea {
          resize: vertical;
          min-height: 180px;
          line-height: 1.6;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
          font-size: 13px;
        }

        .status-row {
          max-width: 220px;
        }

        .email-nav {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin: 22px 0;
          padding: 14px;
          border: 1px solid rgba(148, 163, 184, .18);
          background: rgba(2, 6, 23, .28);
          border-radius: 22px;
        }

        .email-chip {
          border: 1px solid rgba(148, 163, 184, .22);
          background: rgba(255, 255, 255, .07);
          color: #fff;
          border-radius: 16px;
          padding: 10px 14px;
          cursor: pointer;
          font-weight: 900;
          display: grid;
          gap: 3px;
          min-width: 96px;
          text-align: left;
        }

        .email-chip small {
          color: rgba(226, 232, 240, .65);
          font-size: 11px;
        }

        .email-chip.active {
          border-color: rgba(34, 211, 238, .8);
          background: rgba(14, 165, 233, .24);
        }

        .email-chip.add {
          border-style: dashed;
          color: #67e8f9;
        }

        .email-editor {
          border: 1px solid rgba(148, 163, 184, .18);
          border-radius: 24px;
          padding: 20px;
          background: rgba(255, 255, 255, .045);
        }

        .fields-grid {
          display: grid;
          grid-template-columns: 180px 1fr;
          gap: 14px;
        }

        .primary,
        .ghost,
        .danger,
        .danger-outline {
          border: 0;
          border-radius: 16px;
          padding: 13px 18px;
          color: #fff;
          font-weight: 950;
          cursor: pointer;
        }

        .primary {
          background: linear-gradient(135deg, #7c3aed, #06b6d4);
          box-shadow: 0 16px 36px rgba(124, 58, 237, .28);
        }

        .ghost {
          border: 1px solid rgba(148, 163, 184, .25);
          background: rgba(255, 255, 255, .08);
        }

        .danger {
          background: rgba(244, 63, 94, .82);
        }

        .danger-outline {
          border: 1px solid rgba(244, 63, 94, .55);
          background: rgba(244, 63, 94, .12);
          color: #fecdd3;
        }

        button:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        .saved-panel {
          position: sticky;
          top: 24px;
        }

        .small {
          font-size: 13px;
        }

        .saved-list {
          display: grid;
          gap: 12px;
          margin-top: 16px;
        }

        .saved-card {
          text-align: left;
          border: 1px solid rgba(148, 163, 184, .25);
          background: rgba(59, 130, 246, .16);
          color: #fff;
          border-radius: 20px;
          padding: 16px;
          cursor: pointer;
          display: grid;
          gap: 6px;
        }

        .saved-card:hover,
        .saved-card.active {
          border-color: rgba(34, 211, 238, .9);
          background: rgba(14, 165, 233, .26);
          transform: translateY(-1px);
        }

        .saved-card strong {
          font-size: 15px;
        }

        .saved-card span,
        .saved-card small {
          color: rgba(226, 232, 240, .75);
        }

        .saved-card em {
          color: #67e8f9;
          font-style: normal;
          font-weight: 900;
          margin-top: 4px;
        }

        .lead-list {
          display: grid;
          gap: 10px;
          margin-top: 18px;
        }

        .lead-row,
        .empty {
          border: 1px solid rgba(148, 163, 184, .18);
          background: rgba(255, 255, 255, .05);
          border-radius: 16px;
          padding: 14px;
        }

        .lead-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
        }

        code {
          color: #67e8f9;
        }

        @media (max-width: 980px) {
          .page {
            padding: 18px;
          }

          .top-grid,
          .funil-layout,
          .fields-grid {
            grid-template-columns: 1fr;
          }

          .saved-panel {
            position: static;
          }
        }
      `}</style>
    </main>
  );
}
