"use client";

import { useEffect, useState } from "react";

type SystemStatus = {
  api: string;
  gemini: string;
  ollama: { online: boolean; models: string[] } | string;
  uptime: number;
  memory?: { heapUsed: number; heapTotal: number; rss: number };
};

type UserProfile = {
  credits: number;
  plan: string;
  role: string;
  email?: string;
};

const AGENT_API = "/api/agent-api";

function fmtUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function fmtMemory(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function SystemTruthPanel({ userId }: { userId?: string }) {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setError(null);
        const res = await fetch(`${AGENT_API}/status`);
        if (!res.ok) throw new Error(`Status API: HTTP ${res.status}`);
        const data: SystemStatus = await res.json();
        if (!cancelled) setStatus(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Erro ao conectar");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  if (error) {
    return (
      <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 16, padding: 16, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <strong style={{ color: "#fcd34d", fontSize: 13 }}>Backend de agentes offline</strong>
          <span style={{ fontSize: 11, color: "rgba(148,163,184,.7)", marginLeft: "auto" }}>Proxy: {AGENT_API}/status</span>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: "rgba(148,163,184,.7)" }}>{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ background: "rgba(30,41,59,.5)", borderRadius: 16, padding: 16, marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: "rgba(148,163,184,.6)" }}>Conectando ao backend de agentes...</div>
      </div>
    );
  }

  if (!status) return null;

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ background: "rgba(16,185,129,.15)", color: "#6ee7b7", fontSize: 10, fontWeight: 800, letterSpacing: ".5px", textTransform: "uppercase", padding: "2px 8px", borderRadius: 999, border: "1px solid rgba(16,185,129,.3)" }}>
          Dados Reais
        </span>
        <span style={{ fontSize: 11, color: "rgba(148,163,184,.5)" }}>
          Fonte: Agentes API
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
        <TruthCard label="Sistema" value={fmtUptime(status.uptime)} detail="Tempo de atividade da API" />
        <TruthCard
          label="Google Gemini"
          value={status.gemini === "configured" ? "Configurado" : "Ausente"}
          detail={status.gemini === "configured" ? "Chave API ativa" : "Chave API não configurada"}
          color={status.gemini === "configured" ? "#6ee7b7" : "#a1a1aa"}
        />
        <TruthCard
          label="Ollama (Mia)"
          value={typeof status.ollama === "object" && status.ollama.online ? "Online" : "Offline"}
          detail={typeof status.ollama === "object" && status.ollama.models?.length ? `${status.ollama.models.length} modelos` : "Fallback Gemini"}
          color={typeof status.ollama === "object" && status.ollama.online ? "#6ee7b7" : "#a1a1aa"}
        />
        <TruthCard
          label="Memória"
          value={status.memory ? fmtMemory(status.memory.heapUsed) : "—"}
          detail={status.memory ? `Total: ${fmtMemory(status.memory.heapTotal)}` : "Indisponível"}
        />
      </div>
    </div>
  );
}

function TruthCard({ label, value, detail, color }: { label: string; value: string; detail: string; color?: string }) {
  return (
    <div style={{ background: "rgba(15,23,42,.6)", border: "1px solid rgba(148,163,184,.12)", borderRadius: 12, padding: "14px 16px" }}>
      <div style={{ fontSize: 11, color: "rgba(148,163,184,.5)", fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: color || "#e2e8f0", lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: 11, color: "rgba(148,163,184,.5)", marginTop: 2 }}>{detail}</div>
    </div>
  );
}
