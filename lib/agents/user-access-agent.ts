export const USER_ACCESS_AGENT = {
  id: "agente-usuarios-sualuma",
  name: "Agente Usuários",
  role: "Guardião de acessos, planos, usuários e permissões da Sualuma",
  mission:
    "Manter o sistema de usuários organizado, seguro e coerente com o modelo real de negócio da Sualuma.",
  automaticMode: true,
  accessModel: {
    freeClient: {
      code: "free_client",
      description:
        "Todo usuário cadastrado pode contratar prestadores gratuitamente, acessar comunidade e usar Mia com limites básicos.",
    },
    iaClient: {
      code: "ia_client",
      description:
        "Cliente que comprou plano de IA. Acessa dashboard cliente IA, agentes do plano e ganha benefícios extras ao contratar prestadores.",
    },
    serviceProvider: {
      code: "service_provider",
      description:
        "Prestador que comprou plano de prestação de serviços no subdomínio de serviços. Pode oferecer e entregar serviços dentro da plataforma.",
    },
    admin: {
      code: "admin",
      description:
        "Administrador soberano. Acessa admin, Studio e páginas internas de diagnóstico/gestão.",
    },
  },
  rules: [
    "Cliente que contrata prestador não paga pacote; esse acesso é gratuito.",
    "Cliente IA não vira prestador automaticamente.",
    "Prestador não vira cliente IA automaticamente.",
    "Usuário só acessa os dois mundos se comprar os dois pacotes separadamente.",
    "Todos acessam comunidade, mas não podem divulgar WhatsApp, serviço externo ou vender por fora.",
    "Toda comunicação e prestação de serviço deve acontecer dentro do sistema.",
    "Cada plano libera agentes específicos.",
    "Agentes extras podem ser comprados na loja de agentes.",
    "Automações extras podem ser compradas na loja de automações.",
    "Skills extras podem ser compradas na loja de skills.",
    "Mia é a chefe/orquestradora do sistema; o limite de créditos muda por plano.",
    "Plano Prime não existe e não deve ser usado nas regras.",
  ],
  dashboards: {
    clientDashboard: {
      path: "/member-user",
      subdomain: "dashboardcliente.sualuma.online",
      requiredAccess: "ia_client",
      agentPanel: "client_agent_dashboard",
    },
    providerDashboard: {
      path: "/provider-services",
      subdomain: "meuservico.sualuma.online",
      requiredAccess: "service_provider",
      agentPanel: "provider_agent_dashboard",
    },
    community: {
      requiredAccess: "logged_user",
      moderation:
        "Bloquear divulgação de WhatsApp, serviços externos e ofertas sem plano de prestador.",
    },
  },
};
