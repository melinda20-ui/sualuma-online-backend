import fs from "fs/promises";
import path from "path";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Workspace = {
  id: string;
  templateSlug: string;
  templateName: string;
  createdAt: string;
  status: "active";
  plan: {
    title: string;
    mainGoal: string;
    weeklyFocus: string;
    agent: string;
    duration: string;
  };
  todayTasks: {
    id: string;
    title: string;
    area: string;
    priority: string;
    status: string;
  }[];
  habits: {
    id: string;
    title: string;
    area: string;
    frequency: string;
  }[];
  checkins: {
    morning: string[];
    night: string[];
  };
};

async function getWorkspaces(): Promise<Workspace[]> {
  try {
    const filePath = path.join(process.cwd(), "data", "flowmind-workspaces.json");
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default async function Page() {
  const workspaces = await getWorkspaces();

  return (
    <main className="fm-commerce">
      <header className="fm-commerce-hero template-hero">
        <nav className="fm-commerce-nav">
          <Link href="/flowmind">← Voltar ao app</Link>
          <div>
            <Link href="/flowmind/templates">Loja</Link>
            <Link href="/flowmind/planos">Planos</Link>
          </div>
        </nav>

        <div className="fm-commerce-kicker">MEUS TEMPLATES</div>
        <h1>Templates ativados dentro do Flowmatic.</h1>
        <p>
          Aqui aparecem os templates que já viraram plano, tarefas, hábitos e
          check-ins. Por enquanto está salvo em JSON local; depois vamos levar para
          Supabase por usuário.
        </p>
      </header>

      {workspaces.length === 0 ? (
        <section className="fm-empty-state">
          <h2>Nenhum template ativado ainda.</h2>
          <p>Abra a loja, escolha um template e clique em “Usar este template”.</p>
          <Link href="/flowmind/templates" className="fm-commerce-btn primary">
            Abrir loja de templates
          </Link>
        </section>
      ) : (
        <section className="fm-workspace-grid">
          {workspaces.map((workspace) => (
            <article className="fm-workspace-card" key={workspace.id}>
              <div className="fm-workspace-top">
                <span>Ativo</span>
                <small>
                  {new Date(workspace.createdAt).toLocaleDateString("pt-BR")}
                </small>
              </div>

              <h2>{workspace.templateName}</h2>
              <p>{workspace.plan.mainGoal}</p>

              <div className="fm-workspace-meta">
                <div>
                  <small>Agente</small>
                  <strong>{workspace.plan.agent}</strong>
                </div>
                <div>
                  <small>Duração</small>
                  <strong>{workspace.plan.duration}</strong>
                </div>
              </div>

              <div className="fm-workspace-block">
                <h3>🎯 Foco da semana</h3>
                <p>{workspace.plan.weeklyFocus}</p>
              </div>

              <div className="fm-workspace-block">
                <h3>📋 Tarefas criadas</h3>
                <ul>
                  {workspace.todayTasks.map((task) => (
                    <li key={task.id}>
                      <b>{task.priority}</b> · {task.title}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="fm-workspace-block">
                <h3>🌱 Hábitos criados</h3>
                <ul>
                  {workspace.habits.map((habit) => (
                    <li key={habit.id}>
                      {habit.title} · {habit.frequency === "daily" ? "diário" : "semanal"}
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href={`/flowmind/templates/${workspace.templateSlug}`}
                className="fm-commerce-btn full"
              >
                Abrir página do template
              </Link>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
