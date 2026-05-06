import { promises as fs } from "fs";
import path from "path";
import AgentTasksKanban from "./AgentTasksKanban";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnyObj = Record<string, any>;

async function readJson<T>(relativePath: string, fallback: T): Promise<T> {
  try {
    const file = path.join(process.cwd(), relativePath);
    return JSON.parse(await fs.readFile(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function asTasks(raw: any): AnyObj[] {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.tasks)) return raw.tasks;
  return [];
}

function norm(value: unknown) {
  return String(value || "").toLowerCase().trim();
}

function canonicalStatus(status: unknown) {
  const value = norm(status);
  if (["doing", "in_progress"].includes(value)) return "doing";
  if (["done", "concluido", "concluído", "finalizado"].includes(value)) return "done";
  if (value === "archived") return "archived";
  return "open";
}

function stats(tasks: AnyObj[]) {
  return {
    total: tasks.length,
    emEspera: tasks.filter((task) => canonicalStatus(task.status) === "open").length,
    emAndamento: tasks.filter((task) => canonicalStatus(task.status) === "doing").length,
    concluidas: tasks.filter((task) => canonicalStatus(task.status) === "done").length,
    arquivadas: tasks.filter((task) => canonicalStatus(task.status) === "archived").length,
    urgentes: tasks.filter(
      (task) => norm(task.priority) === "urgent" && !["done", "archived"].includes(canonicalStatus(task.status))
    ).length,
    bugs: tasks.filter(
      (task) => norm(task.type) === "bug" && !["done", "archived"].includes(canonicalStatus(task.status))
    ).length
  };
}

function StatCard({
  label,
  value,
  tone = "default"
}: {
  label: string;
  value: string | number;
  tone?: "default" | "cyan" | "green" | "red" | "purple";
}) {
  const tones = {
    default: "border-white/10 bg-white/5 text-white",
    cyan: "border-cyan-300/20 bg-cyan-500/10 text-cyan-50",
    green: "border-emerald-300/20 bg-emerald-500/10 text-emerald-50",
    red: "border-red-300/20 bg-red-500/10 text-red-50",
    purple: "border-purple-300/20 bg-purple-500/10 text-purple-50"
  };

  return (
    <div className={`rounded-3xl border p-5 ${tones[tone]}`}>
      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-black">{value}</p>
    </div>
  );
}

export default async function AgentesAdmsPage() {
  const rawTasks = await readJson<any>("data/agent-tasks/tasks.json", []);
  const tasks = asTasks(rawTasks);

  const leads = await readJson<AnyObj[]>("data/leads-prospector/leads.json", []);
  const campaignQueue = await readJson<AnyObj[]>("data/campaign-agent/queue.json", []);
  const campaignState = await readJson<AnyObj>("data/campaign-agent/state.json", {});

  const s = stats(tasks);
  const campaignActive = campaignState?.enabled || campaignState?.active || campaignState?.status === "active";

  return (
    <main className="min-h-screen bg-[#020617] px-5 py-8 text-white md:px-10">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-[36px] border border-white/10 bg-gradient-to-br from-slate-950 via-slate-950 to-blue-950/40 p-6 shadow-2xl shadow-blue-950/20 md:p-8">
          <p className="text-xs uppercase tracking-[0.4em] text-blue-300">
            Studio Sualuma
          </p>

          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-black md:text-5xl">
                Agentes ADM
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300 md:text-base">
                Painel operacional dos agentes. Agora a fila virou Kanban: dá para enxergar espera,
                andamento, concluídas, urgentes e arrastar tarefas entre colunas.
              </p>
            </div>

            <a
              href="/studio"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-100 hover:bg-white/10"
            >
              Voltar ao Studio
            </a>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4 xl:grid-cols-8">
            <StatCard label="Total" value={s.total} />
            <StatCard label="Em espera" value={s.emEspera} />
            <StatCard label="Em andamento" value={s.emAndamento} tone="cyan" />
            <StatCard label="Concluídas" value={s.concluidas} tone="green" />
            <StatCard label="Urgentes" value={s.urgentes} tone="red" />
            <StatCard label="Bugs" value={s.bugs} tone="purple" />
            <StatCard label="Leads" value={Array.isArray(leads) ? leads.length : 0} />
            <StatCard label="Fila campanha" value={Array.isArray(campaignQueue) ? campaignQueue.length : 0} />
          </div>

          <div className="mt-4 rounded-3xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
            Campanha ativa:{" "}
            <strong className={campaignActive ? "text-emerald-300" : "text-slate-400"}>
              {campaignActive ? "sim" : "não"}
            </strong>
          </div>
        </div>

        <AgentTasksKanban initialTasks={tasks} />
      </section>
    </main>
  );
}
