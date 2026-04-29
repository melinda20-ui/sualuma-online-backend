"use client";

import { useEffect, useMemo, useState } from "react";

type Status = "Em andamento" | "Em risco" | "Parado" | "Ativo";
type NotificationCategory =
  | "Críticas"
  | "Oportunidades"
  | "Operacionais"
  | "Financeiras";

type Summary = {
  revenueToday: string;
  revenueMonth: string;
  leadsToday: number;
  activeUsers: number;
  openTickets: number;
  riskCount: number;
};

type ModuleItem = {
  id: string;
  title: string;
  description: string;
  status: Status;
  reason: string;
  href: string;
  owner?: string;
};

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  category: NotificationCategory;
  status: "novo" | "atenção" | "ok";
  href: string;
  time: string;
};

type FinanceItem = {
  id: string;
  label: string;
  value: string;
  progress: number;
  href: string;
};

type JourneyItem = {
  id: string;
  title: string;
  subtitle: string;
  status: "saudável" | "atenção" | "risco" | "oportunidade";
  href: string;
};

type BrainData = {
  summary: Summary;
  modules: ModuleItem[];
  notifications: NotificationItem[];
  finance: FinanceItem[];
  journey: JourneyItem[];
};

const fallbackData: BrainData = {
  summary: {
    revenueToday: "R$ 1.280",
    revenueMonth: "R$ 18.430",
    leadsToday: 14,
    activeUsers: 37,
    openTickets: 5,
    riskCount: 3,
  },
  modules: [
    {
      id: "m1",
      title: "Fluxo de Leads",
      description: "Captação, entrada no CRM e qualificação inicial.",
      status: "Em andamento",
      reason: "Entrando leads, mas falta melhorar origem com melhor CTR.",
      href: "/admin/leads",
      owner: "Marketing",
    },
    {
      id: "m2",
      title: "Blog + SEO",
      description: "Publicação de conteúdo, indexação e tráfego orgânico.",
      status: "Em andamento",
      reason: "Posts sendo publicados, mas falta escalar palavras-chave.",
      href: "/admin/conteudo",
      owner: "Conteúdo",
    },
    {
      id: "m3",
      title: "Suporte ao Cliente",
      description: "Atendimento e respostas do time/automação.",
      status: "Em risco",
      reason: "Há tickets em aberto acima do ideal.",
      href: "/member-services",
      owner: "Suporte",
    },
    {
      id: "m4",
      title: "Marketplace",
      description: "Venda de serviços, agentes e oportunidades internas.",
      status: "Parado",
      reason: "Precisa melhorar exposição dos cards e gatilhos comerciais.",
      href: "/marketplace",
      owner: "Comercial",
    },
    {
      id: "m5",
      title: "Área de Planos",
      description: "Página de planos, upgrade e cobrança.",
      status: "Ativo",
      reason: "Fluxo funcionando normalmente.",
      href: "/plans",
      owner: "Financeiro",
    },
    {
      id: "m6",
      title: "Chat Mia",
      description: "Chat principal para ajuda, navegação e IA.",
      status: "Em andamento",
      reason: "Modo teste sem login ativo. Falta conectar memória e contexto.",
      href: "/chat",
      owner: "IA",
    },
    {
      id: "m7",
      title: "Automações",
      description: "Rotinas, disparos e integrações do ecossistema.",
      status: "Em risco",
      reason: "Nem todas as automações têm monitoramento claro ainda.",
      href: "/automations",
      owner: "Operações",
    },
    {
      id: "m8",
      title: "Portal do Usuário",
      description: "Entrada, onboarding e uso do ambiente interno.",
      status: "Ativo",
      reason: "Sem erro crítico no momento.",
      href: "/portal",
      owner: "Produto",
    },
  ],
  notifications: [
    {
      id: "n1",
      title: "3 áreas pedem atenção",
      description: "Suporte, automações e conversão da jornada inicial estão exigindo acompanhamento.",
      category: "Críticas",
      status: "atenção",
      href: "#operacional",
      time: "Agora",
    },
    {
      id: "n2",
      title: "Novo lead entrou",
      description: "Lead novo vindo do funil principal e aguardando qualificação.",
      category: "Oportunidades",
      status: "novo",
      href: "/admin/leads",
      time: "há 2 min",
    },
    {
      id: "n3",
      title: "Página de planos está estável",
      description: "Fluxo de navegação sem alerta crítico detectado hoje.",
      category: "Operacionais",
      status: "ok",
      href: "/plans",
      time: "há 9 min",
    },
    {
      id: "n4",
      title: "Receita de serviços puxando o mês",
      description: "Serviços seguem como principal fonte de faturamento no momento.",
      category: "Financeiras",
      status: "ok",
      href: "#financeiro",
      time: "há 14 min",
    },
  ],
  finance: [
    {
      id: "f1",
      label: "Receita de Planos",
      value: "R$ 4.280",
      progress: 42,
      href: "/plans",
    },
    {
      id: "f2",
      label: "Receita de Serviços",
      value: "R$ 9.760",
      progress: 78,
      href: "/member-services",
    },
    {
      id: "f3",
      label: "Marketplace",
      value: "R$ 2.140",
      progress: 31,
      href: "/marketplace",
    },
    {
      id: "f4",
      label: "Potencial em Leads",
      value: "R$ 18.900",
      progress: 64,
      href: "/admin/leads",
    },
  ],
  journey: [
    {
      id: "j1",
      title: "Usuário entra",
      subtitle: "Acesso pela home, link, campanha ou indicação",
      status: "saudável",
      href: "/",
    },
    {
      id: "j2",
      title: "Cadastro / Login",
      subtitle: "Entrada no sistema e autenticação",
      status: "atenção",
      href: "/login",
    },
    {
      id: "j3",
      title: "E-mail de boas-vindas",
      subtitle: "Orientação inicial e ativação",
      status: "saudável",
      href: "/bem-vindo",
    },
    {
      id: "j4",
      title: "Explora o Studio / Portal",
      subtitle: "Começa a navegar e entender o ambiente",
      status: "saudável",
      href: "/portal",
    },
    {
      id: "j5",
      title: "Usa chat / suporte",
      subtitle: "Busca ajuda, respostas ou atendimento",
      status: "risco",
      href: "/chat",
    },
    {
      id: "j6",
      title: "Consome blog / conteúdo",
      subtitle: "Lê, aprende, volta e amadurece compra",
      status: "oportunidade",
      href: "/admin/conteudo",
    },
    {
      id: "j7",
      title: "Compra serviço / agente / plano",
      subtitle: "Conversão dentro da plataforma",
      status: "saudável",
      href: "/marketplace",
    },
    {
      id: "j8",
      title: "Indica alguém / retorna",
      subtitle: "Vira recorrência, prova social e expansão",
      status: "oportunidade",
      href: "/member-user",
    },
  ],
};

