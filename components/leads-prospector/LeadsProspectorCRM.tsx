"use client";

import { useEffect, useMemo, useState } from "react";
import type { DragEvent } from "react";

type LeadStatus =
  | "novo"
  | "revisar"
  | "aprovado"
  | "contato"
  | "ganho"
  | "descartado";

type Lead = {
  id: string;
  company: string;
  segment?: string;
  city?: string;
  website?: string;
  publicContact?: string;
  sourceUrl?: string;
  status: LeadStatus;
  score?: number;
  fitReason?: string;
  lgpdStatus?: string;
  notes?: string;
};

type Job = {
  id: string;
  title: string;
  target: number;
  status: string;
  progress: number;
  approvedForContact: number;
  createdAt: string;
};

const columns: { id: LeadStatus; title: string; desc: string }[] = [
  { id: "novo", title: "Novos", desc: "Leads brutos com fonte pública" },
  { id: "revisar", title: "Revisar LGPD", desc: "Precisa validar fonte e contato" },
  { id: "aprovado", title: "Aprovados", desc: "Pode preparar abordagem manual" },
  { id: "contato", title: "Contato feito", desc: "Abordagem manual registrada" },
  { id: "ganho", title: "Convertidos", desc: "Viraram oportunidade real" },
  { id: "descartado", title: "Descartados", desc: "Sem fit ou sem fonte segura" }
];

const emptyLead = {
  company: "",
  segment: "",
  city: "",
  website: "",
  publicContact: "",
  sourceUrl: "",
  notes: ""
};

