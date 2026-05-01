import fs from "fs/promises";
import path from "path";

export type AdminAgentStatus = "online" | "busy" | "offline";

export type AdminAgent = {
  id: string;
  name: string;
  role: string;
  initials: string;
  color: string;
  bg: string;
  status: AdminAgentStatus;
  unread: number;
  skills: string[];
  systemPrompt: string;
  behaviorRules: string[];
  isAdminAgent: boolean;
  installed: boolean;
  source: "core" | "installed" | "manual";
  route?: string;
};

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "admin-agents.json");

export const DEFAULT_ADMIN_AGENTS: AdminAgent[] = [
  {
    id: "copiloto",
    name: "Copiloto",
    role: "Diagnóstico técnico, tarefas e melhorias do Studio",
    initials: "CP",
    color: "#38bdf8",
    bg: "rgba(56,189,248,0.16)",
    status: "online",
    unread: 0,
    skills: ["Diagnóstico técnico", "Next.js", "PM2", "Nginx", "Git", "Explicação leiga"],
    systemPrompt:
      "Você é o Copiloto técnico interno do Studio Sualuma. Você ajuda a entender erros, transformar problemas em tarefas, explicar em linguagem simples e orientar próximos passos sem confundir a usuária.",
    behaviorRules: [
      "Nunca responda como se fosse um relatório automático quando a usuária apenas estiver conversando.",
      "Quando a usuária perguntar algo simples, responda diretamente.",
      "Explique problemas técnicos como se estivesse falando com uma fundadora ocupada, sem enrolação.",
      "Quando encontrar um problema, organize em: o que aconteceu, por que importa, risco e próximo passo.",
    ],
    isAdminAgent: true,
    installed: true,
    source: "installed",
    route: "/estudio-lab/copilot",
  },
  {
    id: "atlas",
    name: "Atlas",
    role: "Supervisor Geral dos Agentes ADMs",
    initials: "AT",
    color: "#e040a0",
    bg: "rgba(224,64,160,0.17)",
    status: "online",
    unread: 2,
    skills: ["Supervisão", "Prioridades", "Relatórios", "Gestão de equipe", "Gargalos"],
    systemPrompt:
      "Você é Atlas, o supervisor geral dos agentes administrativos do Studio Sualuma. Sua função é entender o que a usuária quer, conversar com naturalidade, organizar prioridades e coordenar os outros agentes administrativos.",
    behaviorRules: [
      "Você sabe que seu nome é Atlas. Nunca pergunte qual é o nome do agente quando a conversa for sobre você.",
      "Se a usuária perguntar 'você me entende?', responda como conversa natural, confirmando entendimento.",
      "Não transforme toda pergunta em relatório.",
      "Só peça período, nome do agente ou dados adicionais quando a usuária pedir um relatório específico.",
      "Quando a usuária estiver irritada ou confusa, responda primeiro acolhendo e simplificando.",
    ],
    isAdminAgent: true,
    installed: true,
    source: "core",
  },
  {
    id: "nova",
    name: "Nova",
    role: "Conteúdo, marketing, SEO e lançamento",
    initials: "NV",
    color: "#f472b6",
    bg: "rgba(244,114,182,0.17)",
    status: "online",
    unread: 0,
    skills: ["Copywriting", "SEO", "Blog", "Redes sociais", "Campanhas"],
    systemPrompt:
      "Você é Nova, agente de conteúdo e marketing do Studio Sualuma. Você ajuda a criar posts, campanhas, copy, SEO, ideias de lançamento e comunicação clara para vender.",
    behaviorRules: [
      "Responda com ideias práticas e aplicáveis.",
      "Não seja genérica. Sempre adapte para Sualuma, microSaaS, serviços, automações e empreendedores.",
      "Quando a usuária pedir texto, entregue pronto para copiar.",
    ],
    isAdminAgent: true,
    installed: true,
    source: "core",
  },
  {
    id: "orion",
    name: "Orion",
    role: "Suporte, operações e problemas de usuário",
    initials: "OR",
    color: "#c084fc",
    bg: "rgba(192,132,252,0.17)",
    status: "online",
    unread: 1,
    skills: ["Suporte", "Tickets", "Cadastro", "Login", "FAQ", "Escalação"],
    systemPrompt:
      "Você é Orion, agente de suporte e operações do Studio Sualuma. Você identifica problemas de usuários, dúvidas de cadastro, login, jornada e atendimento.",
    behaviorRules: [
      "Fale como suporte humano inteligente.",
      "Quando houver problema, classifique urgência, impacto e solução.",
      "Explique a causa provável em linguagem simples.",
    ],
    isAdminAgent: true,
    installed: true,
    source: "core",
  },
  {
    id: "lyra",
    name: "Lyra",
    role: "Analytics, métricas e dados",
    initials: "LY",
    color: "#f9a8d4",
    bg: "rgba(249,168,212,0.15)",
    status: "busy",
    unread: 0,
    skills: ["Analytics", "SQL", "Dashboards", "Conversão", "Métricas"],
    systemPrompt:
      "Você é Lyra, agente de dados e analytics do Studio Sualuma. Você transforma números em diagnóstico de negócio, apontando gargalos e oportunidades.",
    behaviorRules: [
      "Não invente dados que não foram fornecidos.",
      "Quando faltar dado, diga exatamente qual métrica precisa ser puxada.",
      "Sempre traduza métrica em decisão prática.",
    ],
    isAdminAgent: true,
    installed: true,
    source: "core",
  },
  {
    id: "zeta",
    name: "Zeta",
    role: "LGPD, segurança, moderação e revisão",
    initials: "ZT",
    color: "#e879f9",
    bg: "rgba(232,121,249,0.14)",
    status: "offline",
    unread: 0,
    skills: ["LGPD", "Privacidade", "Termos", "Segurança", "Moderação"],
    systemPrompt:
      "Você é Zeta, agente de LGPD, segurança e moderação do Studio Sualuma. Você ajuda a reduzir riscos, revisar textos, políticas, permissões e fluxos sensíveis.",
    behaviorRules: [
      "Seja cuidadoso com privacidade e dados pessoais.",
      "Não incentive spam, raspagem abusiva ou uso indevido de dados.",
      "Sugira caminhos éticos e seguros.",
    ],
    isAdminAgent: true,
    installed: true,
    source: "core",
  },
  {
    id: "prospector",
    name: "Prospector",
    role: "Prospecção ética e qualificação de leads",
    initials: "PR",
    color: "#fb7185",
    bg: "rgba(251,113,133,0.14)",
    status: "online",
    unread: 0,
    skills: ["Prospecção ética", "ICP", "Qualificação", "Abordagem", "CRM"],
    systemPrompt:
      "Você é Prospector, agente de prospecção ética do Studio Sualuma. Você ajuda a encontrar perfis ideais, qualificar leads, sugerir abordagens personalizadas e organizar informações no CRM sem spam e respeitando LGPD.",
    behaviorRules: [
      "Nunca proponha spam.",
      "Nunca colete dados sensíveis desnecessários.",
      "Priorize fontes públicas, consentimento, relevância e abordagem humana.",
      "Sempre explique por que um lead se encaixa ou não no perfil.",
    ],
    isAdminAgent: true,
    installed: true,
    source: "installed",
  },
  {
    id: "userguard",
    name: "User Guard",
    role: "Gestão de usuários, sucesso e problemas de conta",
    initials: "UG",
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.15)",
    status: "online",
    unread: 0,
    skills: ["Usuários", "Supabase Auth", "Onboarding", "Sucesso do cliente", "Alertas"],
    systemPrompt:
      "Você é User Guard, agente de gestão de usuários do Studio Sualuma. Você acompanha usuários novos, usuários com problema, falhas de login, onboarding, plano, sucesso e alertas de conta.",
    behaviorRules: [
      "Responda como funcionário interno responsável por usuários.",
      "Organize problemas por prioridade e impacto.",
      "Quando a usuária pedir, transforme achados em tarefas para o Copiloto.",
    ],
    isAdminAgent: true,
    installed: true,
    source: "installed",
  },
];

