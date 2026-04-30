import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

const servicePlans = [
  {
    id: "free",
    name: "Prestador Gratuito",
    price: 0,
    priceFormatted: money(0),
    type: "gratuito",
    proposalsIncluded: 3,
    priority: "normal",
    platformFeePercent: 12,
    active: true,
    description:
      "Plano gratuito para entrar no marketplace, montar perfil, receber oportunidades e enviar algumas propostas por mês.",
    features: [
      "Perfil público de prestador",
      "Até 3 propostas gratuitas por mês",
      "Acesso às oportunidades abertas",
      "Taxa sobre contratos fechados",
    ],
  },
  {
    id: "credits",
    name: "Pacote de Propostas",
    price: 19.9,
    priceFormatted: money(19.9),
    type: "credito",
    proposalsIncluded: 10,
    priority: "normal",
    platformFeePercent: 12,
    active: true,
    description:
      "Pacote avulso para o prestador comprar mais propostas sem precisar assinar um plano mensal.",
    features: [
      "10 propostas extras",
      "Sem mensalidade",
      "Ideal para testar demanda",
      "Pode ser vendido via Stripe",
    ],
  },
  {
    id: "priority",
    name: "Prestador Prioritário",
    price: 49.9,
    priceFormatted: money(49.9),
    type: "assinatura",
    proposalsIncluded: 40,
    priority: "alta",
    platformFeePercent: 10,
    active: true,
    description:
      "Plano pago para prestadores aparecerem com mais destaque e enviarem mais propostas.",
    features: [
      "40 propostas por mês",
      "Prioridade na listagem",
      "Selo de prestador verificado",
      "Taxa menor por contrato fechado",
    ],
  },
  {
    id: "agency",
    name: "Agência / Time",
    price: 97,
    priceFormatted: money(97),
    type: "assinatura",
    proposalsIncluded: 120,
    priority: "máxima",
    platformFeePercent: 8,
    active: true,
    description:
      "Plano para equipes, agências e prestadores que querem operar volume dentro da plataforma.",
    features: [
      "120 propostas por mês",
      "Prioridade máxima",
      "Perfil de equipe",
      "Taxa reduzida sobre contratos",
    ],
  },
];

const commissionRules = [
  {
    id: "service-contract",
    name: "Comissão por contrato fechado",
    percent: 12,
    appliesTo: "contratos de serviços",
    description:
      "Quando cliente e prestador fecham um serviço pela plataforma, a Sualuma cobra uma porcentagem sobre o valor contratado.",
  },
  {
    id: "priority-discount",
    name: "Desconto para prestador pago",
    percent: 10,
    appliesTo: "prestadores prioritários",
    description:
      "Prestadores com plano pago podem ter taxa menor para incentivar recorrência e volume.",
  },
  {
    id: "agency-discount",
    name: "Desconto para agência/time",
    percent: 8,
    appliesTo: "agências e times",
    description:
      "Plano maior com comissão menor para clientes que movimentam mais contratos.",
  },
];

const referrals = [
  {
    id: "ref-luma-demo",
    name: "Campanha Indique Sualuma",
    code: "LUMA10",
    link: "https://sualuma.online/cadastro?ref=LUMA10",
    rewardType: "cupom",
    reward: "10% de desconto",
    clicks: 42,
    leads: 9,
    conversions: 2,
    revenueGenerated: money(394),
    commissionToPay: money(39.4),
    status: "ativa",
  },
  {
    id: "ref-prestador",
    name: "Prestador indica prestador",
    code: "PRESTADORVIP",
    link: "https://sualuma.online/cadastro?ref=PRESTADORVIP",
    rewardType: "dinheiro",
    reward: "R$ 20 por assinatura confirmada",
    clicks: 18,
    leads: 4,
    conversions: 1,
    revenueGenerated: money(97),
    commissionToPay: money(20),
    status: "ativa",
  },
];

const referralMovements = [
  {
    id: "mov-1",
    type: "entrada",
    source: "Assinatura indicada",
    referralCode: "LUMA10",
    amount: money(197),
    status: "confirmado",
    date: "2026-04-30",
  },
  {
    id: "mov-2",
    type: "saida",
    source: "Prêmio de indicação",
    referralCode: "LUMA10",
    amount: money(19.7),
    status: "pendente",
    date: "2026-04-30",
  },
];

export async function GET() {
  return NextResponse.json({
    ok: true,
    source: "internal-seed",
    updatedAt: new Date().toISOString(),
    summary: {
      servicePlans: servicePlans.length,
      referralCampaigns: referrals.length,
      commissionRules: commissionRules.length,
      totalReferralRevenue: money(491),
      totalReferralPayout: money(59.4),
    },
    servicePlans,
    commissionRules,
    referrals,
    referralMovements,
    nextSteps: [
      "Conectar essa API ao Supabase para salvar planos, indicações e movimentos financeiros.",
      "Criar checkout Stripe para créditos de propostas e plano de prestador prioritário.",
      "Criar rastreamento real de cliques, leads, conversões, entrada e saída de comissão.",
    ],
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));

  const name = String(body?.name || "Nova campanha indique");
  const reward = String(body?.reward || "Cupom ou comissão pendente");
  const code = slugify(String(body?.code || name)).toUpperCase();

  return NextResponse.json({
    ok: true,
    message:
      "Campanha simulada criada. No próximo passo vamos salvar isso no Supabase.",
    referral: {
      id: `ref-${Date.now()}`,
      name,
      code,
      reward,
      link: `https://sualuma.online/cadastro?ref=${code}`,
      clicks: 0,
      leads: 0,
      conversions: 0,
      revenueGenerated: money(0),
      commissionToPay: money(0),
      status: "rascunho",
    },
  });
}
