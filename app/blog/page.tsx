import Link from "next/link";

const featured = [
  "Como estruturar uma operação simples e lucrativa com IA",
  "Os 5 erros que fazem autônomos parecerem amadores online",
  "O que automatizar primeiro em um pequeno negócio",
];

const comments = [
  "Ana: adorei esse conteúdo sobre posicionamento.",
  "Marina: quero ver mais sobre automações simples.",
  "Cláudia: esse tema de identidade mexeu comigo.",
];

const newsCards = [
  "Como vender mais com uma página clara e profissional",
  "Estrutura digital mínima para pequenos negócios",
  "O impacto da organização visual na confiança do cliente",
  "Por que seu site precisa falar por você mesmo quando você dorme",
];

const sections = [
  {
    title: "Empreendedorismo feminino",
    posts: [
      "Como construir autoridade sem deixar sua identidade de lado",
      "Negócios femininos: posicionamento, coragem e consistência",
      "Como criar uma presença digital forte sem parecer artificial",
    ],
  },
  {
    title: "Finanças",
    posts: [
      "Como organizar caixa, preço e lucro sem complicar",
      "Os primeiros indicadores que uma microempresa precisa olhar",
      "Como parar de misturar dinheiro pessoal e do negócio",
    ],
  },
  {
    title: "Marketing",
    posts: [
      "O que uma pequena empresa precisa comunicar para vender melhor",
      "Como usar conteúdo para gerar confiança e conversão",
      "A diferença entre marketing bonito e marketing que funciona",
    ],
  },
  {
    title: "Produtividade",
    posts: [
      "Como operar com foco sem cair em excesso de tarefas",
      "Sistemas simples para organizar rotina, clientes e entregas",
      "O que eliminar da rotina para liberar energia estratégica",
    ],
  },
  {
    title: "Neurociência aplicada",
    posts: [
      "Como a autoimagem influencia decisões, relações e crescimento",
      "Os benefícios e riscos da identidade que você repete para si mesma",
      "Experiências neurológicas, memória emocional e comportamento",
    ],
  },
];

