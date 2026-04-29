"use client";

import { useMemo, useState } from "react";

type JourneyStatus = "ativo" | "andamento" | "risco" | "alerta";

type JourneyNode = {
  id: string;
  title: string;
  icon: string;
  status: JourneyStatus;
  position: {
    left: string;
    top: string;
  };
  steps: string[];
  description: string;
};

const statusLabel: Record<JourneyStatus, string> = {
  ativo: "Ativo",
  andamento: "Em andamento",
  risco: "Em risco",
  alerta: "Alerta",
};

const statusClass: Record<JourneyStatus, string> = {
  ativo: "status-pink",
  andamento: "status-green",
  risco: "status-red",
  alerta: "status-yellow",
};

const nodes: JourneyNode[] = [
  {
    id: "entrada",
    title: "Entrada do usuário",
    icon: "👤",
    status: "ativo",
    position: { left: "15%", top: "7%" },
    steps: ["Viu conteúdo", "Clicou no link", "Chegou na home"],
    description: "Mostra por onde o usuário chega antes de conhecer o ecossistema Sualuma.",
  },
  {
    id: "home",
    title: "Home",
    icon: "🏠",
    status: "ativo",
    position: { left: "48%", top: "4%" },
    steps: ["Acessa a home", "Lê a promessa", "Escolhe uma ação"],
    description: "Primeiro contato real com a plataforma, promessa principal e caminhos de entrada.",
  },
  {
    id: "cadastro",
    title: "Cadastro/Login",
    icon: "🔐",
    status: "ativo",
    position: { left: "10%", top: "25%" },
    steps: ["Clica em entrar", "Cria conta", "Confirma acesso"],
    description: "Fluxo de autenticação, cadastro, login e possíveis limites de acesso.",
  },
  {
    id: "onboarding",
    title: "Onboarding",
    icon: "🤖",
    status: "andamento",
    position: { left: "8%", top: "42%" },
    steps: ["Boas-vindas", "Tour guiado", "Primeira ação", "Usuário pronto"],
    description: "Explica o que acontece depois do cadastro e como o usuário aprende a usar.",
  },
  {
    id: "suporte",
    title: "Dúvida/Suporte",
    icon: "🎧",
    status: "ativo",
    position: { left: "10%", top: "60%" },
    steps: ["Abriu dúvida", "IA responde", "Ticket criado", "Resolvido"],
    description: "Mostra o caminho quando o usuário tem uma dúvida ou precisa de atendimento.",
  },
  {
    id: "email",
    title: "E-mail enviado?",
    icon: "✉️",
    status: "alerta",
    position: { left: "29%", top: "73%" },
    steps: ["Evento disparado", "E-mail preparado", "Envio validado", "Entrega monitorada"],
    description: "Confere se o usuário recebeu o e-mail certo depois de cada ação importante.",
  },
  {
    id: "compra",
    title: "Compra",
    icon: "🛒",
    status: "ativo",
    position: { left: "76%", top: "9%" },
    steps: ["Carrinho aberto", "Pagamento iniciado", "Pagamento concluído", "Confirmação enviada"],
    description: "Acompanha o caminho completo de compra, pagamento e confirmação.",
  },
  {
    id: "indicacao",
    title: "Indicação",
    icon: "👥",
    status: "andamento",
    position: { left: "72%", top: "31%" },
    steps: ["Usuário indica", "Link rastreado", "Novo lead entra", "Recompensa registrada"],
    description: "Mostra o que acontece quando alguém indica a plataforma para outra pessoa.",
  },
  {
    id: "prestador",
    title: "Prestador de serviço",
    icon: "🧰",
    status: "andamento",
    position: { left: "73%", top: "48%" },
    steps: ["Entra na área", "Completa perfil", "Ativa serviços", "Recebe oportunidades"],
    description: "Fluxo para transformar um usuário em prestador dentro da plataforma.",
  },
  {
    id: "empresa",
    title: "Empresa cria proposta",
    icon: "📄",
    status: "alerta",
    position: { left: "74%", top: "65%" },
    steps: ["Empresa entra", "Publica demanda", "Recebe propostas", "Escolhe profissional"],
    description: "Mostra como uma empresa consegue criar uma proposta ou contratar serviços.",
  },
  {
    id: "contratacao",
    title: "Contratação",
    icon: "✅",
    status: "ativo",
    position: { left: "56%", top: "76%" },
    steps: ["Proposta aceita", "Pagamento combinado", "Projeto iniciado", "Entrega acompanhada"],
    description: "Acompanha o momento em que uma contratação acontece dentro do ecossistema.",
  },
  {
    id: "retencao",
    title: "Retenção",
    icon: "💗",
    status: "ativo",
    position: { left: "77%", top: "82%" },
    steps: ["Usuário volta", "Recebe novidades", "Gera novo valor", "Continua ativo"],
    description: "Mostra o que mantém o usuário voltando, comprando e usando a plataforma.",
  },
];

