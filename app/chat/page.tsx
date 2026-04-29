"use client";

import { FormEvent, useRef, useState } from "react";

type Msg = {
  role: "user" | "assistant";
  content: string;
};

function cleanText(value: any) {
  let text =
    typeof value === "string"
      ? value
      : value?.reply || value?.message || value?.content || JSON.stringify(value);

  return String(text)
    .replace(/\\n/g, "\n")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/^\s*["']|["']\s*$/g, "")
    .trim();
}

async function readMiaReply(response: Response) {
  const raw = await response.text();

  try {
    const json = JSON.parse(raw);
    return cleanText(json);
  } catch {
    return cleanText(raw);
  }
}

export default function ChatTesteSemLoginPage() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Oi, eu sou a Mia em modo teste. Por enquanto você pode testar o chat sem login.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

  async function sendMessage(event: FormEvent) {
    event.preventDefault();

    const text = input.trim();
    if (!text || loading) return;

    const nextMessages: Msg[] = [...messages, { role: "user", content: text }];

    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    setTimeout(() => {
      boxRef.current?.scrollTo({
        top: boxRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 80);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
          messages: nextMessages.slice(-10),
        }),
      });

      const reply = await readMiaReply(response);

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            reply ||
            "Recebi sua mensagem, mas a resposta veio vazia. Tente novamente.",
        },
      ]);
    } catch (error: any) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            "Modo teste ativo, mas a API do chat falhou agora: " +
            (error?.message || "erro desconhecido"),
        },
      ]);
    } finally {
      setLoading(false);

      setTimeout(() => {
        boxRef.current?.scrollTo({
          top: boxRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 120);
    }
  }

  return (
    <main className="chatPage">
      <header className="chatHeader">
        <div>
          <h1>
            Mia <span>(Teste)</span>
          </h1>
          <p>Teste livre do chat sem autenticação.</p>
        </div>

        <div className="badge">sem login</div>
      </header>

      <section ref={boxRef} className="messages">
        {messages.map((msg, index) => (
          <div key={index} className={`bubble ${msg.role}`}>
            {msg.content}
          </div>
        ))}

        {loading && <div className="bubble assistant small">Pensando...</div>}
      </section>

      <form className="composer" onSubmit={sendMessage}>
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Escreva sua mensagem para a Mia..."
          rows={3}
        />

        <button disabled={loading || !input.trim()} type="submit">
          {loading ? "Enviando..." : "Enviar"}
        </button>
      </form>

      <style jsx>{`
        .chatPage {
          min-height: 100dvh;
          background:
            radial-gradient(circle at 20% 0%, rgba(56, 189, 248, 0.22), transparent 32%),
            radial-gradient(circle at 90% 20%, rgba(124, 58, 237, 0.25), transparent 35%),
            linear-gradient(135deg, #071225, #11104a 55%, #0c0820);
          color: white;
          display: flex;
          flex-direction: column;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .chatHeader {
          padding: 36px 36px 26px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.2);
        }

        h1 {
          margin: 0;
          font-size: clamp(42px, 7vw, 74px);
          line-height: 0.95;
          font-weight: 500;
          letter-spacing: -0.07em;
        }

        h1 span {
          color: #8b5cf6;
        }

        .chatHeader p {
          margin: 18px 0 0;
          color: rgba(255, 255, 255, 0.72);
          font-size: clamp(18px, 3.5vw, 30px);
          line-height: 1.35;
          max-width: 560px;
        }

        .badge {
          border: 1px solid rgba(56, 189, 248, 0.55);
          color: #9ee7ff;
          border-radius: 999px;
          padding: 18px 28px;
          font-size: clamp(18px, 3vw, 26px);
          font-weight: 800;
          background: rgba(15, 23, 42, 0.45);
          white-space: nowrap;
        }

        .messages {
          flex: 1;
          overflow-y: auto;
          padding: 40px 32px;
          display: flex;
          flex-direction: column;
          gap: 28px;
          scroll-behavior: smooth;
        }

        .bubble {
          max-width: min(82%, 780px);
          border-radius: 34px;
          padding: 30px 36px;
          font-size: clamp(18px, 4vw, 30px);
          line-height: 1.45;
          white-space: pre-wrap;
          word-break: break-word;
          box-shadow: 0 22px 60px rgba(0, 0, 0, 0.18);
        }

        .assistant {
          align-self: flex-start;
          background: rgba(255, 255, 255, 0.13);
          border: 1px solid rgba(255, 255, 255, 0.16);
        }

        .user {
          align-self: flex-end;
          background: linear-gradient(135deg, #1d8cff, #8b35ff);
          border: 1px solid rgba(255, 255, 255, 0.18);
        }

        .small {
          max-width: fit-content;
        }

        .composer {
          padding: 32px;
          border-top: 1px solid rgba(148, 163, 184, 0.22);
          background: rgba(3, 7, 18, 0.4);
          display: grid;
          gap: 22px;
        }

        textarea {
          width: 100%;
          resize: none;
          border-radius: 28px;
          padding: 28px 34px;
          border: 1px solid rgba(125, 211, 252, 0.65);
          background: rgba(255, 255, 255, 0.08);
          color: white;
          font-size: clamp(18px, 4vw, 28px);
          outline: none;
        }

        textarea::placeholder {
          color: rgba(255, 255, 255, 0.45);
        }

        button {
          border: 0;
          border-radius: 28px;
          padding: 26px;
          font-size: clamp(18px, 4vw, 28px);
          font-weight: 800;
          color: white;
          background: linear-gradient(135deg, #6d28d9, #0891b2);
          cursor: pointer;
        }

        button:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        @media (max-width: 640px) {
          .chatHeader {
            padding: 32px 32px 24px;
          }

          .messages {
            padding: 32px 32px;
          }

          .bubble {
            max-width: 92%;
          }

          .composer {
            padding: 28px 32px 36px;
          }
        }
      `}</style>
    </main>
  );
}
