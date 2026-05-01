"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Mood = "idle" | "thinking" | "talking" | "happy";

type VoiceChoice = "browser" | "piper-cadu" | "piper-jeff";

const ASSISTANT_SELECTORS = [
  ".msg:not(.user) .m-bubble",
  ".agent-intro",
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

const READABLE_SELECTORS = [
  ".m-bubble",
  ".agent-intro",
  ".adms-voice-preview",
  ".msg",
];

function normalizeText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function getSelectionText() {
  if (typeof window === "undefined") return "";
  return normalizeText(window.getSelection()?.toString() || "");
}

function findAssistantMessages() {
  const found = new Set<string>();

  for (const selector of ASSISTANT_SELECTORS) {
    document.querySelectorAll<HTMLElement>(selector).forEach((node) => {
      const text = normalizeText(node.innerText || node.textContent || "");
      if (text.length > 6) found.add(text);
    });
  }

  return Array.from(found);
}

function getPiperVoiceId(choice: VoiceChoice) {
  if (choice === "piper-jeff") return "pt_BR-jeff-medium";
  return "pt_BR-cadu-medium";
}

function getChoiceLabel(choice: VoiceChoice) {
  if (choice === "piper-cadu") return "Piper Cadu";
  if (choice === "piper-jeff") return "Piper Jeff";
  return "Navegador";
}

export default function AdmsVoiceRobotOverlay() {
  const [isMinimized, setIsMinimized] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [mood, setMood] = useState<Mood>("idle");
  const [speaking, setSpeaking] = useState(false);
  const [pickMode, setPickMode] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [voiceChoice, setVoiceChoice] = useState<VoiceChoice>("piper-cadu");
  const [lastReply, setLastReply] = useState(
    "Oi, Luma. Eu sou o robô de voz dos Agentes ADMs. Agora estou compacto e posso ler textos com Piper Cadu, Piper Jeff ou voz do navegador."
  );

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSeenRef = useRef("");
  const timerRef = useRef<number | null>(null);

  const choiceLabel = getChoiceLabel(voiceChoice);

  const setMoodForAWhile = useCallback((next: Mood, ms = 1400) => {
    setMood(next);

    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(() => {
      setMood("idle");
    }, ms);
  }, []);

  const stopSpeaking = useCallback(() => {
    try {
      window.speechSynthesis?.cancel();
    } catch {}

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }

    setSpeaking(false);
    setMood("idle");
  }, []);

  const speakBrowser = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

      const clean = normalizeText(text);
      if (!clean) return;

      stopSpeaking();

      const utter = new SpeechSynthesisUtterance(clean);
      utter.lang = "pt-BR";
      utter.rate = 1;
      utter.pitch = 1.05;
      utter.volume = 1;

      const voices = window.speechSynthesis.getVoices();
      const ptVoice =
        voices.find((voice) => voice.lang?.toLowerCase() === "pt-br") ||
        voices.find((voice) => voice.lang?.toLowerCase().startsWith("pt")) ||
        voices[0];

      if (ptVoice) {
        utter.voice = ptVoice;
        utter.lang = ptVoice.lang || "pt-BR";
      }

      setLastReply(clean);

      utter.onstart = () => {
        setSpeaking(true);
        setMood("talking");
      };

      utter.onend = () => {
        setSpeaking(false);
        setMoodForAWhile("happy");
      };

      utter.onerror = () => {
        setSpeaking(false);
        setMoodForAWhile("idle", 500);
      };

      window.speechSynthesis.speak(utter);
    },
    [setMoodForAWhile, stopSpeaking]
  );

  const speakPiper = useCallback(
    async (text: string, voiceId: string) => {
      const clean = normalizeText(text);
      if (!clean) return;

      stopSpeaking();

      setLastReply(clean);
      setSpeaking(true);
      setMood("talking");

      try {
        const response = await fetch("/api/tts/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ voiceId, text: clean }),
        });

        if (!response.ok) throw new Error(await response.text());

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);

        audioRef.current = audio;

        audio.onended = () => {
          URL.revokeObjectURL(url);
          setSpeaking(false);
          setMoodForAWhile("happy");
        };

        audio.onerror = () => {
          URL.revokeObjectURL(url);
          setSpeaking(false);
          setMoodForAWhile("idle", 500);
        };

        await audio.play();
      } catch {
        setSpeaking(false);
        setMoodForAWhile("idle", 500);
        setLastReply("Não consegui tocar a voz Piper agora. A API pode ter demorado ou o navegador bloqueou o áudio. Clique em Testar voz novamente.");
      }
    },
    [setMoodForAWhile, stopSpeaking]
  );

  const speak = useCallback(
    (text: string) => {
      const clean = normalizeText(text);
      if (!clean) return;

      if (voiceChoice === "browser") {
        speakBrowser(clean);
        return;
      }

      speakPiper(clean, getPiperVoiceId(voiceChoice));
    },
    [speakBrowser, speakPiper, voiceChoice]
  );

  const readSelection = useCallback(() => {
    const text = getSelectionText() || selectedText;

    if (!text) {
      setLastReply("Selecione um trecho do chat primeiro, ou clique em Escolher no chat e depois clique em um balão.");
      setMoodForAWhile("thinking", 1000);
      return;
    }

    speak(text);
  }, [selectedText, setMoodForAWhile, speak]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedMinimized = localStorage.getItem("adms_voice_minimized");
    const savedEnabled = localStorage.getItem("adms_voice_enabled");
    const savedChoice = localStorage.getItem("adms_voice_compact_choice") as VoiceChoice | null;

    if (savedMinimized === "0") setIsMinimized(false);
    if (savedEnabled === "0") setVoiceEnabled(false);

    if (savedChoice === "browser" || savedChoice === "piper-cadu" || savedChoice === "piper-jeff") {
      setVoiceChoice(savedChoice);
    }

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      stopSpeaking();
    };
  }, [stopSpeaking]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("adms_voice_minimized", isMinimized ? "1" : "0");
  }, [isMinimized]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("adms_voice_enabled", voiceEnabled ? "1" : "0");
  }, [voiceEnabled]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("adms_voice_compact_choice", voiceChoice);
  }, [voiceChoice]);

  useEffect(() => {
    const updateSelection = () => setSelectedText(getSelectionText());

    document.addEventListener("selectionchange", updateSelection);
    document.addEventListener("mouseup", updateSelection);
    document.addEventListener("keyup", updateSelection);

    return () => {
      document.removeEventListener("selectionchange", updateSelection);
      document.removeEventListener("mouseup", updateSelection);
      document.removeEventListener("keyup", updateSelection);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("adms-pick-reading", pickMode);

    return () => {
      document.body.classList.remove("adms-pick-reading");
    };
  }, [pickMode]);

  useEffect(() => {
    if (!pickMode) return;

    const chooseText = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      if (target.closest(".adms-voice-shell") || target.closest(".adms-voice-mini-shell")) return;

      let readable: HTMLElement | null = null;

      for (const selector of READABLE_SELECTORS) {
        readable = target.closest(selector);
        if (readable) break;
      }

      if (!readable) return;

      event.preventDefault();
      event.stopPropagation();

      const text = normalizeText(readable.innerText || readable.textContent || "");

      if (text) speak(text);

      setPickMode(false);
    };

    document.addEventListener("click", chooseText, true);

    return () => {
      document.removeEventListener("click", chooseText, true);
    };
  }, [pickMode, speak]);

  useEffect(() => {
    const scan = () => {
      const messages = findAssistantMessages();
      if (!messages.length) return;

      const newest = messages[messages.length - 1];
      if (!newest || newest === lastSeenRef.current) return;

      lastSeenRef.current = newest;
      setLastReply(newest);

      if (voiceEnabled) {
        speak(newest);
      } else {
        setMoodForAWhile("happy");
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
  }, [setMoodForAWhile, speak, voiceEnabled]);

  if (isMinimized) {
    return (
      <div className="adms-voice-mini-shell">
        <button
          type="button"
          className={`adms-voice-mini ${speaking ? "speaking" : ""} ${voiceEnabled ? "on" : "off"}`}
          onClick={() => setIsMinimized(false)}
          title="Abrir assistente de voz"
        >
          <span className="adms-mini-robot">🤖</span>
          <span className="adms-mini-text">Voz</span>
          <span className="adms-mini-status">{speaking ? "falando" : choiceLabel}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="adms-voice-shell">
      <div className="adms-voice-card">
        <div className="adms-voice-header">
          <div>
            <div className="adms-voice-title">Robô de Voz</div>
            <div className="adms-voice-subtitle">
              {speaking ? "Falando" : pickMode ? "Escolha um balão" : "Pronto"} · {choiceLabel}
            </div>
          </div>

          <button
            type="button"
            className="adms-voice-min-btn"
            onClick={() => setIsMinimized(true)}
            title="Minimizar"
          >
            —
          </button>
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
        </div>

        <div className="adms-voice-choices">
          <button
            type="button"
            className={voiceChoice === "piper-cadu" ? "active" : ""}
            onClick={() => setVoiceChoice("piper-cadu")}
          >
            🎙️ Cadu
          </button>

          <button
            type="button"
            className={voiceChoice === "piper-jeff" ? "active" : ""}
            onClick={() => setVoiceChoice("piper-jeff")}
          >
            🎙️ Jeff
          </button>

          <button
            type="button"
            className={voiceChoice === "browser" ? "active" : ""}
            onClick={() => setVoiceChoice("browser")}
          >
            🌐 Navegador
          </button>
        </div>

        <button
          type="button"
          className="adms-voice-test"
          onClick={() => speak("Oi, Luma. Essa é a voz selecionada para os Agentes ADMs do Studio Sualuma.")}
        >
          Testar voz
        </button>

        <div className="adms-selected-box">
          {selectedText ? (
            <>
              <strong>Selecionado</strong>
              <span>{selectedText}</span>
            </>
          ) : (
            <span>Selecione um trecho ou clique em “Escolher”.</span>
          )}
        </div>

        <div className="adms-voice-preview">{lastReply}</div>

        <div className="adms-voice-actions">
          <button
            type="button"
            className={voiceEnabled ? "active" : ""}
            onClick={() => setVoiceEnabled((value) => !value)}
          >
            {voiceEnabled ? "🔊 Voz ligada" : "🔇 Voz off"}
          </button>

          <button type="button" onClick={readSelection}>
            Ler seleção
          </button>

          <button
            type="button"
            className={pickMode ? "active" : ""}
            onClick={() => setPickMode((value) => !value)}
          >
            {pickMode ? "Clique no balão" : "Escolher"}
          </button>

          <button type="button" onClick={() => speak(lastReply)}>
            Ouvir última
          </button>

          <button type="button" onClick={stopSpeaking}>
            Parar
          </button>
        </div>
      </div>
    </div>
  );
}
