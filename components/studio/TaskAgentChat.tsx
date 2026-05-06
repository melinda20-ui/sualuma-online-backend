"use client";

import { useEffect, useRef, useState } from "react";

type Msg = {
  role: "user" | "agent";
  text: string;
};

export default function TaskAgentChat() {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const [summary, setSummary] = useState<any>(null);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "agent",
      text: "Oi, eu sou o Agente de Tarefas. Posso te dizer prioridades, bugs, tarefas do onboarding, blog, site ou criar novas tarefas."
    }
  ]);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch("/api/agent-tasks/chat")
      .then((r) => r.json())
      .then((data) => {
        if (data?.summary) setSummary(data.summary);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function send(text?: string) {
    const message = (text || input).trim();
    if (!message || sending) return;

    setInput("");
    setSending(true);
    setMessages((prev) => [...prev, { role: "user", text: message }]);

    try {
      const res = await fetch("/api/agent-tasks/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });

      const data = await res.json();

      if (data?.summary) setSummary(data.summary);

      setMessages((prev) => [
        ...prev,
        {
          role: "agent",
          text: data?.reply || "Não consegui responder agora, mas o chat está conectado."
        }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "agent",
          text: "Tive um erro ao falar com a API de tarefas. Verifique o build/logs depois."
        }
      ]);
    } finally {
      setSending(false);
    }
  }

  const quicks = [
    "O que faço agora?",
    "Resumo das tarefas",
    "Tarefas urgentes",
    "Tarefas do onboarding",
    "Tarefas do blog"
  ];

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          position: "fixed",
          right: 22,
          bottom: 22,
          zIndex: 80,
          border: "1px solid rgba(168,85,247,.55)",
          borderRadius: 999,
          padding: "13px 18px",
          background:
            "radial-gradient(circle at 20% 20%, rgba(34,211,238,.35), transparent 30%), linear-gradient(135deg, rgba(15,23,42,.96), rgba(88,28,135,.95))",
          color: "white",
          boxShadow: "0 0 30px rgba(124,58,237,.55)",
          fontWeight: 800,
          cursor: "pointer"
        }}
      >
        🤖 Tarefas
      </button>

      {open && (
        <section
          style={{
            position: "fixed",
            right: 22,
            bottom: 84,
            zIndex: 80,
            width: "min(420px, calc(100vw - 28px))",
            height: "min(650px, calc(100vh - 120px))",
            border: "1px solid rgba(148,163,184,.22)",
            borderRadius: 24,
            overflow: "hidden",
            background:
              "linear-gradient(180deg, rgba(15,23,42,.98), rgba(30,27,75,.98))",
            color: "white",
            boxShadow: "0 30px 90px rgba(0,0,0,.55), 0 0 40px rgba(59,130,246,.25)",
            display: "flex",
            flexDirection: "column"
          }}
        >
          <header
            style={{
              padding: 18,
              borderBottom: "1px solid rgba(148,163,184,.16)",
              background:
                "radial-gradient(circle at top left, rgba(34,211,238,.18), transparent 35%)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <strong style={{ fontSize: 17 }}>Agente de Tarefas</strong>
                <p style={{ margin: "4px 0 0", color: "#cbd5e1", fontSize: 13 }}>
                  Conversa com a fila real do sistema.
                </p>
              </div>

              <button
                onClick={() => setOpen(false)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 999,
                  border: "1px solid rgba(148,163,184,.25)",
                  background: "rgba(15,23,42,.6)",
                  color: "white",
                  cursor: "pointer"
                }}
              >
                ×
              </button>
            </div>

            {summary && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 8,
                  marginTop: 14
                }}
              >
                {[
                  ["Total", summary.total],
                  ["Abertas", summary.open],
                  ["Urgentes", summary.urgent],
                  ["Bugs", summary.bugs]
                ].map(([label, value]) => (
                  <div
                    key={String(label)}
                    style={{
                      padding: "9px 8px",
                      borderRadius: 14,
                      background: "rgba(255,255,255,.06)",
                      border: "1px solid rgba(255,255,255,.08)"
                    }}
                  >
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{label}</div>
                    <div style={{ fontSize: 19, fontWeight: 900 }}>{String(value)}</div>
                  </div>
                ))}
              </div>
            )}
          </header>

          <div
            style={{
              padding: 14,
              display: "flex",
              gap: 8,
              overflowX: "auto",
              borderBottom: "1px solid rgba(148,163,184,.12)"
            }}
          >
            {quicks.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                style={{
                  flex: "0 0 auto",
                  border: "1px solid rgba(125,211,252,.25)",
                  borderRadius: 999,
                  padding: "8px 11px",
                  background: "rgba(14,165,233,.10)",
                  color: "#e0f2fe",
                  fontSize: 12,
                  cursor: "pointer"
                }}
              >
                {q}
              </button>
            ))}
          </div>

          <main
            style={{
              flex: 1,
              overflowY: "auto",
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 12
            }}
          >
            {messages.map((m, index) => (
              <div
                key={index}
                style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "88%",
                  whiteSpace: "pre-wrap",
                  padding: "11px 13px",
                  borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background:
                    m.role === "user"
                      ? "linear-gradient(135deg, rgba(37,99,235,.9), rgba(124,58,237,.9))"
                      : "rgba(255,255,255,.07)",
                  border: "1px solid rgba(255,255,255,.08)",
                  color: "white",
                  fontSize: 14,
                  lineHeight: 1.45
                }}
              >
                {m.text}
              </div>
            ))}

            {sending && (
              <div
                style={{
                  alignSelf: "flex-start",
                  padding: "10px 12px",
                  borderRadius: 16,
                  background: "rgba(255,255,255,.07)",
                  color: "#cbd5e1",
                  fontSize: 13
                }}
              >
                Analisando tarefas...
              </div>
            )}

            <div ref={bottomRef} />
          </main>

          <footer
            style={{
              padding: 14,
              borderTop: "1px solid rgba(148,163,184,.16)",
              display: "flex",
              gap: 10
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              placeholder='Ex: "o que faço agora?" ou "criar tarefa: revisar checkout"'
              style={{
                flex: 1,
                border: "1px solid rgba(148,163,184,.25)",
                borderRadius: 14,
                padding: "12px 13px",
                background: "rgba(15,23,42,.75)",
                color: "white",
                outline: "none",
                fontSize: 13
              }}
            />

            <button
              onClick={() => send()}
              disabled={sending}
              style={{
                border: 0,
                borderRadius: 14,
                padding: "0 15px",
                background: sending
                  ? "rgba(148,163,184,.25)"
                  : "linear-gradient(135deg, #2563eb, #9333ea)",
                color: "white",
                fontWeight: 900,
                cursor: sending ? "not-allowed" : "pointer"
              }}
            >
              Enviar
            </button>
          </footer>
        </section>
      )}
    </>
  );
}
