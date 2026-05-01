"use client";

import { FormEvent, useRef, useState } from "react";

type Msg = {
  role: "user" | "assistant";
  text: string;
  source?: string;
};

export default function CopilotChatBox() {
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text:
        "Oi, Luma. Eu sou o Copiloto de Lançamento. Posso explicar o relatório, priorizar tarefas e te dizer o que ainda impede o lançamento.",
      source: "copilot",
    },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  async function send(custom?: string) {
    const text = (custom || input).trim();
    if (!text || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    setLoading(true);

    try {
      const res = await fetch("/api/estudio-lab/copilot-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ message: text }),
      });

      const json = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: json?.answer || json?.error || "Não consegui responder agora.",
          source: json?.source || "copilot",
        },
      ]);

      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text:
            "Não consegui conectar no chat agora. O painel pode estar online, mas a API do chat precisa ser revisada.",
          source: "erro",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    send();
  }

  const quick = [
    "O que falta para lançar?",
    "Qual é a prioridade de hoje?",
    "Explica a parte de usuários e login",
    "O que está errado no banco/Supabase?",
  ];

  if (!open) {
    return (
      <button className="copilot-chat-fab" onClick={() => setOpen(true)}>
        💬 Falar com o Copiloto
      </button>
    );
  }

  return (
    <section className="copilot-chat-box">
      <div className="copilot-chat-head">
        <div>
          <span>Chat operacional</span>
          <strong>Fale com o Copiloto</strong>
        </div>
        <button onClick={() => setOpen(false)} aria-label="Fechar chat">
          ×
        </button>
      </div>

      <div className="copilot-chat-quick">
        {quick.map((q) => (
          <button key={q} onClick={() => send(q)} disabled={loading}>
            {q}
          </button>
        ))}
      </div>

      <div className="copilot-chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`copilot-msg ${msg.role}`}>
            <p>{msg.text}</p>
            {msg.role === "assistant" && msg.source ? (
              <small>Fonte: {msg.source === "ollama-local" ? "Ollama local + relatório" : "Relatório do Copiloto"}</small>
            ) : null}
          </div>
        ))}

        {loading ? (
          <div className="copilot-msg assistant">
            <p>Analisando o relatório e pensando em português simples...</p>
          </div>
        ) : null}

        <div ref={bottomRef} />
      </div>

      <form className="copilot-chat-form" onSubmit={submit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pergunte: o que faço primeiro?"
        />
        <button disabled={loading || !input.trim()} type="submit">
          Enviar
        </button>
      </form>

      <style jsx>{`
        .copilot-chat-fab {
          position: fixed;
          right: 22px;
          bottom: 22px;
          z-index: 90;
          border: 0;
          border-radius: 999px;
          padding: 14px 18px;
          font-weight: 800;
          color: #07111f;
          background: linear-gradient(135deg, #38bdf8, #c084fc);
          box-shadow: 0 18px 45px rgba(56, 189, 248, 0.28);
          cursor: pointer;
        }

        .copilot-chat-box {
          position: fixed;
          right: 22px;
          bottom: 22px;
          width: min(430px, calc(100vw - 28px));
          height: min(680px, calc(100vh - 40px));
          z-index: 90;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid rgba(148, 163, 184, 0.28);
          border-radius: 28px;
          background:
            radial-gradient(circle at top left, rgba(56, 189, 248, 0.22), transparent 35%),
            radial-gradient(circle at bottom right, rgba(192, 132, 252, 0.22), transparent 35%),
            rgba(7, 12, 32, 0.94);
          box-shadow: 0 26px 80px rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(18px);
        }

        .copilot-chat-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          padding: 18px 18px 14px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.18);
        }

        .copilot-chat-head span {
          display: block;
          color: rgba(255, 255, 255, 0.54);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          font-weight: 800;
        }

        .copilot-chat-head strong {
          display: block;
          color: #fff;
          font-size: 18px;
        }

        .copilot-chat-head button {
          width: 34px;
          height: 34px;
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 999px;
          color: #fff;
          background: rgba(255, 255, 255, 0.08);
          cursor: pointer;
          font-size: 22px;
          line-height: 1;
        }

        .copilot-chat-quick {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding: 12px 16px;
        }

        .copilot-chat-quick button {
          white-space: nowrap;
          border: 1px solid rgba(56, 189, 248, 0.28);
          border-radius: 999px;
          color: rgba(255, 255, 255, 0.86);
          background: rgba(56, 189, 248, 0.1);
          padding: 8px 10px;
          font-size: 12px;
          cursor: pointer;
        }

        .copilot-chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 8px 16px 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .copilot-msg {
          max-width: 92%;
          border-radius: 18px;
          padding: 12px 13px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .copilot-msg p {
          margin: 0;
          white-space: pre-wrap;
          color: rgba(255, 255, 255, 0.88);
          font-size: 13px;
          line-height: 1.52;
        }

        .copilot-msg small {
          display: block;
          margin-top: 8px;
          color: rgba(255, 255, 255, 0.42);
          font-size: 11px;
        }

        .copilot-msg.assistant {
          align-self: flex-start;
          background: rgba(255, 255, 255, 0.07);
        }

        .copilot-msg.user {
          align-self: flex-end;
          background: linear-gradient(135deg, rgba(56, 189, 248, 0.28), rgba(192, 132, 252, 0.24));
        }

        .copilot-chat-form {
          display: flex;
          gap: 10px;
          padding: 14px;
          border-top: 1px solid rgba(148, 163, 184, 0.18);
        }

        .copilot-chat-form input {
          flex: 1;
          min-width: 0;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 999px;
          color: #fff;
          background: rgba(255, 255, 255, 0.08);
          padding: 12px 14px;
          outline: none;
        }

        .copilot-chat-form input::placeholder {
          color: rgba(255, 255, 255, 0.42);
        }

        .copilot-chat-form button {
          border: 0;
          border-radius: 999px;
          padding: 0 16px;
          font-weight: 800;
          color: #07111f;
          background: linear-gradient(135deg, #38bdf8, #c084fc);
          cursor: pointer;
        }

        .copilot-chat-form button:disabled,
        .copilot-chat-quick button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        @media (max-width: 720px) {
          .copilot-chat-box {
            right: 10px;
            bottom: 10px;
            width: calc(100vw - 20px);
            height: min(76vh, 680px);
            border-radius: 22px;
          }
        }
      `}</style>
    </section>
  );
}
