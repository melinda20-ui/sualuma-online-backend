"use client";

import { useMemo, useState } from "react";

type StudioView =
  | "visao"
  | "sitemap"
  | "mia"
  | "agentes"
  | "servicos"
  | "comunidade"
  | "ideias"
  | "usuarios"
  | "saude"
  | "financeiro";

type Tone = "pink" | "blue" | "green" | "yellow" | "red" | "purple";

const tabs: { id: StudioView; label: string; icon: string; badge?: string }[] = [
  { id: "visao", label: "Visão Geral", icon: "🏠" },
  { id: "sitemap", label: "Raiz do Site", icon: "🧬", badge: "12" },
  { id: "mia", label: "Painel da Mia", icon: "🧠" },
  { id: "agentes", label: "Agentes", icon: "🤖", badge: "9" },
  { id: "servicos", label: "Serviços", icon: "🧰" },
  { id: "comunidade", label: "Comunidade", icon: "💬" },
  { id: "ideias", label: "Idea Store", icon: "💡", badge: "Novo" },
  { id: "usuarios", label: "Usuários", icon: "👥" },
  { id: "saude", label: "Saúde Geral", icon: "📡" },
  { id: "financeiro", label: "Financeiro", icon: "💎" },
];

const empireHealth = [
  { title: "Sistema", value: "92%", tone: "green" as Tone, detail: "APIs principais online" },
  { title: "UX", value: "78%", tone: "yellow" as Tone, detail: "Onboarding precisa atenção" },
  { title: "Agentes", value: "84%", tone: "blue" as Tone, detail: "2 fluxos com lentidão" },
  { title: "Financeiro", value: "+18%", tone: "pink" as Tone, detail: "Receita subindo no mês" },
];

const sitemapItems = [
  { area: "sualuma.online", path: "/", status: "Online", tone: "green" as Tone, response: "214ms" },
  { area: "sualuma.online", path: "/planos", status: "Online", tone: "green" as Tone, response: "298ms" },
  { area: "blog.sualuma.online", path: "/", status: "Online", tone: "green" as Tone, response: "344ms" },
  { area: "studio.sualuma.online", path: "/studio-lab", status: "Preview", tone: "blue" as Tone, response: "187ms" },
  { area: "trabalhosja.sualuma.online", path: "/comunidade", status: "Atenção", tone: "yellow" as Tone, response: "682ms" },
  { area: "sospublicidade.sualuma.online", path: "/obrigada", status: "Verificar", tone: "red" as Tone, response: "404?" },
];

const agents = [
  { name: "Mia Orquestradora", task: "Entende pedidos e chama agentes", status: "Ativo", roi: "Alto", tone: "pink" as Tone },
  { name: "Agente de Suporte", task: "Responde dúvidas e abre tickets", status: "Teste", roi: "Médio", tone: "blue" as Tone },
  { name: "Agente Sitemap", task: "Verifica páginas quebradas", status: "Novo", roi: "Alto", tone: "green" as Tone },
  { name: "Agente Serviços", task: "Monitora empresas e prestadores", status: "Rascunho", roi: "Médio", tone: "yellow" as Tone },
];

const serviceSignals = [
  { title: "Prestadores ativos", value: "42", detail: "8 precisam atualizar perfil", tone: "green" as Tone },
  { title: "Empresas contratando", value: "13", detail: "3 pararam no orçamento", tone: "pink" as Tone },
  { title: "Gargalos", value: "5", detail: "Briefing incompleto e atraso", tone: "yellow" as Tone },
  { title: "Contratações", value: "9", detail: "Nesta semana", tone: "blue" as Tone },
];

const communitySignals = [
  { title: "Posts criados", value: "128", detail: "Alta de 21%", tone: "pink" as Tone },
  { title: "Comentários", value: "746", detail: "Sentimento positivo", tone: "green" as Tone },
  { title: "Denúncias", value: "3", detail: "Revisar diretrizes", tone: "yellow" as Tone },
  { title: "Usuários com erro", value: "11", detail: "Login e upload", tone: "red" as Tone },
];

const ideaStore = [
  { idea: "Agente que monta proposta comercial", score: "Aplicar agora", impact: "Alto", effort: "Médio", tone: "green" as Tone },
  { idea: "Ranking de prestadores por entrega", score: "Aplicar depois", impact: "Médio", effort: "Alto", tone: "yellow" as Tone },
  { idea: "Resumo diário da Mia por WhatsApp", score: "Aplicar agora", impact: "Alto", effort: "Baixo", tone: "pink" as Tone },
  { idea: "Marketplace de templates", score: "Manter pensamento", impact: "Alto", effort: "Alto", tone: "blue" as Tone },
];

