"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import styles from "./MiaStudioChat.module.css";

type ChatMessage = {
  id: string;
  role: "user" | "mia" | "system";
  content: string;
};

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function extractMiaAnswer(data: any): string {
  if (!data) return "Não consegui receber resposta da Mia.";

  if (typeof data.answer === "string") return data.answer;
  if (typeof data.reply === "string") return data.reply;
  if (typeof data.response === "string") return data.response;
  if (typeof data.content === "string") return data.content;

  if (data.ok === false && data.error) {
    return `Encontrei um erro ao falar com a Mia: ${data.error}`;
  }

  if (data.message && typeof data.message === "string" && data.cards) {
    const cards = Array.isArray(data.cards)
      ? data.cards.map((c: any) => `• ${c.title}: ${c.value}`).join("\n")
      : "";

    const tasks = Array.isArray(data.tasks)
      ? data.tasks.map((t: any) => `• ${t.title} — ${t.area} — ${t.priority || "sem prioridade"}`).join("\n")
      : "";

    return [
      data.message,
      cards ? `\nCards do Studio:\n${cards}` : "",
      tasks ? `\nTarefas pendentes:\n${tasks}` : "",
    ].join("\n").trim();
  }

  return JSON.stringify(data, null, 2);
}

export default function MiaStudioChat() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: uid(),
      role: "mia",
      content:
        "Oi, Luma. Eu sou a Mia. Posso ler o estado do Studio, olhar o banco conectado, organizar tarefas e te ajudar a decidir o que falta antes do lançamento.",
    },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const lastMessageText = useMemo(() => {
    const last = [...messages].reverse().find((m) => m.role === "mia");
    return last?.content || "";
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, open, minimized]);

  useEffect(() => {
    function handleGlobalClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const button = target.closest("button, a, [role='button']") as HTMLElement | null;
      if (!button) return;

      const text = (button.innerText || button.textContent || "").toLowerCase().trim();

      const isMiaButton =
        text.includes("falar com a mia") ||
        text.includes("abrir mia") ||
        text.includes("chat da mia") ||
        text === "mia" ||
        text.includes("mia brain");

      if (!isMiaButton) return;

      event.preventDefault();
      setOpen(true);
      setMinimized(false);
    }

    document.addEventListener("click", handleGlobalClick, true);
    return () => document.removeEventListener("click", handleGlobalClick, true);
  }, []);

  async function sendMessage(customMessage?: string) {
    const text = (customMessage || input).trim();
    if (!text || loading) return;

    setInput("");

    const userMessage: ChatMessage = {
      id: uid(),
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await fetch("/api/studio/mia-brain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
          source: "studio-luma-chat-visual",
        }),
      });

      const data = await res.json().catch(() => null);
      const answer = extractMiaAnswer(data);

      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "mia",
          content: answer,
        },
      ]);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "system",
          content:
            "Não consegui conectar com a Mia agora. A janela abriu, mas a API da Mia não respondeu. Verifique /api/studio/mia-brain.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage();
  }

  function speakLast() {
    if (!lastMessageText || typeof window === "undefined") return;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(lastMessageText);
      utterance.lang = "pt-BR";
      utterance.rate = 1;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    } catch {}
  }

  function stopVoice() {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }

  return (
    <>
      <button
        type="button"
        className={styles.floatingButton}
        onClick={() => {
          setOpen(true);
          setMinimized(false);
        }}
        aria-label="Abrir chat da Mia"
      >
        <span className={styles.robotFace}>
          <span className={styles.eye}></span>
          <span className={styles.eye}></span>
        </span>
        <span>Falar com a Mia</span>
      </button>

      {open && (
        <section className={`${styles.chatShell} ${minimized ? styles.minimized : ""}`}>
          <header className={styles.header}>
            <div className={styles.identity}>
              <div className={styles.avatar}>
                <span className={styles.avatarEye}></span>
                <span className={styles.avatarEye}></span>
                <span className={styles.avatarMouth}></span>
              </div>

              <div>
                <strong>Mia Brain</strong>
                <small>Conectada ao Studio Luma</small>
              </div>
            </div>

            <div className={styles.actions}>
              <button type="button" onClick={speakLast} title="Ler última resposta">
                🔊
              </button>
              <button type="button" onClick={stopVoice} title="Parar voz">
                ⏹
              </button>
              <button
                type="button"
                onClick={() => setMinimized((v) => !v)}
                title={minimized ? "Expandir" : "Minimizar"}
              >
                {minimized ? "▣" : "—"}
              </button>
              <button type="button" onClick={() => setOpen(false)} title="Fechar">
                ×
              </button>
            </div>
          </header>

          {!minimized && (
            <>
              <div className={styles.quickActions}>
                <button
                  type="button"
                  onClick={() =>
                    sendMessage(
                      "Mia, leia o estado atual do Studio Luma e me diga se o banco está conectado, quais cards existem e quais tarefas estão pendentes antes do lançamento."
                    )
                  }
                >
                  Ler estado do Studio
                </button>

                <button
                  type="button"
                  onClick={() =>
                    sendMessage(
                      "Mia, me diga em linguagem simples o que falta resolver antes de lançar hoje."
                    )
                  }
                >
                  O que falta lançar?
                </button>

                <button
                  type="button"
                  onClick={() =>
                    sendMessage(
                      "Mia, organize minhas próximas prioridades em ordem: urgente, importante e pode esperar."
                    )
                  }
                >
                  Priorizar
                </button>
              </div>

              <div className={styles.messages} ref={scrollRef}>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`${styles.message} ${
                      message.role === "user"
                        ? styles.user
                        : message.role === "system"
                          ? styles.system
                          : styles.mia
                    }`}
                  >
                    <span>
                      {message.role === "user"
                        ? "Você"
                        : message.role === "system"
                          ? "Sistema"
                          : "Mia"}
                    </span>
                    <p>{message.content}</p>
                  </div>
                ))}

                {loading && (
                  <div className={`${styles.message} ${styles.mia}`}>
                    <span>Mia</span>
                    <p>Estou lendo o Studio agora...</p>
                  </div>
                )}
              </div>

              <form className={styles.form} onSubmit={handleSubmit}>
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Pergunte para a Mia o que falta, peça análise do Studio ou mande ela organizar suas prioridades..."
                  rows={2}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      sendMessage();
                    }
                  }}
                />

                <button type="submit" disabled={loading || !input.trim()}>
                  {loading ? "..." : "Enviar"}
                </button>
              </form>
            </>
          )}
        </section>
      )}
    </>
  );
}
