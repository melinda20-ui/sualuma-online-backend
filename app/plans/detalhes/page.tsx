import Link from "next/link";

const details = [
  {
    id: "free",
    name: "Free",
    price: "R$0 para sempre",
    text: "O Free é o acesso base da Sualuma. Ele existe para a pessoa entrar, conhecer o ecossistema, participar da comunidade, divulgar serviços como prestadora e testar a Mia com créditos limitados.",
    includes: [
      "Portal Sualuma",
      "Comunidade",
      "Blog",
      "Loja de agentes",
      "Chat Mia com créditos limitados",
      "Painel de prestador",
      "Divulgação básica de serviços",
      "FlowMind Free",
    ],
    notIncludes: [
      "Dashboard de cliente",
      "Agentes pagos ilimitados",
      "Créditos altos de IA",
    ],
  },
  {
    id: "basico",
    name: "Básico",
    price: "R$49/mês — 7 dias grátis",
    text: "O Básico é para quem quer usar a Sualuma como ferramenta real de organização, produtividade e começo de operação com IA.",
    includes: [
      "Tudo do Free",
      "FlowMind para produtividade pessoal e da empresa",
      "Dashboard de cliente",
      "Contratar prestadores",
      "Divulgar serviços",
      "3 agentes: criação de sites, prospecção e automações",
      "Créditos diários de IA",
    ],
    notIncludes: [
      "Flowmatic Rotina Pro",
      "Flowmatic Solo CEO",
      "Prioridade de prestador",
    ],
  },
  {
    id: "prime",
    name: "Prime",
    price: "R$97/mês — 7 dias grátis",
    text: "O Prime é o plano de crescimento. Ele mantém o Básico e adiciona mais agentes e mais créditos para quem quer usar mais IA no dia a dia.",
    includes: [
      "Tudo do Free e Básico",
      "Mais 2 agentes extras",
      "Mais créditos de IA",
      "FlowMind Free/Básico",
      "Mais força para operação e crescimento",
    ],
    notIncludes: [
      "Flowmatic Rotina Pro incluso",
      "Flowmatic Solo CEO",
      "Prestador prioritário",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: "R$197/mês — 7 dias grátis",
    text: "O Premium é para quem quer rotina, organização e automação mais avançada. Aqui entra o Flowmatic Rotina Pro como parte do pacote.",
    includes: [
      "Tudo do Free, Básico e Prime",
      "Flowmatic Rotina Pro",
      "Mais créditos de IA",
      "Recursos avançados de rotina",
      "Mais estrutura para operação",
    ],
    notIncludes: [
      "Flowmatic Solo CEO",
      "Prestador prioritário incluso",
      "Add-on Agência Time incluso",
    ],
  },
  {
    id: "ia_pro",
    name: "IA Pro",
    price: "R$397/mês — 30 dias grátis",
    text: "O IA Pro é o plano mais completo. Ele é para quem quer transformar a Sualuma em uma operação com agentes, créditos maiores, produtividade avançada e prioridade como prestador.",
    includes: [
      "Tudo do Free, Básico, Prime e Premium",
      "Mais 4 agentes gratuitos disponíveis",
      "Mais créditos de IA",
      "Flowmatic Solo CEO",
      "Prestador prioritário",
      "Add-on Agência Time por +R$42,50",
    ],
    notIncludes: [
      "Uso infinito de IA sem limite de crédito",
      "Serviços humanos contratados separadamente",
    ],
  },
];

export default function PlanDetailsPage() {
  return (
    <main className="min-h-screen bg-[#050507] px-4 py-10 text-white md:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10">
          <Link href="/plans" className="text-sm text-[#00F0FF]">
            ← Voltar aos planos
          </Link>

          <h1 className="mt-5 text-4xl font-semibold md:text-6xl">
            Detalhes dos planos
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/60 md:text-base">
            Aqui fica a explicação simples do que cada pessoa recebe, o que não recebe e quando vale evoluir.
          </p>
        </header>

        <section className="space-y-6">
          {details.map((plan) => (
            <article
              id={plan.id}
              key={plan.id}
              className="rounded-[30px] border border-white/10 bg-white/[0.04] p-6 md:p-8"
            >
              <div className="mb-4 inline-flex rounded-full border border-[#7A00FF]/25 bg-[#7A00FF]/10 px-3 py-1 text-xs text-[#d7b8ff]">
                {plan.price}
              </div>

              <h2 className="text-3xl font-semibold">{plan.name}</h2>
              <p className="mt-3 text-sm leading-7 text-white/65">{plan.text}</p>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <div className="rounded-3xl border border-[#00F0FF]/15 bg-[#00F0FF]/10 p-5">
                  <h3 className="font-semibold text-[#00F0FF]">Inclui</h3>
                  <ul className="mt-4 space-y-2 text-sm text-white/75">
                    {plan.includes.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                  <h3 className="font-semibold text-white/80">Não inclui</h3>
                  <ul className="mt-4 space-y-2 text-sm text-white/55">
                    {plan.notIncludes.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
