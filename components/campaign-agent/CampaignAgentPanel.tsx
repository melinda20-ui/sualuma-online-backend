"use client";

import { useEffect, useState } from "react";

export default function CampaignAgentPanel() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/campaign-agent", { cache: "no-store" });
    setData(await res.json());
  }

  async function action(type: string) {
    setLoading(true);
    await fetch("/api/campaign-agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: type }),
    });
    await load();
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const state = data?.state;
  const stats = data?.stats;

  return (
    <main style={{ minHeight: "100vh", background: "#070914", color: "#fff", padding: 24, fontFamily: "Inter, system-ui, sans-serif" }}>
      <section style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ border: "1px solid rgba(125,92,255,.35)", borderRadius: 24, padding: 24, background: "linear-gradient(135deg, rgba(29,38,80,.95), rgba(8,10,22,.98))" }}>
          <p style={{ color: "#91a7ff", fontWeight: 800, margin: 0 }}>AGENTE DE CAMPANHA ÉTICA</p>
          <h1 style={{ fontSize: 38, margin: "10px 0" }}>Sequência automática de vendas do Sualuma</h1>
          <p style={{ color: "#cbd5e1", maxWidth: 820 }}>
            Estrutura ativa: 4 dias com 2 e-mails por dia, manutenção com conteúdo/oferta e cheque-mate após 14 dias.
            O agente só trabalha com leads que tenham consentimento/opt-in.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
            <button disabled={loading} onClick={() => action("start")} style={btn("#22c55e")}>Iniciar automático</button>
            <button disabled={loading} onClick={() => action("pause")} style={btn("#ef4444")}>Pausar</button>
            <button disabled={loading} onClick={() => action("run-batch")} style={btn("#6366f1")}>Rodar agora</button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginTop: 18 }}>
          <Card title="Status" value={state?.active ? "Ativo" : "Pausado"} />
          <Card title="Contatos na sequência" value={stats?.contacts ?? 0} />
          <Card title="E-mails prontos" value={stats?.ready ?? 0} />
          <Card title="Enviados" value={stats?.sent ?? 0} />
          <Card title="Agendados" value={stats?.scheduled ?? 0} />
          <Card title="Erros" value={stats?.error ?? 0} />
        </div>

        <div style={{ marginTop: 18, border: "1px solid rgba(255,255,255,.12)", borderRadius: 20, padding: 20, background: "rgba(255,255,255,.04)" }}>
          <h2>Mensagem do agente</h2>
          <p style={{ color: "#cbd5e1" }}>{state?.lastMessage || "Carregando..."}</p>
          <p style={{ color: "#94a3b8", fontSize: 14 }}>
            Envio real: {data?.sendRealEmailsEnabled ? "ativado via CAMPAIGN_AGENT_SEND_ENABLED=true" : "modo seguro/draft ativo"}.
          </p>
        </div>
      </section>
    </main>
  );
}

function Card({ title, value }: { title: string; value: any }) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,.1)", borderRadius: 18, padding: 18, background: "rgba(255,255,255,.05)" }}>
      <p style={{ color: "#94a3b8", margin: 0, fontSize: 13 }}>{title}</p>
      <strong style={{ fontSize: 26 }}>{value}</strong>
    </div>
  );
}

function btn(color: string): React.CSSProperties {
  return {
    border: 0,
    borderRadius: 14,
    padding: "12px 16px",
    background: color,
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  };
}
