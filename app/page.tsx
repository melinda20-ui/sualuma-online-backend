import Link from "next/link";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-[#050507] text-white overflow-hidden">
      
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(122,0,255,0.22),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(0,240,255,0.18),transparent_25%)]" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 border-b border-white/10">
        <div>
          <p className="text-xs tracking-[0.3em] text-[#00F0FF]">LUMA OS</p>
          <p className="text-xs text-white/40">Sistema operacional criativo</p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/chat" className="text-sm text-white/70">
            Entrar
          </Link>

          <Link
            href="/chat"
            className="rounded-xl bg-[#7A00FF] px-4 py-2 text-sm font-semibold"
          >
            Abrir Chat
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 px-6 pt-16 pb-10 md:pt-24">
        <div className="max-w-4xl">
          <p className="mb-4 text-xs text-[#A855F7]">
            Plataforma para construir empresas com IA
          </p>

          <h1 className="text-5xl md:text-7xl font-semibold leading-[0.95]">
            Você não usa ferramentas.
            <span className="block bg-gradient-to-r from-[#00F0FF] to-[#A855F7] text-transparent bg-clip-text">
              Você cria sistemas.
            </span>
          </h1>

          <p className="mt-6 text-white/60 max-w-2xl">
            Crie agentes, serviços, automações, sites e toda a estrutura da sua
            empresa em um único ambiente inteligente.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link
              href="/chat"
              className="rounded-2xl bg-[#7A00FF] px-6 py-4 font-semibold text-center shadow-[0_0_30px_rgba(122,0,255,0.3)]"
            >
              Abrir chat
            </Link>

            <button className="rounded-2xl border border-white/10 px-6 py-4 text-white/80">
              Ver plataforma
            </button>
          </div>
        </div>
      </section>

      {/* Preview Card */}
      <section className="relative z-10 px-6">
        <div className="max-w-4xl rounded-3xl border border-white/10 bg-[#0b0d12] p-6">
          <p className="text-sm text-[#A855F7] mb-2">Agente</p>
          <p className="text-white/80">
            Pronta para construir sua empresa inteira com IA?
          </p>
        </div>
      </section>

      {/* System Blocks */}
      <section className="relative z-10 px-6 mt-16 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
          
          <div className="p-6 rounded-3xl border border-white/10 bg-white/[0.03]">
            <h3 className="text-lg font-semibold">Chat Inteligente</h3>
            <p className="text-white/60 text-sm mt-2">
              Controle tudo com comandos e IA.
            </p>
          </div>

          <div className="p-6 rounded-3xl border border-white/10 bg-white/[0.03]">
            <h3 className="text-lg font-semibold">Marketplace</h3>
            <p className="text-white/60 text-sm mt-2">
              Agentes, serviços e templates prontos.
            </p>
          </div>

          <div className="p-6 rounded-3xl border border-white/10 bg-white/[0.03]">
            <h3 className="text-lg font-semibold">Mini Empresa</h3>
            <p className="text-white/60 text-sm mt-2">
              Estrutura completa para seu negócio.
            </p>
          </div>

          <div className="p-6 rounded-3xl border border-white/10 bg-white/[0.03]">
            <h3 className="text-lg font-semibold">Criação de Sites</h3>
            <p className="text-white/60 text-sm mt-2">
              Solicite e receba sites profissionais.
            </p>
          </div>

        </div>
      </section>

      {/* CTA FINAL */}
      <section className="relative z-10 px-6 pb-20">
        <div className="max-w-4xl">
          <h2 className="text-3xl font-semibold">
            Comece agora a construir seu sistema
          </h2>

          <Link
            href="/chat"
            className="mt-6 inline-block rounded-2xl bg-[#00F0FF] px-6 py-4 text-black font-semibold"
          >
            Entrar no sistema
          </Link>
        </div>
      </section>
    </main>
  );
}
