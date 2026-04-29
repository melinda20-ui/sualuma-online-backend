"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Conversation = {
  id: string;
  title: string;
  agent_slug: string;
  channel: string;
  created_at: string;
  updated_at: string;
};

type Message = {
  id: string;
  conversation_id: string;
  user_id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  metadata?: any;
  created_at: string;
};

type Props = {
  variant?: "full" | "embedded";
  channel?: string;
  agentSlug?: string;
};

export default function SualumaChatCore({
  variant = "full",
  channel = "main",
  agentSlug = "mia",
}: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const isEmbedded = variant === "embedded";

  const subtitle = useMemo(() => {
    if (agentSlug === "mia") return "Mia conecta agentes, automações e próximos passos.";
    return `Agente ativo: ${agentSlug}`;
  }, [agentSlug]);

  async function loadConversations(selectFirst = true) {
    try {
      setError("");
      const res = await fetch("/api/sualuma-chat/conversations", {
        cache: "no-store",
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao carregar conversas.");
        return;
      }

      const list = data.conversations || [];
      setConversations(list);

      if (selectFirst && !activeConversation && list.length > 0) {
        setActiveConversation(list[0]);
      }
    } catch (err: any) {
      setError(err?.message || "Erro ao carregar conversas.");
    } finally {
      setLoadingConversations(false);
    }
  }

  async function loadMessages(conversationId: string) {
    try {
      setLoadingMessages(true);
      setError("");

      const res = await fetch(
        `/api/sualuma-chat/messages?conversation_id=${conversationId}`,
        { cache: "no-store" }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao carregar mensagens.");
        return;
      }

      setMessages(data.messages || []);
    } catch (err: any) {
      setError(err?.message || "Erro ao carregar mensagens.");
    } finally {
      setLoadingMessages(false);
    }
  }

  function startNewConversation() {
    setActiveConversation(null);
    setMessages([]);
    setInput("");
    setError("");
  }

  async function sendMessage() {
    const content = input.trim();

    if (!content || sending) return;

    setSending(true);
    setInput("");
    setError("");

    const tempUserMessage: Message = {
      id: `temp-user-${Date.now()}`,
      conversation_id: activeConversation?.id || "new",
      user_id: "me",
      role: "user",
      content,
      created_at: new Date().toISOString(),
    };

    const tempAssistantMessage: Message = {
      id: `temp-assistant-${Date.now()}`,
      conversation_id: activeConversation?.id || "new",
      user_id: "assistant",
      role: "assistant",
      content: "Pensando...",
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMessage, tempAssistantMessage]);

    try {
      const res = await fetch("/api/sualuma-chat/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          conversation_id: activeConversation?.id || null,
          agent_slug: agentSlug,
          channel,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) =>
          prev.filter(
            (msg) =>
              msg.id !== tempUserMessage.id && msg.id !== tempAssistantMessage.id
          )
        );
        setError(data.error || "Erro ao enviar mensagem.");
        return;
      }

      if (data.conversation) {
        setActiveConversation(data.conversation);
      }

      setMessages((prev) => {
        const clean = prev.filter(
          (msg) =>
            msg.id !== tempUserMessage.id && msg.id !== tempAssistantMessage.id
        );

        return [
          ...clean,
          data.user_message,
          data.assistant_message,
        ].filter(Boolean);
      });

      await loadConversations(false);
    } catch (err: any) {
      setMessages((prev) =>
        prev.filter(
          (msg) =>
            msg.id !== tempUserMessage.id && msg.id !== tempAssistantMessage.id
        )
      );
      setError(err?.message || "Erro ao enviar mensagem.");
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    loadConversations(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeConversation?.id) {
      loadMessages(activeConversation.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversation?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => {
    if (!activeConversation?.id) return;

    const timer = setInterval(() => {
      loadMessages(activeConversation.id);
      loadConversations(false);
    }, 7000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversation?.id]);

  return (
    <div
      className={
        isEmbedded
          ? "flex h-full min-h-[560px] overflow-hidden rounded-3xl border border-white/10 bg-[#050816] text-white shadow-2xl"
          : "flex min-h-screen overflow-hidden bg-[#050816] text-white"
      }
    >
      <aside
        className={
          isEmbedded
            ? "hidden w-72 shrink-0 border-r border-white/10 bg-white/[0.03] p-4 md:block"
            : "hidden w-80 shrink-0 border-r border-white/10 bg-white/[0.03] p-5 md:block"
        }
      >
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-300 font-black">
            S
          </div>
          <div>
            <h1 className="text-lg font-bold">Sualuma Chat</h1>
            <p className="text-xs text-white/45">Histórico por usuário</p>
          </div>
        </div>

        <button
          onClick={startNewConversation}
          className="mt-5 w-full rounded-2xl bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/10"
        >
          Abrir nova conversa
        </button>

        <div className="mt-6">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-white/40">
            Conversas
          </p>

          {loadingConversations && (
            <p className="text-sm text-white/40">Carregando conversas...</p>
          )}

          {!loadingConversations && conversations.length === 0 && (
            <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/45">
              Nenhuma conversa ainda.
            </p>
          )}

          <div className="space-y-2">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => setActiveConversation(conversation)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  activeConversation?.id === conversation.id
                    ? "border-cyan-300 bg-cyan-300/10"
                    : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                }`}
              >
                <p className="line-clamp-1 text-sm font-semibold">
                  {conversation.title || "Nova conversa"}
                </p>
                <p className="mt-1 text-xs text-white/40">
                  {conversation.agent_slug || "mia"} · {conversation.channel || "main"}
                </p>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-white/10 bg-[#050816]/90 px-5 py-5 backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black md:text-3xl">
                Mia <span className="text-white/50">(Suporte)</span>
              </h2>
              <p className="mt-1 text-sm text-white/50">{subtitle}</p>
            </div>

            <div className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-xs font-bold text-cyan-100">
              Brain online
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-6">
          {error && (
            <div className="mx-auto mb-5 max-w-3xl rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
              {error}
            </div>
          )}

          {!error && messages.length === 0 && !loadingMessages && (
            <div className="mx-auto flex max-w-3xl flex-col items-center justify-center py-16 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-violet-500 to-cyan-300 text-2xl font-black">
                S
              </div>
              <h3 className="mt-6 text-3xl font-black">
                Como posso te ajudar hoje?
              </h3>
              <p className="mt-3 max-w-xl text-white/55">
                Converse com a Mia para entender agentes, serviços, automações,
                ideias de negócio, conteúdo, vendas e próximos passos.
              </p>

              <div className="mt-8 grid w-full gap-3 md:grid-cols-2">
                {[
                  "Quero entender qual agente pode me ajudar a vender mais.",
                  "Crie uma estratégia de conteúdo para meu negócio.",
                  "Quero automatizar meu atendimento no WhatsApp.",
                  "Me ajude a montar uma página de vendas.",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left text-sm text-white/75 transition hover:bg-white/[0.08]"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loadingMessages && (
            <div className="mx-auto max-w-3xl text-sm text-white/40">
              Carregando mensagens...
            </div>
          )}

          <div className="mx-auto max-w-4xl space-y-5">
            {messages.map((message) => {
              const isUser = message.role === "user";

              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-300 text-sm font-black">
                      S
                    </div>
                  )}

                  <div
                    className={`max-w-[82%] rounded-3xl border px-5 py-4 text-sm leading-relaxed md:text-base ${
                      isUser
                        ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-50"
                        : "border-white/10 bg-white/[0.06] text-white/90"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>

                  {isUser && (
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-white/10 text-sm font-black">
                      U
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        </div>

        <footer className="border-t border-white/10 bg-[#050816]/95 p-4">
          <div className="mx-auto flex max-w-4xl items-end gap-3">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Escreva sua mensagem para a Mia..."
              className="max-h-40 min-h-[56px] flex-1 resize-none rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-4 text-white outline-none placeholder:text-white/30 focus:border-cyan-300"
            />

            <button
              onClick={sendMessage}
              disabled={sending || !input.trim()}
              className="h-14 rounded-2xl bg-gradient-to-r from-violet-500 to-cyan-400 px-6 font-black text-white transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? "..." : "Enviar"}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
