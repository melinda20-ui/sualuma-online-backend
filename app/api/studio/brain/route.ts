import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const fallback = {
  summary: {
    revenueToday: "R$ 1.280",
    revenueMonth: "R$ 18.430",
    leadsToday: 14,
    activeUsers: 37,
    openTickets: 5,
    riskCount: 3
  },
  modules: [
    {
      id: "m1",
      title: "Fluxo de Leads",
      description: "Captação, entrada no CRM e qualificação inicial.",
      status: "Em andamento",
      reason: "Entrando leads, mas falta melhorar origem com melhor CTR.",
      href: "/admin/leads",
      owner: "Marketing"
    },
    {
      id: "m2",
      title: "Blog + SEO",
      description: "Publicação de conteúdo, indexação e tráfego orgânico.",
      status: "Em andamento",
      reason: "Posts sendo publicados, mas falta escalar palavras-chave.",
      href: "/admin/conteudo",
      owner: "Conteúdo"
    },
    {
      id: "m3",
      title: "Suporte ao Cliente",
      description: "Atendimento e respostas do time/automação.",
      status: "Em risco",
      reason: "Há tickets em aberto acima do ideal.",
      href: "/member-services",
      owner: "Suporte"
    },
    {
      id: "m4",
      title: "Marketplace",
      description: "Venda de serviços, agentes e oportunidades internas.",
      status: "Parado",
      reason: "Precisa melhorar exposição dos cards e gatilhos comerciais.",
      href: "/marketplace",
      owner: "Comercial"
    },
    {
      id: "m5",
      title: "Área de Planos",
      description: "Página de planos, upgrade e cobrança.",
      status: "Ativo",
      reason: "Fluxo funcionando normalmente.",
      href: "/plans",
      owner: "Financeiro"
    },
    {
      id: "m6",
      title: "Chat Mia",
      description: "Chat principal para ajuda, navegação e IA.",
      status: "Em andamento",
      reason: "Modo teste sem login ativo. Falta conectar memória e contexto.",
      href: "/chat",
      owner: "IA"
    },
    {
      id: "m7",
      title: "Automações",
      description: "Rotinas, disparos e integrações do ecossistema.",
      status: "Em risco",
      reason: "Nem todas as automações têm monitoramento claro ainda.",
      href: "/automations",
      owner: "Operações"
    },
    {
      id: "m8",
      title: "Portal do Usuário",
      description: "Entrada, onboarding e uso do ambiente interno.",
      status: "Ativo",
      reason: "Sem erro crítico no momento.",
      href: "/portal",
      owner: "Produto"
    }
  ],
  notifications: [
    {
      id: "n1",
      title: "3 áreas pedem atenção",
      description: "Suporte, automações e conversão da jornada inicial estão exigindo acompanhamento.",
      category: "Críticas",
      status: "atenção",
      href: "#operacional",
      time: "Agora"
    },
    {
      id: "n2",
      title: "Novo lead entrou",
      description: "Lead novo vindo do funil principal e aguardando qualificação.",
      category: "Oportunidades",
      status: "novo",
      href: "/admin/leads",
      time: "há 2 min"
    },
    {
      id: "n3",
      title: "Página de planos está estável",
      description: "Fluxo de navegação sem alerta crítico detectado hoje.",
      category: "Operacionais",
      status: "ok",
      href: "/plans",
      time: "há 9 min"
    },
    {
      id: "n4",
      title: "Receita de serviços puxando o mês",
      description: "Serviços seguem como principal fonte de faturamento no momento.",
      category: "Financeiras",
      status: "ok",
      href: "#financeiro",
      time: "há 14 min"
    }
  ],
  finance: [
    { id: "f1", label: "Receita de Planos", value: "R$ 4.280", progress: 42, href: "/plans" },
    { id: "f2", label: "Receita de Serviços", value: "R$ 9.760", progress: 78, href: "/member-services" },
    { id: "f3", label: "Marketplace", value: "R$ 2.140", progress: 31, href: "/marketplace" },
    { id: "f4", label: "Potencial em Leads", value: "R$ 18.900", progress: 64, href: "/admin/leads" }
  ],
  journey: [
    {
      id: "j1",
      title: "Usuário entra",
      subtitle: "Acesso pela home, link, campanha ou indicação",
      status: "saudável",
      href: "/"
    },
    {
      id: "j2",
      title: "Cadastro / Login",
      subtitle: "Entrada no sistema e autenticação",
      status: "atenção",
      href: "/login"
    },
    {
      id: "j3",
      title: "E-mail de boas-vindas",
      subtitle: "Orientação inicial e ativação",
      status: "saudável",
      href: "/bem-vindo"
    },
    {
      id: "j4",
      title: "Explora o Studio / Portal",
      subtitle: "Começa a navegar e entender o ambiente",
      status: "saudável",
      href: "/portal"
    },
    {
      id: "j5",
      title: "Usa chat / suporte",
      subtitle: "Busca ajuda, respostas ou atendimento",
      status: "risco",
      href: "/chat"
    },
    {
      id: "j6",
      title: "Consome blog / conteúdo",
      subtitle: "Lê, aprende, volta e amadurece compra",
      status: "oportunidade",
      href: "/admin/conteudo"
    },
    {
      id: "j7",
      title: "Compra serviço / agente / plano",
      subtitle: "Conversão dentro da plataforma",
      status: "saudável",
      href: "/marketplace"
    },
    {
      id: "j8",
      title: "Indica alguém / retorna",
      subtitle: "Vira recorrência, prova social e expansão",
      status: "oportunidade",
      href: "/member-user"
    }
  ]
};

