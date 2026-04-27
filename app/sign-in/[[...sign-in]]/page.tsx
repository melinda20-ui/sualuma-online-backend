import Link from "next/link";
import { signIn } from "@/app/auth/actions/auth";

type Params = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined, fallback = "") {
  return Array.isArray(value) ? value[0] || fallback : value || fallback;
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams?: Promise<Params> | Params;
}) {
  const params = await Promise.resolve(searchParams || {});
  const error = first(params.error);
  const role = first(params.role, "client") === "provider" ? "provider" : "client";
  const next = first(params.next, role === "provider" ? "/provider-services" : "/member-user");

  return (
    <main className="min-h-screen bg-[#050507] text-white">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 lg:grid-cols-2">
        <section className="flex flex-col justify-center px-6 py-16 md:px-10">
          <div className="mb-4 inline-flex w-fit rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100">
            Login Supabase
          </div>

          <h1 className="max-w-xl text-4xl font-semibold leading-tight md:text-6xl">
            Entre na sua conta Sualuma.
          </h1>

          <p className="mt-5 max-w-xl text-sm leading-7 text-white/55 md:text-base">
            Acesse seu dashboard, projetos, serviços, automações e área de prestador usando Supabase.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/" className="rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm text-white/80">
              Voltar para home
            </Link>

            <Link href={`/sign-up?role=${role}&next=${encodeURIComponent(next)}`} className="rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm text-white/80">
              Criar conta
            </Link>
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-16 md:px-10">
          <form action={signIn} className="w-full max-w-md rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_0_40px_rgba(24,242,255,0.08)] backdrop-blur-xl">
            <h2 className="text-2xl font-semibold">Entrar</h2>
            <p className="mt-2 text-sm leading-6 text-white/55">Use e-mail e senha cadastrados no Supabase.</p>

            {error ? (
              <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-100">
                {decodeURIComponent(error)}
              </div>
            ) : null}

            <input type="hidden" name="redirect_to" value={next} />

            <label className="mt-5 block text-xs font-semibold text-white/60">Tipo de acesso</label>
            <select name="role" defaultValue={role} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none">
              <option value="client">Cliente / Empresa</option>
              <option value="provider">Prestador de serviço</option>
            </select>

            <label className="mt-4 block text-xs font-semibold text-white/60">E-mail</label>
            <input name="email" type="email" required className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none" placeholder="voce@email.com" />

            <label className="mt-4 block text-xs font-semibold text-white/60">Senha</label>
            <input name="password" type="password" required className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none" placeholder="Sua senha" />

            <button className="mt-6 w-full rounded-2xl bg-cyan-400 px-4 py-4 text-sm font-bold text-black shadow-[0_0_24px_rgba(24,242,255,0.25)]">
              Entrar
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
