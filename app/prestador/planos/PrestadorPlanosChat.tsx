"use client";

import { FormEvent, useState } from "react";

type ChatMessage = {
  from: "bot" | "user";
  text: string;
};

export default function PrestadorPlanosChat() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      from: "bot",
      text: "Oi! Posso te ajudar? Me manda sua dúvida sobre os planos para prestadores.",
    },
  ]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanMessage = message.trim();
    const cleanName = name.trim();

    if (!cleanMessage) return;

    setMessages((current) => [
      ...current,
      { from: "user", text: cleanMessage },
    ]);

    setMessage("");
    setSending(true);

    try {
      const res = await fetch("/api/prestador/chat-publico", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: cleanName || "Visitante",
          message: cleanMessage,
          page: "/prestador/planos",
        }),
      });

      if (!res.ok) {
        throw new Error("Falha ao enviar mensagem");
      }

      setMessages((current) => [
        ...current,
        {
          from: "bot",
          text: "Recebi sua mensagem. A equipe Sualuma vai acompanhar sua dúvida e responder assim que possível.",
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          from: "bot",
          text: "Não consegui enviar agora. Tente novamente em alguns instantes.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="prestador-chat-floating">
      {open && (
        <section className="prestador-chat-box" aria-label="Chat de atendimento">
          <div className="prestador-chat-head">
            <div className="prestador-chat-robot" aria-hidden="true">
              🤖
            </div>

            <div>
              <strong>Posso te ajudar?</strong>
              <span>Chat dos planos para prestadores</span>
            </div>

            <button type="button" onClick={() => setOpen(false)} aria-label="Fechar chat">
              ×
            </button>
          </div>

          <div className="prestador-chat-messages">
            {messages.map((item, index) => (
              <div key={`${item.from}-${index}`} className={`prestador-chat-message ${item.from}`}>
                {item.text}
              </div>
            ))}
          </div>

          <form className="prestador-chat-form" onSubmit={sendMessage}>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Seu nome"
              aria-label="Seu nome"
            />

            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Digite sua dúvida..."
              aria-label="Digite sua dúvida"
              rows={3}
            />

            <button type="submit" disabled={sending || !message.trim()}>
              {sending ? "Enviando..." : "Enviar pergunta"}
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        className="prestador-chat-bubble"
        onClick={() => setOpen((current) => !current)}
        aria-label="Abrir chat de atendimento"
      >
        <span className="prestador-chat-bubble-robot">🤖</span>
        <span>
          <strong>Posso te ajudar?</strong>
          <small>Fale comigo aqui</small>
        </span>
      </button>

      <style jsx>{`
        .prestador-chat-floating {
          position: fixed;
          right: 22px;
          bottom: 22px;
          z-index: 80;
          font-family: inherit;
        }

        .prestador-chat-bubble {
          display: flex;
          align-items: center;
          gap: 12px;
          border: 1px solid rgba(255, 255, 255, 0.22);
          background:
            radial-gradient(circle at 15% 20%, rgba(56, 189, 248, 0.32), transparent 32%),
            linear-gradient(135deg, rgba(124, 58, 237, 0.96), rgba(14, 165, 233, 0.92));
          color: #fff;
          border-radius: 999px;
          padding: 12px 18px 12px 12px;
          box-shadow: 0 22px 60px rgba(14, 165, 233, 0.35);
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .prestador-chat-bubble:hover {
          transform: translateY(-2px);
          box-shadow: 0 28px 80px rgba(124, 58, 237, 0.42);
        }

        .prestador-chat-bubble-robot {
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: rgba(2, 6, 23, 0.42);
          font-size: 24px;
        }

        .prestador-chat-bubble strong,
        .prestador-chat-bubble small {
          display: block;
          text-align: left;
          line-height: 1.1;
        }

        .prestador-chat-bubble strong {
          font-size: 14px;
          font-weight: 900;
        }

        .prestador-chat-bubble small {
          margin-top: 3px;
          color: rgba(255, 255, 255, 0.78);
          font-size: 11px;
          font-weight: 700;
        }

        .prestador-chat-box {
          width: min(360px, calc(100vw - 32px));
          margin-bottom: 14px;
          border: 1px solid rgba(148, 163, 184, 0.24);
          border-radius: 26px;
          overflow: hidden;
          background:
            radial-gradient(circle at top left, rgba(124, 58, 237, 0.24), transparent 38%),
            linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 0.98));
          color: #fff;
          box-shadow: 0 30px 100px rgba(0, 0, 0, 0.55);
        }

        .prestador-chat-head {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.18);
        }

        .prestador-chat-head strong,
        .prestador-chat-head span {
          display: block;
        }

        .prestador-chat-head strong {
          font-size: 15px;
          font-weight: 900;
        }

        .prestador-chat-head span {
          margin-top: 3px;
          color: rgba(226, 232, 240, 0.72);
          font-size: 12px;
        }

        .prestador-chat-head button {
          margin-left: auto;
          width: 32px;
          height: 32px;
          border: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.09);
          color: #fff;
          cursor: pointer;
          font-size: 22px;
          line-height: 1;
        }

        .prestador-chat-robot {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(56, 189, 248, 0.32), rgba(124, 58, 237, 0.42));
          font-size: 24px;
        }

        .prestador-chat-messages {
          display: grid;
          gap: 10px;
          max-height: 260px;
          overflow: auto;
          padding: 16px;
        }

        .prestador-chat-message {
          width: fit-content;
          max-width: 88%;
          padding: 10px 12px;
          border-radius: 16px;
          font-size: 13px;
          line-height: 1.45;
        }

        .prestador-chat-message.bot {
          background: rgba(255, 255, 255, 0.09);
          color: rgba(255, 255, 255, 0.88);
          border-top-left-radius: 6px;
        }

        .prestador-chat-message.user {
          justify-self: end;
          background: linear-gradient(135deg, rgba(56, 189, 248, 0.9), rgba(124, 58, 237, 0.92));
          color: #fff;
          border-top-right-radius: 6px;
        }

        .prestador-chat-form {
          display: grid;
          gap: 10px;
          padding: 14px;
          border-top: 1px solid rgba(148, 163, 184, 0.18);
        }

        .prestador-chat-form input,
        .prestador-chat-form textarea {
          width: 100%;
          border: 1px solid rgba(148, 163, 184, 0.24);
          border-radius: 14px;
          background: rgba(15, 23, 42, 0.82);
          color: #fff;
          outline: none;
          padding: 11px 12px;
          font-family: inherit;
          font-size: 13px;
        }

        .prestador-chat-form textarea {
          resize: none;
        }

        .prestador-chat-form input::placeholder,
        .prestador-chat-form textarea::placeholder {
          color: rgba(226, 232, 240, 0.48);
        }

        .prestador-chat-form button {
          border: 0;
          border-radius: 999px;
          padding: 12px 14px;
          color: #fff;
          font-weight: 900;
          cursor: pointer;
          background: linear-gradient(135deg, #7c3aed, #0ea5e9);
        }

        .prestador-chat-form button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        @media (max-width: 640px) {
          .prestador-chat-floating {
            right: 14px;
            bottom: 14px;
          }

          .prestador-chat-bubble {
            padding-right: 14px;
          }
        }
      `}</style>
    </div>
  );
}
