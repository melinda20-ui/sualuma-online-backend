export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050507] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(122,0,255,0.22),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(0,240,255,0.18),transparent_25%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.14),transparent_28%)]" />
      <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:48px_48px]" />

      <header className="relative z-10 flex items-center justify-between border-b border-white/10 bg-black/20 px-6 py-4 backdrop-blur-xl">
        <div>
          <h1 className="text-xl font-bold tracking-[0.3em] text-[#00F0FF] drop-shadow-[0_0_14px_rgba(0,240,255,0.45)]">
            LUMA OS
          </h1>
          <p className="mt-1 text-xs text-white/40">Centro de comando inteligente</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full border border-[#00F0FF]/30 bg-[#00F0FF]/10 px-3 py-1 text-xs text-[#00F0FF] shadow-[0_0_24px_rgba(0,240,255,0.15)]">
            Ollama
          </span>
          <span className="rounded-full border border-[#7A00FF]/30 bg-[#7A00FF]/10 px-3 py-1 text-xs text-[#d7b8ff] shadow-[0_0_24px_rgba(122,0,255,0.18)]">
            Online
          </span>
          <button className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/85 transition hover:border-[#00F0FF]/30 hover:bg-white/[0.08]">
            Novo chat
          </button>
        </div>
      </header>

      <section className="relative z-10 grid min-h-[calc(100vh-73px)] grid-cols-1 lg:grid-cols-[290px_1fr]">
        <aside className="border-r border-white/10 bg-white/[0.03] p-5 backdrop-blur-2xl">
          <div className="mb-6 rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-4 shadow-[0_0_40px_rgba(122,0,255,0.08)]">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00F0FF] via-[#3fbfff] to-[#7A00FF] shadow-[0_0_30px_rgba(0,240,255,0.35)]">
              ✦
            </div>
            <h2 className="text-sm font-semibold text-white">Luma Prime</h2>
            <p className="mt-1 text-xs leading-relaxed text-white/50">
              Seu sistema visual para agentes, automações, criação e escala.
            </p>
          </div>

          <nav className="space-y-2">
            {[
              "Chats",
              "Agentes",
              "Projetos",
              "Workflows",
              "Sites",
              "Configurações",
            ].map((item, index) => (
              <button
                key={item}
                className={`w-full rounded-2xl px-4 py-3 text-left text-sm transition ${
                  index === 0
                    ? "border border-[#00F0FF]/30 bg-[#00F0FF]/10 text-[#00F0FF] shadow-[0_0_24px_rgba(0,240,255,0.12)]"
                    : "border border-transparent bg-white/[0.02] text-white/70 hover:border-white/10 hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                {item}
              </button>
            ))}
          </nav>

          <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-white/35">Status</p>
            <div className="mt-3 space-y-3">
              <div>
                <p className="text-xs text-white/40">Modelo ativo</p>
                <p className="text-sm text-white">Ollama local</p>
              </div>
              <div>
                <p className="text-xs text-white/40">Modo</p>
                <p className="text-sm text-[#00F0FF]">Operacional</p>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex flex-col">
          <section className="px-6 pt-10 pb-6">
            <div className="max-w-4xl">
              <p className="mb-4 inline-flex rounded-full border border-[#7A00FF]/25 bg-[#7A00FF]/10 px-3 py-1 text-xs text-[#d7b8ff] shadow-[0_0_18px_rgba(122,0,255,0.12)]">
                Sistema operacional criativo
              </p>

              <h2 className="max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
                Você não usa ferramentas.
                <span className="mt-2 block bg-gradient-to-r from-[#00F0FF] via-white to-[#A855F7] bg-clip-text text-transparent">
                  Você cria universos.
                </span>
              </h2>

              <p className="mt-5 max-w-2xl text-base text-white/50 md:text-lg">
                Orquestre agentes, construa interfaces, crie automações e transforme
                comandos em ativos reais com uma experiência premium.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <button className="rounded-2xl bg-[#00F0FF] px-6 py-3 font-semibold text-black transition hover:scale-[1.02] shadow-[0_0_35px_rgba(0,240,255,0.35)]">
                  Iniciar comando
                </button>
                <button className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-3 font-medium text-white/85 transition hover:border-[#7A00FF]/30 hover:bg-white/[0.07]">
                  Explorar agentes
                </button>
              </div>
            </div>
          </section>

          <section className="grid flex-1 grid-cols-1 gap-6 px-6 pb-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] shadow-[0_0_60px_rgba(122,0,255,0.08)] backdrop-blur-2xl">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div>
                  <h3 className="font-semibold text-white">Chat principal</h3>
                  <p className="text-sm text-white/40">Comando central do sistema</p>
                </div>
                <span className="rounded-full border border-[#00F0FF]/20 bg-[#00F0FF]/10 px-3 py-1 text-xs text-[#00F0FF]">
                  Ativo
                </span>
              </div>

              <div className="space-y-4 p-5">
                <div className="max-w-xl rounded-3xl border border-white/10 bg-[#0b0d12] p-4 shadow-[0_0_24px_rgba(122,0,255,0.06)]">
                  <p className="mb-1 text-sm font-semibold text-[#A855F7]">Agente</p>
                  <p className="text-sm leading-relaxed text-white/80">
                    Olá, Luma. Seu centro de comando está pronto para construir
                    experiências, sistemas e negócios inteiros.
                  </p>
                </div>

                <div className="ml-auto max-w-xl rounded-3xl border border-[#00F0FF]/20 bg-[#00F0FF]/10 p-4 shadow-[0_0_24px_rgba(0,240,255,0.08)]">
                  <p className="mb-1 text-sm font-semibold text-[#00F0FF]">Você</p>
                  <p className="text-sm leading-relaxed text-white">
                    Quero uma interface poderosa, futurista e vendável.
                  </p>
                </div>
              </div>

              <div className="border-t border-white/10 p-5">
                <div className="flex gap-3">
                  <input
                    placeholder="Digite um comando..."
                    className="w-full rounded-2xl border border-white/10 bg-[#0b0d12] px-4 py-4 text-white outline-none placeholder:text-white/30 focus:border-[#00F0FF] focus:shadow-[0_0_20px_rgba(0,240,255,0.12)]"
                  />
                  <button className="rounded-2xl bg-[#7A00FF] px-6 font-semibold text-white shadow-[0_0_30px_rgba(122,0,255,0.32)] transition hover:bg-[#8d28ff] hover:shadow-[0_0_40px_rgba(122,0,255,0.4)]">
                    Enviar
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-2xl">
                <h3 className="mb-4 font-semibold text-white">Agentes em destaque</h3>

                <div className="space-y-3">
                  {[
                    ["Dev Agent", "Cria sistemas, páginas e estrutura."],
                    ["Design Agent", "Interface, direção visual e UX."],
                    ["Automation Agent", "Fluxos n8n e integrações."],
                  ].map(([title, desc]) => (
                    <div
                      key={title}
                      className="rounded-3xl border border-white/10 bg-black/20 p-4 transition hover:border-[#00F0FF]/20 hover:bg-white/[0.03] hover:shadow-[0_0_24px_rgba(0,240,255,0.08)]"
                    >
                      <p className="font-medium text-white">{title}</p>
                      <p className="mt-1 text-sm text-white/45">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-[#7A00FF]/18 via-black/20 to-[#00F0FF]/10 p-5 backdrop-blur-2xl shadow-[0_0_40px_rgba(122,0,255,0.12)]">
                <p className="text-sm text-white/50">Próxima missão</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">
                  Transformar comando em império
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-white/65">
                  Evoluir o frontend, conectar IA, integrar automações e construir
                  a sua experiência SaaS autoral.
                </p>
                <button className="mt-5 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-white transition hover:bg-white/[0.08]">
                  Planejar evolução
                </button>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
