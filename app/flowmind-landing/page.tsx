import Link from "next/link";

export default function FlowMindLanding() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050507] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[#7A00FF]/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[300px] w-[300px] rounded-full bg-[#FF2D78]/15 blur-[100px]" />
        <div className="absolute left-0 top-1/2 h-[200px] w-[200px] rounded-full bg-[#00F0FF]/10 blur-[80px]" />
      </div>

      <nav className="relative z-10 flex items-center justify-between px-6 py-5 md:px-12">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight">
            <span className="text-[#FF2D78]">Flow</span>Mind
          </span>
        </div>
        <a
          href="https://sualuma.online/login"
          className="rounded-full border border-white/20 bg-white/5 px-5 py-2 text-sm font-medium text-white/80 backdrop-blur transition hover:bg-white/10 hover:text-white"
        >
          Entrar
        </a>
      </nav>

      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-10 pt-10 md:px-12 md:pt-16">
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-center lg:gap-16">
          <div className="flex-1 text-center lg:text-left">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#FF2D78]/30 bg-[#FF2D78]/10 px-4 py-1.5 text-xs font-semibold text-[#FF2D78]">
              ✦ Seu GPS Mental
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              Cabeça organizada,{" "}
              <span className="bg-gradient-to-r from-[#FF2D78] via-[#d7b8ff] to-[#00F0FF] bg-clip-text text-transparent">
                vida que avança
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-white/55 lg:mx-0">
              O FlowMind reúne sua rotina, empresa e metas em um único painel — com IA, agentes e templates prontos pra você começar agora.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <div className="flex items-start gap-3 rounded-2xl border border-[#FF2D78]/20 bg-[#FF2D78]/5 px-4 py-3 text-left">
                <span className="mt-0.5 text-lg">🔗</span>
                <div>
                  <p className="text-sm font-semibold text-white">Integração com Notion</p>
                  <p className="text-xs leading-5 text-white/50">Traga o que já está salvo lá. Sem começar do zero.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-[#7A00FF]/20 bg-[#7A00FF]/5 px-4 py-3 text-left">
                <span className="mt-0.5 text-lg">🤖</span>
                <div>
                  <p className="text-sm font-semibold text-white">Templates + Agentes de IA</p>
                  <p className="text-xs leading-5 text-white/50">Estrutura pronta. IA que guia cada etapa.</p>
                </div>
              </div>
            </div>
            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row lg:items-start">
              <Link
                className="w-full rounded-2xl bg-gradient-to-r from-[#FF2D78] to-[#7A00FF] px-8 py-4 text-center text-sm font-bold text-white shadow-[0_0_30px_rgba(255,45,120,0.3)] transition hover:opacity-90 sm:w-auto"
                href="/flowmind/planos"
              >
                Começar grátis
              </Link>
              <a
                href="https://sualuma.online/login"
                className="w-full rounded-2xl border border-white/15 bg-white/5 px-8 py-4 text-center text-sm font-medium text-white/70 transition hover:bg-white/10 sm:w-auto"
              >
                Já tenho conta →
              </a>
            </div>
          </div>

          <div className="flex-shrink-0">
            <div className="relative mx-auto h-72 w-64 md:h-80 md:w-72">
              <div className="absolute bottom-0 left-1/2 h-36 w-28 -translate-x-1/2 rounded-3xl border border-white/10 bg-gradient-to-b from-[#1a1a2e] to-[#0d0d1a] shadow-2xl">
                <div className="mx-auto mt-4 h-16 w-20 rounded-xl border border-[#00F0FF]/20 bg-[#050507] p-2">
                  <div className="mb-1 h-1.5 w-full rounded-full bg-[#FF2D78]/60" />
                  <div className="mb-1 h-1.5 w-3/4 rounded-full bg-[#7A00FF]/60" />
                  <div className="mb-1 h-1.5 w-full rounded-full bg-[#00F0FF]/60" />
                  <div className="h-1.5 w-2/3 rounded-full bg-[#FF2D78]/40" />
                </div>
                <div className="mt-3 flex justify-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#FF2D78]/80" />
                  <div className="h-3 w-3 rounded-full bg-[#00F0FF]/80" />
                </div>
              </div>
              <div className="absolute left-1/2 top-8 h-28 w-28 -translate-x-1/2 rounded-3xl border border-white/10 bg-gradient-to-b from-[#1e1e3a] to-[#12122a] shadow-xl">
                <div className="mt-7 flex justify-center gap-5">
                  <div className="relative h-6 w-6 rounded-full bg-[#00F0FF]/20">
                    <div className="absolute inset-1 rounded-full bg-[#00F0FF] shadow-[0_0_8px_#00F0FF]" />
                  </div>
                  <div className="relative h-6 w-6 rounded-full bg-[#00F0FF]/20">
                    <div className="absolute inset-1 rounded-full bg-[#00F0FF] shadow-[0_0_8px_#00F0FF]" />
                  </div>
                </div>
                <div className="mx-auto mt-3 h-2 w-10 rounded-full bg-gradient-to-r from-[#FF2D78] to-[#7A00FF]" />
                <div className="absolute -top-6 left-1/2 h-6 w-0.5 -translate-x-1/2 bg-white/20">
                  <div className="absolute -top-2 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-[#FF2D78] shadow-[0_0_8px_#FF2D78]" />
                </div>
              </div>
              <div className="absolute bottom-12 left-4 h-4 w-10 rounded-full bg-gradient-to-r from-[#1a1a2e] to-[#2a1a3e] border border-white/10" />
              <div className="absolute bottom-12 right-4 h-4 w-10 rounded-full bg-gradient-to-r from-[#2a1a3e] to-[#1a1a2e] border border-white/10" />
              <div className="absolute -right-4 top-2 flex flex-col gap-1.5">
                <div className="rounded-xl border border-[#FF2D78]/30 bg-[#FF2D78]/10 px-2.5 py-1 text-xs text-[#FF2D78]">✓ Rotina</div>
                <div className="rounded-xl border border-[#7A00FF]/30 bg-[#7A00FF]/10 px-2.5 py-1 text-xs text-[#d7b8ff]">✓ Empresa</div>
                <div className="rounded-xl border border-[#00F0FF]/30 bg-[#00F0FF]/10 px-2.5 py-1 text-xs text-[#00F0FF]">✓ Metas</div>
              </div>
              <div className="absolute -bottom-3 left-1/2 h-4 w-32 -translate-x-1/2 rounded-full bg-[#7A00FF]/20 blur-md" />
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-6 py-12 md:px-12">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-6">
            <div className="mb-3 text-2xl">🧭</div>
            <h3 className="mb-1 font-semibold text-[#FF2D78]">Check-in diário</h3>
            <p className="text-sm leading-6 text-white/50">Saiba exatamente o que fazer hoje, sem ruído.</p>
          </div>
          <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-6">
            <div className="mb-3 text-2xl">🏠</div>
            <h3 className="mb-1 font-semibold text-[#7A00FF]">Casa, empresa e saúde</h3>
            <p className="text-sm leading-6 text-white/50">Tudo que importa, num só painel organizado.</p>
          </div>
          <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-6">
            <div className="mb-3 text-2xl">⚡</div>
            <h3 className="mb-1 font-semibold text-[#00F0FF]">Agentes que agem</h3>
            <p className="text-sm leading-6 text-white/50">IA que não só responde — ela executa com você.</p>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-2xl px-6 pb-20 pt-4 text-center md:px-12">
        <p className="mb-6 text-sm text-white/40">Plano gratuito disponível. Sem cartão de crédito.</p>
        <Link
          className="inline-flex rounded-2xl bg-gradient-to-r from-[#FF2D78] to-[#7A00FF] px-10 py-4 text-sm font-bold text-white shadow-[0_0_40px_rgba(122,0,255,0.25)] transition hover:opacity-90"
          href="/flowmind/planos"
        >
          Ver planos do FlowMind →
        </Link>
      </section>
    </main>
  );
}
