import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnyObj = Record<string, any>;

async function readJson(file: string, fallback: any) {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), file), "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function badge(text: string, tone: "ok" | "warn" | "danger" | "info" = "info") {
  const colors = {
    ok: "rgba(34,197,94,.16)",
    warn: "rgba(250,204,21,.16)",
    danger: "rgba(239,68,68,.16)",
    info: "rgba(59,130,246,.16)",
  };

  return (
    <span style={{
      display: "inline-flex",
      padding: "6px 10px",
      borderRadius: 999,
      background: colors[tone],
      border: "1px solid rgba(255,255,255,.12)",
      fontSize: 12,
      color: "#e5e7eb"
    }}>
      {text}
    </span>
  );
}

function card(title: string, value: string | number, subtitle: string, link?: string) {
  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(15,23,42,.96), rgba(30,41,59,.92))",
      border: "1px solid rgba(148,163,184,.22)",
      borderRadius: 22,
      padding: 20,
      boxShadow: "0 20px 70px rgba(0,0,0,.28)"
    }}>
      <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 34, fontWeight: 900, color: "#f8fafc", lineHeight: 1 }}>{value}</div>
      <p style={{ color: "#cbd5e1", fontSize: 14, lineHeight: 1.5 }}>{subtitle}</p>
      {link ? (
        <a href={link} style={{
          color: "#67e8f9",
          fontWeight: 800,
          textDecoration: "none",
          fontSize: 14
        }}>
          Abrir →
        </a>
      ) : null}
    </div>
  );
}

