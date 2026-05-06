import SualumaPublicChat from "@/components/SualumaPublicChat";
import Link from "next/link";
import PlanCheckoutButton, { type PlanKey } from "@/components/plans/PlanCheckoutButton";

const plans: Array<{
  key: PlanKey;
  name: string;
  price: string;
  trial: string;
  highlight: boolean;
  description: string;
  features: string[];
  cta: string;
  note: string;
}> = [
  {
    key: "free",
    name: "Free",
    price: "R$0",
    trial: "Grátis para sempre",
    highlight: false,
    description: "Para entrar na Sualuma, explorar a comunidade, vender serviços e conhecer a Mia com créditos limitados.",
    features: [
      "Portal Sualuma liberado",
      "Comunidade e blog",
      "Loja de agentes",
      "Chat Mia com limite de créditos",
      "Dashboard de prestador liberado",
      "Divulgação básica de serviços",
      "FlowMind Free",
    ],
    cta: "Entrar no Free",
    note: "Não libera dashboard de cliente. O uso de IA funciona por créditos.",
  },
  {
    key: "basico",
    name: "Básico",
    price: "R$49/mês",
    trial: "7 dias grátis",
    highlight: false,
    description: "Para quem quer organizar a rotina, a empresa e começar a usar IA com painel de cliente.",
    features: [
      "Tudo do Free",
      "FlowMind para produtividade pessoal e da empresa",
      "Dashboard de cliente",
      "Chat e créditos diários de IA",
      "Divulgar serviços e contratar prestadores",
      "3 agentes: criação de sites, prospecção e automações",
      "Comunidade e FlowMind Free",
    ],
    cta: "Testar Básico por 7 dias",
    note: "Após o teste, a cobrança mensal do Básico começa automaticamente pela Stripe.",
  },
  {
    key: "prime",
    name: "Prime",
    price: "R$97/mês",
    trial: "7 dias grátis",
    highlight: true,
    description: "Para quem quer mais agentes, mais créditos e uma estrutura melhor para crescer.",
    features: [
      "Tudo do Free e do Básico",
      "Mais 2 agentes extras",
      "Mais créditos de IA por dia",
      "FlowMind Free/Básico",
      "Mais recursos para organizar operação e crescimento",
    ],
    cta: "Testar Prime por 7 dias",
    note: "Mais indicado para quem quer crescer com IA sem começar pelo plano mais alto.",
  },
  {
    key: "premium",
    name: "Premium",
    price: "R$197/mês",
    trial: "7 dias grátis",
    highlight: false,
    description: "Para quem quer automação, rotina e produtividade mais avançada dentro do ecossistema.",
    features: [
      "Tudo do Free, Básico e Prime",
      "Flowmatic Rotina Pro incluso",
      "Mais créditos de IA",
      "Recursos avançados para rotina e operação",
      "Mais suporte para crescer com consistência",
    ],
    cta: "Testar Premium por 7 dias",
    note: "Ideal para quem quer transformar rotina em operação com automações.",
  },
  {
    key: "ia_pro",
    name: "IA Pro",
    price: "R$397/mês",
    trial: "30 dias grátis",
    highlight: false,
    description: "Para quem quer usar a Sualuma como uma operação completa com IA, agentes e prioridade.",
    features: [
      "Tudo do Free, Básico, Prime e Premium",
      "Mais 4 agentes gratuitos disponíveis",
      "Mais créditos de IA",
      "Flowmatic Solo CEO incluso",
      "Prestador prioritário incluso",
      "Add-on Agência Time por +R$42,50",
    ],
    cta: "Testar IA Pro por 30 dias",
    note: "Plano mais completo para quem quer escalar com agentes, IA e prioridade.",
  },
];

export default function PlansPage() {
  return (
    <main className="min-h-screen bg-[#050507] text-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6">
        <header className="mb-10 text-center">
          <div className="mb-4 inline-flex rounded-full border border-[#7A00FF]/25 bg-[#7A00FF]/10 px-3 py-1 text-xs text-[#d7b8ff]">
            Planos da Sualuma
          </div>

          <h1 className="text-4xl font-semibold md:text-6xl">
            Escolha como você quer começar
          </h1>

          <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-white/55 md:text-base">
            Entre gratuitamente, teste os planos pagos com segurança e evolua conforme sua operação crescer.
          </p>
        </header>

        <section className="mb-8 rounded-[30px] border border-[#00F0FF]/20 bg-[#00F0FF]/10 p-5 text-center">
          <p className="text-sm font-semibold text-[#00F0FF]">
            O plano Free é gratuito para sempre. Planos pagos têm teste antes da cobrança.
          </p>
          <p className="mt-2 text-sm leading-6 text-white/70">
            Básico, Prime e Premium têm 7 dias grátis. IA Pro tem 30 dias grátis. Você pode cancelar antes da cobrança.
          </p>
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-5">
          {plans.map((plan) => (
            <article
              id={plan.key}
              key={plan.key}
              className={`flex flex-col rounded-[30px] border p-6 ${
                plan.highlight
                  ? "border-[#7A00FF]/40 bg-[#7A00FF]/10 shadow-[0_0_40px_rgba(122,0,255,0.18)]"
                  : "border-white/10 bg-white/[0.04]"
              }`}
            >
              {plan.highlight && (
                <div className="mb-4 inline-flex w-fit rounded-full border border-[#00F0FF]/20 bg-[#00F0FF]/10 px-3 py-1 text-xs text-[#00F0FF]">
                  Mais recomendado
                </div>
              )}

              <h2 className="text-2xl font-semibold">{plan.name}</h2>
              <p className="mt-2 text-2xl font-bold text-[#00F0FF]">{plan.price}</p>
              <p className="mt-1 text-xs font-semibold text-[#d7b8ff]">{plan.trial}</p>

              <p className="mt-3 text-sm leading-6 text-white/55">
                {plan.description}
              </p>

              <ul className="mt-6 flex-1 space-y-3 text-sm text-white/75">
                {plan.features.map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>

              <p className="mt-6 text-xs leading-5 text-white/40">{plan.note}</p>

              <PlanCheckoutButton
                plan={plan.key}
                label={plan.cta}
                highlight={plan.highlight}
              />

              <Link
                href={`/plans/detalhes#${plan.key}`}
                className="mt-3 inline-flex w-full items-center justify-center rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/70 hover:bg-white/[0.05]"
              >
                Ver detalhes
              </Link>
            </article>
          ))}
        </section>

        <div className="mt-10 text-center">
          <Link
            href="/"
            className="rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm text-white/80"
          >
            Voltar para home
          </Link>
        </div>
      </div>

      <SualumaPublicChat sourcePage="Plans Sua Luma" />
    </main>
  );
}
