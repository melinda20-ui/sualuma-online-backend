"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Mood = "idle" | "thinking" | "talking" | "happy";

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
    const nodes = document.querySelectorAll<HTMLElement>(selector);
    nodes.forEach((node) => {
      const text = normalizeText(node.innerText || node.textContent || "");
      if (text.length > 6) found.add(text);
    });
  }

  return Array.from(found);
}

function pickVoice(voices: SpeechSynthesisVoice[], selectedVoiceURI: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;

  if (selectedVoiceURI) {
    const chosen = voices.find((voice) => voice.voiceURI === selectedVoiceURI);
    if (chosen) return chosen;
  }

  return (
    voices.find((v) => v.lang?.toLowerCase() === "pt-br") ||
    voices.find((v) => v.lang?.toLowerCase().startsWith("pt")) ||
    voices[0] ||
    null
  );
}

export default function AdmsVoiceRobotOverlay() {
  const [isMinimized, setIsMinimized] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [mood, setMood] = useState<Mood>("idle");
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [pickMode, setPickMode] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState("");
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1.08);
  const [voicePanelOpen, setVoicePanelOpen] = useState(false);
  const [lastReply, setLastReply] = useState(
    "Oi, Luma. Agora você pode escolher a voz que mais gostar, ajustar velocidade, ajustar tom e escolher qualquer texto do chat para eu ler."
  );

  const lastSeenRef = useRef("");
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const saved = localStorage.getItem("adms_voice_minimized");
    if (saved === "1") {
      setIsMinimized(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("adms_voice_minimized", isMinimized ? "1" : "0");
  }, [isMinimized]);


  const moodLabel = useMemo(() => {
    if (pickMode) return "Escolha um balão";
    if (speaking || mood === "talking") return "Falando";
    if (mood === "thinking") return "Pensando";
    if (mood === "happy") return "Feliz";
    return "Aguardando";
  }, [mood, pickMode, speaking]);

  const preferredVoices = useMemo(() => {
    const pt = availableVoices.filter((voice) => voice.lang?.toLowerCase().startsWith("pt"));
    const others = availableVoices.filter((voice) => !voice.lang?.toLowerCase().startsWith("pt"));
    return [...pt, ...others];
  }, [availableVoices]);

  const selectedVoiceName = useMemo(() => {
    const voice = availableVoices.find((item) => item.voiceURI === selectedVoiceURI);
    return voice ? `${voice.name} · ${voice.lang}` : "Automática";
  }, [availableVoices, selectedVoiceURI]);

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
      utter.rate = rate;
      utter.pitch = pitch;
      utter.volume = 1;

      const voice = pickVoice(availableVoices, selectedVoiceURI);
      if (voice) {
        utter.voice = voice;
        utter.lang = voice.lang || "pt-BR";
      }

      setLastReply(clean);

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
    [availableVoices, pitch, rate, selectedVoiceURI, setMoodForAWhile]
  );

  const readSelection = useCallback(() => {
    const text = getSelectionText() || selectedText;

    if (text) {
      speak(text);
      return;
    }

    setLastReply("Selecione um trecho do chat primeiro. Depois clique em Ler seleção.");
    setMoodForAWhile("thinking", 1200);
  }, [selectedText, setMoodForAWhile, speak]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setSupported("speechSynthesis" in window);

    const savedEnabled = localStorage.getItem("adms_voice_enabled");
    const savedVoice = localStorage.getItem("adms_voice_uri");
    const savedRate = localStorage.getItem("adms_voice_rate");
    const savedPitch = localStorage.getItem("adms_voice_pitch");

    if (savedEnabled === "0") setVoiceEnabled(false);
    if (savedVoice) setSelectedVoiceURI(savedVoice);
    if (savedRate) setRate(Number(savedRate) || 1);
    if (savedPitch) setPitch(Number(savedPitch) || 1.08);

    const loadVoices = () => {
      try {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
      } catch {}
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

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
    if (typeof window === "undefined") return;
    localStorage.setItem("adms_voice_uri", selectedVoiceURI);
  }, [selectedVoiceURI]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("adms_voice_rate", String(rate));
  }, [rate]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("adms_voice_pitch", String(pitch));
  }, [pitch]);

  useEffect(() => {
    const updateSelection = () => {
      setSelectedText(getSelectionText());
    };

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

      if (target.closest(".adms-voice-shell")) return;

      let readable: HTMLElement | null = null;

      for (const selector of READABLE_SELECTORS) {
        readable = target.closest(selector);
        if (readable) break;
      }

      if (!readable) return;

      event.preventDefault();
      event.stopPropagation();

      const text = normalizeText(readable.innerText || readable.textContent || "");

      if (text) {
        speak(text);
      }

      setPickMode(false);
    };

    document.addEventListener("click", chooseText, true);

    return () => {
      document.removeEventListener("click", chooseText, true);
    };
  }, [pickMode, speak]);

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
          <span className="adms-mini-status">{speaking ? "falando" : voiceEnabled ? "ligada" : "off"}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="adms-voice-shell">
      <div className="adms-voice-card">
        <div className="adms-voice-header">
          <div>
            <div className="adms-voice-title">Assistente de Voz</div>
            <div className="adms-voice-subtitle">{moodLabel} · {selectedVoiceName}</div>
          </div>

          <div className="adms-voice-head-actions">
            <button
              type="button"
              className="adms-voice-min-btn"
              onClick={() => setIsMinimized(true)}
              title="Minimizar assistente de voz"
            >
              —
            </button>

            <div className={`adms-voice-dot ${voiceEnabled ? "on" : "off"}`} />
          </div>
        </div>

        <div className={`pink-robot ${mood} ${speaking ? "speaking" : ""} ${pickMode ? "picking" : ""}`}>
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

        <button
          type="button"
          className="adms-voice-config-toggle"
          onClick={() => setVoicePanelOpen((value) => !value)}
        >
          {voicePanelOpen ? "Fechar vozes" : "Escolher voz"}
        </button>

        {voicePanelOpen && (
          <div className="adms-voice-config">
            <label>
              Voz
              <select
                value={selectedVoiceURI}
                onChange={(event) => setSelectedVoiceURI(event.target.value)}
              >
                <option value="">Automática / melhor português</option>
                {preferredVoices.map((voice) => (
                  <option key={voice.voiceURI} value={voice.voiceURI}>
                    {voice.lang?.toLowerCase().startsWith("pt") ? "🇧🇷 " : ""}
                    {voice.name} · {voice.lang}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Velocidade: {rate.toFixed(2)}
              <input
                type="range"
                min="0.7"
                max="1.35"
                step="0.05"
                value={rate}
                onChange={(event) => setRate(Number(event.target.value))}
              />
            </label>

            <label>
              Tom: {pitch.toFixed(2)}
              <input
                type="range"
                min="0.75"
                max="1.45"
                step="0.05"
                value={pitch}
                onChange={(event) => setPitch(Number(event.target.value))}
              />
            </label>

            <button
              type="button"
              className="adms-voice-btn primary"
              onClick={() => speak("Oi, Luma. Essa é uma prévia da voz escolhida para os agentes administrativos do Studio Sualuma.")}
            >
              Testar esta voz
            </button>
          </div>
        )}

        <div className="adms-selected-box">
          {selectedText ? (
            <>
              <strong>Texto selecionado:</strong>
              <span>{selectedText}</span>
            </>
          ) : (
            <span>Selecione um trecho do chat ou use “Escolher no chat”.</span>
          )}
        </div>

        <div className="adms-voice-preview">{lastReply}</div>

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
            onClick={readSelection}
            disabled={!supported}
          >
            Ler seleção
          </button>

          <button
            type="button"
            className={`adms-voice-btn ${pickMode ? "active" : ""}`}
            onClick={() => setPickMode((v) => !v)}
            disabled={!supported}
          >
            {pickMode ? "Clique no balão" : "Escolher no chat"}
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
