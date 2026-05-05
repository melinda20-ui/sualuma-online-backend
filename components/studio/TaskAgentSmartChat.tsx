"use client";

import { useMemo, useState } from "react";

type Msg = {
  role: "user" | "assistant";
  text: string;
};

type Summary = {
  total: number;
  open: number;
  done: number;
  urgent: number;
  bugs: number;
};

function speak(text: string) {
  if (typeof window === "undefined") return;
  if (!("speechSynthesis" in window)) {
    alert("Seu navegador não liberou leitura por voz.");
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "pt-BR";
  utterance.rate = 1;
  utterance.pitch = 1;

  const voices = window.speechSynthesis.getVoices();
  const brVoice =
    voices.find((v) => v.lang?.toLowerCase().includes("pt-br")) ||
    voices.find((v) => v.lang?.toLowerCase().startsWith("pt")) ||
    voices[0];

  if (brVoice) utterance.voice = brVoice;
  window.speechSynthesis.speak(utterance);
}

export default function TaskAgentSmartChat() {
  const [open, setOpen] = useState(false);
  const [autoAudio, setAutoAudio] = useState(false);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [lastSpeak, setLastSpeak] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text:
        "Oi, eu sou o Agente de Tarefas. Agora eu consigo buscar contexto real, criar tarefas e mudar status quando você pedir."
    }
  ]);

  const quicks = useMemo(
    () => [
      "me passa as tarefas que impedem venda e usuários hoje",
      "resumo das tarefas",
      "tarefas urgentes",
      "tarefas de onboarding",
      "tarefas de usuários e acesso"
    ],
    []
  );

  async function send(text?: string) {
    const value = (text || input).trim();
    if (!value || loading) return;

    setInput("");
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", text: value }]);

    try {
      const res = await fetch("/api/agent-tasks/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: value })
      });

      const data = await res.json();
      const reply = data.reply || data.error || "Não consegui responder agora.";
      const audio = data.speak || reply;

      setSummary(data.summary || null);
      setLastSpeak(audio);
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);

      if (autoAudio) speak(audio);
    } catch {
      const err = "Erro ao conversar com o Agente de Tarefas.";
      setMessages((prev) => [...prev, { role: "assistant", text: err }]);
      setLastSpeak(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          right: 22,
          bottom: 22,
          zIndex: 9999,
          border: "1px solid rgba(124,92,255,.7)",
          background: "linear-gradient(135deg, rgba(79,70,229,.95), rgba(168,85,247,.95))",
          color: "white",
          borderRadius: 999,
          padding: "14px 18px",
          fontWeight: 900,
          boxShadow: "0 0 35px rgba(90,80,255,.55)",
          cursor: "pointer"
        }}
      >
        🤖 Tarefas IA
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            right: 18,
            bottom: 82,
            width: "min(680px, calc(100vw - 28px))",
            maxHeight: "82vh",
            zIndex: 10000,
            borderRadius: 28,
            overflow: "hidden",
            border: "1px solid rgba(99,102,241,.55)",
            background: "rgba(8, 10, 32, .94)",
            color: "white",
            boxShadow: "0 0 70px rgba(59,130,246,.35)",
            backdropFilter: "blur(18px)"
          }}
        >
          <div style={{ padding: 18, borderBottom: "1px solid rgba(255,255,255,.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 22 }}>Agente de Tarefas IA</h2>
                <p style={{ margin: "6px 0 0", color: "rgba(255,255,255,.72)" }}>
                  Busca contexto real, cria tarefas, muda status e lê em voz alta.
                </p>
              </div>

              <button
                onClick={() => setOpen(false)}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,.2)",
                  background: "rgba(255,255,255,.06)",
                  color: "white",
                  cursor: "pointer",
                  fontSize: 20
                }}
              >
                ×
              </button>
            </div>

            {summary && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, minmax(0,1fr))",
                  gap: 10,
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
                    key={label}
                    style={{
                      padding: 12,
                      borderRadius: 16,
                      background: "rgba(37,99,235,.22)",
                      border: "1px solid rgba(96,165,250,.25)"
                    }}
                  >
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,.65)" }}>{label}</div>
                    <div style={{ fontSize: 24, fontWeight: 950 }}>{value}</div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
              <button
                onClick={() => {
                  const next = !autoAudio;
                  setAutoAudio(next);
                  if (next && lastSpeak) speak(lastSpeak);
                }}
                style={pill(autoAudio)}
              >
                {autoAudio ? "🔊 Áudio ligado" : "🔇 Áudio desligado"}
              </button>

              <button onClick={() => lastSpeak && speak(lastSpeak)} style={pill(false)}>
                Ouvir última resposta
              </button>

              <button onClick={() => window.speechSynthesis?.cancel()} style={pill(false)}>
                Parar áudio
              </button>
            </div>
          </div>

          <div
            style={{
              padding: 16,
              height: "min(430px, 46vh)",
              overflowY: "auto",
              background:
                "radial-gradient(circle at top left, rgba(59,130,246,.24), transparent 35%), radial-gradient(circle at bottom right, rgba(168,85,247,.22), transparent 38%)"
            }}
          >
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 12 }}>
              {quicks.map((q) => (
                <button key={q} onClick={() => send(q)} style={pill(false)}>
                  {q}
                </button>
              ))}
            </div>

            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                  margin: "10px 0"
                }}
              >
                <div
                  style={{
                    maxWidth: "92%",
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.45,
                    padding: "13px 15px",
                    borderRadius: 18,
                    background:
                      m.role === "user"
                        ? "linear-gradient(135deg, rgba(37,99,235,.95), rgba(124,58,237,.95))"
                        : "rgba(255,255,255,.09)",
                    border: "1px solid rgba(255,255,255,.12)"
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ opacity: 0.75, padding: 12 }}>
                Consultando tarefas reais...
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            style={{
              display: "flex",
              gap: 10,
              padding: 14,
              borderTop: "1px solid rgba(255,255,255,.1)",
              background: "rgba(2,6,23,.8)"
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='Ex: "criar tarefa: revisar checkout" ou "marcar checkout como concluída"'
              style={{
                flex: 1,
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,.18)",
                background: "rgba(255,255,255,.08)",
                color: "white",
                padding: "14px 16px",
                outline: "none"
              }}
            />
            <button
              disabled={loading}
              style={{
                border: 0,
                borderRadius: 999,
                padding: "0 22px",
                background: loading
                  ? "rgba(148,163,184,.5)"
                  : "linear-gradient(135deg, #38bdf8, #8b5cf6)",
                color: "white",
                fontWeight: 900,
                cursor: loading ? "wait" : "pointer"
              }}
            >
              Enviar
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function pill(active: boolean): React.CSSProperties {
  return {
    borderRadius: 999,
    border: active ? "1px solid rgba(34,211,238,.85)" : "1px solid rgba(255,255,255,.18)",
    background: active ? "rgba(14,165,233,.24)" : "rgba(255,255,255,.07)",
    color: "white",
    padding: "10px 13px",
    fontWeight: 800,
    cursor: "pointer",
    whiteSpace: "nowrap"
  };
}