export default async function StudioAgentesAdmsPage() {
  const tasks: AnyObj[] = await readJson("data/agent-tasks/tasks.json", []);
  const campaignState = await readJson("data/campaign-agent/state.json", {});
  const campaignQueue = await readJson("data/campaign-agent/queue.json", []);
  const leadsState = await readJson("data/leads-prospector/agent-state.json", {});
  const leads = await readJson("data/leads-prospector/leads.json", []);

  const openTasks = tasks.filter((t) => t.status === "open" || t.status === "doing");
  const urgentTasks = openTasks.filter((t) => t.priority === "urgent");
  const bugs = openTasks.filter((t) => t.type === "bug");

  return (
    <main style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at top left, rgba(6,182,212,.20), transparent 32%), radial-gradient(circle at top right, rgba(168,85,247,.22), transparent 30%), #020617",
      color: "#fff",
      padding: "32px 18px",
      fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    }}>
      <section style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center", marginBottom: 26 }}>
          <div>
            {badge("Studio • Agentes Admin", "ok")}
            <h1 style={{ fontSize: "clamp(32px, 6vw, 58px)", margin: "14px 0 8px", letterSpacing: "-.05em" }}>
              Central de Agentes
            </h1>
            <p style={{ maxWidth: 820, color: "#cbd5e1", fontSize: 17, lineHeight: 1.6 }}>
              Painel central para acompanhar agentes, tarefas, alertas, campanhas, prospecção e próximos módulos do cérebro da Sualuma.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a href="/studio" style={buttonStyle}>Studio</a>
            <a href="/studio/campaign-agent" style={buttonStyle}>Campanhas</a>
            <a href="/leads-prospector" style={buttonStyle}>Prospector</a>
            <a href="/admin/emails" style={buttonStyle}>Admin E-mails</a>
          </div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          gap: 16,
          marginBottom: 22
        }}>
          {card("Tarefas abertas", openTasks.length, "Tudo que os agentes trouxerem vira tarefa, aviso, bug ou checklist.", "/api/agent-tasks")}
          {card("Urgentes", urgentTasks.length, "O que precisa da sua atenção primeiro. Futuro: mandar no WhatsApp/Telegram.")}
          {card("Bugs ativos", bugs.length, "Erros reais da plataforma que precisam ser corrigidos.")}
          {card("Leads em revisão", Array.isArray(leads) ? leads.filter((l) => l.status === "revisar").length : 0, "Leads coletados pelo modo gratuito OpenStreetMap.", "/leads-prospector")}
          {card("Campanhas na fila", Array.isArray(campaignQueue) ? campaignQueue.length : 0, "E-mails preparados/agendados pelo Campaign Agent.", "/studio/campaign-agent")}
          {card("Campanha ativa", campaignState?.active ? "Sim" : "Não", campaignState?.lastMessage || "Sem status recente.", "/studio/campaign-agent")}
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.4fr) minmax(280px, .8fr)",
          gap: 18
        }}>
          <section style={panelStyle}>
            <h2 style={h2Style}>Fila inteligente de tarefas</h2>
            <p style={pStyle}>
              Esta é a primeira versão da central que vai receber tarefas dos agentes. Depois vamos conectar Campaign, Blog, Google/SEO,
              Planos, FlowMind, Usuários e notificações.
            </p>

            <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
              {openTasks.length === 0 ? (
                <div style={emptyStyle}>Nenhuma tarefa aberta agora.</div>
              ) : (
                openTasks.map((task) => (
                  <article key={task.id} style={{
                    padding: 16,
                    borderRadius: 18,
                    background: "rgba(15,23,42,.74)",
                    border: "1px solid rgba(148,163,184,.18)"
                  }}>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                      {badge(task.priority === "urgent" ? "urgente" : task.priority || "média", task.priority === "urgent" ? "danger" : task.priority === "high" ? "warn" : "info")}
                      {badge(task.type || "task", "info")}
                      {badge(task.status || "open", task.status === "doing" ? "warn" : "ok")}
                      {badge(task.source || "system", "info")}
                    </div>
                    <h3 style={{ margin: "8px 0", fontSize: 18 }}>{task.title}</h3>
                    <p style={{ color: "#cbd5e1", lineHeight: 1.55, margin: 0 }}>{task.message}</p>
                    {task.link ? (
                      <a href={task.link} style={{ color: "#67e8f9", display: "inline-block", marginTop: 10, fontWeight: 800, textDecoration: "none" }}>
                        Abrir referência →
                      </a>
                    ) : null}
                  </article>
                ))
              )}
            </div>
          </section>

          <aside style={panelStyle}>
            <h2 style={h2Style}>Próximas conexões</h2>
            <ol style={{ color: "#cbd5e1", lineHeight: 1.7, paddingLeft: 20 }}>
              <li>Campaign Agent salvar rascunhos no Admin de E-mails.</li>
              <li>Prospector só enviar para campanha após aprovação/opt-in.</li>
              <li>Agente SEO/Google alimentar Blog e Campanhas.</li>
              <li>Agente de Blog publicar artigos com imagens.</li>
              <li>Telegram primeiro; WhatsApp oficial depois.</li>
              <li>Agente de Planos informar acessos ao Agente de Usuários.</li>
              <li>Agente FlowMind supervisionar Minha Casa/Minha Empresa.</li>
            </ol>

            <div style={{ marginTop: 18, padding: 14, borderRadius: 16, background: "rgba(6,182,212,.10)", border: "1px solid rgba(103,232,249,.20)" }}>
              <strong>Status do Prospector:</strong>
              <p style={pStyle}>{leadsState?.lastMessage || "Sem status."}</p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

const buttonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "11px 14px",
  borderRadius: 14,
  background: "rgba(15,23,42,.88)",
  border: "1px solid rgba(148,163,184,.25)",
  color: "#e2e8f0",
  textDecoration: "none",
  fontWeight: 800,
  fontSize: 14
};

const panelStyle: React.CSSProperties = {
  background: "rgba(2,6,23,.72)",
  border: "1px solid rgba(148,163,184,.20)",
  borderRadius: 24,
  padding: 22,
  boxShadow: "0 20px 80px rgba(0,0,0,.30)"
};

const h2Style: React.CSSProperties = {
  margin: "0 0 8px",
  fontSize: 24,
  letterSpacing: "-.03em"
};

const pStyle: React.CSSProperties = {
  color: "#cbd5e1",
  lineHeight: 1.55
};

const emptyStyle: React.CSSProperties = {
  padding: 18,
  borderRadius: 16,
  background: "rgba(15,23,42,.66)",
  color: "#94a3b8",
  border: "1px solid rgba(148,163,184,.18)"
};
