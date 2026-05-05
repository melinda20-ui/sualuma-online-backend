"use client";

import { useState } from "react";

type DetectorType = "Real" | "Misto/Ilustrativo" | "Risco";

interface PanelSuggestion {
  detector: DetectorType;
  percebi: string;
  proxPassos: string;
  linkTarefas?: string;
}

const suggestions: Record<string, PanelSuggestion> = {
  visao: {
    detector: "Misto/Ilustrativo",
    percebi:
      "Alguns indicadores desta tela podem ser ilustrativos. Confirme se estão conectados a dados reais antes de tomar decisões.",
    proxPassos:
      "Verifique quais métricas têm fonte real e marque as demais como estimativas.",
    linkTarefas: "/studio/agentesadms",
  },
  usuarios: {
    detector: "Risco",
    percebi:
      "Permissões e acessos de usuários precisam ser validados com dados reais. Evite exibir dados sensíveis sem autenticação confirmada.",
    proxPassos:
      "Revise as regras de acesso e garanta que cada papel tenha apenas as permissões necessárias.",
    linkTarefas: "/studio/agentesadms",
  },
  google: {
    detector: "Misto/Ilustrativo",
    percebi:
      "Diferencie dados vindos do Search Console/API real de sugestões visuais geradas automaticamente.",
    proxPassos:
      "Conecte a integração real com Google Search Console e valide os tokens de acesso.",
    linkTarefas: "/studio/agentesadms",
  },
  comunidade: {
    detector: "Risco",
    percebi:
      "Regras de moderação, links externos e conteúdo da comunidade precisam de revisão manual periódica.",
    proxPassos:
      "Configure alertas de moderação e documente as regras da comunidade de forma visível.",
    linkTarefas: "/studio/agentesadms",
  },
  tarefas: {
    detector: "Real",
    percebi:
      "Suas tarefas estão visíveis. Priorize as pendentes com maior risco para o lançamento.",
    proxPassos:
      "Abra a primeira tarefa crítica e marque o próximo passo como em andamento.",
    linkTarefas: "/studio/agentesadms",
  },
  mia: {
    detector: "Misto/Ilustrativo",
    percebi:
      "A memória da Mia depende de logs, prompts reais e contexto salvo. Respostas sem histórico podem ficar genéricas.",
    proxPassos:
      "Verifique se o chat da Mia está salvando conversas e se o cérebro está lendo o histórico.",
    linkTarefas: "/studio/agentesadms",
  },
  stripe: {
    detector: "Risco",
    percebi:
      "Checkout, webhooks e liberação de acesso precisam estar conectados ao Stripe antes de vender.",
    proxPassos:
      "Teste compra, webhook e liberação do plano antes de produção.",
    linkTarefas: "/studio/agentesadms",
  },
};

const fallbackSuggestion: PanelSuggestion = {
  detector: "Misto/Ilustrativo",
  percebi:
    "Esta seção pode conter dados ilustrativos. Revise antes de usar como base para decisões.",
  proxPassos: "Identifique quais informações precisam de fonte real.",
  linkTarefas: "/studio/agentesadms",
};

const detectorStyles: Record<
  DetectorType,
  { bg: string; text: string; dot: string }
> = {
  Real: {
    bg: "rgba(16,185,129,0.15)",
    text: "#6ee7b7",
    dot: "#10b981",
  },
  "Misto/Ilustrativo": {
    bg: "rgba(245,158,11,0.15)",
    text: "#fcd34d",
    dot: "#f59e0b",
  },
  Risco: {
    bg: "rgba(239,68,68,0.15)",
    text: "#fca5a5",
    dot: "#ef4444",
  },
};

interface MiaPanelTruthCardProps {
  panelKey?: string;
}

