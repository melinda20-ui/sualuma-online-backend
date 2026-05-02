import fs from "fs";
import path from "path";

export type FlowTemplate = {
  slug: string;
  icon: string;
  name: string;
  category: string;
  price: string;
  tag: string;
  desc: string;
  includes: string[];
  agent: string;
  difficulty: "Leve" | "Médio" | "Avançado";
  timeToStart: string;
};

export const flowTemplates: FlowTemplate[] = [
  {
    slug: "1-ano-12-semanas",
    icon: "🗺️",
    name: "1 Ano, 12 Semanas",
    category: "Planejamento",
    price: "Incluso no Solo CEO",
    tag: "Principal",
    desc: "Transforma uma meta anual em trimestres, semanas e tarefas diárias.",
    includes: ["Onboarding guiado", "Plano anual", "Semana ideal", "Check-ins"],
    agent: "Vera",
    difficulty: "Médio",
    timeToStart: "15 minutos",
  },
  {
    slug: "organiza-minha-cabeca",
    icon: "🧠",
    name: "Organiza Minha Cabeça",
    category: "Mente",
    price: "Grátis",
    tag: "Entrada",
    desc: "Captura pensamentos soltos e transforma bagunça mental em 3 prioridades.",
    includes: ["Dump mental", "Triagem", "Lista do dia", "Modo TDAH-friendly"],
    agent: "Dona",
    difficulty: "Leve",
    timeToStart: "5 minutos",
  },
  {
    slug: "saida-financeira",
    icon: "💸",
    name: "Saída Financeira",
    category: "Dinheiro",
    price: "R$ 29",
    tag: "Independência",
    desc: "Plano de 90 dias para quem quer começar a criar renda própria.",
    includes: ["Mapa financeiro", "Meta de renda", "Plano de ação", "Checkpoints"],
    agent: "Rica",
    difficulty: "Médio",
    timeToStart: "20 minutos",
  },
  {
    slug: "mae-empreendedora",
    icon: "👩‍👧",
    name: "Mãe Empreendedora",
    category: "Rotina",
    price: "R$ 29",
    tag: "Vida real",
    desc: "Organiza blocos de trabalho em uma rotina com filhos, casa e imprevistos.",
    includes: ["Blocos de foco", "Rotina flexível", "Plano 1h/dia", "Agenda leve"],
    agent: "Dona",
    difficulty: "Leve",
    timeToStart: "12 minutos",
  },
  {
    slug: "lancamento-em-30-dias",
    icon: "🚀",
    name: "Lançamento em 30 Dias",
    category: "Vendas",
    price: "R$ 39",
    tag: "Rica Turbo",
    desc: "Cronograma reverso para vender uma oferta específica em um mês.",
    includes: ["Checklist diário", "Oferta", "Conteúdo", "Follow-up"],
    agent: "Rica",
    difficulty: "Avançado",
    timeToStart: "25 minutos",
  },
  {
    slug: "casa-sem-caos",
    icon: "🏠",
    name: "Casa Sem Caos",
    category: "Casa",
    price: "R$ 19",
    tag: "Leveza",
    desc: "Sistema simples para manter a casa funcionando sem tentar fazer tudo.",
    includes: ["Rotina mínima", "Tarefas por energia", "Lista semanal", "Sem culpa"],
    agent: "Calma",
    difficulty: "Leve",
    timeToStart: "8 minutos",
  },
  {
    slug: "prospeccao-sem-vergonha",
    icon: "💬",
    name: "Prospecção Sem Vergonha",
    category: "Vendas",
    price: "R$ 29",
    tag: "Conversas",
    desc: "Mensagens, follow-ups e rotina de venda para quem trava na abordagem.",
    includes: ["Scripts", "CRM simples", "Follow-up", "Métrica semanal"],
    agent: "Rica",
    difficulty: "Médio",
    timeToStart: "10 minutos",
  },
  {
    slug: "recomeco-gentil",
    icon: "🌱",
    name: "Recomeço Gentil",
    category: "Mente",
    price: "R$ 19",
    tag: "Calma",
    desc: "Para semanas em que a pessoa sumiu, travou ou perdeu o ritmo.",
    includes: ["Reset de rotina", "Plano de 3 dias", "Autocuidado", "Revisão leve"],
    agent: "Calma",
    difficulty: "Leve",
    timeToStart: "6 minutos",
  },
  {
    slug: "bussola-semanal",
    icon: "📊",
    name: "Bússola Semanal",
    category: "Análise",
    price: "R$ 19",
    tag: "Relatório",
    desc: "Mostra evolução, hábitos, vendas e pontos de ajuste da semana.",
    includes: ["Resumo visual", "Pontuação", "Vitórias", "Próximos ajustes"],
    agent: "Bússola",
    difficulty: "Leve",
    timeToStart: "10 minutos",
  },
];

export function getAllTemplates() {
  return flowTemplates;
}

export function getTemplateBySlug(slug: string) {
  return flowTemplates.find((template) => template.slug === slug);
}

export function getTemplateMarkdown(slug: string) {
  const safeSlug = slug.replace(/[^a-z0-9-]/g, "");
  const filePath = path.join(
    process.cwd(),
    "app",
    "flowmind",
    "content",
    "templates",
    `${safeSlug}.md`
  );

  if (!fs.existsSync(filePath)) {
    return "";
  }

  return fs.readFileSync(filePath, "utf8");
}