export default function LeadsProspectorCRM() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [agentLoading, setAgentLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [dragId, setDragId] = useState("");
  const [form, setForm] = useState(emptyLead);
  const [csv, setCsv] = useState("");

  const stats = useMemo(() => {
    const total = leads.length;
    const approved = leads.filter((lead) =>
      ["aprovado", "contato", "ganho"].includes(lead.status)
    ).length;
    const review = leads.filter((lead) => lead.status === "revisar").length;
    const target = jobs[0]?.target || 1000;

    return {
      total,
      approved,
      review,
      target,
      progress: Math.min(100, Math.round((total / target) * 100))
    };
  }, [leads, jobs]);

  async function load() {
    setLoading(true);

    try {
      const res = await fetch("/api/leads-prospector", { cache: "no-store" });
      const json = await res.json();

      if (json.ok) {
        setLeads(json.leads || []);
        setJobs(json.jobs || []);
      }
    } finally {
      setLoading(false);
    }
  }

  async function api(payload: any) {
    const res = await fetch("/api/leads-prospector", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const json = await res.json();

    if (json.ok) {
      setLeads(json.leads || []);
      setJobs(json.jobs || []);
      setMessage(json.message || "Atualizado com sucesso.");
    } else {
      setMessage(json.error || "Algo deu errado.");
    }

    return json;
  }

  useEffect(() => {
    load();
  }, []);

  async function startAgent() {
    setAgentLoading(true);
    setMessage("");

    try {
      await api({ action: "start-agent", target: 1000 });
    } finally {
      setAgentLoading(false);
    }
  }

  async function addLead() {
    if (!form.company.trim()) {
      setMessage("Informe pelo menos o nome da empresa.");
      return;
    }

    await api({
      action: "add",
      lead: {
        ...form,
        status: "novo",
        score: 50,
        fitReason: "Lead inserido manualmente. Aguardando qualificação.",
        lgpdStatus: "Revisão manual obrigatória antes de contato."
      }
    });

    setForm(emptyLead);
  }

  async function moveLead(id: string, status: LeadStatus) {
    await api({ action: "move", id, status });
  }

  async function deleteLead(id: string) {
    const ok = window.confirm("Descartar este lead do CRM?");
    if (!ok) return;

    await api({ action: "delete", id });
  }

  function parseCsv() {
    const rows = csv
      .split("\n")
      .map((row) => row.trim())
      .filter(Boolean);

    const parsed = rows.map((row) => {
      const parts = row.includes(";") ? row.split(";") : row.split(",");

      return {
        company: parts[0]?.trim() || "",
        segment: parts[1]?.trim() || "",
        city: parts[2]?.trim() || "",
        website: parts[3]?.trim() || "",
        publicContact: parts[4]?.trim() || "",
        sourceUrl: parts[5]?.trim() || "",
        status: "novo",
        score: 50,
        fitReason: "Lead importado. Aguardando análise de fit.",
        lgpdStatus: "Revisão manual obrigatória antes de contato."
      };
    });

    return parsed.filter((item) => item.company);
  }

  async function importCsv() {
    const parsed = parseCsv();

    if (!parsed.length) {
      setMessage("Cole pelo menos uma linha com o nome da empresa.");
      return;
    }

    const json = await api({ action: "import", leads: parsed });
    setMessage(`Importação finalizada. Leads novos: ${json.imported || 0}.`);
    setCsv("");
  }

  function onDragStart(leadId: string) {
    setDragId(leadId);
  }

  function onDrop(e: DragEvent<HTMLDivElement>, status: LeadStatus) {
    e.preventDefault();
    if (!dragId) return;

    moveLead(dragId, status);
    setDragId("");
  }

  return (
    <main className="prospectorPage">
      <section className="hero">
        <div>
          <p className="kicker">SUALUMA PROSPECTOR</p>
          <h1>CRM de Prospecção Ética</h1>
          <p className="heroText">
            Painel para organizar 1000 leads B2B com fonte pública, revisão LGPD,
            aprovação humana e abordagem manual. Nada de spam, nada de coleta
            agressiva de dados pessoais.
          </p>
        </div>

        <button className="agentButton" onClick={startAgent} disabled={agentLoading}>
          {agentLoading ? "Ligando agente..." : "Ligar agente: 1000 leads"}
        </button>
      </section>

      <section className="statsGrid">
        <div className="statCard">
          <span>Total no CRM</span>
          <strong>{loading ? "..." : stats.total}</strong>
          <small>meta: {stats.target} leads</small>
        </div>

        <div className="statCard">
          <span>Aprovados para abordagem</span>
          <strong>{stats.approved}</strong>
          <small>contato somente manual</small>
        </div>

        <div className="statCard">
          <span>Precisam revisar</span>
          <strong>{stats.review}</strong>
          <small>fonte, fit e LGPD</small>
        </div>

        <div className="statCard">
          <span>Progresso</span>
          <strong>{stats.progress}%</strong>
          <small>{stats.total}/{stats.target}</small>
        </div>
      </section>

      {jobs[0] && (
        <section className="agentPanel">
          <div>
            <p className="kicker">AGENTE ATIVO</p>
            <h2>{jobs[0].title}</h2>
            <p>
              Status: <b>{jobs[0].status}</b> · Encontrados/registrados:{" "}
              <b>{stats.total}</b> · Aprovados: <b>{stats.approved}</b>
            </p>
          </div>

          <div className="progressOuter">
            <div className="progressInner" style={{ width: `${stats.progress}%` }} />
          </div>
        </section>
      )}

      {message && <div className="notice">{message}</div>}

      <section className="toolsGrid">
        <div className="toolCard">
          <h3>Adicionar lead manual</h3>
          <div className="formGrid">
            <input
              placeholder="Empresa"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
            />
            <input
              placeholder="Nicho"
              value={form.segment}
              onChange={(e) => setForm({ ...form, segment: e.target.value })}
            />
            <input
              placeholder="Cidade"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
            <input
              placeholder="Site"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
            />
            <input
              placeholder="Contato público empresarial"
              value={form.publicContact}
              onChange={(e) =>
                setForm({ ...form, publicContact: e.target.value })
              }
            />
            <input
              placeholder="URL da fonte pública"
              value={form.sourceUrl}
              onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
            />
          </div>

          <textarea
            placeholder="Observações do lead"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />

          <button onClick={addLead}>Salvar lead</button>
        </div>

        <div className="toolCard">
          <h3>Importar lista própria</h3>
          <p>
            Formato por linha: Empresa; Nicho; Cidade; Site; Contato público; Fonte
          </p>
          <textarea
            placeholder="Ex: Loja Sol; Moda; Florianópolis; https://...; contato@empresa.com; https://fonte..."
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
          />
          <button onClick={importCsv}>Importar para revisão</button>
        </div>
      </section>

      <section className="kanban">
        {columns.map((column) => {
          const items = leads.filter((lead) => lead.status === column.id);

          return (
            <div
              key={column.id}
              className="column"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDrop(e, column.id)}
            >
              <div className="columnHeader">
                <div>
                  <h3>{column.title}</h3>
                  <p>{column.desc}</p>
                </div>
                <strong>{items.length}</strong>
              </div>

              <div className="cards">
                {items.map((lead) => (
                  <article
                    key={lead.id}
                    draggable
                    onDragStart={() => onDragStart(lead.id)}
                    className="leadCard"
                  >
                    <div className="leadTop">
                      <h4>{lead.company}</h4>
                      <span>{lead.score || 50}</span>
                    </div>

                    <p className="meta">
                      {lead.segment || "Sem nicho"} · {lead.city || "Sem cidade"}
                    </p>

                    {lead.website && (
                      <a href={lead.website} target="_blank">
                        Site da empresa
                      </a>
                    )}

                    {lead.sourceUrl && (
                      <a href={lead.sourceUrl} target="_blank">
                        Fonte pública
                      </a>
                    )}

                    <p className="lgpd">{lead.lgpdStatus}</p>

                    {lead.notes && <p className="notes">{lead.notes}</p>}

                    <div className="cardActions">
                      <button onClick={() => moveLead(lead.id, "revisar")}>
                        Revisar
                      </button>
                      <button onClick={() => moveLead(lead.id, "aprovado")}>
                        Aprovar
                      </button>
                      <button onClick={() => deleteLead(lead.id)}>Descartar</button>
                    </div>
                  </article>
                ))}

                {!items.length && (
                  <div className="emptyDrop">Arraste leads para cá</div>
                )}
              </div>
            </div>
          );
        })}
      </section>

      <style jsx>{`
        .prospectorPage {
          min-height: 100vh;
          padding: 34px;
          color: white;
          background:
            radial-gradient(circle at top left, rgba(255, 0, 170, 0.22), transparent 35%),
            radial-gradient(circle at top right, rgba(72, 70, 255, 0.16), transparent 34%),
            #080711;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .hero,
        .agentPanel,
        .toolCard,
        .statCard,
        .column {
          border: 1px solid rgba(255, 80, 180, 0.28);
          background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.065), rgba(255, 255, 255, 0.025));
          box-shadow: 0 0 40px rgba(255, 0, 150, 0.12);
          backdrop-filter: blur(18px);
        }

        .hero {
          display: flex;
          justify-content: space-between;
          gap: 24px;
          align-items: center;
          border-radius: 34px;
          padding: 34px;
          margin-bottom: 22px;
        }

        .kicker {
          margin: 0 0 10px;
          color: #ff5fbd;
          letter-spacing: 0.2em;
          font-size: 12px;
          font-weight: 900;
        }

        h1 {
          margin: 0;
          font-size: clamp(38px, 8vw, 82px);
          line-height: 0.94;
          letter-spacing: -0.06em;
        }

        .heroText {
          max-width: 780px;
          margin: 18px 0 0;
          color: rgba(255, 255, 255, 0.72);
          font-size: 17px;
          line-height: 1.55;
        }

        button {
          border: 1px solid rgba(255, 90, 190, 0.55);
          border-radius: 999px;
          padding: 12px 16px;
          background: rgba(255, 28, 160, 0.16);
          color: white;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 0 24px rgba(255, 0, 160, 0.16);
        }

        button:disabled {
          opacity: 0.6;
          cursor: wait;
        }

        .agentButton {
          padding: 16px 22px;
          font-size: 15px;
          white-space: nowrap;
          background: linear-gradient(135deg, rgba(255, 0, 180, 0.42), rgba(255, 70, 180, 0.16));
        }

        .statsGrid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 18px;
        }

        .statCard {
          border-radius: 24px;
          padding: 22px;
        }

        .statCard span {
          display: block;
          color: rgba(255, 255, 255, 0.58);
          margin-bottom: 10px;
        }

        .statCard strong {
          display: block;
          font-size: 38px;
          letter-spacing: -0.05em;
        }

        .statCard small {
          color: #ff70c7;
        }

        .agentPanel {
          border-radius: 28px;
          padding: 24px;
          margin-bottom: 18px;
        }

        .agentPanel h2 {
          margin: 0 0 10px;
          font-size: 28px;
        }

        .agentPanel p {
          margin: 0;
          color: rgba(255, 255, 255, 0.7);
        }

        .progressOuter {
          height: 12px;
          border-radius: 999px;
          overflow: hidden;
          margin-top: 18px;
          background: rgba(255, 255, 255, 0.08);
        }

        .progressInner {
          height: 100%;
          background: linear-gradient(90deg, #ff2ca8, #b44cff);
        }

        .notice {
          margin: 0 0 18px;
          padding: 16px 18px;
          border: 1px solid rgba(255, 90, 190, 0.38);
          border-radius: 18px;
          background: rgba(255, 40, 160, 0.1);
          color: #ffd5ef;
        }

        .toolsGrid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 22px;
        }

        .toolCard {
          border-radius: 28px;
          padding: 24px;
        }

        .toolCard h3 {
          margin: 0 0 14px;
          font-size: 24px;
        }

        .toolCard p {
          color: rgba(255, 255, 255, 0.62);
        }

        .formGrid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        input,
        textarea {
          width: 100%;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 16px;
          padding: 13px 14px;
          background: rgba(0, 0, 0, 0.26);
          color: white;
          outline: none;
        }

        textarea {
          min-height: 96px;
          margin: 10px 0;
          resize: vertical;
        }

        .kanban {
          display: grid;
          grid-template-columns: repeat(6, minmax(260px, 1fr));
          gap: 16px;
          overflow-x: auto;
          padding-bottom: 18px;
        }

        .column {
          min-height: 500px;
          border-radius: 26px;
          padding: 16px;
        }

        .columnHeader {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 14px;
        }

        .columnHeader h3 {
          margin: 0;
          font-size: 18px;
        }

        .columnHeader p {
          margin: 6px 0 0;
          color: rgba(255, 255, 255, 0.55);
          font-size: 13px;
        }

        .columnHeader strong {
          display: grid;
          place-items: center;
          min-width: 34px;
          height: 34px;
          border-radius: 999px;
          background: rgba(255, 0, 160, 0.18);
          color: #ff8ed2;
        }

        .cards {
          display: grid;
          gap: 12px;
        }

        .leadCard {
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 22px;
          padding: 15px;
          background: rgba(5, 5, 16, 0.72);
          cursor: grab;
        }

        .leadCard:active {
          cursor: grabbing;
        }

        .leadTop {
          display: flex;
          justify-content: space-between;
          gap: 12px;
        }

        .leadTop h4 {
          margin: 0;
          font-size: 17px;
        }

        .leadTop span {
          display: grid;
          place-items: center;
          min-width: 34px;
          height: 34px;
          border-radius: 999px;
          background: rgba(255, 80, 180, 0.16);
          color: #ff80d0;
          font-weight: 900;
        }

        .meta,
        .lgpd,
        .notes {
          color: rgba(255, 255, 255, 0.62);
          font-size: 13px;
          line-height: 1.45;
        }

        .lgpd {
          color: #ff8ed2;
        }

        a {
          display: block;
          color: #d9b8ff;
          font-size: 13px;
          margin: 7px 0;
          text-decoration: none;
        }

        .cardActions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }

        .cardActions button {
          padding: 8px 10px;
          font-size: 12px;
        }

        .emptyDrop {
          display: grid;
          place-items: center;
          min-height: 120px;
          border: 1px dashed rgba(255, 90, 190, 0.28);
          border-radius: 20px;
          color: rgba(255, 255, 255, 0.42);
        }

        @media (max-width: 1100px) {
          .statsGrid,
          .toolsGrid {
            grid-template-columns: 1fr 1fr;
          }

          .kanban {
            grid-template-columns: repeat(6, 280px);
          }
        }

        @media (max-width: 720px) {
          .prospectorPage {
            padding: 18px;
          }

          .hero {
            flex-direction: column;
            align-items: stretch;
            padding: 24px;
          }

          .statsGrid,
          .toolsGrid,
          .formGrid {
            grid-template-columns: 1fr;
          }

          .agentButton {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
