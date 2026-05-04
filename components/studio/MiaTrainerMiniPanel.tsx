"use client";

import { useState } from "react";

const actions = [
  {
    label: "Auditar cérebro",
    emoji: "🧠",
    goal: "Audite o cérebro da Mia: prompt, memória, skills, APIs, orquestração, riscos e próximos ajustes."
  },
  {
    label: "Treinar Mia",
    emoji: "🎓",
    goal: "Crie um plano de treinamento para a Mia funcionar como orquestradora chefe dos agentes do Studio."
  },
  {
    label: "Monitorar skills",
    emoji: "🧩",
    goal: "Analise as skills da Mia, diga quais estão conectadas, quais parecem fracas e quais precisam virar prioridade."
  },
  {
    label: "Plano de melhoria",
    emoji: "🚀",
    goal: "Monte um plano prático para melhorar o cérebro da Mia antes do lançamento do Sualuma."
  }
];

function List({ items }: { items: any }) {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <ul className="miaTrainerList">
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>{String(item)}</li>
      ))}
    </ul>
  );
}

export default function MiaTrainerMiniPanel() {
  const [loading, setLoading] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  async function run(goal: string, label: string) {
    setLoading(label);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/studio/mia-trainer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal })
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Não consegui chamar o agente mia-trainer.");
      }

      setResult(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido.");
    } finally {
      setLoading("");
    }
  }

  const data = result?.data || {};

  return (
    <section className="miaTrainerPanel">
      <div className="miaTrainerHeader">
        <div>
          <p>Agente interno</p>
          <h2>Treinador da Mia</h2>
          <span>Skill: mia-trainer · Cérebro Azul</span>
        </div>
        <strong>🧠</strong>
      </div>

      <div className="miaTrainerActions">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => run(action.goal, action.label)}
            disabled={Boolean(loading)}
          >
            <span>{action.emoji}</span>
            {loading === action.label ? "Rodando..." : action.label}
          </button>
        ))}
      </div>

      {error && <div className="miaTrainerError">⚠️ {error}</div>}

      {result && (
        <article className="miaTrainerResult">
          <p className="resultKicker">Resposta do mia-trainer</p>
          <h3>{result.title}</h3>
          <p>{result.answer}</p>

          {(data.next_actions || data.recommended_actions) && (
            <>
              <h4>Próximas ações</h4>
              <List items={data.next_actions || data.recommended_actions} />
            </>
          )}

          {(data.risks || data.blockers) && (
            <>
              <h4>Riscos / bloqueios</h4>
              <List items={data.risks || data.blockers} />
            </>
          )}

          {data.checklist && (
            <>
              <h4>Checklist</h4>
              <List items={data.checklist} />
            </>
          )}
        </article>
      )}

      <style jsx>{`
        .miaTrainerPanel {
          margin: 18px 0 24px;
          border: 1px solid rgba(103, 232, 249, .22);
          background:
            radial-gradient(circle at top right, rgba(103, 232, 249, .14), transparent 34%),
            rgba(255,255,255,.055);
          border-radius: 28px;
          padding: 20px;
          box-shadow: 0 20px 70px rgba(0,0,0,.24);
        }

        .miaTrainerHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 16px;
        }

        .miaTrainerHeader p {
          margin: 0 0 5px;
          color: #67e8f9;
          text-transform: uppercase;
          letter-spacing: .12em;
          font-size: 11px;
          font-weight: 900;
        }

        .miaTrainerHeader h2 {
          margin: 0;
          font-size: 26px;
        }

        .miaTrainerHeader span {
          display: block;
          margin-top: 6px;
          color: rgba(255,255,255,.55);
          font-size: 13px;
        }

        .miaTrainerHeader strong {
          font-size: 42px;
          filter: drop-shadow(0 0 18px rgba(103,232,249,.35));
        }

        .miaTrainerActions {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }

        .miaTrainerActions button {
          border: 1px solid rgba(255,255,255,.12);
          background: rgba(255,255,255,.07);
          color: white;
          border-radius: 18px;
          padding: 13px 12px;
          font-weight: 900;
          cursor: pointer;
        }

        .miaTrainerActions button:hover {
          border-color: rgba(103,232,249,.45);
          background: rgba(103,232,249,.12);
        }

        .miaTrainerActions button:disabled {
          opacity: .6;
          cursor: wait;
        }

        .miaTrainerActions span {
          margin-right: 6px;
        }

        .miaTrainerError {
          margin-top: 14px;
          border: 1px solid rgba(239,68,68,.35);
          background: rgba(239,68,68,.12);
          border-radius: 16px;
          padding: 12px;
        }

        .miaTrainerResult {
          margin-top: 16px;
          border-top: 1px solid rgba(255,255,255,.1);
          padding-top: 16px;
        }

        .resultKicker {
          margin: 0 0 6px;
          color: #f9a8d4;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .1em;
        }

        .miaTrainerResult h3 {
          margin: 0 0 10px;
          font-size: 22px;
        }

        .miaTrainerResult p {
          color: rgba(255,255,255,.76);
          line-height: 1.7;
        }

        .miaTrainerResult h4 {
          margin: 16px 0 8px;
          color: #67e8f9;
        }

        .miaTrainerList {
          margin: 0;
          padding-left: 18px;
          color: rgba(255,255,255,.76);
          line-height: 1.7;
        }

        @media (max-width: 820px) {
          .miaTrainerActions {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 520px) {
          .miaTrainerActions {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}
