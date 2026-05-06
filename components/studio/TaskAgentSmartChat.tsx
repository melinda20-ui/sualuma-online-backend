"use client";

import { useEffect, useRef, useState } from "react";

type Summary = {
  total?: number;
  open?: number;
  done?: number;
  urgent?: number;
  bugs?: number;
};

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
  speak?: string;
};

export default function TaskAgentSmartChat() {
  const [open, setOpen] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [summary, setSummary] = useState<Summary>({
    total: 0,
    open: 0,
    urgent: 0,
    bugs: 0,
  });
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text:
        "Oi, Luma. Eu sou o Agente de Tarefas IA.\n\nAgora o chat está em modo leitura: texto maior, fundo mais sólido e campo de escrita fixo embaixo.\n\nVocê pode pedir:\n• o que faço agora?\n• resumo das tarefas\n• atualizações do agente de usuários\n• problemas do Cérebro Azul\n• criar tarefa: nome da tarefa\n• marcar tarefa X como concluída",
    },
  ]);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const lastSpeakRef = useRef("");

  function speak(text: string) {
    if (!text || typeof window === "undefined") return;
    lastSpeakRef.current = text;

    if (!audioEnabled) return;
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    utterance.rate = 0.95;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }

  function stopAudio() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  function hearLast() {
    if (!lastSpeakRef.current) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(lastSpeakRef.current);
    utterance.lang = "pt-BR";
    utterance.rate = 0.95;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }

  async function sendMessage(text?: string) {
    const message = (text || input).trim();
    if (!message || loading) return;

    setInput("");
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", text: message }]);

    try {
      const res = await fetch("/api/agent-tasks/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const data = await res.json();

      const reply =
        data?.reply ||
        "Não consegui ler a resposta do agente agora. Tente novamente em alguns segundos.";

      const speakText = data?.speak || reply.slice(0, 500);

      if (data?.summary) {
        setSummary(data.summary);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: reply,
          speak: speakText,
        },
      ]);

      speak(speakText);
    } catch (error) {
      const fallback =
        "Tive um erro ao conversar com o agente de tarefas. Verifique se o Next está online e tente de novo.";
      setMessages((prev) => [...prev, { role: "assistant", text: fallback }]);
      speak(fallback);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!open) stopAudio();
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          right: 22,
          bottom: 22,
          zIndex: 9998,
          border: "1px solid rgba(147,197,253,.65)",
          borderRadius: 999,
          padding: "14px 20px",
          background:
            "linear-gradient(135deg, rgba(37,99,235,.95), rgba(147,51,234,.95))",
          color: "white",
          fontWeight: 900,
          fontSize: 13,
          boxShadow: "0 0 30px rgba(59,130,246,.6)",
          cursor: "pointer",
        }}
      >
        🤖 Tarefas IA
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            right: 18,
            bottom: 86,
            width: "min(980px, calc(100vw - 18px))",
            height: "min(92vh, 860px)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderRadius: 26,
            border: "1px solid rgba(96,165,250,.7)",
            background:
              "linear-gradient(180deg, rgba(3,7,18,.98), rgba(15,23,42,.98))",
            boxShadow:
              "0 0 0 1px rgba(255,255,255,.06), 0 30px 90px rgba(0,0,0,.75), 0 0 50px rgba(37,99,235,.35)",
            color: "white",
          }}
        >
          <div
            style={{
              padding: "14px 18px 10px",
              borderBottom: "1px solid rgba(148,163,184,.22)",
              background:
                "linear-gradient(135deg, rgba(30,64,175,.5), rgba(88,28,135,.35))",
            }}
          >
            <div style={{ display: "flex", alignItems: "start", gap: 14 }}>
              <div style={{ flex: 1 }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 23,
                    lineHeight: 1.1,
                    letterSpacing: "-.04em",
                    fontWeight: 950,
                  }}
                >
                  Agente de Tarefas IA
                </h2>
                <p
                  style={{
                    margin: "8px 0 0",
                    color: "rgba(226,232,240,.92)",
                    fontSize: 13,
                    lineHeight: 1.35,
                    fontWeight: 600,
                  }}
                >
                  Lê contexto real, cria tarefas, muda status e fala em voz alta.
                </p>
              </div>

              <button
                onClick={() => setOpen(false)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,.18)",
                  background: "rgba(15,23,42,.75)",
                  color: "white",
                  fontSize: 22,
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: 8,
                marginTop: 10,
              }}
            >
              {[
                ["Total", summary.total ?? 0],
                ["Abertas", summary.open ?? 0],
                ["Urgentes", summary.urgent ?? 0],
                ["Bugs", summary.bugs ?? 0],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  style={{
                    borderRadius: 18,
                    padding: "9px 11px",
                    background: "rgba(37,99,235,.34)",
                    border: "1px solid rgba(147,197,253,.26)",
                  }}
                >
                  <div
                    style={{
                      color: "rgba(219,234,254,.9)",
                      fontSize: 13,
                      fontWeight: 800,
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 23,
                      lineHeight: 1,
                      fontWeight: 950,
                    }}
                  >
                    {value}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 9,
                overflowX: "auto",
                paddingBottom: 2,
              }}
            >
              <button onClick={() => setAudioEnabled((v) => !v)} style={pillStyle}>
                {audioEnabled ? "🔊 Áudio ligado" : "🔇 Áudio desligado"}
              </button>
              <button onClick={hearLast} style={pillStyle}>
                Ouvir última resposta
              </button>
              <button onClick={stopAudio} style={pillStyle}>
                Parar áudio
              </button>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              padding: "8px 14px",
              overflowX: "auto",
              borderBottom: "1px solid rgba(148,163,184,.16)",
              background: "rgba(2,6,23,.72)",
            }}
          >
            {[
              "O que faço agora?",
              "Resumo das tarefas",
              "Tarefas urgentes",
              "Atualizações do agente de usuários",
              "Problemas do Cérebro Azul",
            ].map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                style={{
                  ...pillStyle,
                  whiteSpace: "nowrap",
                  fontSize: 13,
                  padding: "8px 12px",
                }}
              >
                {q}
              </button>
            ))}
          </div>

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden",
              padding: "18px 20px 14px",
              background:
                "linear-gradient(180deg, rgba(15,23,42,.94), rgba(2,6,23,.98))",
            }}
          >
            {messages.map((m, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    maxWidth: m.role === "user" ? "82%" : "96%",
                    borderRadius: 20,
                    padding: "15px 17px",
                    background:
                      m.role === "user"
                        ? "linear-gradient(135deg, rgba(37,99,235,.95), rgba(124,58,237,.92))"
                        : "rgba(15,23,42,.96)",
                    border:
                      m.role === "user"
                        ? "1px solid rgba(191,219,254,.35)"
                        : "1px solid rgba(148,163,184,.22)",
                    color: "white",
                    fontSize: 15.5,
                    lineHeight: 1.5,
                    fontWeight: 600,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    overflowWrap: "anywhere",
                    boxShadow:
                      m.role === "assistant"
                        ? "0 18px 45px rgba(0,0,0,.28)"
                        : "0 16px 35px rgba(37,99,235,.22)",
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {loading && (
              <div
                style={{
                  color: "rgba(226,232,240,.85)",
                  fontSize: 15,
                  fontWeight: 700,
                  padding: "10px 2px",
                }}
              >
                Pensando e lendo a fila real...
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div
            style={{
              padding: 10,
              borderTop: "1px solid rgba(148,163,184,.22)",
              background: "rgba(2,6,23,.98)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 10,
                alignItems: "end",
              }}
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder='Ex: "me mostre problemas do Cérebro Azul" ou "marcar tarefa X como concluída"'
                style={{
                  width: "100%",
                  minHeight: 46,
                  maxHeight: 86,
                  resize: "vertical",
                  borderRadius: 18,
                  border: "1px solid rgba(147,197,253,.35)",
                  background: "rgba(15,23,42,.98)",
                  color: "white",
                  padding: "10px 13px",
                  fontSize: 16,
                  lineHeight: 1.35,
                  outline: "none",
                  boxShadow: "inset 0 0 0 1px rgba(255,255,255,.03)",
                }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                style={{
                  minHeight: 46,
                  borderRadius: 18,
                  border: "1px solid rgba(191,219,254,.45)",
                  background:
                    loading || !input.trim()
                      ? "rgba(71,85,105,.65)"
                      : "linear-gradient(135deg, #38bdf8, #8b5cf6)",
                  color: "white",
                  padding: "0 18px",
                  fontSize: 16,
                  fontWeight: 950,
                  cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                }}
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const pillStyle: React.CSSProperties = {
  borderRadius: 999,
  border: "1px solid rgba(147,197,253,.35)",
  background: "rgba(15,23,42,.8)",
  color: "white",
  padding: "8px 12px",
  fontWeight: 850,
  fontSize: 13,
  cursor: "pointer",
};