function normalizeModuleStatus(value: any) {
  const text = String(value || "").toLowerCase();

  if (text.includes("risco")) return "Em risco";
  if (text.includes("parado") || text.includes("pausado")) return "Parado";
  if (text.includes("ativo") || text.includes("online")) return "Ativo";
  return "Em andamento";
}

function normalizeJourneyStatus(value: any) {
  const text = String(value || "").toLowerCase();

  if (text.includes("risco")) return "risco";
  if (text.includes("aten")) return "atenção";
  if (text.includes("oportun")) return "oportunidade";
  return "saudável";
}

function normalizeNotificationCategory(value: any) {
  const text = String(value || "").toLowerCase();

  if (text.includes("oportun")) return "Oportunidades";
  if (text.includes("oper")) return "Operacionais";
  if (text.includes("financ")) return "Financeiras";
  return "Críticas";
}

function normalizeNotificationStatus(value: any) {
  const text = String(value || "").toLowerCase();

  if (text.includes("aten")) return "atenção";
  if (text.includes("ok") || text.includes("ativo")) return "ok";
  return "novo";
}

function readStoredData() {
  try {
    const file = path.join(process.cwd(), "data", "studio-brain.json");
    if (!fs.existsSync(file)) return fallback;

    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    return parsed && typeof parsed === "object" ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export async function GET() {
  const raw = readStoredData();

  const summary = {
    ...fallback.summary,
    ...(raw.summary && typeof raw.summary === "object" ? raw.summary : {})
  };

  const modulesSource = Array.isArray(raw.modules) ? raw.modules : fallback.modules;
  const notificationsSource = Array.isArray(raw.notifications) ? raw.notifications : fallback.notifications;
  const financeSource = Array.isArray(raw.finance) ? raw.finance : fallback.finance;
  const journeySource = Array.isArray(raw.journey) ? raw.journey : fallback.journey;

  const modules = modulesSource.map((item: any, index: number) => ({
    id: String(item.id || `m${index + 1}`),
    title: String(item.title || "Área sem nome"),
    description: String(item.description || "Sem descrição ainda."),
    status: normalizeModuleStatus(item.status),
    reason: String(item.reason || "Ainda sem motivo registrado."),
    href: String(item.href || "#"),
    owner: String(item.owner || "Studio")
  }));

  const notifications = notificationsSource.map((item: any, index: number) => ({
    id: String(item.id || `n${index + 1}`),
    title: String(item.title || "Notificação"),
    description: String(item.description || "Sem descrição."),
    category: normalizeNotificationCategory(item.category),
    status: normalizeNotificationStatus(item.status),
    href: String(item.href || "#"),
    time: String(item.time || "Agora")
  }));

  const finance = financeSource.map((item: any, index: number) => ({
    id: String(item.id || `f${index + 1}`),
    label: String(item.label || "Indicador financeiro"),
    value: String(item.value || "R$ 0,00"),
    progress: Math.max(0, Math.min(100, Number(item.progress || 0))),
    href: String(item.href || "#")
  }));

  const journey = journeySource.map((item: any, index: number) => ({
    id: String(item.id || `j${index + 1}`),
    title: String(item.title || "Etapa da jornada"),
    subtitle: String(item.subtitle || "Sem descrição."),
    status: normalizeJourneyStatus(item.status),
    href: String(item.href || "#")
  }));

  return NextResponse.json(
    {
      summary,
      modules,
      notifications,
      finance,
      journey,
      updatedAt: new Date().toISOString()
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate"
      }
    }
  );
}