const statusOrder: Status[] = [
  "Em andamento",
  "Em risco",
  "Parado",
  "Ativo",
];

const statusTone: Record<Status, { label: string; className: string }> = {
  "Em andamento": { label: "Em andamento", className: "statusProgress" },
  "Em risco": { label: "Em risco", className: "statusRisk" },
  Parado: { label: "Parado", className: "statusPaused" },
  Ativo: { label: "Ativo", className: "statusActive" },
};

const journeyTone: Record<
  JourneyItem["status"],
  { label: string; className: string }
> = {
  saudável: { label: "Saudável", className: "journeyHealthy" },
  atenção: { label: "Atenção", className: "journeyAttention" },
  risco: { label: "Risco", className: "journeyRisk" },
  oportunidade: { label: "Oportunidade", className: "journeyOpportunity" },
};

function normalizeData(raw: any): BrainData {
  if (!raw || typeof raw !== "object") return fallbackData;

  const summary = {
    revenueToday:
      raw?.summary?.revenueToday ??
      raw?.summary?.todayRevenue ??
      fallbackData.summary.revenueToday,
    revenueMonth:
      raw?.summary?.revenueMonth ??
      raw?.summary?.monthRevenue ??
      fallbackData.summary.revenueMonth,
    leadsToday:
      Number(raw?.summary?.leadsToday ?? fallbackData.summary.leadsToday) || 0,
    activeUsers:
      Number(raw?.summary?.activeUsers ?? fallbackData.summary.activeUsers) || 0,
    openTickets:
      Number(raw?.summary?.openTickets ?? fallbackData.summary.openTickets) || 0,
    riskCount:
      Number(raw?.summary?.riskCount ?? fallbackData.summary.riskCount) || 0,
  };

  const modules = Array.isArray(raw?.modules)
    ? raw.modules
    : Array.isArray(raw?.cards)
    ? raw.cards
    : fallbackData.modules;

  const notifications = Array.isArray(raw?.notifications)
    ? raw.notifications
    : fallbackData.notifications;

  const finance = Array.isArray(raw?.finance)
    ? raw.finance
    : fallbackData.finance;

  const journey = Array.isArray(raw?.journey)
    ? raw.journey
    : fallbackData.journey;

  return { summary, modules, notifications, finance, journey };
}

