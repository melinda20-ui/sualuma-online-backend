"use client";

import { useEffect, useRef, useState } from "react";

type Msg = {
  role: "user" | "assistant";
  content: string;
};

const STORAGE_KEY = "chatcode:messages";

function renderMarkdown(text: string) {
  const html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br>");
  return html;
}

export default function ChatCodePage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setMessages(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const newMessages: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chatcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      const json = await res.json();

      if (json?.ok && json?.reply) {
        setMessages([...newMessages, { role: "assistant", content: json.reply }]);
      } else {
        setMessages([
          ...newMessages,
          { role: "assistant", content: json?.reply || "Sem resposta." },
        ]);
      }
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Erro de conexão com o servidor." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function clearChat() {
    if (messages.length === 0) return;
    if (confirm("Limpar todo o histórico?")) {
      setMessages([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes pulse-dot {
          0%, 80%, 100% { opacity: 0; }
          40% { opacity: 1; }
        }
        .typing-dot { animation: pulse-dot 1.4s infinite; }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        pre { background: rgba(0,0,0,0.3); border-radius: 8px; padding: 12px; overflow-x: auto; margin: 8px 0; }
        code { background: rgba(0,0,0,0.2); padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
        pre code { background: none; padding: 0; }
        textarea:focus { outline: none; }
      `}</style>

      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.logo}>&#x2328;</span>
          <span style={styles.title}>ChatCode</span>
          <span style={styles.subtitle}>Terminal IA</span>
        </div>
        <button onClick={clearChat} style={styles.clearBtn} title="Limpar histórico">
          &#x1F5D1;
        </button>
      </header>

      <div style={styles.chatArea}>
        {messages.length === 0 && (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>&#x2328;</div>
            <p style={styles.emptyText}>Conectado ao terminal IA</p>
            <p style={styles.emptyHint}>Digite sua mensagem abaixo para começar</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              ...styles.messageRow,
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                ...styles.bubble,
                background:
                  msg.role === "user"
                    ? "linear-gradient(135deg, #7c3aed, #3b82f6)"
                    : "rgba(255,255,255,0.06)",
                border: msg.role === "user" ? "none" : "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div
                style={styles.bubbleText}
                dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
              />
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ ...styles.messageRow, justifyContent: "flex-start" }}>
            <div
              style={{
                ...styles.bubble,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
                padding: "14px 18px",
              }}
            >
              <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <span className="typing-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: "#a78bfa" }} />
                <span className="typing-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: "#a78bfa" }} />
                <span className="typing-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: "#a78bfa" }} />
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={styles.inputArea}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua mensagem..."
          rows={1}
          style={styles.input}
          disabled={loading}
        />
        <button onClick={send} disabled={loading || !input.trim()} style={styles.sendBtn}>
          &#x27A4;
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "linear-gradient(135deg, #09090f 0%, #10101c 50%, #07070c 100%)",
    color: "#f4f1ff",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(0,0,0,0.2)",
    flexShrink: 0,
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 10 },
  logo: { fontSize: 22 },
  title: { fontSize: 18, fontWeight: 700, color: "#fff" },
  subtitle: { fontSize: 13, color: "rgba(255,255,255,0.35)", fontWeight: 400 },
  clearBtn: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
    color: "rgba(255,255,255,0.4)",
    padding: "6px 10px",
    cursor: "pointer",
    fontSize: 16,
  },
  chatArea: {
    flex: 1,
    overflowY: "auto",
    padding: "20px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    gap: 8,
  },
  emptyIcon: { fontSize: 48, opacity: 0.3 },
  emptyText: { fontSize: 16, color: "rgba(255,255,255,0.4)", margin: 0 },
  emptyHint: { fontSize: 13, color: "rgba(255,255,255,0.2)", margin: 0 },
  messageRow: {
    display: "flex",
    width: "100%",
  },
  bubble: {
    maxWidth: "80%",
    borderRadius: 16,
    padding: "10px 16px",
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 1.55,
    color: "rgba(255,255,255,0.9)",
    wordBreak: "break-word",
  },
  inputArea: {
    display: "flex",
    gap: 8,
    padding: "12px 16px",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(0,0,0,0.15)",
    flexShrink: 0,
  },
  input: {
    flex: 1,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: "12px 16px",
    color: "#fff",
    fontSize: 14,
    resize: "none",
    fontFamily: "inherit",
    lineHeight: 1.4,
    minHeight: 46,
    maxHeight: 120,
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
    color: "#fff",
    fontSize: 20,
    cursor: "pointer",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};
