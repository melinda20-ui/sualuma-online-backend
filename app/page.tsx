import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#03030a] text-white">
      <section className="relative min-h-screen flex items-center px-6 py-24 md:px-12 lg:px-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(126,34,206,0.35),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(0,212,255,0.24),transparent_32%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:80px_80px] opacity-10" />

        <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-14 lg:grid-cols-[1.02fr_0.98fr]">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-200 shadow-[0_0_35px_rgba(0,212,255,0.15)]">
              <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(0,212,255,1)]" />
              MicroSaaS com IA para empresas inteligentes
            </div>

            <h1 className="max-w-4xl text-4xl font-black leading-[1.02] tracking-tight text-white md:text-6xl lg:text-7xl">
              Sua empresa com{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-fuchsia-400 bg-clip-text text-transparent">
                IA, automações e serviços digitais
              </span>{" "}
              em um só lugar.
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-8 text-white/70 md:text-lg">
              A Sua Luma conecta pequenos negócios a agentes de inteligência artificial,
              criação de sites, atendimento, catálogo, social media, automações e
              prestadores online prontos para acelerar sua operação.
            </p>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/sign-up"
                className="group inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-300 via-blue-500 to-fuchsia-500 px-7 py-4 text-sm font-bold text-white shadow-[0_0_35px_rgba(0,212,255,0.35)] transition hover:-translate-y-1 hover:shadow-[0_0_55px_rgba(168,85,247,0.45)]"
              >
                Começar teste grátis
                <span className="ml-2 transition group-hover:translate-x-1">→</span>
              </Link>

              <Link
                href="/site-demo-request"
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-7 py-4 text-sm font-bold text-white backdrop-blur transition hover:border-cyan-300/50 hover:bg-cyan-300/10"
              >
                Pedir demonstração
              </Link>
            </div>

            <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
                <strong className="block text-xl text-cyan-200">IA</strong>
                <span className="text-xs text-white/55">agentes digitais</span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
                <strong className="block text-xl text-fuchsia-200">Sites</strong>
                <span className="text-xs text-white/55">páginas e funis</span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
                <strong className="block text-xl text-blue-200">Auto</strong>
                <span className="text-xs text-white/55">processos online</span>
              </div>
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            <div className="absolute inset-0 m-auto h-[360px] w-[360px] rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="absolute right-6 top-10 h-40 w-40 rounded-full bg-fuchsia-500/20 blur-3xl" />

            <div className="relative rounded-[2rem] border border-white/10 bg-white/[0.04] p-3 shadow-[0_0_80px_rgba(0,212,255,0.18)] backdrop-blur">
              <Image
                src="/images/bannerhome01.png"
                alt="Banner principal Sua Luma"
                width={760}
                height={760}
                priority
                className="h-auto w-full max-w-[560px] rounded-[1.6rem] object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="relative px-6 py-24 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 max-w-3xl">
            <span className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-300">
              Como funciona
            </span>
            <h2 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
              Um ecossistema digital para tirar sua empresa do improviso.
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                title: "1. Escolha o que precisa",
                text: "Site, automação, atendimento, catálogo, social media, página de vendas ou agentes de IA.",
              },
              {
                title: "2. Receba a solução",
                text: "A plataforma conecta sua demanda ao melhor caminho: prestador, agente ou fluxo automatizado.",
              },
              {
                title: "3. Cresça com sistema",
                text: "Organize vendas, processos, presença digital e atendimento com mais velocidade e menos bagunça.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 shadow-[0_0_45px_rgba(0,0,0,0.25)] backdrop-blur transition hover:-translate-y-1 hover:border-cyan-300/35"
              >
                <h3 className="text-xl font-black text-white">{item.title}</h3>
                <p className="mt-4 leading-7 text-white/65">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-24 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-cyan-300/20 bg-gradient-to-r from-cyan-400/10 via-blue-500/10 to-fuchsia-500/10 p-8 text-center shadow-[0_0_70px_rgba(0,212,255,0.12)] md:p-14">
          <h2 className="text-3xl font-black md:text-5xl">
            Pronta para transformar sua operação digital?
          </h2>
          <p className="mx-auto mt-5 max-w-2xl leading-8 text-white/70">
            Comece com uma demonstração e veja como a Sua Luma pode ajudar sua empresa
            a vender, atender e operar melhor.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/site-demo-request"
              className="inline-flex items-center justify-center rounded-full bg-white px-7 py-4 text-sm font-black text-[#060612] transition hover:-translate-y-1"
            >
              Pedir demonstração grátis
            </Link>
            <Link
              href="/plans"
              className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-7 py-4 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Ver planos
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