export default function MiaPanelTruthCard({
  panelKey = "visao",
}: MiaPanelTruthCardProps) {
  const [open, setOpen] = useState(false);

  const suggestion = suggestions[panelKey] ?? fallbackSuggestion;
  const style = detectorStyles[suggestion.detector];

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {!open && (
        <>
          <style>{`
            @keyframes miaGlow {
              0%, 100% {
                box-shadow:
                  0 0 6px 1px rgba(139,92,246,0.5),
                  0 0 14px 2px rgba(99,102,241,0.3);
              }
              50% {
                box-shadow:
                  0 0 14px 4px rgba(167,139,250,0.85),
                  0 0 28px 6px rgba(99,102,241,0.5);
              }
            }

            @keyframes miaRingPulse {
              0%, 100% { opacity: 0.55; transform: scale(1); }
              50% { opacity: 1; transform: scale(1.08); }
            }

            .mia-pill-btn:hover {
              transform: scale(1.04) !important;
              filter: brightness(1.15);
            }

            .mia-pill-btn:active {
              transform: scale(0.97) !important;
            }
          `}</style>

          <button
            onClick={() => setOpen(true)}
            aria-label="Ver sugestão da Mia"
            className="mia-pill-btn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "5px 16px 5px 5px",
              borderRadius: "999px",
              background: "rgba(15, 10, 40, 0.82)",
              border: "1.5px solid rgba(139,92,246,0.6)",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 600,
              color: "#ddd6fe",
              letterSpacing: "0.02em",
              animation: "miaGlow 2.4s ease-in-out infinite",
              transition: "transform 0.15s ease, filter 0.15s ease",
              whiteSpace: "nowrap",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
            }}
          >
            <span
              style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  inset: "-3px",
                  borderRadius: "50%",
                  border: "1.5px solid rgba(167,139,250,0.7)",
                  animation: "miaRingPulse 2.4s ease-in-out infinite",
                  pointerEvents: "none",
                }}
              />
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "26px",
                  height: "26px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "#fff",
                  letterSpacing: "0.5px",
                  userSelect: "none",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)",
                }}
              >
                M
              </span>
            </span>

            Que tal isso?
          </button>
        </>
      )}

      {open && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            zIndex: 50,
            width: "min(320px, 90vw)",
            borderRadius: "14px",
            background: "linear-gradient(145deg, #1e1b4b 0%, #1a1035 100%)",
            border: "1px solid rgba(139,92,246,0.35)",
            boxShadow:
              "0 8px 32px rgba(109,40,217,0.4), 0 2px 8px rgba(0,0,0,0.5)",
            padding: "14px 16px 12px",
            animation: "miaPop 0.18s ease-out",
          }}
        >
          <style>{`
            @keyframes miaPop {
              from { opacity: 0; transform: scale(0.92) translateY(-6px); }
              to { opacity: 1; transform: scale(1) translateY(0); }
            }
          `}</style>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
              marginBottom: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "26px",
                  height: "26px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,#6d28d9,#2563eb)",
                  flexShrink: 0,
                  color: "#fff",
                  fontSize: "11px",
                  fontWeight: 800,
                }}
              >
                M
              </span>

              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#c4b5fd",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                Sugestão da Mia
              </span>
            </div>

            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "2px 8px",
                borderRadius: "999px",
                background: style.bg,
                fontSize: "11px",
                fontWeight: 600,
                color: style.text,
                border: `1px solid ${style.dot}44`,
                whiteSpace: "nowrap",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: style.dot,
                  flexShrink: 0,
                }}
              />
              {suggestion.detector}
            </span>
          </div>

          <div
            style={{
              height: "1px",
              background: "rgba(139,92,246,0.2)",
              marginBottom: "10px",
            }}
          />

          <div style={{ marginBottom: "8px" }}>
            <p
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "#a78bfa",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                margin: "0 0 3px",
              }}
            >
              O que percebi
            </p>
            <p
              style={{
                fontSize: "12px",
                color: "#ddd6fe",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              {suggestion.percebi}
            </p>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <p
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "#60a5fa",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                margin: "0 0 3px",
              }}
            >
              Próximo passo
            </p>
            <p
              style={{
                fontSize: "12px",
                color: "#bfdbfe",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              {suggestion.proxPassos}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => setOpen(false)}
              style={{
                padding: "5px 14px",
                borderRadius: "999px",
                background: "rgba(139,92,246,0.15)",
                border: "1px solid rgba(139,92,246,0.35)",
                color: "#c4b5fd",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Fechar
            </button>

            {suggestion.linkTarefas && (
              <a
                href={suggestion.linkTarefas}
                style={{
                  padding: "5px 14px",
                  borderRadius: "999px",
                  background: "linear-gradient(135deg,#6d28d9,#2563eb)",
                  color: "#e9d5ff",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  textDecoration: "none",
                  display: "inline-block",
                  boxShadow: "0 0 10px rgba(109,40,217,0.4)",
                }}
              >
                Ver tarefas →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