export default function StudioPage() {
  const [data, setData] = useState<BrainData>(fallbackData);
  const [notifTab, setNotifTab] =
    useState<NotificationCategory>("Críticas");
  const [robotIndex, setRobotIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const res = await fetch("/api/studio/brain", { cache: "no-store" });
        if (!res.ok) throw new Error("Falha na API");
        const json = await res.json();
        if (alive) setData(normalizeData(json));
      } catch {
        if (alive) setData(fallbackData);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, 30000);

    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, []);

  const grouped = useMemo(() => {
    return statusOrder.map((status) => ({
      status,
      items: data.modules.filter((item) => item.status === status),
    }));
  }, [data.modules]);

  const filteredNotifications = useMemo(() => {
    return data.notifications.filter((n) => n.category === notifTab);
  }, [data.notifications, notifTab]);

  const robotMessages = useMemo(() => {
    const risk = data.modules.find((item) => item.status === "Em risco");
    const progressCount = data.modules.filter(
      (item) => item.status === "Em andamento"
    ).length;

    return [
      progressCount > 0
        ? `Temos ${progressCount} áreas em andamento agora.`
        : "Tudo fluindo tranquilamente por aqui.",
      risk
        ? `Alerta: ${risk.title} precisa da sua atenção.`
        : "Nenhuma área crítica gritando agora.",
      `Receita do mês: ${data.summary.revenueMonth}.`,
      `Hoje entraram ${data.summary.leadsToday} leads. Vamos pra cima ✨`,
    ];
  }, [data.modules, data.summary]);

  useEffect(() => {
    const timer = setInterval(() => {
      setRobotIndex((prev) => (prev + 1) % robotMessages.length);
    }, 3500);

    return () => clearInterval(timer);
  }, [robotMessages.length]);

  return (
    <div className="studioShell">
      <aside className="sidebar">
        <div className="brandBlock">
          <div className="brandLogo">S</div>
          <div>
            <p className="brandEyebrow">Studio Admin</p>
            <h1 className="brandTitle">Cérebro do Studio</h1>
          </div>
        </div>

        <nav className="sideNav">
          <a href="#visao-geral">Visão Geral</a>
          <a href="#operacional">Cérebro Operacional</a>
          <a href="#jornada">Mapa do Usuário</a>
          <a href="#financeiro">Financeiro</a>
          <a href="#notificacoes">Notificações</a>
        </nav>

        <div className="sideCard">
          <p className="sideCardLabel">Prioridade do dia</p>
          <strong>Acompanhar risco + conversão</strong>
          <span>Foque primeiro no que está em andamento e em risco.</span>
        </div>

        <div className="sideCard">
          <p className="sideCardLabel">Atualização automática</p>
          <strong>Ligada</strong>
          <span>O Studio tenta atualizar sozinho a cada 30 segundos.</span>
        </div>
      </aside>

      <main className="mainContent">
        <section className="hero" id="visao-geral">
          <div className="heroText">
            <div className="heroBadge">
              {loading ? "Atualizando..." : "Studio online"}
            </div>
            <h2>
              Seu painel administrativo, financeiro e operacional
              <span> em um só lugar.</span>
            </h2>
            <p>
              Aqui você acompanha o que está acontecendo na plataforma,
              identifica riscos, vê oportunidades e entra direto nas áreas
              importantes com um clique.
            </p>

            <div className="summaryGrid">
              <a className="summaryCard" href="#financeiro">
                <span>Receita hoje</span>
                <strong>{data.summary.revenueToday}</strong>
              </a>
              <a className="summaryCard" href="#financeiro">
                <span>Receita do mês</span>
                <strong>{data.summary.revenueMonth}</strong>
              </a>
              <a className="summaryCard" href="/admin/leads">
                <span>Leads hoje</span>
                <strong>{data.summary.leadsToday}</strong>
              </a>
              <a className="summaryCard" href="/member-user">
                <span>Usuários ativos</span>
                <strong>{data.summary.activeUsers}</strong>
              </a>
              <a className="summaryCard" href="/chat">
                <span>Tickets abertos</span>
                <strong>{data.summary.openTickets}</strong>
              </a>
              <a className="summaryCard" href="#operacional">
                <span>Itens em risco</span>
                <strong>{data.summary.riskCount}</strong>
              </a>
            </div>
          </div>

          <div className="robotPanel">
            <div className="speechBubble">{robotMessages[robotIndex]}</div>

            <div className="robotWrap" aria-label="Robô do Studio">
              <div className="robotGlow" />
              <div className="robot">
                <div className="robotHead">
                  <div className="robotEyes">
                    <span className="eye" />
                    <span className="eye" />
                  </div>
                  <div className="robotSmile" />
                  <div className="robotAntenna" />
                </div>
                <div className="robotBody">
                  <div className="robotCore" />
                </div>
              </div>

              <div className="floatBalloon balloonOne">lead novo</div>
              <div className="floatBalloon balloonTwo">risco</div>
              <div className="floatBalloon balloonThree">ativo</div>
            </div>
          </div>
        </section>

        <section className="section" id="operacional">
          <div className="sectionHead">
            <div>
              <p className="sectionEyebrow">Cérebro Operacional</p>
              <h3>Áreas organizadas por prioridade</h3>
            </div>
            <span className="sectionHint">
              Ordem: em andamento → em risco → parado → ativo
            </span>
          </div>

          <div className="rowsWrap">
            {grouped.map(({ status, items }) => (
              <div className="statusRow" key={status}>
                <div className="rowLabel">
                  <span className={`statusPill ${statusTone[status].className}`}>
                    {statusTone[status].label}
                  </span>
                  <small>{items.length} item(ns)</small>
                </div>

                <div className="cardsGrid">
                  {items.length === 0 ? (
                    <div className="emptyCard">Nenhum item nesta fileira.</div>
                  ) : (
                    items.map((item) => (
                      <a className="moduleCard" href={item.href} key={item.id}>
                        <div className="moduleTop">
                          <span
                            className={`statusPill ${statusTone[item.status].className}`}
                          >
                            {item.status}
                          </span>
                          <span className="ownerTag">{item.owner ?? "Studio"}</span>
                        </div>

                        <h4>{item.title}</h4>
                        <p>{item.description}</p>

                        <div className="moduleReason">
                          <strong>Motivo:</strong> {item.reason}
                        </div>

                        <span className="moduleLink">Abrir área →</span>
                      </a>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="section" id="jornada">
          <div className="sectionHead">
            <div>
              <p className="sectionEyebrow">Mapa do Usuário</p>
              <h3>Jornada em formato de mapa mental</h3>
            </div>
            <span className="sectionHint">
              Clique em qualquer etapa para abrir a área relacionada
            </span>
          </div>

          <div className="mindMap">
            <div className="mindCenter">
              <span className="mindMini">Centro</span>
              <strong>Usuário dentro da plataforma</strong>
              <p>O cérebro acompanha a jornada completa.</p>
            </div>

            <div className="mindBranches">
              {data.journey.map((step) => (
                <a className="mindNode" href={step.href} key={step.id}>
                  <span
                    className={`journeyBadge ${journeyTone[step.status].className}`}
                  >
                    {journeyTone[step.status].label}
                  </span>
                  <strong>{step.title}</strong>
                  <p>{step.subtitle}</p>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="financeiro">
          <div className="sectionHead">
            <div>
              <p className="sectionEyebrow">Financeiro</p>
              <h3>Resultado financeiro resumido</h3>
            </div>
            <span className="sectionHint">
              Visão rápida do que está puxando receita
            </span>
          </div>

          <div className="financeGrid">
            {data.finance.map((item) => (
              <a className="financeCard" href={item.href} key={item.id}>
                <div className="financeTop">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
                <div className="progressTrack">
                  <div
                    className="progressFill"
                    style={{ width: `${Math.max(6, item.progress)}%` }}
                  />
                </div>
                <small>{item.progress}% do foco atual</small>
              </a>
            ))}
          </div>
        </section>

        <section className="section" id="notificacoes">
          <div className="sectionHead">
            <div>
              <p className="sectionEyebrow">Central Inteligente</p>
              <h3>Notificações por categoria</h3>
            </div>
          </div>

          <div className="tabs">
            {(["Críticas", "Oportunidades", "Operacionais", "Financeiras"] as NotificationCategory[]).map(
              (tab) => (
                <button
                  key={tab}
                  className={notifTab === tab ? "tab activeTab" : "tab"}
                  onClick={() => setNotifTab(tab)}
                  type="button"
                >
                  {tab}
                </button>
              )
            )}
          </div>

          <div className="notifGrid">
            {filteredNotifications.length === 0 ? (
              <div className="emptyCard">Sem notificações nesta categoria agora.</div>
            ) : (
              filteredNotifications.map((item) => (
                <a className="notifCard" href={item.href} key={item.id}>
                  <div className="notifTop">
                    <span
                      className={
                        item.status === "novo"
                          ? "notifDot notifNew"
                          : item.status === "atenção"
                          ? "notifDot notifWarn"
                          : "notifDot notifOk"
                      }
                    />
                    <small>{item.time}</small>
                  </div>
                  <h4>{item.title}</h4>
                  <p>{item.description}</p>
                  <span className="moduleLink">Ver área →</span>
                </a>
              ))
            )}
          </div>
        </section>
      </main>

      <style jsx>{`
        :global(html) {
          scroll-behavior: smooth;
        }

        .studioShell {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 280px minmax(0, 1fr);
          background:
            radial-gradient(circle at top, rgba(255, 73, 173, 0.15), transparent 24%),
            linear-gradient(180deg, #0d0710 0%, #120913 45%, #0a050d 100%);
          color: #fff4fb;
        }

        .sidebar {
          position: sticky;
          top: 0;
          height: 100vh;
          padding: 28px 18px;
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(10, 6, 12, 0.88);
          backdrop-filter: blur(18px);
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .brandBlock {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .brandLogo {
          width: 48px;
          height: 48px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          font-weight: 800;
          font-size: 22px;
          background: linear-gradient(135deg, #ff3ea6, #a646ff);
          color: white;
          box-shadow: 0 12px 36px rgba(255, 62, 166, 0.28);
        }

        .brandEyebrow {
          margin: 0;
          color: #ff9cd3;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
        }

        .brandTitle {
          margin: 4px 0 0;
          font-size: 20px;
          line-height: 1.2;
          color: #fff7fc;
        }

        .sideNav {
          display: grid;
          gap: 8px;
        }

        .sideNav a {
          text-decoration: none;
          color: #f9d8ea;
          padding: 10px 12px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.03);
          transition: 0.2s ease;
          font-size: 14px;
        }

        .sideNav a:hover {
          background: rgba(255, 62, 166, 0.15);
          color: #fff;
          transform: translateX(3px);
        }

        .sideCard {
          padding: 14px;
          border-radius: 18px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.02));
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: grid;
          gap: 6px;
        }

        .sideCardLabel {
          margin: 0;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: #ff93c6;
        }

        .sideCard strong {
          font-size: 15px;
          color: #fff9fd;
        }

        .sideCard span {
          font-size: 13px;
          color: #d9bfd2;
          line-height: 1.5;
        }

        .mainContent {
          padding: 26px;
          display: grid;
          gap: 22px;
        }

        .hero,
        .section {
          border-radius: 28px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: linear-gradient(180deg, rgba(22, 12, 25, 0.88), rgba(14, 9, 17, 0.94));
          box-shadow: 0 18px 60px rgba(0, 0, 0, 0.28);
        }

        .hero {
          padding: 28px;
          display: grid;
          grid-template-columns: 1.2fr 0.9fr;
          gap: 24px;
          align-items: center;
        }

        .heroBadge {
          display: inline-flex;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(255, 62, 166, 0.16);
          border: 1px solid rgba(255, 62, 166, 0.26);
          color: #ffafd9;
          font-size: 13px;
          font-weight: 600;
        }

        .heroText h2 {
          margin: 14px 0 10px;
          font-size: clamp(28px, 4vw, 44px);
          line-height: 1.08;
          color: #fff8fd;
          max-width: 16ch;
        }

        .heroText h2 span {
          color: #ff78bf;
        }

        .heroText p {
          margin: 0;
          max-width: 70ch;
          color: #dec6d7;
          line-height: 1.7;
          font-size: 15px;
        }

        .summaryGrid {
          margin-top: 18px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .summaryCard {
          text-decoration: none;
          color: inherit;
          padding: 16px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: grid;
          gap: 8px;
          transition: 0.2s ease;
        }

        .summaryCard:hover,
        .moduleCard:hover,
        .mindNode:hover,
        .financeCard:hover,
        .notifCard:hover {
          transform: translateY(-3px);
          border-color: rgba(255, 120, 191, 0.38);
          box-shadow: 0 16px 36px rgba(255, 62, 166, 0.15);
        }

        .summaryCard span {
          font-size: 13px;
          color: #d8bbcd;
        }

        .summaryCard strong {
          font-size: 24px;
          line-height: 1.1;
          color: #fff7fc;
        }

        .robotPanel {
          min-height: 100%;
          display: grid;
          align-content: center;
          gap: 18px;
          justify-items: center;
        }

        .speechBubble {
          max-width: 320px;
          padding: 14px 18px;
          border-radius: 18px;
          background: linear-gradient(180deg, rgba(255, 105, 180, 0.18), rgba(255, 255, 255, 0.05));
          border: 1px solid rgba(255, 120, 191, 0.3);
          color: #fff3fb;
          font-size: 14px;
          line-height: 1.6;
          text-align: center;
          min-height: 54px;
        }

        .robotWrap {
          position: relative;
          width: 320px;
          height: 320px;
          display: grid;
          place-items: center;
        }

        .robotGlow {
          position: absolute;
          inset: auto;
          width: 220px;
          height: 220px;
          background: radial-gradient(circle, rgba(255, 62, 166, 0.28), transparent 70%);
          filter: blur(12px);
          animation: pulseGlow 3.4s ease-in-out infinite;
        }

        .robot {
          position: relative;
          z-index: 2;
          display: grid;
          gap: 10px;
          justify-items: center;
          animation: floatRobot 4.5s ease-in-out infinite;
        }

        .robotHead {
          width: 130px;
          height: 110px;
          border-radius: 30px;
          background: linear-gradient(180deg, #251025, #160a19);
          border: 1px solid rgba(255, 255, 255, 0.12);
          position: relative;
          display: grid;
          place-items: center;
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.36);
        }

        .robotAntenna {
          position: absolute;
          top: -20px;
          width: 4px;
          height: 22px;
          background: linear-gradient(180deg, #ff77bf, #ffffff);
          border-radius: 999px;
        }

        .robotAntenna::after {
          content: "";
          position: absolute;
          top: -7px;
          left: 50%;
          transform: translateX(-50%);
          width: 12px;
          height: 12px;
          border-radius: 999px;
          background: #ff72bc;
          box-shadow: 0 0 18px rgba(255, 114, 188, 0.7);
        }

        .robotEyes {
          display: flex;
          gap: 18px;
          align-items: center;
        }

        .eye {
          width: 18px;
          height: 18px;
          border-radius: 999px;
          background: linear-gradient(180deg, #ff7ec5, #ffffff);
          box-shadow: 0 0 16px rgba(255, 126, 197, 0.7);
          animation: blink 4.4s infinite;
        }

        .robotSmile {
          position: absolute;
          bottom: 20px;
          width: 36px;
          height: 18px;
          border-bottom: 4px solid #ff8acb;
          border-radius: 0 0 20px 20px;
          opacity: 0.95;
        }

        .robotBody {
          width: 160px;
          height: 120px;
          border-radius: 28px;
          background: linear-gradient(180deg, #201021, #120914);
          border: 1px solid rgba(255, 255, 255, 0.12);
          display: grid;
          place-items: center;
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.32);
        }

        .robotCore {
          width: 64px;
          height: 64px;
          border-radius: 18px;
          background: radial-gradient(circle, #ff8acc 0%, #ff4bab 45%, #8f3fff 100%);
          box-shadow: 0 0 26px rgba(255, 75, 171, 0.5);
          animation: pulseCore 2.6s ease-in-out infinite;
        }

        .floatBalloon {
          position: absolute;
          z-index: 3;
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(10px);
          animation: floatSmall 3.8s ease-in-out infinite;
        }

        .balloonOne {
          top: 70px;
          right: 20px;
          color: #b2ffd2;
        }

        .balloonTwo {
          bottom: 80px;
          left: 18px;
          color: #ffd7b2;
          animation-delay: 0.9s;
        }

        .balloonThree {
          top: 38px;
          left: 48px;
          color: #ffd5ee;
          animation-delay: 1.5s;
        }

        .section {
          padding: 24px;
          display: grid;
          gap: 18px;
        }

        .sectionHead {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          align-items: end;
          flex-wrap: wrap;
        }

        .sectionEyebrow {
          margin: 0 0 6px;
          color: #ff9fd4;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
        }

        .sectionHead h3 {
          margin: 0;
          font-size: 26px;
          line-height: 1.15;
          color: #fff8fd;
        }

        .sectionHint {
          color: #d6bac9;
          font-size: 13px;
        }

        .rowsWrap {
          display: grid;
          gap: 18px;
        }

        .statusRow {
          display: grid;
          gap: 14px;
        }

        .rowLabel {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .rowLabel small {
          color: #cfb4c6;
        }

        .cardsGrid,
        .notifGrid,
        .financeGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .moduleCard,
        .mindNode,
        .financeCard,
        .notifCard,
        .emptyCard {
          text-decoration: none;
          color: inherit;
          padding: 18px;
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: 0.2s ease;
        }

        .moduleTop,
        .financeTop,
        .notifTop {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 10px;
        }

        .ownerTag {
          font-size: 12px;
          color: #f1cbdf;
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.05);
        }

        .moduleCard h4,
        .notifCard h4 {
          margin: 0 0 8px;
          font-size: 19px;
          color: #fff8fc;
        }

        .moduleCard p,
        .notifCard p,
        .mindNode p {
          margin: 0;
          color: #d8c2d0;
          line-height: 1.65;
          font-size: 14px;
        }

        .moduleReason {
          margin-top: 14px;
          padding: 12px 14px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.04);
          color: #f5dbe8;
          font-size: 13px;
          line-height: 1.6;
        }

        .moduleLink {
          display: inline-block;
          margin-top: 14px;
          color: #ff93c9;
          font-weight: 700;
          font-size: 14px;
        }

        .statusPill,
        .journeyBadge {
          display: inline-flex;
          align-items: center;
          padding: 7px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          border: 1px solid transparent;
        }

        .statusProgress {
          background: rgba(255, 168, 73, 0.12);
          border-color: rgba(255, 168, 73, 0.22);
          color: #ffd29a;
        }

        .statusRisk {
          background: rgba(255, 93, 93, 0.13);
          border-color: rgba(255, 93, 93, 0.24);
          color: #ffc4c4;
        }

        .statusPaused {
          background: rgba(154, 154, 154, 0.13);
          border-color: rgba(154, 154, 154, 0.22);
          color: #d6d6d6;
        }

        .statusActive {
          background: rgba(87, 213, 150, 0.13);
          border-color: rgba(87, 213, 150, 0.24);
          color: #caffdf;
        }

        .mindMap {
          display: grid;
          gap: 18px;
        }

        .mindCenter {
          padding: 18px;
          border-radius: 24px;
          text-align: center;
          background: linear-gradient(180deg, rgba(255, 62, 166, 0.16), rgba(255, 255, 255, 0.04));
          border: 1px solid rgba(255, 120, 191, 0.28);
        }

        .mindMini {
          display: inline-block;
          margin-bottom: 8px;
          color: #ffabd8;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }

        .mindCenter strong {
          display: block;
          font-size: 24px;
          color: #fff8fd;
        }

        .mindCenter p {
          margin: 8px 0 0;
          color: #e2c9d8;
        }

        .mindBranches {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }

        .mindNode {
          display: grid;
          gap: 10px;
        }

        .mindNode strong {
          font-size: 18px;
          color: #fff7fc;
          line-height: 1.25;
        }

        .journeyHealthy {
          background: rgba(87, 213, 150, 0.13);
          color: #d4ffe8;
          border-color: rgba(87, 213, 150, 0.24);
        }

        .journeyAttention {
          background: rgba(255, 200, 84, 0.14);
          color: #ffe5a3;
          border-color: rgba(255, 200, 84, 0.22);
        }

        .journeyRisk {
          background: rgba(255, 93, 93, 0.13);
          color: #ffd2d2;
          border-color: rgba(255, 93, 93, 0.22);
        }

        .journeyOpportunity {
          background: rgba(179, 110, 255, 0.14);
          color: #ecd6ff;
          border-color: rgba(179, 110, 255, 0.24);
        }

        .financeCard span {
          color: #d9bfd0;
          font-size: 14px;
        }

        .financeCard strong {
          font-size: 26px;
          color: #fff8fd;
        }

        .progressTrack {
          width: 100%;
          height: 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.08);
          overflow: hidden;
          margin: 10px 0 8px;
        }

        .progressFill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #ff4fab, #ff82c7, #c64dff);
          box-shadow: 0 0 16px rgba(255, 79, 171, 0.4);
        }

        .financeCard small {
          color: #cfb5c7;
        }

        .tabs {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .tab {
          border: none;
          padding: 10px 14px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.05);
          color: #f2d5e4;
          cursor: pointer;
          font-weight: 700;
          transition: 0.2s ease;
        }

        .activeTab {
          background: linear-gradient(135deg, #ff4fab, #a848ff);
          color: white;
          box-shadow: 0 10px 24px rgba(255, 79, 171, 0.28);
        }

        .notifDot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          display: inline-block;
        }

        .notifNew {
          background: #ff8bd0;
          box-shadow: 0 0 12px rgba(255, 139, 208, 0.7);
        }

        .notifWarn {
          background: #ffb057;
          box-shadow: 0 0 12px rgba(255, 176, 87, 0.7);
        }

        .notifOk {
          background: #62d693;
          box-shadow: 0 0 12px rgba(98, 214, 147, 0.7);
        }

        @keyframes floatRobot {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes blink {
          0%, 45%, 55%, 100% {
            transform: scaleY(1);
          }
          50% {
            transform: scaleY(0.18);
          }
        }

        @keyframes pulseCore {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 22px rgba(255, 75, 171, 0.45);
          }
          50% {
            transform: scale(1.08);
            box-shadow: 0 0 34px rgba(255, 75, 171, 0.62);
          }
        }

        @keyframes pulseGlow {
          0%, 100% {
            transform: scale(1);
            opacity: 0.85;
          }
          50% {
            transform: scale(1.08);
            opacity: 1;
          }
        }

        @keyframes floatSmall {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @media (max-width: 1180px) {
          .studioShell {
            grid-template-columns: 1fr;
          }

          .sidebar {
            position: relative;
            height: auto;
            border-right: none;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          }

          .hero {
            grid-template-columns: 1fr;
          }

          .mindBranches {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 780px) {
          .mainContent {
            padding: 16px;
          }

          .hero,
          .section {
            padding: 18px;
            border-radius: 22px;
          }

          .summaryGrid,
          .cardsGrid,
          .financeGrid,
          .notifGrid,
          .mindBranches {
            grid-template-columns: 1fr;
          }

          .heroText h2 {
            max-width: none;
            font-size: 30px;
          }

          .robotWrap {
            width: 100%;
            max-width: 320px;
            height: 280px;
          }

          .sectionHead h3 {
            font-size: 22px;
          }
        }
      `}</style>
    </div>
  );
}
