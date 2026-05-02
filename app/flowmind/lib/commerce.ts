export type FlowmaticCheckoutKind = "plan" | "template";

export type FlowmaticCheckoutItem = {
  kind: FlowmaticCheckoutKind;
  slug: string;
  name: string;
  mode: "payment" | "subscription" | "free";
  priceEnv?: string;
  description: string;
  successPath: string;
  cancelPath: string;
};

export const flowmaticPlanCheckoutItems: FlowmaticCheckoutItem[] = [
  {
    kind: "plan",
    slug: "comecar",
    name: "Começar",
    mode: "free",
    description: "Plano grátis para testar o Flowmatic.",
    successPath: "/flowmind",
    cancelPath: "/flowmind/planos",
  },
  {
    kind: "plan",
    slug: "rotina-pro",
    name: "Rotina Pro",
    mode: "subscription",
    priceEnv: "STRIPE_PRICE_FLOWMATIC_ROTINA_PRO",
    description: "Plano mensal para rotina, casa e saúde mental.",
    successPath: "/flowmind/checkout/sucesso",
    cancelPath: "/flowmind/planos",
  },
  {
    kind: "plan",
    slug: "solo-ceo",
    name: "Solo CEO",
    mode: "subscription",
    priceEnv: "STRIPE_PRICE_FLOWMATIC_SOLO_CEO",
    description: "Plano mensal para solopreneurs com agentes e templates principais.",
    successPath: "/flowmind/checkout/sucesso",
    cancelPath: "/flowmind/planos",
  },
  {
    kind: "plan",
    slug: "imperio-solo",
    name: "Império Solo",
    mode: "subscription",
    priceEnv: "STRIPE_PRICE_FLOWMATIC_IMPERIO_SOLO",
    description: "Plano completo do Flowmatic.",
    successPath: "/flowmind/checkout/sucesso",
    cancelPath: "/flowmind/planos",
  },
];

export const flowmaticTemplateCheckoutItems: FlowmaticCheckoutItem[] = [
  {
    kind: "template",
    slug: "organiza-minha-cabeca",
    name: "Organiza Minha Cabeça",
    mode: "free",
    description: "Template grátis de organização mental.",
    successPath: "/flowmind/meus-templates",
    cancelPath: "/flowmind/templates/organiza-minha-cabeca",
  },
  {
    kind: "template",
    slug: "1-ano-12-semanas",
    name: "1 Ano, 12 Semanas",
    mode: "subscription",
    priceEnv: "STRIPE_PRICE_FLOWMATIC_SOLO_CEO",
    description: "Template principal liberado no plano Solo CEO.",
    successPath: "/flowmind/checkout/sucesso",
    cancelPath: "/flowmind/templates/1-ano-12-semanas",
  },
  {
    kind: "template",
    slug: "saida-financeira",
    name: "Saída Financeira",
    mode: "payment",
    priceEnv: "STRIPE_PRICE_TEMPLATE_SAIDA_FINANCEIRA",
    description: "Template avulso Saída Financeira.",
    successPath: "/flowmind/checkout/sucesso",
    cancelPath: "/flowmind/templates/saida-financeira",
  },
  {
    kind: "template",
    slug: "mae-empreendedora",
    name: "Mãe Empreendedora",
    mode: "payment",
    priceEnv: "STRIPE_PRICE_TEMPLATE_MAE_EMPREENDEDORA",
    description: "Template avulso Mãe Empreendedora.",
    successPath: "/flowmind/checkout/sucesso",
    cancelPath: "/flowmind/templates/mae-empreendedora",
  },
  {
    kind: "template",
    slug: "lancamento-em-30-dias",
    name: "Lançamento em 30 Dias",
    mode: "payment",
    priceEnv: "STRIPE_PRICE_TEMPLATE_LANCAMENTO_30_DIAS",
    description: "Template avulso Lançamento em 30 Dias.",
    successPath: "/flowmind/checkout/sucesso",
    cancelPath: "/flowmind/templates/lancamento-em-30-dias",
  },
  {
    kind: "template",
    slug: "casa-sem-caos",
    name: "Casa Sem Caos",
    mode: "payment",
    priceEnv: "STRIPE_PRICE_TEMPLATE_CASA_SEM_CAOS",
    description: "Template avulso Casa Sem Caos.",
    successPath: "/flowmind/checkout/sucesso",
    cancelPath: "/flowmind/templates/casa-sem-caos",
  },
  {
    kind: "template",
    slug: "prospeccao-sem-vergonha",
    name: "Prospecção Sem Vergonha",
    mode: "payment",
    priceEnv: "STRIPE_PRICE_TEMPLATE_PROSPECCAO_SEM_VERGONHA",
    description: "Template avulso Prospecção Sem Vergonha.",
    successPath: "/flowmind/checkout/sucesso",
    cancelPath: "/flowmind/templates/prospeccao-sem-vergonha",
  },
  {
    kind: "template",
    slug: "recomeco-gentil",
    name: "Recomeço Gentil",
    mode: "payment",
    priceEnv: "STRIPE_PRICE_TEMPLATE_RECOMECO_GENTIL",
    description: "Template avulso Recomeço Gentil.",
    successPath: "/flowmind/checkout/sucesso",
    cancelPath: "/flowmind/templates/recomeco-gentil",
  },
  {
    kind: "template",
    slug: "bussola-semanal",
    name: "Bússola Semanal",
    mode: "payment",
    priceEnv: "STRIPE_PRICE_TEMPLATE_BUSSOLA_SEMANAL",
    description: "Template avulso Bússola Semanal.",
    successPath: "/flowmind/checkout/sucesso",
    cancelPath: "/flowmind/templates/bussola-semanal",
  },
];

export function getFlowmaticCheckoutItem(kind: string, slug: string) {
  const cleanKind = kind === "plan" || kind === "template" ? kind : "";
  const cleanSlug = String(slug || "").replace(/[^a-z0-9-]/g, "");

  if (cleanKind === "plan") {
    return flowmaticPlanCheckoutItems.find((item) => item.slug === cleanSlug);
  }

  if (cleanKind === "template") {
    return flowmaticTemplateCheckoutItems.find((item) => item.slug === cleanSlug);
  }

  return null;
}
