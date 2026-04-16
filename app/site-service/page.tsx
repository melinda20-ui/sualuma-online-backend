import Link from "next/link";

const portfolio = [
  {
    title: "Site institucional premium",
    type: "Site empresarial",
    description:
      "Estrutura ideal para empresas que querem presença profissional, autoridade e geração de leads.",
  },
  {
    title: "Landing page de alta conversão",
    type: "Página de vendas",
    description:
      "Página pensada para campanhas, lançamentos, captação de leads e ofertas com foco em conversão.",
  },
  {
    title: "Blog estratégico com SEO",
    type: "Blog",
    description:
      "Estrutura de conteúdo para atrair tráfego orgânico, educar o público e vender com artigos bem posicionados.",
  },
  {
    title: "Loja virtual leve e elegante",
    type: "E-commerce",
    description:
      "Visual mais clean e moderno, com foco em experiência mobile, confiança e jornada de compra.",
  },
  {
    title: "Portal de serviços com área privada",
    type: "Área de membros",
    description:
      "Ideal para prestação de serviços, acompanhamento de projetos, briefings e comunicação com clientes.",
  },
  {
    title: "Site para expert ou curso online",
    type: "Infoproduto",
    description:
      "Perfeito para quem vende consultoria, mentorias, cursos e treinamentos com posicionamento premium.",
  },
];

const faq = [
  {
    question: "Como funciona a demonstração grátis?",
    answer:
      "Você preenche o formulário, informa seu segmento e suas referências, e nós criamos três modelos visuais para você avaliar.",
  },
  {
    question: "Em quanto tempo recebo os modelos?",
    answer:
      "Em até 3 horas você recebe os modelos e o orçamento por e-mail, além de um aviso no WhatsApp.",
  },
  {
    question: "Preciso já ter um site?",
    answer:
      "Não. Se você já tiver um site, analisamos o atual. Se não tiver, criamos com base no seu objetivo e referências.",
  },
  {
    question: "Vocês fazem só o design ou também o site completo?",
    answer:
      "Podemos fazer o visual, a estrutura estratégica e também a construção completa do site, dependendo do pacote escolhido.",
  },
  {
    question: "O site pode ter blog, automações ou área de membros?",
    answer:
      "Sim. A proposta pode incluir blog, integração com automações, captação de leads, área de membros e outros recursos.",
  },
];

const storeProducts = [
  { name: "Conjunto Elegance", price: "R$ 129,90" },
  { name: "Vestido Aura", price: "R$ 149,90" },
  { name: "Blazer Lumière", price: "R$ 189,90" },
  { name: "Body Premium", price: "R$ 79,90" },
];

