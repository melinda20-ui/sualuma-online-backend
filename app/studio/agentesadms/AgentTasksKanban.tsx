"use client";

import { useMemo, useState } from "react";

type Task = {
  id?: string;
  title?: string;
  message?: string;
  status?: string;
  priority?: string;
  type?: string;
  source?: string;
  link?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
};

type Summary = {
  total: number;
  emEspera: number;
  emAndamento: number;
  concluidas: number;
  arquivadas: number;
  urgentesAbertas: number;
  bugs: number;
};

const columns = [
  { id: "open", title: "Em espera", hint: "Ainda precisa começar" },
  { id: "doing", title: "Em andamento", hint: "Está sendo resolvida agora" },
  { id: "done", title: "Concluídas", hint: "Já foi finalizada" },
  { id: "archived", title: "Arquivadas", hint: "Guardadas fora da fila ativa" }
];

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

function priorityLabel(priority: unknown) {
  const value = norm(priority);
  if (value === "urgent") return "Urgente";
  if (value === "high") return "Alta";
  if (value === "low") return "Baixa";
  return "Média";
}

function priorityClass(priority: unknown) {
  const value = norm(priority);
  if (value === "urgent") return "border-red-400/70 bg-red-500/15 text-red-100";
  if (value === "high") return "border-orange-300/70 bg-orange-500/15 text-orange-100";
  if (value === "low") return "border-slate-500/70 bg-slate-500/15 text-slate-200";
  return "border-blue-300/70 bg-blue-500/15 text-blue-100";
}

function priorityWeight(task: Task) {
  const value = norm(task.priority);
  if (value === "urgent") return 0;
  if (value === "high") return 1;
  if (value === "medium") return 2;
  if (value === "low") return 3;
  return 4;
}

function calcSummary(tasks: Task[]): Summary {
  return {
    total: tasks.length,
    emEspera: tasks.filter((task) => canonicalStatus(task.status) === "open").length,
    emAndamento: tasks.filter((task) => canonicalStatus(task.status) === "doing").length,
    concluidas: tasks.filter((task) => canonicalStatus(task.status) === "done").length,
    arquivadas: tasks.filter((task) => canonicalStatus(task.status) === "archived").length,
    urgentesAbertas: tasks.filter(
      (task) => norm(task.priority) === "urgent" && !["done", "archived"].includes(canonicalStatus(task.status))
    ).length,
    bugs: tasks.filter(
      (task) => norm(task.type) === "bug" && !["done", "archived"].includes(canonicalStatus(task.status))
    ).length
  };
}

