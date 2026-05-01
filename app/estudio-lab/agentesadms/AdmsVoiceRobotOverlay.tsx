"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Mood = "idle" | "thinking" | "talking" | "happy";

type PiperVoice = {
  id: string;
  name: string;
  lang: string;
  quality: string;
};

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

function pickBrowserVoice(voices: SpeechSynthesisVoice[], selectedVoiceURI: string) {
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
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [mood, setMood] = useState<Mood>("idle");
  const [speaking, setSpeaking] = useState(false);
  const [browserSupported, setBrowserSupported] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [pickMode, setPickMode] = useState(false);
  const [availableBrowserVoices, setAvailableBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [piperVoices, setPiperVoices] = useState<PiperVoice[]>([]);
  const [voiceChoice, setVoiceChoice] = useState("browser:auto");
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1.08);
  const [voicePanelOpen, setVoicePanelOpen] = useState(false);
  const [lastReply, setLastReply] = useState(
    "Oi, Luma. Agora você pode usar vozes locais do Piper ou vozes do navegador para ler qualquer texto do chat."
  );

  const lastSeenRef = useRef("");
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const canSpeak = browserSupported || piperVoices.length > 0;

  const moodLabel = useMemo(() => {
    if (pickMode) return "Escolha um balão";
    if (speaking || mood === "talking") return "Falando";
    if (mood === "thinking") return "Pensando";
    if (mood === "happy") return "Feliz";
    return "Aguardando";
  }, [mood, pickMode, speaking]);

  const preferredBrowserVoices = useMemo(() => {
    const pt = availableBrowserVoices.filter((voice) => voice.lang?.toLowerCase().startsWith("pt"));
    const others = availableBrowserVoices.filter((voice) => !voice.lang?.toLowerCase().startsWith("pt"));
    return [...pt, ...others];
  }, [availableBrowserVoices]);

  const selectedVoiceName = useMemo(() => {
    if (voiceChoice.startsWith("piper:")) {
      const id = voiceChoice.replace("piper:", "");
      const voice = piperVoices.find((item) => item.id === id);
      return voice ? `${voice.name} · Piper local` : "Piper local";
    }

    const browserURI = voiceChoice.replace("browser:", "");
    if (browserURI && browserURI !== "auto") {
      const voice = availableBrowserVoices.find((item) => item.voiceURI === browserURI);
      return voice ? `${voice.name} · navegador` : "Navegador";
    }

    return "Automática";
  }, [availableBrowserVoices, piperVoices, voiceChoice]);

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

  const speakWithBrowser = useCallback(
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

      const browserURI = voiceChoice.startsWith("browser:") ? voiceChoice.replace("browser:", "") : "";
      const voice = pickBrowserVoice(availableBrowserVoices, browserURI === "auto" ? "" : browserURI);

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
    [availableBrowserVoices, pitch, rate, setMoodForAWhile, voiceChoice]
  );

  const speakWithPiper = useCallback(
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
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: clean,
            voiceId,
          }),
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);

        audioRef.current = audio;

        audio.onended = () => {
          URL.revokeObjectURL(url);
          setSpeaking(false);
          setMoodForAWhile("happy", 1400);
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
        setLastReply("Não consegui tocar a voz Piper agora. Tente clicar em Testar voz de novo.");
      }
    },
    [setMoodForAWhile, stopSpeaking]
  );

  const speak = useCallback(
    (text: string) => {
      const clean = normalizeText(text);
      if (!clean) return;

      if (voiceChoice.startsWith("piper:")) {
        const voiceId = voiceChoice.replace("piper:", "") || "pt_BR-cadu-medium";
        void speakWithPiper(clean, voiceId);
        return;
      }

      speakWithBrowser(clean);
    },
    [speakWithBrowser, speakWithPiper, voiceChoice]
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

    setBrowserSupported("speechSynthesis" in window);

    const savedEnabled = localStorage.getItem("adms_voice_enabled");
    const savedChoice = localStorage.getItem("adms_voice_choice");
    const savedRate = localStorage.getItem("adms_voice_rate");
    const savedPitch = localStorage.getItem("adms_voice_pitch");

    if (savedEnabled === "0") setVoiceEnabled(false);
    if (savedChoice) setVoiceChoice(savedChoice);
    if (savedRate) setRate(Number(savedRate) || 1);
    if (savedPitch) setPitch(Number(savedPitch) || 1.08);

    const loadBrowserVoices = () => {
      try {
        const voices = window.speechSynthesis.getVoices();
        setAvailableBrowserVoices(voices);
      } catch {}
    };

    loadBrowserVoices();

    if ("speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = loadBrowserVoices;
    }

    fetch("/api/tts/voices", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.voices)) {
          setPiperVoices(data.voices);
        }
      })
      .catch(() => {});

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      stopSpeaking();
    };
  }, [stopSpeaking]);

  useEffect(() => {
    localStorage.setItem("adms_voice_enabled", voiceEnabled ? "1" : "0");
  }, [voiceEnabled]);

  useEffect(() => {
    localStorage.setItem("adms_voice_choice", voiceChoice);
  }, [voiceChoice]);

  useEffect(() => {
    localStorage.setItem("adms_voice_rate", String(rate));
  }, [rate]);

  useEffect(() => {
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

      if (voiceEnabled && canSpeak) {
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
  }, [canSpeak, setMoodForAWhile, speak, voiceEnabled]);

  return (
    <div className="adms-voice-shell">
      <div className="adms-voice-card">
        <div className="adms-voice-header">
          <div>
            <div className="adms-voice-title">Assistente de Voz</div>
            <div className="adms-voice-subtitle">{moodLabel} · {selectedVoiceName}</div>
          </div>

          <div className={`adms-voice-dot ${voiceEnabled ? "on" : "off"}`} />
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
              Motor e voz
              <select
                value={voiceChoice}
                onChange={(event) => setVoiceChoice(event.target.value)}
              >
                <option value="browser:auto">Navegador · automática</option>

                {piperVoices.length > 0 && (
                  <optgroup label="Piper local no servidor">
                    {piperVoices.map((voice) => (
                      <option key={voice.id} value={`piper:${voice.id}`}>
                        {voice.name} · {voice.lang} · {voice.quality}
                      </option>
                    ))}
                  </optgroup>
                )}

                {preferredBrowserVoices.length > 0 && (
                  <optgroup label="Vozes do navegador">
                    {preferredBrowserVoices.map((voice) => (
                      <option key={voice.voiceURI} value={`browser:${voice.voiceURI}`}>
                        {voice.lang?.toLowerCase().startsWith("pt") ? "🇧🇷 " : ""}
                        {voice.name} · {voice.lang}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </label>

            {!voiceChoice.startsWith("piper:") && (
              <>
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
              </>
            )}

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
            disabled={!canSpeak}
          >
            Ler seleção
          </button>

          <button
            type="button"
            className={`adms-voice-btn ${pickMode ? "active" : ""}`}
            onClick={() => setPickMode((v) => !v)}
            disabled={!canSpeak}
          >
            {pickMode ? "Clique no balão" : "Escolher no chat"}
          </button>

          <button
            type="button"
            className="adms-voice-btn"
            onClick={() => speak(lastReply)}
            disabled={!canSpeak}
          >
            Ouvir última
          </button>

          <button
            type="button"
            className="adms-voice-btn"
            onClick={stopSpeaking}
            disabled={!canSpeak}
          >
            Parar
          </button>
        </div>

        {!canSpeak && (
          <div className="adms-voice-warning">
            Nenhuma voz disponível ainda. Verifique se o Piper local foi instalado ou use Chrome/Edge.
          </div>
        )}
      </div>
    </div>
  );
}
