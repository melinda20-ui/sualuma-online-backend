import Link from "next/link";

export default function SiteDemoRequestPage() {
  return (
    <main className="min-h-screen bg-[#f7f4ef] text-[#1e1d1a]">
      <div className="mx-auto w-full max-w-4xl px-4 py-10 md:px-6">
        <header className="mb-8">
          <Link
            href="/site-service"
            className="inline-flex rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black/75"
          >
            ← Voltar
          </Link>
        </header>

        <section className="rounded-[34px] border border-black/10 bg-white p-6 shadow-[0_18px_45px_rgba(0,0,0,0.06)] md:p-8">
          <div className="mb-6 inline-flex rounded-full border border-[#d6c7b1] bg-[#fffaf4] px-3 py-1 text-xs text-[#8c6f48]">
            Demonstração grátis
          </div>

          <h1 className="text-3xl font-semibold md:text-5xl">
            Conte para nós como deve ser o seu site
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-black/60 md:text-base">
            Vamos criar 3 modelos iniciais com base no seu segmento, no seu momento
            e nas referências que você deseja seguir.
          </p>

          <form className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-black/70">
                Qual é o segmento da sua empresa?
              </label>
              <input
                placeholder="Ex: moda feminina, clínica, consultoria, marketing..."
                className="w-full rounded-2xl border border-black/10 bg-[#faf8f4] px-4 py-4 text-sm outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-black/70">
                Qual é o seu site atual? (se tiver)
              </label>
              <input
                placeholder="https://..."
                className="w-full rounded-2xl border border-black/10 bg-[#faf8f4] px-4 py-4 text-sm outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-black/70">
                Qual é o site de referência que você gostaria de ter?
              </label>
              <input
                placeholder="Cole aqui um link ou nome de referência"
                className="w-full rounded-2xl border border-black/10 bg-[#faf8f4] px-4 py-4 text-sm outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-black/70">
                Seu nome
              </label>
              <input
                placeholder="Digite seu nome"
                className="w-full rounded-2xl border border-black/10 bg-[#faf8f4] px-4 py-4 text-sm outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-black/70">
                Seu e-mail
              </label>
              <input
                type="email"
                placeholder="voce@empresa.com"
                className="w-full rounded-2xl border border-black/10 bg-[#faf8f4] px-4 py-4 text-sm outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-black/70">
                Seu WhatsApp
              </label>
              <input
                placeholder="(00) 00000-0000"
                className="w-full rounded-2xl border border-black/10 bg-[#faf8f4] px-4 py-4 text-sm outline-none"
              />
            </div>

            <div className="rounded-[24px] border border-[#d6c7b1] bg-[#fffaf4] p-4 text-sm leading-7 text-black/65">
              Em até <span className="font-semibold text-[#4a5f53]">3 horas</span>,
              você receberá seus modelos e o orçamento por e-mail, além de um aviso
              no WhatsApp.
            </div>

            <Link
              href="/site-demo-success"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-[#4a5f53] px-5 py-4 text-sm font-semibold text-white"
            >
              Enviar e continuar
            </Link>
          </form>
        </section>
      </div>
    </main>
  );
}
