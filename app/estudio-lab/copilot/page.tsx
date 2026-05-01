import CopilotChatBox from "@/components/copilot/CopilotChatBox";
export const dynamic = "force-dynamic";

export default function CopilotKanbanPage() {
  return (
    <main className="copilot-page">
      <section className="hero">
        <div>
          <p className="eyebrow">Studio Sualuma • Copiloto Operacional</p>
          <h1>Kanban automático do Copiloto</h1>
          <p>
            Relatórios automáticos viram tarefas. Você executa, marca para verificar e o sistema confirma se resolveu de verdade.
          </p>
        </div>
        <button id="refreshBtn">Atualizar relatório agora</button>
      </section>

      <section className="metrics">
        <div><span id="total">0</span><small>Total</small></div>
        <div><span id="todo">0</span><small>Pendente</small></div>
        <div><span id="doing">0</span><small>Em andamento</small></div>
        <div><span id="review">0</span><small>Verificar</small></div>
        <div><span id="done">0</span><small>Concluído e ativado</small></div>
      </section>

      <p id="lastUpdate" className="last-update">Carregando relatório...</p>

      <section className="board">
        <div className="column" data-status="todo">
          <h2>🧾 Pendente</h2>
          <div id="col-todo"></div>
        </div>
        <div className="column" data-status="doing">
          <h2>⚙️ Em andamento</h2>
          <div id="col-doing"></div>
        </div>
        <div className="column" data-status="review">
          <h2>🔎 Verificar</h2>
          <div id="col-review"></div>
        </div>
        <div className="column" data-status="done">
          <h2>✅ Concluído e ativado</h2>
          <div id="col-done"></div>
        </div>
      </section>

      <script
        dangerouslySetInnerHTML={{
          __html: `
const api = "/api/studio/copilot-kanban";

const labels = {
  todo: "Pendente",
  doing: "Em andamento",
  review: "Verificar",
  done: "Concluído e ativado"
};

async function request(action, data = {}) {
  const res = await fetch(api, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...data })
  });
  return res.json();
}

async function setStatus(id, status) {
  await request("setStatus", { id, status });
  await load();
}

async function verifyTask(id) {
  const json = await request("verify", { id });
  alert(json.message || "Verificação finalizada.");
  await load();
}

function card(task) {
  const div = document.createElement("article");
  div.className = "task-card";
  div.innerHTML = \`
    <div class="task-top">
      <strong>\${task.title}</strong>
      <span>\${labels[task.status] || task.status}</span>
    </div>
    <p>\${task.detail}</p>
    <small>Fonte: \${task.source || "Copiloto"} \${task.lastResult ? " • Última verificação: " + task.lastResult : ""}</small>
    <div class="actions">
      <button onclick="setStatus('\${task.id}', 'todo')">Pendente</button>
      <button onclick="setStatus('\${task.id}', 'doing')">Executando</button>
      <button onclick="setStatus('\${task.id}', 'review')">Finalizei</button>
      <button class="verify" onclick="verifyTask('\${task.id}')">Verificar</button>
    </div>
  \`;
  return div;
}

async function load() {
  const res = await fetch(api, { cache: "no-store" });
  const data = await res.json();

  ["todo","doing","review","done"].forEach(status => {
    const el = document.getElementById("col-" + status);
    el.innerHTML = "";
    const tasks = (data.tasks || []).filter(t => t.status === status);
    if (!tasks.length) {
      el.innerHTML = '<div class="empty">Nada aqui agora.</div>';
    } else {
      tasks.forEach(t => el.appendChild(card(t)));
    }
  });

  const counts = data.counts || {};
  document.getElementById("total").textContent = counts.total || 0;
  document.getElementById("todo").textContent = counts.todo || 0;
  document.getElementById("doing").textContent = counts.doing || 0;
  document.getElementById("review").textContent = counts.review || 0;
  document.getElementById("done").textContent = counts.done || 0;

  const date = data.generatedAt ? data.generatedAt : new Date().toLocaleString("pt-BR");
  document.getElementById("lastUpdate").textContent = "Última leitura do Copiloto: " + date;
}

document.getElementById("refreshBtn").addEventListener("click", async () => {
  document.getElementById("refreshBtn").textContent = "Atualizando...";
  await request("refresh");
  document.getElementById("refreshBtn").textContent = "Atualizar relatório agora";
  await load();
});

load();
setInterval(load, 60000);
          `,
        }}
      />

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        .copilot-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(124,58,237,.28), transparent 32%),
            radial-gradient(circle at top right, rgba(56,189,248,.20), transparent 28%),
            #070816;
          color: #fff;
          padding: 28px;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        .hero {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          align-items: center;
          padding: 24px;
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 28px;
          background: rgba(255,255,255,.06);
          box-shadow: 0 24px 80px rgba(0,0,0,.32);
        }
        .eyebrow {
          margin: 0 0 8px;
          color: #38bdf8;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: .14em;
          font-weight: 800;
        }
        h1 { margin: 0; font-size: clamp(28px, 4vw, 48px); }
        .hero p { color: rgba(255,255,255,.68); max-width: 760px; line-height: 1.55; }
        button {
          border: 0;
          cursor: pointer;
          color: #fff;
          background: rgba(255,255,255,.10);
          border: 1px solid rgba(255,255,255,.14);
          border-radius: 999px;
          padding: 10px 14px;
          font-weight: 800;
        }
        #refreshBtn {
          background: linear-gradient(135deg, #7c3aed, #38bdf8);
          box-shadow: 0 14px 40px rgba(56,189,248,.24);
          white-space: nowrap;
        }
        .metrics {
          display: grid;
          grid-template-columns: repeat(5, minmax(120px, 1fr));
          gap: 14px;
          margin: 18px 0;
        }
        .metrics div {
          padding: 18px;
          border: 1px solid rgba(255,255,255,.10);
          border-radius: 22px;
          background: rgba(255,255,255,.055);
        }
        .metrics span { display: block; font-size: 30px; font-weight: 900; }
        .metrics small { color: rgba(255,255,255,.58); }
        .last-update { color: rgba(255,255,255,.58); }
        .board {
          display: grid;
          grid-template-columns: repeat(4, minmax(240px, 1fr));
          gap: 16px;
          align-items: start;
        }
        .column {
          min-height: 420px;
          border: 1px solid rgba(255,255,255,.10);
          border-radius: 24px;
          background: rgba(255,255,255,.045);
          padding: 14px;
        }
        .column h2 {
          margin: 4px 4px 14px;
          font-size: 16px;
        }
        .task-card {
          padding: 14px;
          border-radius: 18px;
          background: rgba(255,255,255,.08);
          border: 1px solid rgba(255,255,255,.10);
          margin-bottom: 12px;
        }
        .task-top {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: flex-start;
        }
        .task-top strong { line-height: 1.25; }
        .task-top span {
          font-size: 11px;
          color: #bae6fd;
          background: rgba(56,189,248,.12);
          border: 1px solid rgba(56,189,248,.18);
          border-radius: 999px;
          padding: 5px 8px;
          white-space: nowrap;
        }
        .task-card p {
          color: rgba(255,255,255,.72);
          font-size: 13px;
          line-height: 1.45;
        }
        .task-card small {
          display: block;
          color: rgba(255,255,255,.48);
          line-height: 1.4;
          margin-bottom: 12px;
        }
        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .actions button {
          padding: 8px 10px;
          font-size: 12px;
        }
        .actions .verify {
          background: linear-gradient(135deg, #22c55e, #38bdf8);
        }
        .empty {
          color: rgba(255,255,255,.42);
          padding: 18px;
          border: 1px dashed rgba(255,255,255,.12);
          border-radius: 16px;
          text-align: center;
        }
        @media (max-width: 1100px) {
          .board { grid-template-columns: repeat(2, 1fr); }
          .metrics { grid-template-columns: repeat(2, 1fr); }
          .hero { flex-direction: column; align-items: flex-start; }
        }
        @media (max-width: 650px) {
          .copilot-page { padding: 16px; }
          .board { grid-template-columns: 1fr; }
          .metrics { grid-template-columns: 1fr; }
        }
      `}</style>
    
      <CopilotChatBox />
</main>
  );
}