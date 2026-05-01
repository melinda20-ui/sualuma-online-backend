"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Mood = "idle" | "thinking" | "talking" | "happy";

const ASSISTANT_SELECTORS = [
  '[data-role="assistant"]',
  '[data-message-role="assistant"]',
  ".assistant",
  ".assistant-message",
  ".bot-message",
  ".message.assistant",
  ".msg.assistant",
  ".adms-message.assistant",
  ".adms-bubble.assistant",
  ".from-assistant",
];

function normalizeText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function findAssistantMessages() {
  const found = new Set<string>();

  for (const selector of ASSISTANT_SELECTORS) {
    const nodes = document.querySelectorAll<HTMLElement>(selector);
    nodes.forEach((node) => {
      const text = normalizeText(node.innerText || node.textContent || "");
      if (text.length > 6) found.add(text);
    });
  }

  return Array.from(found);
}

function pickVoice() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;

  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  return (
    voices.find((v) => v.lang?.toLowerCase() === "pt-br") ||
    voices.find((v) => v.lang?.toLowerCase().startsWith("pt")) ||
    voices[0] ||
    null
  );
}

export default function AdmsVoiceRobotOverlay() {
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [mood, setMood] = useState<Mood>("idle");
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  const [lastReply, setLastReply] = useState(
    "Oi, Luma. Quando um agente responder, eu posso ler em voz alta para você."
  );

  const lastSeenRef = useRef("");
  const timerRef = useRef<number | null>(null);

  const moodLabel = useMemo(() => {
    if (speaking || mood === "talking") return "Falando";
    if (mood === "thinking") return "Pensando";
    if (mood === "happy") return "Feliz";
    return "Aguardando";
  }, [mood, speaking]);

  const setMoodForAWhile = useCallback((next: Mood, ms = 1800) => {
    setMood(next);

    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(() => {
      setMood("idle");
    }, ms);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setMood("idle");
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      const clean = normalizeText(text);
      if (!clean) return;

      window.speechSynthesis.cancel();

      const utter = new SpeechSynthesisUtterance(clean);
      utter.lang = "pt-BR";
      utter.rate = 1;
      utter.pitch = 1.08;
      utter.volume = 1;

      const voice = pickVoice();
      if (voice) utter.voice = voice;

      utter.onstart = () => {
        setSpeaking(true);
        setMood("talking");
      };

      utter.onend = () => {
        setSpeaking(false);
        setMoodForAWhile("happy", 1400);
      };

      utter.onerror = () => {
        setSpeaking(false);
        setMoodForAWhile("idle", 500);
      };

      window.speechSynthesis.speak(utter);
    },
    [setMoodForAWhile]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    setSupported("speechSynthesis" in window);

    const saved = localStorage.getItem("adms_voice_enabled");
    if (saved === "0") setVoiceEnabled(false);

    const warmup = () => {
      try {
        window.speechSynthesis.getVoices();
      } catch {}
    };

    warmup();

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      try {
        window.speechSynthesis.cancel();
      } catch {}
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("adms_voice_enabled", voiceEnabled ? "1" : "0");
  }, [voiceEnabled]);

  useEffect(() => {
    const clickListener = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const button = target.closest("button");
      const joined = `${button?.textContent || ""} ${button?.getAttribute("aria-label") || ""}`.toLowerCase();

      if (/enviar|send|mandar/.test(joined)) {
        setMoodForAWhile("thinking", 2400);
      }
    };

    const keyListener = (event: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null;
      const tag = active?.tagName?.toLowerCase();

      if (event.key === "Enter" && !event.shiftKey && (tag === "textarea" || tag === "input")) {
        setMoodForAWhile("thinking", 2400);
      }
    };

    document.addEventListener("click", clickListener, true);
    document.addEventListener("keydown", keyListener, true);

    return () => {
      document.removeEventListener("click", clickListener, true);
      document.removeEventListener("keydown", keyListener, true);
    };
  }, [setMoodForAWhile]);

  useEffect(() => {
    const scan = () => {
      const messages = findAssistantMessages();
      if (!messages.length) return;

      const newest = messages[messages.length - 1];
      if (!newest) return;
      if (newest === lastSeenRef.current) return;

      lastSeenRef.current = newest;
      setLastReply(newest);

      if (voiceEnabled && supported) {
        speak(newest);
      } else {
        setMoodForAWhile("happy", 1200);
      }
    };

    const observer = new MutationObserver(() => {
      window.requestAnimationFrame(scan);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    scan();

    return () => observer.disconnect();
  }, [voiceEnabled, supported, speak, setMoodForAWhile]);

  return (
    <div className="adms-voice-shell">
      <div className="adms-voice-card">
        <div className="adms-voice-header">
          <div>
            <div className="adms-voice-title">Assistente de Voz</div>
            <div className="adms-voice-subtitle">{moodLabel}</div>
          </div>

          <div className={`adms-voice-dot ${voiceEnabled ? "on" : "off"}`} />
        </div>

        <div className={`pink-robot ${mood} ${speaking ? "speaking" : ""}`}>
          <div className="robot-antenna" />
          <div className="robot-head">
            <div className="robot-eye left" />
            <div className="robot-eye right" />
            <div className="robot-mouth" />
            <div className="robot-cheek left" />
            <div className="robot-cheek right" />
          </div>
          <div className="robot-body">
            <div className="robot-heart">❤</div>
          </div>
          <div className="robot-arm left" />
          <div className="robot-arm right" />
          <div className="robot-shadow" />
        </div>

        <div className="adms-voice-preview">
          {lastReply}
        </div>

        <div className="adms-voice-actions">
          <button
            type="button"
            className={`adms-voice-btn primary ${voiceEnabled ? "active" : ""}`}
            onClick={() => setVoiceEnabled((v) => !v)}
          >
            {voiceEnabled ? "🔊 Voz ligada" : "🔇 Voz desligada"}
          </button>

          <button
            type="button"
            className="adms-voice-btn"
            onClick={() => speak(lastReply)}
            disabled={!supported}
          >
            Ouvir última
          </button>

          <button
            type="button"
            className="adms-voice-btn"
            onClick={stopSpeaking}
            disabled={!supported}
          >
            Parar
          </button>
        </div>

        {!supported && (
          <div className="adms-voice-warning">
            Seu navegador não suporta leitura em voz. No Chrome e Edge isso costuma funcionar normalmente.
          </div>
        )}
      </div>
    </div>
  );
}