const users = [
  { name: "Ana Paula", email: "ana@email.com", plan: "Premium", last: "há 4 min", issue: "Sem erro", tone: "green" as Tone },
  { name: "Carlos Lima", email: "carlos@email.com", plan: "Free", last: "há 18 min", issue: "Login travou", tone: "yellow" as Tone },
  { name: "Marina Alves", email: "marina@email.com", plan: "Prime", last: "há 1h", issue: "Pagamento pendente", tone: "red" as Tone },
  { name: "João Pedro", email: "joao@email.com", plan: "Pro", last: "hoje", issue: "Sessão ativa", tone: "blue" as Tone },
];

const notifications = [
  { title: "Sitemap detectou possível 404", detail: "sospublicidade.sualuma.online/obrigada", tone: "red" as Tone },
  { title: "Mia encontrou gargalo no onboarding", detail: "Usuários abandonando depois do cadastro", tone: "yellow" as Tone },
  { title: "Agente Sitemap pode ser criado agora", detail: "Impacto alto para manutenção do império", tone: "green" as Tone },
  { title: "Receita do mês subiu", detail: "Financeiro aponta crescimento de 18%", tone: "pink" as Tone },
];

function ToneDot({ tone }: { tone: Tone }) {
  return <span className={`tone-dot ${tone}`} />;
}

function MetricCard({
  title,
  value,
  detail,
  tone,
}: {
  title: string;
  value: string;
  detail: string;
  tone: Tone;
}) {
  return (
    <div className={`metric-card ${tone}`}>
      <span className="metric-glow" />
      <small>{title}</small>
      <strong>{value}</strong>
      <p>{detail}</p>
      <div className="mini-line" />
    </div>
  );
}

function PanelTitle({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: string;
}) {
  return (
    <div className="panel-title">
      <div>
        <small>{eyebrow}</small>
        <h2>{title}</h2>
      </div>
      {action && <button>{action}</button>}
    </div>
  );
}

function DataRow({
  title,
  detail,
  value,
  tone,
}: {
  title: string;
  detail: string;
  value?: string;
  tone: Tone;
}) {
  return (
    <div className="data-row">
      <ToneDot tone={tone} />
      <div>
        <strong>{title}</strong>
        <p>{detail}</p>
      </div>
      {value && <em>{value}</em>}
    </div>
  );
}