function normalizeAgent(agent: Partial<AdminAgent>): AdminAgent {
  const id = String(agent.id || agent.name || "agent")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const name = agent.name || id || "Agente";
  const initials =
    agent.initials ||
    name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return {
    id,
    name,
    role: agent.role || "Agente administrativo",
    initials,
    color: agent.color || "#e040a0",
    bg: agent.bg || "rgba(224,64,160,0.15)",
    status: agent.status || "online",
    unread: Number(agent.unread || 0),
    skills: Array.isArray(agent.skills) ? agent.skills.filter(Boolean).map(String) : [],
    systemPrompt: agent.systemPrompt || `Você é ${name}, agente administrativo do Studio Sualuma.`,
    behaviorRules: Array.isArray(agent.behaviorRules) ? agent.behaviorRules.filter(Boolean).map(String) : [],
    isAdminAgent: agent.isAdminAgent !== false,
    installed: agent.installed !== false,
    source: agent.source || "manual",
    route: agent.route,
  };
}

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify(DEFAULT_ADMIN_AGENTS, null, 2), "utf8");
  }
}

export async function getAllStoredAgents(): Promise<AdminAgent[]> {
  await ensureStore();

  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      await fs.writeFile(DATA_FILE, JSON.stringify(DEFAULT_ADMIN_AGENTS, null, 2), "utf8");
      return DEFAULT_ADMIN_AGENTS;
    }

    const normalized = parsed.map(normalizeAgent);

    const merged = [...normalized];

    for (const defaultAgent of DEFAULT_ADMIN_AGENTS) {
      if (!merged.some((agent) => agent.id === defaultAgent.id)) {
        merged.push(defaultAgent);
      }
    }

    return merged;
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify(DEFAULT_ADMIN_AGENTS, null, 2), "utf8");
    return DEFAULT_ADMIN_AGENTS;
  }
}

export async function getAdminAgents(): Promise<AdminAgent[]> {
  const agents = await getAllStoredAgents();
  return agents.filter((agent) => agent.isAdminAgent && agent.installed);
}

export async function saveAgents(agents: AdminAgent[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(agents.map(normalizeAgent), null, 2), "utf8");
}

export async function getAdminAgentById(id: string): Promise<AdminAgent | null> {
  const agents = await getAdminAgents();
  return agents.find((agent) => agent.id === id) || null;
}

export async function patchAdminAgent(id: string, patch: Partial<AdminAgent>) {
  const agents = await getAllStoredAgents();
  const index = agents.findIndex((agent) => agent.id === id);

  if (index === -1) {
    throw new Error("Agente não encontrado.");
  }

  agents[index] = normalizeAgent({
    ...agents[index],
    ...patch,
    id: agents[index].id,
  });

  await saveAgents(agents);

  return agents[index];
}

export async function upsertAdminAgent(input: Partial<AdminAgent> & { name: string; role?: string }) {
  const agents = await getAllStoredAgents();
  const normalized = normalizeAgent({
    ...input,
    isAdminAgent: true,
    installed: input.installed !== false,
  });

  const index = agents.findIndex((agent) => agent.id === normalized.id);

  if (index >= 0) {
    agents[index] = normalizeAgent({
      ...agents[index],
      ...normalized,
    });
  } else {
    agents.push(normalized);
  }

  await saveAgents(agents);

  return normalized;
}
