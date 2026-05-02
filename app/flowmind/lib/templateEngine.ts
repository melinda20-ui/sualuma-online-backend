import crypto from "crypto";
import { getTemplateBySlug } from "./templates";

export type FlowTask = {
  id: string;
  title: string;
  area: "casa" | "empresa" | "mente" | "dinheiro";
  priority: "essencial" | "importante" | "leve";
  status: "todo" | "done";
};

export type FlowHabit = {
  id: string;
  title: string;
  area: "casa" | "empresa" | "mente" | "dinheiro";
  frequency: "daily" | "weekly";
};

export type FlowWorkspace = {
  id: string;
  userId: string;
  templateSlug: string;
  templateName: string;
  createdAt: string;
  status: "active";
  plan: {
    title: string;
    mainGoal: string;
    weeklyFocus: string;
    agent: string;
    duration: string;
  };
  todayTasks: FlowTask[];
  habits: FlowHabit[];
  checkins: {
    morning: string[];
    night: string[];
  };
};

function id(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

const templateBlueprints: Record<
  string,
  Omit<FlowWorkspace, "id" | "userId" | "templateSlug" | "templateName" | "createdAt" | "status">
> = {
  "1-ano-12-semanas": {
    plan: {
      title: "Plano 1 Ano, 12 Semanas",
      mainGoal: "Transformar uma meta anual em ações semanais e diárias.",
      weeklyFocus: "Clarear oferta, conversar com clientes e criar rotina mínima.",
      agent: "Vera",
      duration: "12 semanas",
    },
    todayTasks: [
      {
        id: id("task"),
        title: "Responder o onboarding do plano anual",
        area: "empresa",
        priority: "essencial",
        status: "todo",
      },
      {
        id: id("task"),
        title: "Definir uma meta financeira de 12 meses",
        area: "dinheiro",
        priority: "essencial",
        status: "todo",
      },
      {
        id: id("task"),
        title: "Escolher 3 ações possíveis para esta semana",
        area: "mente",
        priority: "importante",
        status: "todo",
      },
    ],
    habits: [
      {
        id: id("habit"),
        title: "Check-in de manhã",
        area: "mente",
        frequency: "daily",
      },
      {
        id: id("habit"),
        title: "Revisão semanal com Vera",
        area: "empresa",
        frequency: "weekly",
      },
    ],
    checkins: {
      morning: [
        "Qual é a coisa essencial de hoje?",
        "Qual tarefa de casa precisa ser mínima?",
        "Qual ação aproxima você da meta anual?",
      ],
      night: [
        "O que avançou hoje?",
        "O que ficou pesado?",
        "O que precisa ser ajustado amanhã?",
      ],
    },
  },

  "organiza-minha-cabeca": {
    plan: {
      title: "Organiza Minha Cabeça",
      mainGoal: "Tirar excesso mental e transformar bagunça em 3 prioridades.",
      weeklyFocus: "Reduzir, escolher e executar o mínimo essencial.",
      agent: "Dona",
      duration: "7 dias",
    },
    todayTasks: [
      {
        id: id("task"),
        title: "Fazer dump mental por 5 minutos",
        area: "mente",
        priority: "essencial",
        status: "todo",
      },
      {
        id: id("task"),
        title: "Escolher só 3 prioridades de hoje",
        area: "mente",
        priority: "essencial",
        status: "todo",
      },
      {
        id: id("task"),
        title: "Mover o resto para 'pode esperar'",
        area: "casa",
        priority: "leve",
        status: "todo",
      },
    ],
    habits: [
      {
        id: id("habit"),
        title: "Lista com no máximo 3 itens",
        area: "mente",
        frequency: "daily",
      },
      {
        id: id("habit"),
        title: "Fechar o dia sem culpa",
        area: "mente",
        frequency: "daily",
      },
    ],
    checkins: {
      morning: [
        "O que está ocupando sua cabeça?",
        "O que é realmente urgente?",
        "Qual é a primeira ação de 5 minutos?",
      ],
      night: [
        "Você fez o essencial?",
        "O que pode esperar?",
        "Como está sua energia agora?",
      ],
    },
  },

  "saida-financeira": {
    plan: {
      title: "Saída Financeira",
      mainGoal: "Criar renda própria com um plano de 90 dias.",
      weeklyFocus: "Mapear números, criar oferta simples e buscar primeiras vendas.",
      agent: "Rica",
      duration: "90 dias",
    },
    todayTasks: [
      {
        id: id("task"),
        title: "Anotar quanto você precisa por mês para se sentir segura",
        area: "dinheiro",
        priority: "essencial",
        status: "todo",
      },
      {
        id: id("task"),
        title: "Listar uma habilidade que pode virar renda",
        area: "empresa",
        priority: "essencial",
        status: "todo",
      },
      {
        id: id("task"),
        title: "Chamar uma pessoa para validar sua oferta",
        area: "dinheiro",
        priority: "importante",
        status: "todo",
      },
    ],
    habits: [
      {
        id: id("habit"),
        title: "Registrar entrada e saída",
        area: "dinheiro",
        frequency: "daily",
      },
      {
        id: id("habit"),
        title: "Fazer uma ação de renda",
        area: "dinheiro",
        frequency: "daily",
      },
    ],
    checkins: {
      morning: [
        "Qual pequena ação pode gerar renda hoje?",
        "Quanto falta para sua meta mínima?",
      ],
      night: [
        "Você fez uma ação de renda?",
        "Entrou algum dinheiro ou oportunidade?",
      ],
    },
  },

  "lancamento-em-30-dias": {
    plan: {
      title: "Lançamento em 30 Dias",
      mainGoal: "Vender uma oferta específica em 30 dias.",
      weeklyFocus: "Clarear oferta, aquecer audiência e abrir conversas de venda.",
      agent: "Rica",
      duration: "30 dias",
    },
    todayTasks: [
      {
        id: id("task"),
        title: "Definir a promessa principal da oferta",
        area: "empresa",
        priority: "essencial",
        status: "todo",
      },
      {
        id: id("task"),
        title: "Listar 10 pessoas que podem se interessar",
        area: "dinheiro",
        priority: "essencial",
        status: "todo",
      },
      {
        id: id("task"),
        title: "Criar um conteúdo de aquecimento",
        area: "empresa",
        priority: "importante",
        status: "todo",
      },
    ],
    habits: [
      {
        id: id("habit"),
        title: "Uma conversa de venda por dia",
        area: "dinheiro",
        frequency: "daily",
      },
      {
        id: id("habit"),
        title: "Um conteúdo de aquecimento",
        area: "empresa",
        frequency: "daily",
      },
    ],
    checkins: {
      morning: [
        "Qual ação de lançamento move venda hoje?",
        "Quem precisa receber uma mensagem?",
      ],
      night: [
        "Quantas conversas de venda aconteceram?",
        "O que a audiência respondeu?",
      ],
    },
  },
};

const fallbackBlueprint = {
  plan: {
    title: "Template Flowmatic",
    mainGoal: "Transformar este template em ações práticas.",
    weeklyFocus: "Executar o mínimo essencial sem sobrecarga.",
    agent: "Dona",
    duration: "7 dias",
  },
  todayTasks: [
    {
      id: id("task"),
      title: "Ler o template escolhido",
      area: "mente" as const,
      priority: "essencial" as const,
      status: "todo" as const,
    },
    {
      id: id("task"),
      title: "Escolher uma ação para hoje",
      area: "empresa" as const,
      priority: "essencial" as const,
      status: "todo" as const,
    },
    {
      id: id("task"),
      title: "Registrar como foi no fim do dia",
      area: "mente" as const,
      priority: "leve" as const,
      status: "todo" as const,
    },
  ],
  habits: [
    {
      id: id("habit"),
      title: "Check-in diário",
      area: "mente" as const,
      frequency: "daily" as const,
    },
  ],
  checkins: {
    morning: ["O que é essencial hoje?"],
    night: ["O que avançou hoje?"],
  },
};

export function generateWorkspaceFromTemplate({
  slug,
  userId = "demo-user",
}: {
  slug: string;
  userId?: string;
}): FlowWorkspace {
  const template = getTemplateBySlug(slug);
  const blueprint = templateBlueprints[slug] || fallbackBlueprint;

  return {
    id: id("workspace"),
    userId,
    templateSlug: slug,
    templateName: template?.name || slug,
    createdAt: new Date().toISOString(),
    status: "active",
    ...blueprint,
  };
}
