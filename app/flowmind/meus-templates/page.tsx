import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { tenantIdFromUserId, readTenantJson } from "@/lib/tenant/tenant-store";

export const dynamic = "force-dynamic";

type Workspace = {
  id: string;
  userId?: string;
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
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(`/login?next=${encodeURIComponent("/flowmind/meus-templates")}`);
  }

  const tenantId = tenantIdFromUserId(user.id);

  const workspaces = readTenantJson<Workspace[]>(
    tenantId,
    "flowmind-workspaces",
    []
  );

  return Array.isArray(workspaces)
    ? workspaces.filter((workspace) => {
        return !workspace.userId || workspace.userId === user.id;
      })
    : [];
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
          Aqui aparecem apenas os templates da sua conta. Cada usuário agora tem
          sua própria casa dentro do FlowMind.
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