export default function AgentTasksKanban({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks || []);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const summary = useMemo(() => calcSummary(tasks), [tasks]);

  const orderedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const p = priorityWeight(a) - priorityWeight(b);
      if (p !== 0) return p;
      return new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime();
    });
  }, [tasks]);

  async function updateTaskStatus(id: string, status: string) {
    const before = tasks;
    setSavingId(id);
    setError("");

    setTasks((current) =>
      current.map((task) =>
        task.id === id
          ? { ...task, status, workflowStatus: status === "doing" ? "in_progress" : status, updatedAt: new Date().toISOString() }
          : task
      )
    );

    try {
      const response = await fetch("/api/studio/agent-tasks-kanban", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, patch: { status } })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "Não consegui salvar a mudança.");
      }

      if (Array.isArray(data.tasks)) {
        setTasks(data.tasks);
      }
    } catch (err) {
      setTasks(before);
      setError(err instanceof Error ? err.message : "Erro ao salvar tarefa.");
    } finally {
      setSavingId(null);
    }
  }

  async function refreshTasks() {
    setError("");

    try {
      const response = await fetch("/api/studio/agent-tasks-kanban", { cache: "no-store" });
      const data = await response.json();

      if (Array.isArray(data.tasks)) {
        setTasks(data.tasks);
      }
    } catch {
      setError("Não consegui atualizar a lista agora.");
    }
  }

  return (
    <section className="mt-8 rounded-[32px] border border-white/10 bg-slate-950/80 p-5 shadow-2xl shadow-blue-950/20">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-blue-300">Central inteligente de tarefas</p>
          <h2 className="mt-2 text-2xl font-black text-white">Kanban dos Agentes ADM</h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-300">
            Arraste uma tarefa entre as colunas. Isso muda o status real no arquivo de tarefas.
            Urgentes e alta prioridade aparecem primeiro.
          </p>
        </div>

        <button
          onClick={refreshTasks}
          className="rounded-2xl border border-blue-300/40 bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-100 hover:bg-blue-500/20"
        >
          Atualizar agora
        </button>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-slate-400">Total</p>
          <p className="text-2xl font-black text-white">{summary.total}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-slate-400">Em espera</p>
          <p className="text-2xl font-black text-white">{summary.emEspera}</p>
        </div>
        <div className="rounded-2xl border border-cyan-300/20 bg-cyan-500/10 p-4">
          <p className="text-xs text-cyan-200">Em andamento</p>
          <p className="text-2xl font-black text-cyan-50">{summary.emAndamento}</p>
        </div>
        <div className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-4">
          <p className="text-xs text-emerald-200">Concluídas</p>
          <p className="text-2xl font-black text-emerald-50">{summary.concluidas}</p>
        </div>
        <div className="rounded-2xl border border-red-300/20 bg-red-500/10 p-4">
          <p className="text-xs text-red-200">Urgentes abertas</p>
          <p className="text-2xl font-black text-red-50">{summary.urgentesAbertas}</p>
        </div>
        <div className="rounded-2xl border border-purple-300/20 bg-purple-500/10 p-4">
          <p className="text-xs text-purple-200">Bugs</p>
          <p className="text-2xl font-black text-purple-50">{summary.bugs}</p>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-4">
        {columns.map((column) => {
          const columnTasks = orderedTasks.filter((task) => canonicalStatus(task.status) === column.id);

          return (
            <div
              key={column.id}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (draggingId) {
                  updateTaskStatus(draggingId, column.id);
                  setDraggingId(null);
                }
              }}
              className="min-h-[420px] rounded-3xl border border-white/10 bg-black/30 p-4"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-white">{column.title}</h3>
                  <p className="text-xs text-slate-400">{column.hint}</p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-black text-white">
                  {columnTasks.length}
                </span>
              </div>

              <div className="space-y-3">
                {columnTasks.length ? columnTasks.map((task) => (
                  <article
                    key={task.id}
                    draggable={Boolean(task.id)}
                    onDragStart={() => setDraggingId(String(task.id))}
                    onDragEnd={() => setDraggingId(null)}
                    className="cursor-grab rounded-2xl border border-white/10 bg-slate-900/90 p-4 shadow-lg shadow-black/20 active:cursor-grabbing"
                  >
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${priorityClass(task.priority)}`}>
                        {priorityLabel(task.priority)}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300">
                        {task.source || "manual"}
                      </span>
                    </div>

                    <h4 className="text-sm font-black leading-snug text-white">
                      {task.title || "Tarefa sem título"}
                    </h4>

                    {task.message ? (
                      <p className="mt-2 line-clamp-4 text-xs leading-relaxed text-slate-300">
                        {task.message}
                      </p>
                    ) : null}

                    <div className="mt-4 flex flex-wrap gap-2">
                      {column.id !== "doing" ? (
                        <button
                          disabled={savingId === task.id}
                          onClick={() => task.id && updateTaskStatus(String(task.id), "doing")}
                          className="rounded-xl border border-cyan-300/30 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-100 hover:bg-cyan-500/20 disabled:opacity-50"
                        >
                          Em andamento
                        </button>
                      ) : null}

                      {column.id !== "done" ? (
                        <button
                          disabled={savingId === task.id}
                          onClick={() => task.id && updateTaskStatus(String(task.id), "done")}
                          className="rounded-xl border border-emerald-300/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100 hover:bg-emerald-500/20 disabled:opacity-50"
                        >
                          Concluir
                        </button>
                      ) : null}

                      {task.link ? (
                        <a
                          href={task.link}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-100 hover:bg-white/10"
                        >
                          Abrir
                        </a>
                      ) : null}
                    </div>
                  </article>
                )) : (
                  <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-500">
                    Nada aqui agora.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
