"use client";

import { useState } from "react";

type MiaTrainerData = {
  ok?: boolean;
  agent?: string;
  title?: string;
  answer?: string;
  data?: {
    risks?: string[];
    opportunities?: string[];
    checklist?: string[];
    next_actions?: string[];
    needs_human_approval?: boolean;
  };
  error?: string;
};

export default function MiaTrainerMiniPanel() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MiaTrainerData | null>(null);
  const [error, setError] = useState("");

  async function runTrainer() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/studio/mia-trainer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal:
            "Audite o cérebro da Mia. Separe fatos confirmados de dados ausentes. Analise prompt, memória operacional, skills, APIs, roteamento, dashboard e próximos passos sem inventar dados técnicos.",
        }),
      });

      const json = await res.json();
      setResult(json);
      if (!json.ok) setError(json.error || "O mia-trainer respondeu com erro.");
    } catch (err) {
      setError("Falha ao chamar o agente mia-trainer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="miaTrainerBox">
      <div className="miaTrainerGlow" />

      <div className="miaTrainerHeader">
        <div>
          <p className="miaTrainerKicker">AGENTE DO CÉREBRO</p>
          <h2>Treinador da Mia</h2>
          <p>
            Monitora o cérebro da Mia, regras de orquestração, memória, prompts,
            skills e riscos de resposta inventada.
          </p>
        </div>

        <button onClick={runTrainer} disabled={loading}>
          {loading ? "Analisando..." : "Auditar cérebro"}
        </button>
      </div>

      <div className="miaTrainerGrid">
        <div>
          <span>Status</span>
          <strong>{result?.ok ? "Conectado" : "Aguardando teste"}</strong>
        </div>
        <div>
          <span>Agente</span>
          <strong>mia-trainer</strong>
        </div>
        <div>
          <span>Segurança</span>
          <strong>Anti-invenção ativo</strong>
        </div>
      </div>

      {error && <div className="miaTrainerError">⚠️ {error}</div>}

      {result?.answer && (
        <div className="miaTrainerResult">
          <h3>{result.title || "Resultado da auditoria"}</h3>
          <p>{result.answer}</p>

          <div className="miaTrainerLists">
            {!!result.data?.risks?.length && (
              <div>
                <h4>Riscos</h4>
                {result.data.risks.slice(0, 3).map((item, i) => (
                  <p key={i}>• {item}</p>
                ))}
              </div>
            )}

            {!!result.data?.next_actions?.length && (
              <div>
                <h4>Próximas ações</h4>
                {result.data.next_actions.slice(0, 3).map((item, i) => (
                  <p key={i}>• {item}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .miaTrainerBox {
          position: relative;
          overflow: hidden;
          margin: 18px 0 28px;
          padding: 24px;
          border: 1px solid rgba(255, 68, 170, 0.35);
          border-radius: 28px;
          background:
            radial-gradient(circle at top right, rgba(255, 0, 180, 0.18), transparent 38%),
            linear-gradient(135deg, rgba(21, 17, 38, 0.94), rgba(9, 8, 18, 0.96));
          box-shadow: 0 0 42px rgba(255, 0, 160, 0.18);
          color: white;
        }

        .miaTrainerGlow {
          position: absolute;
          inset: -80px;
          background: radial-gradient(circle, rgba(255, 0, 200, 0.16), transparent 55%);
          pointer-events: none;
        }

        .miaTrainerHeader {
          position: relative;
          display: flex;
          gap: 18px;
          align-items: flex-start;
          justify-content: space-between;
        }

        .miaTrainerKicker {
          margin: 0 0 8px;
          color: #ff5fbd;
          font-size: 12px;
          letter-spacing: 0.18em;
          font-weight: 800;
        }

        h2 {
          margin: 0;
          font-size: clamp(28px, 7vw, 52px);
          line-height: 1;
        }

        .miaTrainerHeader p {
          max-width: 720px;
          margin: 12px 0 0;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.5;
        }

        button {
          border: 1px solid rgba(255, 90, 190, 0.65);
          border-radius: 999px;
          padding: 14px 20px;
          background: rgba(255, 40, 160, 0.18);
          color: white;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 0 26px rgba(255, 0, 160, 0.22);
          white-space: nowrap;
        }

        button:disabled {
          opacity: 0.6;
          cursor: wait;
        }

        .miaTrainerGrid {
          position: relative;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 22px;
        }

        .miaTrainerGrid div {
          padding: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.045);
        }

        span {
          display: block;
          color: rgba(255, 255, 255, 0.55);
          font-size: 13px;
          margin-bottom: 8px;
        }

        strong {
          font-size: 16px;
        }

        .miaTrainerError {
          position: relative;
          margin-top: 16px;
          padding: 14px;
          border-radius: 16px;
          background: rgba(255, 80, 80, 0.12);
          border: 1px solid rgba(255, 80, 80, 0.3);
        }

        .miaTrainerResult {
          position: relative;
          margin-top: 18px;
          padding: 18px;
          border-radius: 22px;
          background: rgba(0, 0, 0, 0.24);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .miaTrainerResult h3 {
          margin: 0 0 10px;
          font-size: 20px;
        }

        .miaTrainerResult p {
          color: rgba(255, 255, 255, 0.75);
          line-height: 1.5;
        }

        .miaTrainerLists {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-top: 14px;
        }

        .miaTrainerLists h4 {
          margin: 0 0 8px;
          color: #ff70c7;
        }

        @media (max-width: 720px) {
          .miaTrainerBox {
            margin-top: 10px;
            padding: 20px;
            border-radius: 24px;
          }

          .miaTrainerHeader {
            flex-direction: column;
          }

          button {
            width: 100%;
          }

          .miaTrainerGrid,
          .miaTrainerLists {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}