const storeProducts = [
  { name: "Vestido Glow", price: "R$ 139,90" },
  { name: "Blusa Aura", price: "R$ 69,90" },
  { name: "Conjunto Signature", price: "R$ 159,90" },
  { name: "Saia Elegance", price: "R$ 89,90" },
];

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-[#f5f5f1] text-[#1f211f]">
      <div className="border-b border-black/10 bg-[#eef3ee]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 text-sm md:px-6">
          <p className="font-medium text-[#4a5f53]">
            Criamos nosso primeiro modelo de IA orquestrador para ajudar autônomos
            e pequenos negócios a automatizar tarefas e vender mais.
          </p>
          <Link href="/coming-soon" className="font-semibold text-[#4a5f53]">
            Saiba mais aqui
          </Link>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-4 py-8 md:px-6 xl:grid-cols-[1fr_320px]">
        <div>
          <header className="mb-8">
            <div className="mb-4 inline-flex rounded-full border border-[#d6c7b1] bg-white px-3 py-1 text-xs text-[#8c6f48]">
              Blog Luma
            </div>

            <h1 className="max-w-4xl text-4xl font-semibold leading-tight md:text-6xl">
              Notícias, estratégias e reflexões para negócios, identidade e crescimento.
            </h1>

            <p className="mt-4 max-w-3xl text-sm leading-8 text-black/60 md:text-base">
              Um blog com estrutura editorial forte, visual mais claro e foco em SEO,
              conteúdo útil e autoridade digital.
            </p>
          </header>

          <section className="mb-10">
            <h2 className="mb-4 text-2xl font-semibold">Destaques em carrossel</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {newsCards.map((card) => (
                <article
                  key={card}
                  className="rounded-[28px] border border-black/10 bg-white p-4 shadow-[0_12px_30px_rgba(0,0,0,0.04)]"
                >
                  <div className="mb-4 aspect-[16/10] rounded-[20px] bg-[#dde5dd]" />
                  <h3 className="text-lg font-semibold">{card}</h3>
                  <p className="mt-3 text-sm leading-7 text-black/60">
                    Artigo com SEO, escaneabilidade, profundidade e foco em retenção.
                  </p>
                </article>
              ))}
            </div>
          </section>

          {sections.map((section) => (
            <section key={section.title} className="mb-10">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="text-2xl font-semibold md:text-3xl">{section.title}</h2>
                <Link href="/coming-soon" className="text-sm font-medium text-[#4a5f53]">
                  Ver tudo
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {section.posts.map((post) => (
                  <article
                    key={post}
                    className="rounded-[26px] border border-black/10 bg-white p-5"
                  >
                    <div className="mb-4 aspect-[16/10] rounded-[18px] bg-[#e6ece6]" />
                    <h3 className="text-lg font-semibold">{post}</h3>
                    <p className="mt-3 text-sm leading-7 text-black/60">
                      Conteúdo estruturado para ranquear, educar e posicionar.
                    </p>
                  </article>
                ))}
              </div>
            </section>
          ))}

          <section className="mb-10 rounded-[32px] border border-black/10 bg-white p-6">
            <h2 className="text-3xl font-semibold">Nossa loja em destaque</h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-black/60">
              Uma vitrine inspirada em grandes lojas de moda, com visual limpo,
              feminino e foco em navegação agradável.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              {storeProducts.map((product) => (
                <div
                  key={product.name}
                  className="rounded-[22px] border border-black/10 bg-[#faf8f4] p-4"
                >
                  <div className="mb-4 aspect-[3/4] rounded-[16px] bg-[#eadfd3]" />
                  <h3 className="text-sm font-semibold">{product.name}</h3>
                  <p className="mt-1 text-sm text-[#4a5f53]">{product.price}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[32px] border border-black/10 bg-[#4a5f53] p-8 text-white">
            <h2 className="text-3xl font-semibold md:text-4xl">
              Assine nossa newsletter
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75">
              Receba artigos, insights e novidades sobre negócios, vendas,
              automação, posicionamento e crescimento.
            </p>

            <div className="mt-6 flex flex-col gap-3 md:flex-row">
              <input
                placeholder="Digite seu melhor e-mail"
                className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-4 text-sm text-white outline-none placeholder:text-white/60"
              />
              <button className="rounded-2xl bg-white px-5 py-4 text-sm font-semibold text-[#4a5f53]">
                Quero receber
              </button>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-[28px] border border-black/10 bg-white p-5">
            <h2 className="text-lg font-semibold">Destaques da semana</h2>
            <div className="mt-4 space-y-3">
              {featured.map((item) => (
                <article key={item} className="border-b border-black/8 pb-3 last:border-b-0">
                  <p className="text-sm leading-6 text-black/70">{item}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-black/10 bg-white p-5">
            <h2 className="text-lg font-semibold">Últimos comentários</h2>
            <div className="mt-4 space-y-3">
              {comments.map((item) => (
                <p key={item} className="text-sm leading-6 text-black/60">
                  {item}
                </p>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-black/10 bg-white p-5">
            <h2 className="text-lg font-semibold">Nossas redes sociais</h2>
            <div className="mt-4 space-y-2 text-sm text-[#4a5f53]">
              <p>Instagram</p>
              <p>YouTube</p>
              <p>Pinterest</p>
              <p>TikTok</p>
            </div>
          </section>

          <section className="rounded-[28px] border border-black/10 bg-white p-5">
            <h2 className="text-lg font-semibold">Ver nossos outros blogs</h2>
            <div className="mt-4 space-y-2">
              <Link href="/coming-soon" className="block text-sm text-[#4a5f53]">
                Blog de vendas
              </Link>
              <Link href="/coming-soon" className="block text-sm text-[#4a5f53]">
                Blog de identidade
              </Link>
              <Link href="/coming-soon" className="block text-sm text-[#4a5f53]">
                Blog de produtividade
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
