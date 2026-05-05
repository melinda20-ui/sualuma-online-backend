import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

async function readBoard() {
  try {
    const file = path.join(process.cwd(), "data", "onboarding-board", "board.json");
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch {
    return null;
  }
}

export default async function OnboardingBoardPage() {
  const board = await readBoard();

  if (!board) {
    return <main style={{ padding: 40 }}>Board ainda não encontrado.</main>;
  }

  return (
    <main className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">Studio Sualuma</p>
          <h1>One Board de Onboarding</h1>
          <p>
            Página de aprovação para a Jornada Sualuma. Aqui ficam as pastas do opt-in, ideias de Growth,
            revisão de UX, funil por cor e tarefas que precisam ser resolvidas para melhorar a primeira experiência do usuário.
          </p>
        </div>

        <div className="bot">
          <div className="head"><span></span><span></span></div>
          <strong>UX + Growth</strong>
          <small>supervisionando</small>
        </div>
      </section>

      <section className="quick">
        <a href="/jornada-sualuma">Abrir página pública</a>
        <a href="/studio/canvas-empresa">Canvas da empresa</a>
        <a href="/api/studio/onboarding-board?sync=1">Sincronizar tarefas</a>
      </section>

      <section className="cards">
        <article>
          <span>Missão</span>
          <p>{board.mission}</p>
        </article>
        <article>
          <span>Página pública</span>
          <p>{board.publicPage}</p>
        </article>
        <article>
          <span>Última supervisão</span>
          <p>{board.lastSupervisorRunAt || "Aguardando ciclo do agente"}</p>
        </article>
      </section>

      <section className="folders">
        <h2>Pastas para aprovar amanhã</h2>
        {board.folders?.map((folder: any) => (
          <details key={folder.name} open>
            <summary>
              <strong>{folder.name}</strong>
              <span>{folder.owner} · {folder.status}</span>
            </summary>
            <ul>
              {folder.items?.map((item: string) => <li key={item}>{item}</li>)}
            </ul>
          </details>
        ))}
      </section>

      <section className="split">
        <div>
          <h2>Ideias do Growth</h2>
          {board.growthIdeas?.map((idea: string) => <p className="idea" key={idea}>{idea}</p>)}
        </div>
        <div>
          <h2>Ideias do UX</h2>
          {board.uxIdeas?.map((idea: string) => <p className="idea" key={idea}>{idea}</p>)}
        </div>
      </section>

      <section className="paths">
        <h2>Caminhos do jogo</h2>
        <div className="pathGrid">
          {board.paths?.map((item: any) => (
            <article key={item.id}>
              <small>{item.color}</small>
              <h3>{item.title}</h3>
              <p>{item.offer}</p>
              <b>{item.goal}</b>
            </article>
          ))}
        </div>
      </section>

      <style>{`
        .page {
          min-height: 100vh;
          background: #070816;
          color: white;
          padding: 32px;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .hero {
          max-width: 1180px;
          margin: 0 auto 24px;
          display: grid;
          grid-template-columns: 1fr 220px;
          gap: 24px;
          align-items: center;
          padding: 30px;
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 34px;
          background:
            radial-gradient(circle at top left, rgba(124,58,237,.25), transparent 35%),
            rgba(255,255,255,.05);
        }

        .eyebrow {
          color: #93c5fd;
          text-transform: uppercase;
          letter-spacing: .14em;
          font-weight: 900;
          font-size: 12px;
        }

        h1 {
          font-size: clamp(36px, 6vw, 72px);
          margin: 8px 0;
          line-height: .92;
        }

        .hero p {
          color: #c7d2fe;
          line-height: 1.7;
          max-width: 820px;
        }

        .bot {
          min-height: 190px;
          border-radius: 28px;
          background: rgba(0,0,0,.26);
          border: 1px solid rgba(255,255,255,.13);
          display: grid;
          place-items: center;
          text-align: center;
          box-shadow: 0 0 60px rgba(56,189,248,.18);
        }

        .head {
          width: 86px;
          height: 70px;
          border-radius: 28px;
          background: linear-gradient(145deg, #111827, #4338ca);
          display: flex;
          gap: 14px;
          justify-content: center;
          align-items: center;
          animation: float 3s ease-in-out infinite;
        }

        .head span {
          width: 13px;
          height: 13px;
          border-radius: 50%;
          background: #67e8f9;
          box-shadow: 0 0 14px #67e8f9;
        }

        .quick,
        .cards,
        .folders,
        .split,
        .paths {
          max-width: 1180px;
          margin: 18px auto;
        }

        .quick {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .quick a {
          color: white;
          text-decoration: none;
          border-radius: 999px;
          padding: 12px 16px;
          background: rgba(255,255,255,.08);
          border: 1px solid rgba(255,255,255,.12);
        }

        .cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }

        .cards article,
        details,
        .split > div,
        .pathGrid article {
          border: 1px solid rgba(255,255,255,.12);
          background: rgba(255,255,255,.06);
          border-radius: 24px;
          padding: 20px;
        }

        .cards span,
        .pathGrid small {
          color: #93c5fd;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .1em;
          font-size: 11px;
        }

        .cards p,
        li,
        .idea,
        .pathGrid p {
          color: #dbeafe;
          line-height: 1.6;
        }

        .folders h2,
        .split h2,
        .paths h2 {
          font-size: 32px;
        }

        details {
          margin-bottom: 12px;
        }

        summary {
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          gap: 18px;
        }

        summary span {
          color: #c4b5fd;
          font-size: 14px;
        }

        .split {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .idea {
          padding: 12px;
          border-radius: 16px;
          background: rgba(0,0,0,.22);
        }

        .pathGrid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 14px;
        }

        .pathGrid h3 {
          line-height: 1.2;
        }

        .pathGrid b {
          color: #facc15;
          font-size: 13px;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-9px); }
        }

        @media (max-width: 1000px) {
          .hero,
          .cards,
          .split,
          .pathGrid {
            grid-template-columns: 1fr;
          }

          .page {
            padding: 18px;
          }

          summary {
            display: block;
          }
        }
      `}</style>
    </main>
  );
}