const priorityCards = [
  { label: "Em andamento", value: "18", hint: "Jornadas", tone: "green", icon: "🟢" },
  { label: "Em risco", value: "07", hint: "Jornadas", tone: "red", icon: "⚠️" },
  { label: "Parados", value: "05", hint: "Jornadas", tone: "yellow", icon: "⏸️" },
  { label: "Ativos", value: "26", hint: "Jornadas", tone: "pink", icon: "⚡" },
];

const notifications = [
  { icon: "🛒", title: "A jornada Compra está com alta conversão! 🎉", text: "Sua taxa subiu nas últimas 24h.", time: "há 5 min", tone: "pink" },
  { icon: "⚠️", title: "Atenção: 3 jornadas em risco", text: "Onboarding, E-mail e Retenção precisam de atenção.", time: "há 15 min", tone: "red" },
  { icon: "🤖", title: "Novo insight disponível", text: "A IA encontrou melhoria no Cadastro/Login.", time: "há 32 min", tone: "green" },
  { icon: "⭐", title: "Meta semanal quase batida! 🔥", text: "Você está a 8% de alcançar sua meta.", time: "há 1h", tone: "yellow" },
];

export default function StudioPage() {
  const [selectedNode, setSelectedNode] = useState<JourneyNode>(nodes[6]);

  const activePath = useMemo(() => {
    return selectedNode.steps.join(" → ");
  }, [selectedNode]);

  return (
    <main className="studio-page">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">✦</div>
          <div>
            <strong>UX • JORNADA</strong>
            <span>do Usuário</span>
          </div>
        </div>

        <nav className="menu">
          {[
            ["🏠", "Visão Geral", false],
            ["🌳", "Árvore da Jornada", true],
            ["⚙️", "Prioridades", false],
            ["✨", "Insights", false],
            ["🔔", "Notificações", false],
            ["💳", "Financeiro", false],
            ["🔁", "Automações", false],
            ["📊", "Relatórios", false],
            ["⚙️", "Configurações", false],
          ].map(([icon, label, active]) => (
            <button key={String(label)} className={`menu-item ${active ? "active" : ""}`}>
              <span>{icon}</span>
              <strong>{label}</strong>
              {label === "Notificações" && <em>8</em>}
              {label === "Insights" && <small>Novo</small>}
            </button>
          ))}
        </nav>

        <div className="assistant-card">
          <div className="assistant-title">
            <span>🌸</span>
            <div>
              <strong>Assistente IA</strong>
              <small>Seu robozinho estratégico</small>
            </div>
          </div>
          <div className="mini-robot">
            <div className="robot-head">
              <i />
              <i />
            </div>
          </div>
        </div>

        <div className="profile-card">
          <div className="avatar">L</div>
          <div>
            <strong>Luma</strong>
            <span>Plano Premium 👑</span>
          </div>
          <b>⋮</b>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <h1>Olá, Luma! 👋</h1>
            <p>Aqui está o mapa da jornada dos seus usuários.</p>
          </div>

          <div className="top-robot-wrap">
            <div className="top-robot">
              <div className="antenna" />
              <div className="top-robot-face">
                <span />
                <span />
              </div>
            </div>
            <div className="robot-bubble">
              <strong>Tudo sob controle!</strong>
              <p>Sua árvore está linda e sua jornada fluindo bem. ✨</p>
            </div>
          </div>

          <div className="top-actions">
            <div className="search">🔎 Buscar na jornada... <kbd>⌘ K</kbd></div>
            <button className="circle-btn">🔔<em>8</em></button>
            <button className="circle-btn">✦</button>
          </div>
        </header>

        <section className="tree-card">
          <div className="tree-header">
            <div>
              <h2>UX • Jornada do Usuário</h2>
              <p>Clique em uma etapa da árvore para abrir o fluxo.</p>
            </div>
            <button>Abrir minha empresa</button>
          </div>

          <div className="tree-stage">
            <svg className="branch-svg" viewBox="0 0 1000 630" preserveAspectRatio="none">
              <defs>
                <linearGradient id="branchGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#ff4fbd" />
                  <stop offset="45%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Galhos conectados diretamente nas caixinhas */}
              <path className="branch branch-entrada" d="M500 320 C420 215 285 95 150 44" />
              <path className="branch branch-home" d="M500 245 C500 160 492 82 480 25" />
              <path className="branch branch-cadastro" d="M500 355 C385 290 245 190 100 158" />
              <path className="branch branch-onboarding" d="M500 405 C380 365 230 292 80 265" />
              <path className="branch branch-suporte" d="M500 465 C370 455 245 390 100 378" />
              <path className="branch branch-email" d="M500 520 C430 525 355 485 290 460" />
              <path className="branch branch-compra" d="M500 300 C600 190 675 85 760 57" />
              <path className="branch branch-indicacao" d="M500 365 C585 305 645 220 720 195" />
              <path className="branch branch-prestador" d="M500 425 C595 405 655 320 730 302" />
              <path className="branch branch-empresa" d="M500 485 C615 485 680 425 740 410" />
              <path className="branch branch-contratacao" d="M500 540 C520 515 540 495 560 479" />
              <path className="branch branch-retencao" d="M500 545 C610 560 705 535 770 517" />

              {/* pontinhos de conexão nos cards */}
              <circle cx="150" cy="44" r="7" />
              <circle cx="480" cy="25" r="7" />
              <circle cx="100" cy="158" r="7" />
              <circle cx="80" cy="265" r="7" />
              <circle cx="100" cy="378" r="7" />
              <circle cx="290" cy="460" r="7" />
              <circle cx="760" cy="57" r="7" />
              <circle cx="720" cy="195" r="7" />
              <circle cx="730" cy="302" r="7" />
              <circle cx="740" cy="410" r="7" />
              <circle cx="560" cy="479" r="7" />
              <circle cx="770" cy="517" r="7" />
            </svg>

            <div className="magic-tree">
              <div className="trunk-glow" />
              <div className="face">
                <span className="eye left" />
                <span className="eye right" />
                <span className="mouth" />
              </div>
              <div className="speech speech-one">Tá tudo bem? 😊</div>
              <div className="speech speech-two">Vamos ver tal área? 👀</div>
            </div>

            {nodes.map((node) => (
              <button
                key={node.id}
                onClick={() => setSelectedNode(node)}
                className={`journey-node ${statusClass[node.status]} ${selectedNode.id === node.id ? "selected" : ""}`}
                style={{ left: node.position.left, top: node.position.top }}
              >
                <span className="leaf leaf-a" />
                <span className="leaf leaf-b" />
                <span className="node-icon">{node.icon}</span>
                <strong>{node.title}</strong>
                <small>
                  <i /> {statusLabel[node.status]}
                </small>
              </button>
            ))}

            <div className={`flow-popup ${statusClass[selectedNode.status]}`}>
              <button className="close" onClick={() => setSelectedNode(nodes[6])}>×</button>
              <div className="popup-icon">{selectedNode.icon}</div>
              <h3>{selectedNode.title}</h3>
              <p>{selectedNode.description}</p>

              <div className="flow-path">{activePath}</div>

              <div className="timeline">
                {selectedNode.steps.map((step, index) => (
                  <div key={step} className={index === selectedNode.steps.length - 1 ? "done" : ""}>
                    <span>{index + 1}</span>
                    <strong>{step}</strong>
                    <small>{index === selectedNode.steps.length - 1 ? "Concluído" : "Mapeado"}</small>
                  </div>
                ))}
              </div>

              <button className="details-btn">Ver detalhes do fluxo →</button>
            </div>
          </div>
        </section>

        <section className="bottom-grid">
          <div className="panel priorities">
            <div className="panel-title">
              <h3>PRIORIDADES</h3>
              <a>Ver todas →</a>
            </div>
            <div className="priority-grid">
              {priorityCards.map((card) => (
                <button key={card.label} className={`priority-card ${card.tone}`}>
                  <span>{card.icon}</span>
                  <small>{card.label}</small>
                  <strong>{card.value}</strong>
                  <p>{card.hint}</p>
                  <div className="sparkline" />
                </button>
              ))}
            </div>
          </div>

          <div className="panel overview">
            <div className="panel-title">
              <h3>VISÃO GERAL</h3>
              <button>Últimos 30 dias⌄</button>
            </div>
            <div className="metric-row">
              <div><small>Usuários ativos</small><strong>12.842</strong><em>↑ 18,4%</em></div>
              <div><small>Conversão geral</small><strong>24,7%</strong><em>↑ 6,3%</em></div>
              <div><small>Jornadas concluídas</small><strong>8.921</strong><em>↑ 15,7%</em></div>
              <div><small>Satisfação</small><strong>8,6</strong><em>↑ 0,9</em></div>
            </div>
            <div className="chart">
              <svg viewBox="0 0 600 170" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff4fbd" stopOpacity=".55" />
                    <stop offset="100%" stopColor="#ff4fbd" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,140 C60,135 80,55 135,75 C190,95 205,125 260,90 C320,50 350,130 410,88 C465,48 500,45 600,25 L600,170 L0,170 Z" fill="url(#area)" />
                <path d="M0,140 C60,135 80,55 135,75 C190,95 205,125 260,90 C320,50 350,130 410,88 C465,48 500,45 600,25" fill="none" stroke="#ff4fbd" strokeWidth="5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          <div className="panel notifications">
            <div className="panel-title">
              <h3>NOTIFICAÇÕES</h3>
              <a>Ver todas</a>
            </div>
            {notifications.map((item) => (
              <div key={item.title} className={`notification ${item.tone}`}>
                <span>{item.icon}</span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.text}</p>
                </div>
                <small>{item.time}</small>
              </div>
            ))}
          </div>

          <div className="panel finance">
            <div className="panel-title">
              <h3>FINANÇAS</h3>
              <button>Este mês⌄</button>
            </div>
            <div className="money-block">
              <small>Receita</small>
              <strong>R$ 48.750,00</strong>
              <em>↑ 16,8% vs mês anterior</em>
              <div className="money-line pink" />
            </div>
            <div className="money-block">
              <small>Despesas</small>
              <strong>R$ 12.430,00</strong>
              <em className="down">↓ 4,3% vs mês anterior</em>
              <div className="money-line blue" />
            </div>
            <div className="money-block">
              <small>Lucro líquido</small>
              <strong>R$ 36.320,00</strong>
              <em>↑ 22,1% vs mês anterior</em>
              <div className="money-line pink" />
            </div>
            <a>Ver relatório financeiro →</a>
          </div>
        </section>
      </section>

      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #060713;
        }

        .studio-page {
          min-height: 100vh;
          display: flex;
          color: #fff;
          background:
            radial-gradient(circle at 50% 25%, rgba(255, 79, 189, .16), transparent 34%),
            radial-gradient(circle at 80% 18%, rgba(56, 189, 248, .10), transparent 24%),
            radial-gradient(circle at 15% 82%, rgba(168, 85, 247, .14), transparent 30%),
            #070814;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          overflow-x: hidden;
        }

        .sidebar {
          width: 285px;
          min-height: 100vh;
          padding: 26px 18px;
          border-right: 1px solid rgba(255, 255, 255, .08);
          background:
            linear-gradient(180deg, rgba(11, 13, 31, .96), rgba(7, 8, 20, .95)),
            radial-gradient(circle at 0% 20%, rgba(255, 79, 189, .18), transparent 28%);
          position: sticky;
          top: 0;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 34px;
        }

        .brand-mark {
          width: 48px;
          height: 48px;
          border-radius: 18px;
          display: grid;
          place-items: center;
          color: #ff67c8;
          font-size: 28px;
          background: rgba(255, 79, 189, .12);
          box-shadow: 0 0 35px rgba(255, 79, 189, .38);
        }

        .brand strong {
          display: block;
          font-size: 19px;
          letter-spacing: .02em;
        }

        .brand span {
          color: #ff92dc;
          font-size: 15px;
        }

        .menu {
          display: grid;
          gap: 10px;
        }

        .menu-item {
          width: 100%;
          border: 0;
          color: rgba(255, 255, 255, .78);
          background: transparent;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 15px;
          border-radius: 14px;
          cursor: pointer;
          text-align: left;
          position: relative;
          transition: .25s ease;
        }

        .menu-item strong {
          font-size: 15px;
          font-weight: 650;
        }

        .menu-item:hover,
        .menu-item.active {
          color: #fff;
          background: linear-gradient(90deg, rgba(255, 79, 189, .24), rgba(168, 85, 247, .08));
          box-shadow: inset 3px 0 0 #ff4fbd, 0 0 25px rgba(255, 79, 189, .12);
        }

        .menu-item em,
        .menu-item small {
          margin-left: auto;
          font-style: normal;
          font-size: 12px;
          color: #fff;
          border-radius: 999px;
          padding: 4px 8px;
          background: #ff2e9f;
          box-shadow: 0 0 18px rgba(255, 46, 159, .55);
        }

        .menu-item small {
          background: rgba(168, 85, 247, .35);
          color: #e9d5ff;
        }

        .assistant-card,
        .profile-card,
        .panel,
        .tree-card {
          border: 1px solid rgba(255, 255, 255, .10);
          background: linear-gradient(180deg, rgba(255, 255, 255, .055), rgba(255, 255, 255, .025));
          box-shadow: 0 18px 70px rgba(0, 0, 0, .28);
          backdrop-filter: blur(22px);
        }

        .assistant-card {
          margin-top: 58px;
          padding: 16px;
          border-radius: 22px;
        }

        .assistant-title {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .assistant-title strong,
        .profile-card strong {
          display: block;
        }

        .assistant-title small,
        .profile-card span {
          display: block;
          color: rgba(255, 255, 255, .55);
          font-size: 12px;
          margin-top: 3px;
        }

        .mini-robot {
          height: 130px;
          display: grid;
          place-items: end center;
          overflow: hidden;
        }

        .robot-head {
          width: 118px;
          height: 92px;
          border-radius: 38px 38px 26px 26px;
          background: linear-gradient(180deg, #fff, #dbeafe);
          position: relative;
          box-shadow: 0 0 55px rgba(255, 79, 189, .32);
        }

        .robot-head:before {
          content: "";
          position: absolute;
          width: 76px;
          height: 42px;
          border-radius: 999px;
          background: #10101d;
          left: 21px;
          top: 25px;
        }

        .robot-head i {
          position: absolute;
          width: 14px;
          height: 14px;
          background: #ff4fbd;
          border-radius: 50%;
          top: 39px;
          z-index: 1;
          box-shadow: 0 0 16px #ff4fbd;
        }

        .robot-head i:first-child {
          left: 42px;
        }

        .robot-head i:last-child {
          right: 42px;
        }

        .profile-card {
          margin-top: 16px;
          padding: 14px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .profile-card b {
          margin-left: auto;
          color: rgba(255, 255, 255, .55);
        }

        .avatar {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          font-weight: 900;
          background: linear-gradient(135deg, #ff4fbd, #7c3aed);
          box-shadow: 0 0 25px rgba(255, 79, 189, .45);
        }

        .workspace {
          width: calc(100% - 285px);
          padding: 24px;
        }

        .topbar {
          min-height: 92px;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 20px;
        }

        .topbar h1 {
          margin: 0;
          font-size: 26px;
        }

        .topbar p {
          margin: 5px 0 0;
          color: rgba(255, 255, 255, .62);
        }

        .top-robot-wrap {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .top-robot {
          width: 86px;
          height: 76px;
          position: relative;
        }

        .antenna {
          width: 9px;
          height: 22px;
          background: #fff;
          position: absolute;
          left: 38px;
          top: -10px;
          border-radius: 999px;
        }

        .antenna:before {
          content: "";
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #ff4fbd;
          position: absolute;
          top: -10px;
          left: -2.5px;
          box-shadow: 0 0 18px #ff4fbd;
        }

        .top-robot-face {
          position: absolute;
          inset: 10px 4px 0;
          border-radius: 30px;
          background: linear-gradient(180deg, #fff, #dce8ff);
          box-shadow: 0 0 40px rgba(255, 79, 189, .35);
        }

        .top-robot-face:before {
          content: "";
          position: absolute;
          left: 16px;
          right: 16px;
          top: 20px;
          height: 33px;
          border-radius: 999px;
          background: #11101b;
        }

        .top-robot-face span {
          width: 10px;
          height: 10px;
          background: #ff4fbd;
          border-radius: 50%;
          position: absolute;
          top: 31px;
          z-index: 2;
          box-shadow: 0 0 18px #ff4fbd;
        }

        .top-robot-face span:first-child {
          left: 31px;
        }

        .top-robot-face span:last-child {
          right: 31px;
        }

        .robot-bubble {
          min-width: 245px;
          padding: 14px 16px;
          border-radius: 16px;
          background: rgba(255, 255, 255, .055);
          border: 1px solid rgba(255, 79, 189, .28);
          box-shadow: 0 0 28px rgba(255, 79, 189, .12);
        }

        .robot-bubble strong {
          font-size: 14px;
        }

        .robot-bubble p {
          margin: 4px 0 0;
          font-size: 13px;
        }

        .top-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          align-items: center;
        }

        .search {
          width: 330px;
          max-width: 100%;
          height: 46px;
          border-radius: 16px;
          border: 1px solid rgba(255, 79, 189, .25);
          background: rgba(255, 255, 255, .045);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 14px;
          color: rgba(255, 255, 255, .55);
        }

        kbd {
          color: #fff;
          background: rgba(255, 255, 255, .08);
          border-radius: 8px;
          padding: 4px 7px;
        }

        .circle-btn {
          position: relative;
          width: 46px;
          height: 46px;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, .10);
          color: #fff;
          background: rgba(255, 255, 255, .055);
        }

        .circle-btn em {
          position: absolute;
          top: -6px;
          right: -6px;
          font-size: 11px;
          width: 20px;
          height: 20px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #ff2e9f;
          font-style: normal;
        }

        .tree-card {
          border-radius: 28px;
          padding: 22px;
          min-height: 720px;
          position: relative;
          overflow: hidden;
        }

        .tree-card:before {
          content: "";
          position: absolute;
          inset: -30%;
          background:
            radial-gradient(circle at 50% 50%, rgba(255, 79, 189, .18), transparent 25%),
            radial-gradient(circle at 70% 30%, rgba(34, 211, 238, .11), transparent 25%);
          pointer-events: none;
        }

        .tree-header {
          position: relative;
          z-index: 3;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .tree-header h2 {
          margin: 0;
          font-size: 23px;
        }

        .tree-header p {
          margin: 5px 0 0;
          color: rgba(255, 255, 255, .58);
        }

        .tree-header button,
        .details-btn,
        .panel-title button {
          border: 1px solid rgba(255, 79, 189, .35);
          color: #fff;
          background: linear-gradient(135deg, rgba(255, 79, 189, .35), rgba(124, 58, 237, .24));
          box-shadow: 0 0 26px rgba(255, 79, 189, .16);
          border-radius: 14px;
          padding: 11px 16px;
          cursor: pointer;
        }

        .tree-stage {
          position: relative;
          z-index: 2;
          height: 630px;
          margin-top: 12px;
        }

        .branch-svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          overflow: visible;
          pointer-events: none;
          z-index: 1;
        }

        .branch-svg path {
          fill: none;
          stroke: url(#branchGradient);
          stroke-width: 6;
          stroke-linecap: round;
          filter: url(#glow);
          opacity: .86;
          stroke-dasharray: 1180;
          animation: branchPulse 5s ease-in-out infinite;
        }

        .branch-svg circle {
          fill: #ff9be6;
          stroke: rgba(255, 255, 255, .92);
          stroke-width: 2;
          filter: drop-shadow(0 0 12px #ff4fbd);
          opacity: .96;
        }

        @keyframes branchPulse {
          0%, 100% { opacity: .58; }
          50% { opacity: 1; }
        }

        .magic-tree {
          position: absolute;
          z-index: 2;
          left: 50%;
          bottom: 0;
          transform: translateX(-50%);
          width: 260px;
          height: 430px;
          border-radius: 48% 48% 24% 24%;
          background:
            linear-gradient(95deg, rgba(255, 79, 189, .25), rgba(168, 85, 247, .15), rgba(56, 189, 248, .11)),
            linear-gradient(180deg, #ff4fbd, #a855f7 55%, #4f46e5);
          clip-path: polygon(43% 0, 57% 0, 68% 35%, 83% 100%, 17% 100%, 32% 35%);
          box-shadow:
            0 0 45px rgba(255, 79, 189, .65),
            0 0 120px rgba(168, 85, 247, .42);
          overflow: visible;
          animation: trunkGlow 3.5s ease-in-out infinite;
        }

        .trunk-glow {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(120deg, transparent, rgba(255, 255, 255, .35), transparent),
            radial-gradient(circle at 50% 38%, rgba(255, 255, 255, .35), transparent 18%);
          transform: translateX(-100%);
          animation: energyFlow 3s linear infinite;
        }

        @keyframes energyFlow {
          0% { transform: translateX(-120%) rotate(8deg); opacity: .2; }
          45% { opacity: .7; }
          100% { transform: translateX(120%) rotate(8deg); opacity: .15; }
        }

        @keyframes trunkGlow {
          0%, 100% {
            filter: saturate(1);
            box-shadow: 0 0 45px rgba(255, 79, 189, .58), 0 0 120px rgba(168, 85, 247, .38);
          }
          50% {
            filter: saturate(1.25);
            box-shadow: 0 0 70px rgba(255, 79, 189, .95), 0 0 160px rgba(56, 189, 248, .38);
          }
        }

        .face {
          position: absolute;
          left: 50%;
          top: 45%;
          transform: translate(-50%, -50%);
          width: 90px;
          height: 60px;
          z-index: 3;
        }

        .eye {
          position: absolute;
          top: 7px;
          width: 20px;
          height: 28px;
          border-radius: 50%;
          background: #ff9be6;
          box-shadow: 0 0 22px #ff4fbd;
          animation: blink 4s infinite;
        }

        .eye.left { left: 15px; }
        .eye.right { right: 15px; }

        @keyframes blink {
          0%, 92%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(.12); }
        }

        .mouth {
          position: absolute;
          left: 50%;
          bottom: 5px;
          width: 32px;
          height: 16px;
          transform: translateX(-50%);
          border-bottom: 5px solid #ff9be6;
          border-radius: 0 0 999px 999px;
          filter: drop-shadow(0 0 10px #ff4fbd);
        }

        .speech {
          position: absolute;
          padding: 9px 12px;
          border-radius: 13px;
          color: #fff;
          font-size: 12px;
          background: rgba(20, 14, 32, .78);
          border: 1px solid rgba(255, 79, 189, .28);
          box-shadow: 0 0 20px rgba(255, 79, 189, .20);
          animation: floatBubble 4s ease-in-out infinite;
          white-space: nowrap;
        }

        .speech-one {
          left: -92px;
          top: 205px;
        }

        .speech-two {
          right: -96px;
          top: 292px;
          animation-delay: 1s;
        }

        @keyframes floatBubble {
          0%, 100% { transform: translateY(0); opacity: .75; }
          50% { transform: translateY(-9px); opacity: 1; }
        }

        .journey-node {
          position: absolute;
          z-index: 4;
          width: 175px;
          min-height: 88px;
          transform: translate(-50%, -50%);
          border-radius: 17px;
          padding: 13px 14px;
          color: #fff;
          text-align: left;
          cursor: pointer;
          background: rgba(10, 12, 26, .78);
          backdrop-filter: blur(18px);
          transition: .25s ease;
        }

        .journey-node:hover,
        .journey-node.selected {
          transform: translate(-50%, -50%) scale(1.05);
          z-index: 10;
        }

        .journey-node strong {
          display: block;
          font-size: 14px;
          line-height: 1.18;
          margin-top: 6px;
        }

        .journey-node small {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 8px;
          color: rgba(255, 255, 255, .72);
        }

        .journey-node small i {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
        }

        .node-icon {
          font-size: 20px;
        }

        .leaf {
          position: absolute;
          width: 22px;
          height: 12px;
          border-radius: 100% 0;
          opacity: .85;
          z-index: -1;
          filter: blur(.1px) drop-shadow(0 0 10px currentColor);
          animation: leafFloat 3.8s ease-in-out infinite;
        }

        .leaf-a {
          left: -21px;
          top: 14px;
          transform: rotate(-28deg);
        }

        .leaf-b {
          right: -18px;
          bottom: 20px;
          transform: rotate(145deg);
          animation-delay: .9s;
        }

        @keyframes leafFloat {
          0%, 100% { translate: 0 0; }
          50% { translate: 0 -5px; }
        }

        .status-pink {
          border: 1px solid rgba(255, 79, 189, .75);
          box-shadow: 0 0 24px rgba(255, 79, 189, .28), inset 0 0 22px rgba(255, 79, 189, .08);
        }

        .status-pink .leaf,
        .status-pink small i {
          color: #ff4fbd;
          background: #ff4fbd;
        }

        .status-green {
          border: 1px solid rgba(34, 197, 94, .75);
          box-shadow: 0 0 24px rgba(34, 197, 94, .24), inset 0 0 22px rgba(34, 197, 94, .07);
        }

        .status-green .leaf,
        .status-green small i {
          color: #22c55e;
          background: #22c55e;
        }

        .status-red {
          border: 1px solid rgba(248, 63, 94, .75);
          box-shadow: 0 0 24px rgba(248, 63, 94, .24), inset 0 0 22px rgba(248, 63, 94, .07);
        }

        .status-red .leaf,
        .status-red small i {
          color: #fb395f;
          background: #fb395f;
        }

        .status-yellow {
          border: 1px solid rgba(250, 204, 21, .78);
          box-shadow: 0 0 24px rgba(250, 204, 21, .22), inset 0 0 22px rgba(250, 204, 21, .07);
        }

        .status-yellow .leaf,
        .status-yellow small i {
          color: #facc15;
          background: #facc15;
        }

        .flow-popup {
          position: absolute;
          z-index: 8;
          right: 10px;
          top: 125px;
          width: 330px;
          border-radius: 22px;
          padding: 18px;
          background: rgba(12, 13, 30, .88);
          backdrop-filter: blur(26px);
          z-index: 20;
        }

        .close {
          position: absolute;
          top: 12px;
          right: 12px;
          border: 0;
          color: rgba(255, 255, 255, .7);
          font-size: 24px;
          background: transparent;
          cursor: pointer;
        }

        .popup-icon {
          width: 58px;
          height: 58px;
          border-radius: 17px;
          display: grid;
          place-items: center;
          font-size: 25px;
          background: rgba(255, 79, 189, .15);
          margin-bottom: 12px;
        }

        .flow-popup h3 {
          margin: 0 0 8px;
          font-size: 20px;
        }

        .flow-popup p {
          margin: 0;
          color: rgba(255, 255, 255, .62);
          font-size: 13px;
          line-height: 1.5;
        }

        .flow-path {
          margin: 14px 0;
          border-radius: 13px;
          padding: 11px;
          color: #ff92dc;
          background: rgba(255, 79, 189, .08);
          font-size: 12px;
          line-height: 1.5;
        }

        .timeline {
          display: grid;
          gap: 10px;
          margin: 14px 0;
        }

        .timeline div {
          display: grid;
          grid-template-columns: 30px 1fr auto;
          align-items: center;
          gap: 10px;
        }

        .timeline span {
          width: 27px;
          height: 27px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: rgba(255, 255, 255, .08);
          color: #fff;
          font-size: 12px;
        }

        .timeline strong {
          font-size: 13px;
        }

        .timeline small {
          color: rgba(255, 255, 255, .43);
          font-size: 11px;
        }

        .timeline .done span {
          background: #ff4fbd;
          box-shadow: 0 0 18px rgba(255, 79, 189, .55);
        }

        .details-btn {
          width: 100%;
          margin-top: 6px;
        }

        .bottom-grid {
          margin-top: 20px;
          display: grid;
          grid-template-columns: 1.25fr 1.65fr 1.35fr 1.1fr;
          gap: 16px;
        }

        .panel {
          border-radius: 24px;
          padding: 18px;
          min-height: 230px;
        }

        .panel-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 15px;
        }

        .panel-title h3 {
          margin: 0;
          font-size: 15px;
          letter-spacing: .04em;
        }

        .panel-title a,
        .finance a {
          color: #ff72ce;
          font-size: 13px;
          text-decoration: none;
        }

        .priority-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }

        .priority-card {
          min-height: 172px;
          border-radius: 17px;
          padding: 14px;
          color: #fff;
          text-align: left;
          cursor: pointer;
          background: rgba(255, 255, 255, .04);
        }

        .priority-card small {
          display: block;
          margin-top: 8px;
        }

        .priority-card strong {
          display: block;
          font-size: 30px;
          margin-top: 12px;
        }

        .priority-card p {
          margin: 0;
          color: rgba(255, 255, 255, .65);
        }

        .priority-card.green { border: 1px solid rgba(34, 197, 94, .5); box-shadow: inset 0 0 24px rgba(34, 197, 94, .10); }
        .priority-card.red { border: 1px solid rgba(248, 63, 94, .55); box-shadow: inset 0 0 24px rgba(248, 63, 94, .10); }
        .priority-card.yellow { border: 1px solid rgba(250, 204, 21, .55); box-shadow: inset 0 0 24px rgba(250, 204, 21, .10); }
        .priority-card.pink { border: 1px solid rgba(255, 79, 189, .55); box-shadow: inset 0 0 24px rgba(255, 79, 189, .10); }

        .sparkline,
        .money-line {
          height: 38px;
          margin-top: 16px;
          border-radius: 50%;
          background:
            linear-gradient(135deg, transparent 30%, currentColor 31%, transparent 34%),
            linear-gradient(45deg, transparent 40%, currentColor 41%, transparent 45%);
          opacity: .75;
        }

        .green .sparkline { color: #22c55e; }
        .red .sparkline { color: #fb395f; }
        .yellow .sparkline { color: #facc15; }
        .pink .sparkline { color: #ff4fbd; }

        .metric-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 10px;
        }

        .metric-row div {
          padding: 12px;
          border-radius: 14px;
          background: rgba(255, 255, 255, .035);
          border: 1px solid rgba(255, 255, 255, .08);
        }

        .metric-row small,
        .money-block small {
          display: block;
          color: rgba(255, 255, 255, .52);
        }

        .metric-row strong {
          display: block;
          font-size: 20px;
          margin: 5px 0;
        }

        .metric-row em,
        .money-block em {
          color: #7dfc9f;
          font-style: normal;
          font-size: 12px;
        }

        .chart {
          height: 135px;
          margin-top: 8px;
        }

        .chart svg {
          width: 100%;
          height: 100%;
        }

        .notification {
          display: grid;
          grid-template-columns: 42px 1fr auto;
          gap: 10px;
          align-items: start;
          padding: 11px 0;
          border-bottom: 1px solid rgba(255, 255, 255, .07);
        }

        .notification span {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: rgba(255, 255, 255, .07);
        }

        .notification strong {
          font-size: 13px;
        }

        .notification p {
          margin: 3px 0 0;
          color: rgba(255, 255, 255, .55);
          font-size: 12px;
          line-height: 1.35;
        }

        .notification small {
          color: rgba(255, 255, 255, .38);
          font-size: 11px;
        }

        .finance {
          display: grid;
          gap: 10px;
        }

        .money-block {
          border-bottom: 1px solid rgba(255, 255, 255, .07);
          padding-bottom: 10px;
        }

        .money-block strong {
          display: block;
          font-size: 23px;
          margin: 3px 0;
        }

        .money-block .down {
          color: #fb7185;
        }

        .money-line {
          height: 24px;
          margin-top: 6px;
        }

        .money-line.pink { color: #ff4fbd; }
        .money-line.blue { color: #60a5fa; }

        @media (max-width: 1350px) {
          .bottom-grid {
            grid-template-columns: 1fr 1fr;
          }

          .topbar {
            grid-template-columns: 1fr;
          }

          .top-actions {
            justify-content: flex-start;
            flex-wrap: wrap;
          }
        }

        @media (max-width: 980px) {
          .studio-page {
            display: block;
          }

          .sidebar {
            width: 100%;
            min-height: auto;
            position: relative;
          }

          .workspace {
            width: 100%;
            padding: 14px;
          }

          .tree-stage {
            height: 890px;
            overflow: auto;
          }

          .journey-node {
            width: 155px;
          }

          .flow-popup {
            left: 50%;
            right: auto;
            top: 610px;
            transform: translateX(-50%);
            width: min(92vw, 360px);
          }

          .bottom-grid,
          .priority-grid,
          .metric-row {
            grid-template-columns: 1fr;
          }

          .search {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
