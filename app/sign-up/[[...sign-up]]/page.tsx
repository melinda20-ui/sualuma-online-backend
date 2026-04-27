import Link from "next/link";
import { signUp } from "@/app/auth/actions/auth";

type Params = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined, fallback = "") {
  return Array.isArray(value) ? value[0] || fallback : value || fallback;
}

export default async function SignUpPage({
  searchParams,
}: {
  searchParams?: Promise<Params> | Params;
}) {
  const params = await Promise.resolve(searchParams || {});
  const error = first(params.error);
  const success = first(params.success);
  const role = first(params.role, "client") === "provider" ? "provider" : "client";
  const next = first(params.next, role === "provider" ? "/provider-services" : "/member-user");

  return (
    <main className="min-h-screen bg-[#050507] text-white">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 lg:grid-cols-2">
        <section className="flex flex-col justify-center px-6 py-16 md:px-10">
          <div className="mb-4 inline-flex w-fit rounded-full border border-[#8d5cff]/25 bg-[#8d5cff]/10 px-3 py-1 text-xs text-[#d7b8ff]">
            Cadastro Supabase
          </div>

          <h1 className="max-w-xl text-4xl font-semibold leading-tight md:text-6xl">
            Crie sua conta Sualuma.
          </h1>

          <p className="mt-5 max-w-xl text-sm leading-7 text-white/55 md:text-base">
            Uma única conta para acessar cliente, prestador, marketplace, cursos, automações e planos pagos via Stripe.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/sign-in" className="rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm text-white/80">
              Já tenho conta
            </Link>
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-16 md:px-10">
          <form action={signUp} className="w-full max-w-md rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_0_40px_rgba(141,92,255,0.08)] backdrop-blur-xl">
            <h2 className="text-2xl font-semibold">Criar conta</h2>
            <p className="mt-2 text-sm leading-6 text-white/55">Seu cadastro será salvo no Supabase Auth.</p>

            {error ? (
              <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-100">
                {decodeURIComponent(error)}
              </div>
            ) : null}

            {success === "check-email" ? (
              <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-sm text-cyan-100">
                Conta criada. Confira seu e-mail para confirmar o cadastro, se a confirmação estiver ativa no Supabase.
              </div>
            ) : null}

            <input type="hidden" name="redirect_to" value={next} />

            <label className="mt-5 block text-xs font-semibold text-white/60">Nome</label>
            <input name="full_name" required className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none" placeholder="Seu nome" />

            <label className="mt-4 block text-xs font-semibold text-white/60">Tipo de conta</label>
            <select name="role" defaultValue={role} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none">
              <option value="client">Cliente / Empresa</option>
              <option value="provider">Prestador de serviço</option>
            </select>

            <label className="mt-4 block text-xs font-semibold text-white/60">E-mail</label>
            <input name="email" type="email" required className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none" placeholder="voce@email.com" />

            <label className="mt-4 block text-xs font-semibold text-white/60">Senha</label>
            <input name="password" type="password" required className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none" placeholder="Crie uma senha" />

            <button className="mt-6 w-full rounded-2xl bg-[#8d5cff] px-4 py-4 text-sm font-bold text-white shadow-[0_0_24px_rgba(141,92,255,0.25)]">
              Criar conta
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