export default function SiteServicePage() {
  return (
    <main className="min-h-screen bg-[#f7f4ef] text-[#1e1d1a]">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">
        <header className="mb-10 flex flex-col gap-4 border-b border-black/10 pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-[0.3em] text-[#6a7c6f]">
              LUMA STUDIO
            </p>
            <p className="mt-2 text-sm text-black/55">
              Construção de sites, páginas de vendas, blogs e áreas estratégicas
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="https://wa.me/5500000000000"
              className="rounded-2xl border border-[#6a7c6f]/30 bg-white px-4 py-3 text-sm font-medium text-[#4a5f53]"
            >
              Falar no WhatsApp
            </Link>
            <Link
              href="/site-demo-request"
              className="rounded-2xl bg-[#4a5f53] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(74,95,83,0.18)]"
            >
              Peça sua demonstração grátis agora
            </Link>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-8 pb-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="mb-4 inline-flex rounded-full border border-[#d6c7b1] bg-[#fffaf4] px-3 py-1 text-xs text-[#8c6f48]">
              Sites com estratégia, identidade e conversão
            </div>

            <h1 className="max-w-4xl text-4xl font-semibold leading-tight md:text-6xl">
              Nós criamos sites que passam confiança, vendem melhor e ajudam sua empresa a crescer com estrutura.
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-8 text-black/65 md:text-base">
              Criamos sites institucionais, páginas de vendas, blogs, áreas de membros
              e estruturas digitais pensadas para pequenas empresas, autônomos e
              negócios que querem se posicionar com mais clareza e profissionalismo.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/site-demo-request"
                className="rounded-2xl bg-[#4a5f53] px-5 py-4 text-sm font-semibold text-white"
              >
                Peça sua demonstração grátis agora
              </Link>
              <Link
                href="https://wa.me/5500000000000"
                className="rounded-2xl border border-black/10 bg-white px-5 py-4 text-sm text-black/75"
              >
                Chat ao vivo no WhatsApp
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-[24px] border border-black/10 bg-white p-4">
                <p className="text-xs text-black/45">Entrega</p>
                <p className="mt-2 text-2xl font-semibold">Rápida</p>
              </div>
              <div className="rounded-[24px] border border-black/10 bg-white p-4">
                <p className="text-xs text-black/45">Modelos iniciais</p>
                <p className="mt-2 text-2xl font-semibold">3</p>
              </div>
              <div className="rounded-[24px] border border-black/10 bg-white p-4">
                <p className="text-xs text-black/45">Foco</p>
                <p className="mt-2 text-2xl font-semibold">Conversão</p>
              </div>
              <div className="rounded-[24px] border border-black/10 bg-white p-4">
                <p className="text-xs text-black/45">Suporte</p>
                <p className="mt-2 text-2xl font-semibold">Humano</p>
              </div>
            </div>
          </div>

          <div className="rounded-[36px] border border-black/10 bg-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.06)]">
            <div className="mb-4 rounded-[28px] border border-[#d6c7b1] bg-[#fffaf4] p-5">
              <p className="text-sm font-semibold text-[#8c6f48]">Promoção relâmpago</p>
              <h2 className="mt-3 text-3xl font-semibold text-[#1e1d1a]">
                15:00
              </h2>
              <p className="mt-2 text-sm text-black/60">
                Use o código <span className="font-semibold text-[#4a5f53]">LUMA15</span> na sua proposta inicial.
              </p>
            </div>

            <div className="mb-5 aspect-video rounded-[28px] border border-black/10 bg-[#efebe5] p-4">
              <div className="flex h-full items-center justify-center rounded-[22px] border border-dashed border-black/15 text-center text-black/45">
                Espaço para vídeo de vendas
              </div>
            </div>

            <div className="space-y-4 rounded-[28px] border border-black/10 bg-[#faf8f4] p-5">
              <p className="text-sm font-semibold text-[#4a5f53]">
                Como funciona nosso trabalho
              </p>

              <div className="space-y-3 text-sm leading-7 text-black/65">
                <p>1. Você envia seu segmento, referências e objetivo.</p>
                <p>2. Criamos 3 modelos visuais para você comparar.</p>
                <p>3. Enviamos orçamento junto com os modelos.</p>
                <p>4. Você escolhe qual direção quer seguir.</p>
                <p>5. Depois seguimos para aprovação e construção.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-12">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[#8c6f48]">
                Portfólio
              </p>
              <h2 className="mt-2 text-3xl font-semibold md:text-4xl">
                Exemplos de estruturas que podemos criar
              </h2>
            </div>

            <Link
              href="/site-demo-request"
              className="hidden rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black/75 md:inline-flex"
            >
              Quero meus modelos
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {portfolio.map((item) => (
              <article
                key={item.title}
                className="rounded-[28px] border border-black/10 bg-white p-5 shadow-[0_14px_30px_rgba(0,0,0,0.04)]"
              >
                <div className="mb-4 aspect-[16/10] rounded-[22px] border border-black/10 bg-[#efe8df]" />
                <div className="mb-3 inline-flex rounded-full border border-[#d6c7b1] bg-[#fffaf4] px-3 py-1 text-xs text-[#8c6f48]">
                  {item.type}
                </div>
                <h3 className="text-xl font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-black/60">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="pb-12">
          <div className="rounded-[34px] border border-black/10 bg-white p-6 md:p-8">
            <h2 className="text-3xl font-semibold md:text-4xl">
              Loja integrada no mesmo ecossistema
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-black/60 md:text-base">
              Também podemos estruturar uma vitrine moderna inspirada em grandes
              e-commerces, com visual clean, jornada mobile e foco em confiança.
              Abaixo está uma referência visual para a integração da sua loja.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              {storeProducts.map((product) => (
                <div
                  key={product.name}
                  className="rounded-[24px] border border-black/10 bg-[#faf8f4] p-4"
                >
                  <div className="mb-4 aspect-[3/4] rounded-[18px] bg-[#e7dfd4]" />
                  <h3 className="text-sm font-semibold">{product.name}</h3>
                  <p className="mt-1 text-sm text-[#4a5f53]">{product.price}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-12">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.24em] text-[#8c6f48]">
              Perguntas frequentes
            </p>
            <h2 className="mt-2 text-3xl font-semibold md:text-4xl">FAQ</h2>
          </div>

          <div className="space-y-4">
            {faq.map((item) => (
              <article
                key={item.question}
                className="rounded-[24px] border border-black/10 bg-white p-5"
              >
                <h3 className="text-lg font-semibold">{item.question}</h3>
                <p className="mt-3 text-sm leading-7 text-black/60">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[34px] border border-black/10 bg-[#4a5f53] p-8 text-white">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="text-3xl font-semibold md:text-4xl">
                Pronta para ver 3 modelos do seu site?
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75 md:text-base">
                Clique no botão abaixo, envie seus dados e receba seus modelos iniciais
                e orçamento por e-mail e WhatsApp.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/site-demo-request"
                className="rounded-2xl bg-white px-5 py-4 text-sm font-semibold text-[#4a5f53]"
              >
                Peça sua demonstração grátis agora
              </Link>
              <Link
                href="https://wa.me/5500000000000"
                className="rounded-2xl border border-white/20 px-5 py-4 text-sm font-medium text-white"
              >
                WhatsApp ao vivo
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
