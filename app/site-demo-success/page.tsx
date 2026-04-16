import Link from "next/link";

export default function SiteDemoSuccessPage() {
  return (
    <main className="min-h-screen bg-[#f7f4ef] text-[#1e1d1a]">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-4 py-16 text-center">
        <div className="mb-4 inline-flex rounded-full border border-[#d6c7b1] bg-[#fffaf4] px-3 py-1 text-xs text-[#8c6f48]">
          Solicitação recebida
        </div>

        <h1 className="max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
          Bem-vinda(o). Nós vamos criar 3 modelos do site que você solicitou.
        </h1>

        <p className="mt-5 max-w-2xl text-sm leading-8 text-black/60 md:text-base">
          Você poderá avaliar com qual direção quer seguir. Junto aos modelos,
          enviaremos seu orçamento por e-mail e também um aviso no WhatsApp.
        </p>

        <div className="mt-6 rounded-[28px] border border-black/10 bg-white p-6 text-left shadow-[0_15px_35px_rgba(0,0,0,0.05)]">
          <p className="text-sm leading-7 text-black/65">
            Enquanto aguarda, você pode visitar nosso blog para conhecer mais sobre
            negócios, marketing, automação, produtividade e crescimento digital.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/blog"
            className="rounded-2xl bg-[#4a5f53] px-5 py-4 text-sm font-semibold text-white"
          >
            Ir para o blog
          </Link>

          <Link
            href="/site-service"
            className="rounded-2xl border border-black/10 bg-white px-5 py-4 text-sm text-black/75"
          >
            Voltar para a página de sites
          </Link>
        </div>
      </div>
    </main>
  );
}
