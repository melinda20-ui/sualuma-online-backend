import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions/auth";

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in?next=/member-courses&role=client");
  }

  return (
    <main className="min-h-screen bg-[#050507] px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
          <div>
            <div className="mb-2 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100">
              Aluno
            </div>
            <h1 className="text-3xl font-semibold md:text-5xl">Cursos adquiridos</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/55">Acesse seus cursos, aulas e materiais.</p>
            <p className="mt-2 text-xs text-white/40">Logado como: {user.email}</p>
          </div>

          <form action={signOut}>
            <button className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white/80">
              Sair
            </button>
          </form>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/member-user" className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
            <h2 className="text-lg font-semibold">Minha área</h2>
            <p className="mt-2 text-sm text-white/50">Dashboard principal do usuário.</p>
          </Link>

          <Link href="/member-services" className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
            <h2 className="text-lg font-semibold">Serviços</h2>
            <p className="mt-2 text-sm text-white/50">Serviços contratados e entregas.</p>
          </Link>

          <Link href="/provider-services" className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
            <h2 className="text-lg font-semibold">Prestador</h2>
            <p className="mt-2 text-sm text-white/50">Área para vender e entregar serviços.</p>
          </Link>

          <Link href="/automations" className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
            <h2 className="text-lg font-semibold">Automações</h2>
            <p className="mt-2 text-sm text-white/50">Agentes, fluxos e operações.</p>
          </Link>

          <Link href="/video-editor" className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
            <h2 className="text-lg font-semibold">Editor de vídeo</h2>
            <p className="mt-2 text-sm text-white/50">Ferramentas de vídeo com IA.</p>
          </Link>

          <a href="https://dashboardcliente.sualuma.online" className="rounded-[24px] border border-cyan-400/20 bg-cyan-400/10 p-5">
            <h2 className="text-lg font-semibold">Dashboard cliente</h2>
            <p className="mt-2 text-sm text-cyan-100/70">Abrir subdomínio do cliente.</p>
          </a>
        </div>
      </div>
    </main>
  );
}