export default function StudioLabPage() {
  const [activeView, setActiveView] = useState<StudioView>("visao");
  const [selectedAgent, setSelectedAgent] = useState(agents[0]);

  const currentTab = useMemo(() => tabs.find((tab) => tab.id === activeView) || tabs[0], [activeView]);

  return (
    <main className="lab-page">
      <aside className="lab-sidebar">
        <div className="lab-brand">
          <div className="brand-orb">S</div>
          <div>
            <strong>Studio Sualuma</strong>
            <span>Torre de Controle</span>
          </div>
        </div>

        <nav className="lab-menu">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={activeView === tab.id ? "active" : ""}
              onClick={() => setActiveView(tab.id)}
            >
              <span>{tab.icon}</span>
              <strong>{tab.label}</strong>
              {tab.badge && <em>{tab.badge}</em>}
            </button>
          ))}
        </nav>

        <div className="mia-card">
          <div className="mia-robot">
            <i />
            <b />
            <b />
          </div>
          <strong>Mia está observando</strong>
          <p>Ela enxerga erros, oportunidades, agentes, páginas e usuários.</p>
        </div>
      </aside>

      <section className="lab-workspace">
        <header className="lab-topbar">
          <div>
            <span className="top-pill">Versão laboratório</span>
            <h1>{currentTab.icon} {currentTab.label}</h1>
            <p>Uma visão de startup gigante para uma fundadora solo controlar o microSaaS inteiro.</p>
          </div>

          <div className="command-center">
            <div className="search-box">🔎 Pesquisar usuário, página, agente ou erro...</div>
            <button>+ Nova automação</button>
          </div>
        </header>

        {activeView === "visao" && (
          <>
            <section className="hero-grid">
              <div className="hero-panel">
                <PanelTitle
                  eyebrow="Cérebro operacional"
                  title="Seu império em tempo real"
                  action="Falar com a Mia"
                />

                <div className="empire-map">
                  <div className="core-orb">
                    <span>MIA</span>
                    <i />
                    <i />
                  </div>

                  {[
                    ["Sitemap", "🧬", "Online", "left-1"],
                    ["Agentes", "🤖", "9 ativos", "left-2"],
                    ["Serviços", "🧰", "5 gargalos", "left-3"],
                    ["Usuários", "👥", "3 alertas", "right-1"],
                    ["Comunidade", "💬", "Ativa", "right-2"],
                    ["Financeiro", "💎", "+18%", "right-3"],
                  ].map(([title, icon, status, pos]) => (
                    <button key={title} className={`orbit-node ${pos}`}>
                      <span>{icon}</span>
                      <strong>{title}</strong>
                      <small>{status}</small>
                    </button>
                  ))}
                </div>
              </div>

              <div className="side-stack">
                <div className="panel compact">
                  <PanelTitle eyebrow="Status" title="Saúde geral" />
                  <div className="health-ring">
                    <div>
                      <strong>87%</strong>
                      <span>Saudável</span>
                    </div>
                  </div>
                  <p className="muted">O sistema está bem, mas onboarding e páginas quebradas precisam revisão.</p>
                </div>

                <div className="panel compact">
                  <PanelTitle eyebrow="Sugestão da Mia" title="Próxima melhoria" />
                  <DataRow
                    title="Criar Agente Sitemap"
                    detail="Detectar páginas quebradas e alimentar notificações automaticamente."
                    value="alto impacto"
                    tone="green"
                  />
                </div>
              </div>
            </section>

            <section className="metric-grid">
              {empireHealth.map((item) => (
                <MetricCard key={item.title} {...item} />
              ))}
            </section>

            <section className="lower-grid">
              <div className="panel">
                <PanelTitle eyebrow="Alertas inteligentes" title="Notificações do império" action="Ver todas" />
                {notifications.map((item) => (
                  <DataRow key={item.title} title={item.title} detail={item.detail} tone={item.tone} />
                ))}
              </div>

              <div className="panel">
                <PanelTitle eyebrow="Malha de gráficos" title="Pulso do microSaaS" />
                <div className="pulse-chart">
                  <svg viewBox="0 0 700 240" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="pulseArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ff4fbd" stopOpacity=".55" />
                        <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0,190 C65,120 110,150 155,95 C210,30 260,115 305,82 C360,40 400,160 450,105 C510,42 560,70 610,38 C650,18 675,28 700,18 L700,240 L0,240 Z" fill="url(#pulseArea)" />
                    <path d="M0,190 C65,120 110,150 155,95 C210,30 260,115 305,82 C360,40 400,160 450,105 C510,42 560,70 610,38 C650,18 675,28 700,18" fill="none" stroke="#ff4fbd" strokeWidth="6" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </section>
          </>
        )}

        {activeView === "sitemap" && (
          <section className="panel full">
            <PanelTitle
              eyebrow="Raiz do site"
              title="Sitemap vivo por domínio e subdomínio"
              action="Verificar agora"
            />
            <div className="sitemap-grid">
              {sitemapItems.map((item) => (
                <div key={`${item.area}-${item.path}`} className={`site-card ${item.tone}`}>
                  <div>
                    <ToneDot tone={item.tone} />
                    <strong>{item.area}</strong>
                  </div>
                  <h3>{item.path}</h3>
                  <p>{item.status}</p>
                  <em>{item.response}</em>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeView === "mia" && (
          <section className="brain-layout">
            <div className="panel chat-panel">
              <PanelTitle eyebrow="Painel da Mia" title="Fale com o cérebro da operação" />
              <div className="chat-window">
                <div className="msg mia">Eu analisei o império e encontrei 3 pontos de atenção.</div>
                <div className="msg user">Mia, o que devo corrigir primeiro?</div>
                <div className="msg mia">Corrija o sitemap e o onboarding. Isso protege tráfego, conversão e suporte.</div>
              </div>
              <div className="chat-input">Pedir análise para a Mia...</div>
            </div>

            <div className="panel">
              <PanelTitle eyebrow="Mia trabalhando" title="Execuções internas" />
              {[
                ["Lendo logs do usuário", "2.4s", "blue" as Tone],
                ["Chamando agente de suporte", "4.1s", "pink" as Tone],
                ["Avaliando erro de login", "8.2s", "yellow" as Tone],
                ["Gerando sugestão de correção", "pronto", "green" as Tone],
              ].map(([title, value, tone]) => (
                <DataRow key={title} title={title} detail="Fluxo interno visível para otimização" value={value} tone={tone as Tone} />
              ))}
            </div>
          </section>
        )}

        {activeView === "agentes" && (
          <section className="brain-layout">
            <div className="panel">
              <PanelTitle eyebrow="Agentes e automações" title="Central de agentes" action="Criar agente" />
              <div className="agent-grid">
                {agents.map((agent) => (
                  <button
                    key={agent.name}
                    className={`agent-card ${selectedAgent.name === agent.name ? "selected" : ""} ${agent.tone}`}
                    onClick={() => setSelectedAgent(agent)}
                  >
                    <span>🤖</span>
                    <strong>{agent.name}</strong>
                    <p>{agent.task}</p>
                    <em>{agent.status}</em>
                  </button>
                ))}
              </div>
            </div>

            <div className="panel">
              <PanelTitle eyebrow="Diagnóstico" title={selectedAgent.name} />
              <DataRow title="Função" detail={selectedAgent.task} value={selectedAgent.status} tone={selectedAgent.tone} />
              <DataRow title="ROI estimado" detail="Quanto esse agente economiza tempo e melhora operação" value={selectedAgent.roi} tone="green" />
              <DataRow title="Próximo passo" detail="Criar logs reais e conectar Supabase depois" value="fase 2" tone="pink" />
            </div>
          </section>
        )}

        {activeView === "servicos" && (
          <section className="metric-grid">
            {serviceSignals.map((item) => (
              <MetricCard key={item.title} title={item.title} value={item.value} detail={item.detail} tone={item.tone} />
            ))}
          </section>
        )}

        {activeView === "comunidade" && (
          <section className="metric-grid">
            {communitySignals.map((item) => (
              <MetricCard key={item.title} title={item.title} value={item.value} detail={item.detail} tone={item.tone} />
            ))}
          </section>
        )}

        {activeView === "ideias" && (
          <section className="panel full">
            <PanelTitle eyebrow="Idea Store" title="Jogue ideias rápidas e deixe a Mia classificar" action="Nova ideia" />
            <div className="idea-list">
              {ideaStore.map((item) => (
                <div key={item.idea} className={`idea-card ${item.tone}`}>
                  <strong>{item.idea}</strong>
                  <p>{item.score}</p>
                  <div>
                    <span>Impacto: {item.impact}</span>
                    <span>Esforço: {item.effort}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeView === "usuarios" && (
          <section className="panel full">
            <PanelTitle eyebrow="Suporte e acesso" title="Monitoramento de usuários" action="Buscar usuário" />
            <div className="user-search">🔎 Pesquisar por nome, e-mail, ID, plano ou erro recente...</div>
            <div className="user-table">
              {users.map((user) => (
                <div key={user.email} className="user-row">
                  <ToneDot tone={user.tone} />
                  <div>
                    <strong>{user.name}</strong>
                    <p>{user.email}</p>
                  </div>
                  <span>{user.plan}</span>
                  <span>{user.last}</span>
                  <em>{user.issue}</em>
                  <button>Abrir</button>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeView === "saude" && (
          <section className="metric-grid">
            {[
              { title: "Saúde do sistema", value: "92%", detail: "Servidor e APIs principais online", tone: "green" as Tone },
              { title: "Saúde da UX", value: "78%", detail: "Cadastro bom, onboarding médio", tone: "yellow" as Tone },
              { title: "Saúde dos agentes", value: "84%", detail: "Mia ativa, 2 automações em teste", tone: "blue" as Tone },
              { title: "Saúde do suporte", value: "71%", detail: "11 usuários com erro recente", tone: "red" as Tone },
              { title: "Saúde da comunidade", value: "88%", detail: "Interação subindo", tone: "pink" as Tone },
              { title: "Saúde dos serviços", value: "76%", detail: "Empresas param no briefing", tone: "purple" as Tone },
            ].map((item) => (
              <MetricCard key={item.title} title={item.title} value={item.value} detail={item.detail} tone={item.tone} />
            ))}
          </section>
        )}

        {activeView === "financeiro" && (
          <section className="lower-grid">
            <div className="panel">
              <PanelTitle eyebrow="Financeiro" title="Resultado resumido" />
              <MetricCard title="Receita" value="R$ 48.750" detail="+18% vs mês anterior" tone="pink" />
              <MetricCard title="Lucro líquido" value="R$ 36.320" detail="Margem em crescimento" tone="green" />
            </div>
            <div className="panel">
              <PanelTitle eyebrow="Sinais" title="O que a Mia percebeu" />
              <DataRow title="Crescimento saudável" detail="Receita subiu com estabilidade nos leads." value="positivo" tone="green" />
              <DataRow title="Custo de suporte" detail="Pode cair com agente de dúvidas e onboarding." value="otimizar" tone="yellow" />
              <DataRow title="Próxima campanha" detail="Leads parados podem virar venda." value="sugerido" tone="pink" />
            </div>
          </section>
        )}
      </section>

      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #050611;
        }

        .lab-page {
          min-height: 100vh;
          display: flex;
          color: #fff;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          background:
            radial-gradient(circle at 48% 10%, rgba(255, 79, 189, .18), transparent 32%),
            radial-gradient(circle at 80% 30%, rgba(56, 189, 248, .11), transparent 28%),
            radial-gradient(circle at 10% 80%, rgba(124, 58, 237, .17), transparent 34%),
            #060713;
        }

        .lab-sidebar {
          width: 292px;
          padding: 24px 18px;
          min-height: 100vh;
          position: sticky;
          top: 0;
          border-right: 1px solid rgba(255,255,255,.08);
          background:
            linear-gradient(180deg, rgba(9, 11, 27, .96), rgba(5, 6, 17, .97)),
            radial-gradient(circle at 10% 20%, rgba(255, 79, 189, .18), transparent 28%);
        }

        .lab-brand {
          display: flex;
          align-items: center;
          gap: 13px;
          margin-bottom: 26px;
        }

        .brand-orb {
          width: 50px;
          height: 50px;
          border-radius: 18px;
          display: grid;
          place-items: center;
          font-weight: 950;
          background: linear-gradient(135deg, #ff4fbd, #7c3aed);
          box-shadow: 0 0 35px rgba(255,79,189,.45);
        }

        .lab-brand strong {
          display: block;
          font-size: 18px;
        }

        .lab-brand span {
          color: #ff9be6;
          font-size: 13px;
        }

        .lab-menu {
          display: grid;
          gap: 9px;
        }

        .lab-menu button {
          border: 0;
          width: 100%;
          color: rgba(255,255,255,.75);
          background: transparent;
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 13px 14px;
          border-radius: 15px;
          cursor: pointer;
          text-align: left;
          transition: .25s ease;
        }

        .lab-menu button:hover,
        .lab-menu button.active {
          color: #fff;
          background: linear-gradient(90deg, rgba(255,79,189,.25), rgba(124,58,237,.10));
          box-shadow: inset 3px 0 0 #ff4fbd, 0 0 30px rgba(255,79,189,.11);
        }

        .lab-menu strong {
          font-size: 14px;
          font-weight: 700;
        }

        .lab-menu em {
          margin-left: auto;
          font-style: normal;
          font-size: 11px;
          padding: 4px 8px;
          border-radius: 999px;
          background: #ff2e9f;
          color: #fff;
          box-shadow: 0 0 18px rgba(255,46,159,.55);
        }

        .mia-card,
        .panel,
        .hero-panel,
        .metric-card,
        .site-card,
        .agent-card,
        .idea-card {
          border: 1px solid rgba(255,255,255,.10);
          background: linear-gradient(180deg, rgba(255,255,255,.065), rgba(255,255,255,.025));
          box-shadow: 0 24px 80px rgba(0,0,0,.28);
          backdrop-filter: blur(24px);
        }

        .mia-card {
          margin-top: 28px;
          padding: 18px;
          border-radius: 24px;
          text-align: center;
        }

        .mia-robot {
          width: 112px;
          height: 92px;
          margin: 0 auto 14px;
          border-radius: 38px 38px 28px 28px;
          background: linear-gradient(180deg, #fff, #dce8ff);
          position: relative;
          box-shadow: 0 0 45px rgba(255,79,189,.32);
        }

        .mia-robot i {
          position: absolute;
          width: 8px;
          height: 24px;
          background: #fff;
          top: -16px;
          left: 52px;
          border-radius: 999px;
        }

        .mia-robot:before {
          content: "";
          position: absolute;
          left: 20px;
          right: 20px;
          top: 24px;
          height: 42px;
          border-radius: 999px;
          background: #11101d;
        }

        .mia-robot b {
          position: absolute;
          width: 13px;
          height: 13px;
          background: #ff4fbd;
          border-radius: 50%;
          top: 38px;
          z-index: 2;
          box-shadow: 0 0 18px #ff4fbd;
        }

        .mia-robot b:nth-child(2) {
          left: 40px;
        }

        .mia-robot b:nth-child(3) {
          right: 40px;
        }

        .mia-card strong {
          display: block;
        }

        .mia-card p {
          color: rgba(255,255,255,.58);
          font-size: 13px;
          line-height: 1.45;
        }

        .lab-workspace {
          width: calc(100% - 292px);
          padding: 26px;
        }

        .lab-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 22px;
        }

        .top-pill {
          display: inline-flex;
          margin-bottom: 10px;
          padding: 7px 11px;
          border-radius: 999px;
          color: #ff9be6;
          background: rgba(255,79,189,.10);
          border: 1px solid rgba(255,79,189,.24);
          font-size: 12px;
        }

        .lab-topbar h1 {
          margin: 0;
          font-size: 32px;
          letter-spacing: -.04em;
        }

        .lab-topbar p {
          margin: 6px 0 0;
          color: rgba(255,255,255,.62);
        }

        .command-center {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .search-box {
          width: 390px;
          max-width: 100%;
          padding: 14px 16px;
          border-radius: 17px;
          color: rgba(255,255,255,.55);
          border: 1px solid rgba(255,79,189,.24);
          background: rgba(255,255,255,.045);
        }

        .command-center button,
        .panel-title button,
        .user-row button {
          border: 1px solid rgba(255,79,189,.36);
          color: #fff;
          background: linear-gradient(135deg, rgba(255,79,189,.38), rgba(124,58,237,.28));
          border-radius: 15px;
          padding: 13px 16px;
          cursor: pointer;
          box-shadow: 0 0 30px rgba(255,79,189,.16);
        }

        .hero-grid {
          display: grid;
          grid-template-columns: 1.9fr .8fr;
          gap: 18px;
        }

        .hero-panel,
        .panel {
          border-radius: 28px;
          padding: 22px;
        }

        .panel-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
        }

        .panel-title small {
          color: #ff9be6;
          text-transform: uppercase;
          letter-spacing: .11em;
          font-size: 11px;
          font-weight: 800;
        }

        .panel-title h2 {
          margin: 5px 0 0;
          font-size: 23px;
          letter-spacing: -.03em;
        }

        .empire-map {
          height: 520px;
          position: relative;
          overflow: hidden;
          border-radius: 26px;
          background:
            radial-gradient(circle at 50% 50%, rgba(255,79,189,.22), transparent 28%),
            radial-gradient(circle at 50% 50%, rgba(56,189,248,.12), transparent 46%),
            rgba(255,255,255,.02);
        }

        .empire-map:before {
          content: "";
          position: absolute;
          inset: 12%;
          border-radius: 50%;
          border: 1px dashed rgba(255,79,189,.24);
          box-shadow: 0 0 80px rgba(255,79,189,.10);
        }

        .empire-map:after {
          content: "";
          position: absolute;
          inset: 26%;
          border-radius: 50%;
          border: 1px dashed rgba(56,189,248,.18);
        }

        .core-orb {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 190px;
          height: 190px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background:
            radial-gradient(circle, rgba(255,255,255,.20), transparent 34%),
            conic-gradient(from 180deg, #ff4fbd, #38bdf8, #7c3aed, #ff4fbd);
          box-shadow: 0 0 70px rgba(255,79,189,.56);
          animation: pulseCore 4s ease-in-out infinite;
        }

        .core-orb span {
          font-size: 36px;
          font-weight: 950;
          text-shadow: 0 0 25px rgba(0,0,0,.5);
        }

        .core-orb i {
          position: absolute;
          width: 13px;
          height: 13px;
          background: #ff9be6;
          top: 72px;
          border-radius: 50%;
          box-shadow: 0 0 18px #ff4fbd;
        }

        .core-orb i:nth-child(2) {
          left: 68px;
        }

        .core-orb i:nth-child(3) {
          right: 68px;
        }

        @keyframes pulseCore {
          0%, 100% { filter: saturate(1); transform: translate(-50%, -50%) scale(1); }
          50% { filter: saturate(1.25); transform: translate(-50%, -50%) scale(1.03); }
        }

        .orbit-node {
          position: absolute;
          width: 165px;
          min-height: 94px;
          border: 1px solid rgba(255,255,255,.11);
          color: #fff;
          border-radius: 20px;
          background: rgba(9,10,25,.78);
          display: grid;
          gap: 4px;
          place-items: center;
          cursor: pointer;
          box-shadow: 0 0 34px rgba(255,79,189,.14);
        }

        .orbit-node span {
          font-size: 25px;
        }

        .orbit-node small {
          color: #ff9be6;
        }

        .left-1 { left: 12%; top: 12%; }
        .left-2 { left: 6%; top: 42%; }
        .left-3 { left: 17%; bottom: 10%; }
        .right-1 { right: 12%; top: 12%; }
        .right-2 { right: 6%; top: 42%; }
        .right-3 { right: 17%; bottom: 10%; }

        .side-stack {
          display: grid;
          gap: 18px;
        }

        .compact {
          min-height: 240px;
        }

        .health-ring {
          width: 160px;
          height: 160px;
          margin: 8px auto 16px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: conic-gradient(#ff4fbd 0 87%, rgba(255,255,255,.08) 87% 100%);
          box-shadow: 0 0 45px rgba(255,79,189,.28);
        }

        .health-ring div {
          width: 118px;
          height: 118px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: #080918;
        }

        .health-ring strong {
          font-size: 31px;
          margin-top: 20px;
        }

        .health-ring span {
          color: rgba(255,255,255,.58);
          margin-top: -24px;
        }

        .muted {
          color: rgba(255,255,255,.58);
          line-height: 1.5;
        }

        .metric-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-top: 18px;
        }

        .metric-card {
          min-height: 178px;
          border-radius: 24px;
          padding: 18px;
          position: relative;
          overflow: hidden;
        }

        .metric-glow {
          position: absolute;
          right: -40px;
          top: -40px;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: currentColor;
          filter: blur(40px);
          opacity: .18;
        }

        .metric-card small,
        .site-card p,
        .data-row p,
        .agent-card p,
        .idea-card p {
          color: rgba(255,255,255,.58);
        }

        .metric-card strong {
          display: block;
          font-size: 36px;
          margin: 12px 0 6px;
          letter-spacing: -.05em;
        }

        .metric-card p {
          margin: 0;
          color: rgba(255,255,255,.62);
        }

        .pink { color: #ff4fbd; }
        .blue { color: #38bdf8; }
        .green { color: #22c55e; }
        .yellow { color: #facc15; }
        .red { color: #fb395f; }
        .purple { color: #a855f7; }

        .metric-card.pink,
        .site-card.pink,
        .agent-card.pink,
        .idea-card.pink { border-color: rgba(255,79,189,.35); }

        .metric-card.blue,
        .site-card.blue,
        .agent-card.blue,
        .idea-card.blue { border-color: rgba(56,189,248,.34); }

        .metric-card.green,
        .site-card.green,
        .agent-card.green,
        .idea-card.green { border-color: rgba(34,197,94,.34); }

        .metric-card.yellow,
        .site-card.yellow,
        .agent-card.yellow,
        .idea-card.yellow { border-color: rgba(250,204,21,.35); }

        .metric-card.red,
        .site-card.red,
        .agent-card.red,
        .idea-card.red { border-color: rgba(251,57,95,.36); }

        .metric-card.purple,
        .site-card.purple,
        .agent-card.purple,
        .idea-card.purple { border-color: rgba(168,85,247,.36); }

        .mini-line {
          height: 34px;
          margin-top: 16px;
          background:
            linear-gradient(135deg, transparent 30%, currentColor 31%, transparent 34%),
            linear-gradient(45deg, transparent 48%, currentColor 49%, transparent 52%);
          opacity: .7;
        }

        .lower-grid,
        .brain-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
          margin-top: 18px;
        }

        .full {
          min-height: 650px;
        }

        .sitemap-grid,
        .agent-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }

        .site-card,
        .agent-card,
        .idea-card {
          border-radius: 22px;
          padding: 18px;
        }

        .site-card div {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .site-card h3 {
          font-size: 22px;
          margin: 15px 0 8px;
        }

        .site-card em {
          font-style: normal;
          color: rgba(255,255,255,.66);
        }

        .tone-dot {
          width: 11px;
          height: 11px;
          border-radius: 50%;
          display: inline-block;
          background: currentColor;
          box-shadow: 0 0 16px currentColor;
          flex: 0 0 auto;
        }

        .data-row {
          display: grid;
          grid-template-columns: 18px 1fr auto;
          align-items: center;
          gap: 12px;
          padding: 14px 0;
          border-bottom: 1px solid rgba(255,255,255,.07);
        }

        .data-row strong {
          display: block;
        }

        .data-row p {
          margin: 4px 0 0;
          font-size: 13px;
        }

        .data-row em {
          font-style: normal;
          color: #ff9be6;
          font-size: 12px;
          white-space: nowrap;
        }

        .pulse-chart {
          height: 270px;
          border-radius: 22px;
          background: rgba(255,255,255,.03);
          border: 1px solid rgba(255,255,255,.07);
          overflow: hidden;
        }

        .pulse-chart svg {
          width: 100%;
          height: 100%;
        }

        .chat-window {
          height: 360px;
          padding: 16px;
          border-radius: 22px;
          background: rgba(255,255,255,.035);
          border: 1px solid rgba(255,255,255,.08);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .msg {
          max-width: 82%;
          padding: 13px 15px;
          border-radius: 18px;
          line-height: 1.45;
          font-size: 14px;
        }

        .msg.mia {
          background: rgba(255,79,189,.13);
          border: 1px solid rgba(255,79,189,.20);
        }

        .msg.user {
          margin-left: auto;
          background: rgba(56,189,248,.12);
          border: 1px solid rgba(56,189,248,.20);
        }

        .chat-input,
        .user-search {
          margin-top: 14px;
          padding: 15px 16px;
          border-radius: 16px;
          color: rgba(255,255,255,.50);
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.09);
        }

        .agent-card {
          color: #fff;
          text-align: left;
          cursor: pointer;
          min-height: 170px;
        }

        .agent-card.selected {
          box-shadow: 0 0 38px rgba(255,79,189,.28);
          transform: translateY(-2px);
        }

        .agent-card span {
          font-size: 25px;
        }

        .agent-card strong {
          display: block;
          margin: 10px 0 6px;
        }

        .agent-card em {
          font-style: normal;
          color: #ff9be6;
        }

        .idea-list {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }

        .idea-card strong {
          font-size: 18px;
        }

        .idea-card div {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .idea-card span {
          color: rgba(255,255,255,.70);
          padding: 8px 10px;
          border-radius: 999px;
          background: rgba(255,255,255,.06);
          font-size: 12px;
        }

        .user-table {
          margin-top: 16px;
          display: grid;
          gap: 10px;
        }

        .user-row {
          display: grid;
          grid-template-columns: 20px 1.4fr .7fr .7fr 1fr auto;
          align-items: center;
          gap: 14px;
          padding: 14px;
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,.08);
          background: rgba(255,255,255,.035);
        }

        .user-row p {
          margin: 3px 0 0;
          color: rgba(255,255,255,.55);
          font-size: 13px;
        }

        .user-row span {
          color: rgba(255,255,255,.72);
        }

        .user-row em {
          font-style: normal;
          color: #ff9be6;
        }

        @media (max-width: 1280px) {
          .hero-grid,
          .lower-grid,
          .brain-layout {
            grid-template-columns: 1fr;
          }

          .metric-grid,
          .sitemap-grid,
          .agent-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .lab-topbar {
            align-items: flex-start;
            flex-direction: column;
          }

          .command-center {
            width: 100%;
            flex-wrap: wrap;
          }

          .search-box {
            width: 100%;
          }
        }

        @media (max-width: 880px) {
          .lab-page {
            display: block;
          }

          .lab-sidebar {
            width: 100%;
            min-height: auto;
            position: relative;
          }

          .lab-workspace {
            width: 100%;
            padding: 16px;
          }

          .metric-grid,
          .sitemap-grid,
          .agent-grid,
          .idea-list {
            grid-template-columns: 1fr;
          }

          .empire-map {
            height: 760px;
          }

          .orbit-node {
            width: 145px;
          }

          .left-1 { left: 8%; top: 6%; }
          .right-1 { right: 8%; top: 6%; }
          .left-2 { left: 8%; top: 35%; }
          .right-2 { right: 8%; top: 35%; }
          .left-3 { left: 8%; bottom: 6%; }
          .right-3 { right: 8%; bottom: 6%; }

          .user-row {
            grid-template-columns: 20px 1fr;
          }
        }
      `}</style>
    </main>
  );
}
