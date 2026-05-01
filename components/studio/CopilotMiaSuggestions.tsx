"use client";

import { useEffect, useMemo, useState } from "react";

type Level = "ok" | "attention" | "critical";

type CopilotCheck = {
  name: string;
  status: string;
  detail: string;
};

type CopilotPayload = {
  ok: boolean;
  level: Level;
  summary: string;
  alerts: number;
  criticals: number;
  suggestions: string[];
  checks: CopilotCheck[];
  generated_at?: string;
};

const labelByLevel: Record<Level, string> = {
  ok: "Sistema estável",
  attention: "Atenção",
  critical: "Urgente",
};

const emojiByLevel: Record<Level, string> = {
  ok: "✅",
  attention: "⚠️",
  critical: "🚨",
};

const borderByLevel: Record<Level, string> = {
  ok: "rgba(34,197,94,.35)",
  attention: "rgba(245,158,11,.45)",
  critical: "rgba(239,68,68,.55)",
};

export function CopilotMiaSuggestions() {
  const [data, setData] = useState<CopilotPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    fetch(`/api/studio/copilot?t=${Date.now()}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((payload) => {
        if (alive) setData(payload);
      })
      .catch(() => {
        if (alive) {
          setData({
            ok: false,
            level: "attention",
            summary: "Não consegui carregar o Copiloto agora.",
            alerts: 1,
            criticals: 0,
            suggestions: ["⚠️ Verifique se /api/studio/copilot está respondendo."],
            checks: [],
          });
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const level: Level = data?.level || "attention";

  const visibleSuggestions = useMemo(() => {
    if (!data?.suggestions?.length) return ["Aguardando primeira leitura do Copiloto."];
    return data.suggestions.slice(0, 5);
  }, [data]);

  const problemChecks = useMemo(() => {
    return (data?.checks || []).filter((check) => check.status !== "ok").slice(0, 4);
  }, [data]);

  return (
    <section
      style={{
        marginTop: 18,
        marginBottom: 18,
        padding: 18,
        borderRadius: 24,
        border: `1px solid ${borderByLevel[level]}`,
        background:
          "linear-gradient(135deg, rgba(15,23,42,.92), rgba(31,41,55,.88)), radial-gradient(circle at top right, rgba(124,58,237,.22), transparent 35%)",
        color: "#fff",
        boxShadow: "0 24px 70px rgba(15,23,42,.25)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
        <div>
          <p style={{ margin: 0, color: "#a5b4fc", fontSize: 12, fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase" }}>
            Copiloto operacional
          </p>
          <h3 style={{ margin: "6px 0 6px", fontSize: 22 }}>
            {emojiByLevel[level]} Sugestões inteligentes da Mia
          </h3>
          <p style={{ margin: 0, color: "#cbd5e1", maxWidth: 760 }}>
            {loading ? "Lendo o último relatório do sistema..." : data?.summary}
          </p>
        </div>

        <div
          style={{
            alignSelf: "flex-start",
            borderRadius: 999,
            padding: "9px 13px",
            background: "rgba(255,255,255,.1)",
            border: "1px solid rgba(255,255,255,.14)",
            fontSize: 13,
            fontWeight: 800,
            whiteSpace: "nowrap",
          }}
        >
          {labelByLevel[level]} · {data?.alerts ?? 0} alerta(s)
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, marginTop: 16 }}>
        <div style={{ borderRadius: 18, padding: 14, background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.1)" }}>
          <strong>Alertas</strong>
          <p style={{ margin: "6px 0 0", color: "#cbd5e1" }}>
            {data?.alerts ?? 0} total · {data?.criticals ?? 0} crítico(s)
          </p>
        </div>

        <div style={{ borderRadius: 18, padding: 14, background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.1)" }}>
          <strong>Última leitura</strong>
          <p style={{ margin: "6px 0 0", color: "#cbd5e1" }}>{data?.generated_at || "agora"}</p>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <strong>O que a Mia recomenda agora:</strong>
        <ul style={{ margin: "10px 0 0", paddingLeft: 20, color: "#e2e8f0", lineHeight: 1.7 }}>
          {visibleSuggestions.map((item, index) => (
            <li key={`${item}-${index}`}>{item}</li>
          ))}
        </ul>
      </div>

      {problemChecks.length > 0 && (
        <div style={{ marginTop: 14, borderTop: "1px solid rgba(255,255,255,.1)", paddingTop: 12 }}>
          <strong>Pontos que precisam de atenção:</strong>
          <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
            {problemChecks.map((check) => (
              <div key={`${check.name}-${check.detail}`} style={{ color: "#cbd5e1", fontSize: 14 }}>
                <b style={{ color: "#fff" }}>{check.name}:</b> {check.detail}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
