"use client";

import { FormEvent, useState } from "react";

type ChatMessage = {
  from: "bot" | "user";
  text: string;
};

type SualumaPublicChatProps = {
  sourcePage?: string;
  title?: string;
  subtitle?: string;
};

export default function SualumaPublicChat({
  sourcePage = "Página Sua Luma",
  title = "Posso te ajudar?",
  subtitle = "Fale comigo",
}: SualumaPublicChatProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      from: "bot",
      text: "Oi! Eu sou a assistente da Sua Luma. Me manda sua dúvida que eu aviso a equipe.",
    },
  ]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanMessage = message.trim();
    if (!cleanMessage || sending) return;

    const visitorName = name.trim() || "Visitante";

    setMessages((current) => [
      ...current,
      { from: "user", text: cleanMessage },
    ]);

    setMessage("");
    setSending(true);

    try {
      const response = await fetch("/api/prestador/chat-publico", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: visitorName,
          message: cleanMessage,
          page: sourcePage,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.ok) {
        throw new Error("Falha ao enviar mensagem.");
      }

      setMessages((current) => [
        ...current,
        {
          from: "bot",
          text: "Recebi sua mensagem ✅ A equipe Sua Luma vai te responder assim que possível.",
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          from: "bot",
          text: "Sua mensagem apareceu aqui, mas pode ter falhado o aviso automático. Tente novamente em alguns instantes.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="sualuma-public-chat-button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Abrir chat Sua Luma"
      >
        <span className="sualuma-public-chat-robot">🤖</span>
        <span>
          <strong>{title}</strong>
          <small>{subtitle}</small>
        </span>
      </button>

      {open && (
        <section className="sualuma-public-chat-window" aria-label="Chat Sua Luma">
          <header>
            <div className="sualuma-public-chat-avatar">🤖</div>
            <div>
              <strong>{title}</strong>
              <span>Atendimento Sua Luma</span>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Fechar chat">
              ×
            </button>
          </header>

          <div className="sualuma-public-chat-body">
            {messages.map((item, index) => (
              <div
                key={`${item.from}-${index}`}
                className={`sualuma-public-chat-message ${item.from}`}
              >
                {item.text}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Seu nome"
              autoComplete="name"
            />
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Digite sua dúvida..."
              rows={3}
            />
            <button type="submit" disabled={sending || !message.trim()}>
              {sending ? "Enviando..." : "Enviar mensagem"}
            </button>
          </form>
        </section>
      )}

      <style jsx global>{`
        .sualuma-public-chat-button {
          position: fixed;
          right: 20px;
          bottom: 22px;
          z-index: 9999;
          border: 1px solid rgba(255, 255, 255, 0.25);
          background: linear-gradient(135deg, #7c3aed, #38bdf8);
          color: white;
          border-radius: 999px;
          padding: 10px 14px 10px 10px;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          box-shadow: 0 18px 55px rgba(56, 189, 248, 0.35);
          font-family: inherit;
        }

        .sualuma-public-chat-button strong,
        .sualuma-public-chat-button small {
          display: block;
          line-height: 1.1;
          text-align: left;
        }

        .sualuma-public-chat-button strong {
          font-size: 13px;
          font-weight: 900;
        }

        .sualuma-public-chat-button small {
          margin-top: 2px;
          font-size: 11px;
          opacity: 0.86;
          font-weight: 700;
        }

        .sualuma-public-chat-robot {
          width: 38px;
          height: 38px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: rgba(15, 23, 42, 0.28);
          font-size: 19px;
        }

        .sualuma-public-chat-window {
          position: fixed;
          right: 20px;
          bottom: 92px;
          width: min(360px, calc(100vw - 28px));
          z-index: 10000;
          border-radius: 26px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: rgba(10, 14, 35, 0.96);
          color: white;
          box-shadow: 0 24px 90px rgba(0, 0, 0, 0.55);
          backdrop-filter: blur(18px);
          font-family: inherit;
        }

        .sualuma-public-chat-window header {
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.6), rgba(56, 189, 248, 0.25));
          border-bottom: 1px solid rgba(255, 255, 255, 0.14);
        }

        .sualuma-public-chat-avatar {
          width: 42px;
          height: 42px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          background: rgba(255, 255, 255, 0.14);
          font-size: 22px;
        }

        .sualuma-public-chat-window header strong {
          display: block;
          font-size: 15px;
          font-weight: 900;
        }

        .sualuma-public-chat-window header span {
          display: block;
          margin-top: 2px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.75);
          font-weight: 700;
        }

        .sualuma-public-chat-window header button {
          margin-left: auto;
          width: 30px;
          height: 30px;
          border-radius: 999px;
          border: 0;
          background: rgba(255, 255, 255, 0.12);
          color: white;
          font-size: 22px;
          cursor: pointer;
        }

        .sualuma-public-chat-body {
          padding: 16px;
          max-height: 270px;
          overflow: auto;
          display: grid;
          gap: 10px;
        }

        .sualuma-public-chat-message {
          max-width: 88%;
          border-radius: 18px;
          padding: 10px 12px;
          font-size: 13px;
          line-height: 1.45;
          font-weight: 600;
        }

        .sualuma-public-chat-message.bot {
          justify-self: left;
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.92);
        }

        .sualuma-public-chat-message.user {
          justify-self: right;
          background: linear-gradient(135deg, #7c3aed, #38bdf8);
          color: white;
        }

        .sualuma-public-chat-window form {
          padding: 14px;
          display: grid;
          gap: 9px;
          border-top: 1px solid rgba(255, 255, 255, 0.12);
        }

        .sualuma-public-chat-window input,
        .sualuma-public-chat-window textarea {
          width: 100%;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.08);
          color: white;
          border-radius: 14px;
          padding: 11px 12px;
          outline: none;
          font-family: inherit;
          font-size: 13px;
        }

        .sualuma-public-chat-window input::placeholder,
        .sualuma-public-chat-window textarea::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        .sualuma-public-chat-window button[type="submit"] {
          border: 0;
          border-radius: 999px;
          padding: 12px 14px;
          background: linear-gradient(135deg, #7c3aed, #38bdf8);
          color: white;
          font-weight: 900;
          cursor: pointer;
          font-family: inherit;
        }

        .sualuma-public-chat-window button[type="submit"]:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        @media (max-width: 640px) {
          .sualuma-public-chat-button {
            right: 14px;
            bottom: 14px;
          }

          .sualuma-public-chat-window {
            right: 14px;
            bottom: 82px;
          }
        }
      `}</style>
    </>
  );
}
