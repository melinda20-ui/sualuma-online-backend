"use client";

import Link from "next/link";
import { useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [listening, setListening] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Olá, Luma. Bem-vinda ao seu centro de comando. O que vamos criar hoje?",
    },
  ]);

  function speakText(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    utterance.rate = 1;
    utterance.pitch = 1;

    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find((voice) =>
      voice.lang.toLowerCase().includes("pt")
    );

    if (ptVoice) utterance.voice = ptVoice;

    window.speechSynthesis.speak(utterance);
  }

  function stopSpeaking() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
  }

  async function handleSend(textoOpcional?: string) {
    const userMessage = textoOpcional || input.trim();
    if (!userMessage || loading) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage },
    ]);

    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await res.json();
      const resposta = data?.reply || "Não consegui responder agora.";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: resposta },
      ]);

      if (autoSpeak) {
        speakText(resposta);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Erro ao conectar com o backend.",
        },
      ]);
    }

    setLoading(false);
  }

  function startListening() {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Reconhecimento de voz não suportado neste navegador.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setListening(true);
    recognition.start();

    recognition.onresult = (event: any) => {
      const texto = event.results[0][0].transcript;
      setInput(texto);

      setTimeout(() => {
        handleSend(texto);
      }, 400);
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };
  }

  return (
    <main className="min-h-screen bg-[#050507] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-[#050507]/90 px-4 py-4 backdrop-blur-xl md:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/80"
            >
              ←
            </Link>

            <div>
              <p className="text-sm font-semibold text-white">Luma Chat</p>
              <p className="text-xs text-white/40">Modo conversa</p>
            </div>
          </div>

          <div className="rounded-full border border-[#00F0FF]/20 bg-[#00F0FF]/10 px-3 py-1 text-xs text-[#00F0FF]">
            Ativo
          </div>
        </header>

        <section className="flex-1 px-3 pb-40 pt-4 md:px-6">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={
                  message.role === "assistant"
                    ? "mr-auto max-w-[88%] rounded-[24px] border border-white/10 bg-[#0b0d12] px-4 py-4 shadow-[0_0_24px_rgba(122,0,255,0.06)] md:max-w-[75%]"
                    : "ml-auto max-w-[88%] rounded-[24px] border border-[#00F0FF]/20 bg-[#00F0FF]/10 px-4 py-4 shadow-[0_0_24px_rgba(0,240,255,0.08)] md:max-w-[75%]"
                }
              >
                <p
                  className={
                    message.role === "assistant"
                      ? "mb-2 text-sm font-semibold text-[#A855F7]"
                      : "mb-2 text-sm font-semibold text-[#00F0FF]"
                  }
                >
                  {message.role === "assistant" ? "Agente" : "Você"}
                </p>

                <p className="text-[15px] leading-7 text-white/85">
                  {message.content}
                </p>
              </div>
            ))}

            {loading && (
              <div className="mr-auto max-w-[88%] rounded-[24px] border border-white/10 bg-[#0b0d12] px-4 py-4 md:max-w-[75%]">
                <p className="mb-2 text-sm font-semibold text-[#A855F7]">
                  Agente
                </p>
                <p className="text-[15px] leading-7 text-white/60">Pensando...</p>
              </div>
            )}
          </div>
        </section>

        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#050507]/92 px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl md:px-6">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setAutoSpeak(!autoSpeak)}
                className={`rounded-xl border px-3 py-2 text-xs ${
                  autoSpeak
                    ? "border-[#7A00FF]/30 bg-[#7A00FF]/20 text-white"
                    : "border-white/10 bg-white/[0.05] text-white/75"
                }`}
              >
                {autoSpeak ? "🔊 Voz ON" : "🔇 Voz OFF"}
              </button>

              <button
                onClick={startListening}
                className={`rounded-xl border px-3 py-2 text-xs ${
                  listening
                    ? "border-[#00F0FF]/30 bg-[#00F0FF]/20 text-[#00F0FF]"
                    : "border-white/10 bg-white/[0.05] text-white/75"
                }`}
              >
                {listening ? "🎤 Ouvindo..." : "🎙 Falar"}
              </button>

              <button
                onClick={() => speakText("Teste de voz do Luma OS")}
                className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs text-white/75"
              >
                🧪 Testar voz
              </button>

              <button
                onClick={stopSpeaking}
                className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs text-white/75"
              >
                🛑 Parar voz
              </button>
            </div>

            <div className="flex items-end gap-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
                placeholder="Envie uma mensagem para o Luma OS..."
                className="max-h-40 min-h-[56px] flex-1 resize-none rounded-[24px] border border-white/10 bg-[#0b0d12] px-4 py-4 text-white outline-none placeholder:text-white/30 focus:border-[#00F0FF] focus:shadow-[0_0_20px_rgba(0,240,255,0.12)]"
              />

              <button
                onClick={() => handleSend()}
                disabled={loading}
                className="inline-flex h-14 min-w-[92px] items-center justify-center rounded-[20px] bg-[#7A00FF] px-5 text-sm font-semibold text-white shadow-[0_0_30px_rgba(122,0,255,0.32)] transition hover:bg-[#8d28ff] disabled:opacity-50"
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
