import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getIdeas() {
  try {
    const file = path.join(process.cwd(), "data/content-ideas/ideas.json");
    const data = JSON.parse(await fs.readFile(file, "utf8"));
    return Array.isArray(data.ideas) ? data.ideas : [];
  } catch {
    return [];
  }
}

export default async function IdeiasConteudoPage() {
  const ideas = await getIdeas();

  return (
    <main className="min-h-screen bg-[#020617] px-6 py-10 text-white">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-[32px] border border-white/10 bg-gradient-to-br from-slate-950 via-blue-950/40 to-purple-950/40 p-8">
          <p className="text-xs uppercase tracking-[0.35em] text-blue-300">
            Studio Sualuma · Conteúdo
          </p>
          <h1 className="mt-3 text-4xl font-black">
            Ideias de conteúdo
          </h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            Fonte oficial de ideias para o Agente Google/SEO/Radar e para o futuro Agente de Blog.
            Esta página não muda o layout do blog; ela só organiza os temas.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-400">Total de ideias</p>
              <p className="mt-2 text-3xl font-black">{ideas.length}</p>
            </div>
            <div className="rounded-2xl border border-red-300/20 bg-red-500/10 p-5">
              <p className="text-sm text-red-200">Urgentes</p>
              <p className="mt-2 text-3xl font-black">
                {ideas.filter((i: any) => i.priority === "urgent").length}
              </p>
            </div>
            <div className="rounded-2xl border border-orange-300/20 bg-orange-500/10 p-5">
              <p className="text-sm text-orange-200">Alta prioridade</p>
              <p className="mt-2 text-3xl font-black">
                {ideas.filter((i: any) => i.priority === "high").length}
              </p>
            </div>
            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-500/10 p-5">
              <p className="text-sm text-cyan-200">Na fila</p>
              <p className="mt-2 text-3xl font-black">
                {ideas.filter((i: any) => i.stage === "ideia").length}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ideas.map((idea: any) => (
            <article key={idea.id} className="rounded-3xl border border-white/10 bg-slate-950/80 p-5">
              <div className="mb-3 flex gap-2">
                <span className="rounded-full border border-blue-300/20 bg-blue-500/10 px-3 py-1 text-xs text-blue-100">
                  {idea.category}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                  {idea.priority}
                </span>
              </div>
              <h2 className="text-xl font-black">{idea.title}</h2>
              <p className="mt-3 text-sm text-slate-400">Status: {idea.stage}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
