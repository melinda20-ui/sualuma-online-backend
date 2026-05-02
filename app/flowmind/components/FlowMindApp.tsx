"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Section =
  | "hoje"
  | "minhacasa"
  | "minhaempresa"
  | "plano"
  | "habitos"
  | "agenda"
  | "agentes"
  | "vera"
  | "dona"
  | "rica"
  | "financeiro"
  | "templates";

type AgentKey = "vera" | "dona" | "rica";

type ChatMessage = {
  from: "agent" | "user";
  text: string;
  time?: string;
  replies?: string[];
};

const initialChats: Record<AgentKey, ChatMessage[]> = {
  vera: [
    {
      from: "agent",
      text: "Oi, Ana! 🌿 Já é sexta — você chegou até o fim da semana 4. Isso não é pouca coisa.",
      time: "08:02",
    },
    {
      from: "agent",
      text: "Antes de você partir pro fim de semana, quero te fazer 2 perguntas rápidas da revisão semanal. Pronta?",
      time: "08:02",
      replies: ["Sim, vamos lá!", "Agora não"],
    },
  ],
  dona: [
    {
      from: "agent",
      text: "Bom dia, Ana! ☀️ Com base no seu histórico, sua energia costuma ser melhor de manhã. Então vamos usar isso a nosso favor.",
      time: "08:00",
    },
    {
      from: "agent",
      text: "Como você está hoje? Isso me ajuda a montar a lista certa pra você. 💚",
      time: "08:00",
      replies: ["😊 Bem e com energia", "😐 Mais ou menos", "😔 Cansada / estressada"],
    },
  ],
  rica: [
    {
      from: "agent",
      text: "Ana. 👀 Sexta-feira. Você ainda não prospectou hoje.",
      time: "14:30",
    },
    {
      from: "agent",
      text: "Não precisa ser perfeito. Uma mensagem. Uma pessoa. Quanto tempo você tem agora — 5 minutos ou 30 minutos?",
      time: "14:30",
      replies: ["⚡ Tenho 5 minutos", "⏱️ Tenho 30 minutos", "Já vendi hoje!"],
    },
  ],
};

const agentResponses: Record<AgentKey, string[]> = {
  vera: [
    "Ótimo. Primeira pergunta: das suas tarefas desta semana, qual você está mais orgulhosa de ter feito? 🌟",
    "Entendi. Vou usar isso para ajustar seu plano de 12 semanas. 🧭",
  ],
  dona: [
    "Combinado. Hoje vamos reduzir para 3 coisas: uma de trabalho, uma de casa e uma de cuidado com você. ⚡",
    "Anotado. Vou reorganizar seu dia pensando na sua energia real, não numa rotina perfeita.",
  ],
  rica: [
    "Boa. Agora escolha uma pessoa e mande uma mensagem simples. Nada de perfeição, só movimento. 💰",
    "Registrado. O importante é manter a roda de vendas girando um pouco todo dia.",
  ],
};

const agents = [
  {
    key: "vera" as const,
    emoji: "🧭",
    name: "Vera",
    role: "A Estrategista",
    desc: "Cuida do plano anual, 12 semanas e revisões semanais.",
    status: "Aguardando domingo",
    statusClass: "status-waiting",
  },
  {
    key: "dona" as const,
    emoji: "⚡",
    name: "Dona",
    role: "Gerente do Dia",
    desc: "Organiza sua lista diária com base na sua energia.",
    status: "Ativa agora",
    statusClass: "status-active",
  },
  {
    key: "rica" as const,
    emoji: "💰",
    name: "Rica",
    role: "Coach de Vendas",
    desc: "Te lembra de vender e sugere uma ação simples por dia.",
    status: "1 alerta pendente",
    statusClass: "status-alert",
  },
  {
    key: "calma",
    emoji: "🌱",
    name: "Calma",
    role: "Terapeuta de Produtividade",
    desc: "Detecta semanas difíceis e ajusta o plano sem culpa.",
    status: "Disponível",
    statusClass: "status-waiting",
  },
  {
    key: "bussola",
    emoji: "📊",
    name: "Bússola",
    role: "A Analista",
    desc: "Gera relatório semanal e celebra pequenas vitórias.",
    status: "Domingo às 20h",
    statusClass: "status-waiting",
  },
];

const templates = [
  {
    icon: "🗺️",
    name: "1 Ano, 12 Semanas",
    desc: "Plano completo com meta anual, trimestres, semanas e check-ins diários.",
    bg: "linear-gradient(135deg, var(--dark), #3D3530)",
  },
  {
    icon: "💸",
    name: "Saída Financeira",
    desc: "Para quem quer criar renda própria e sair da dependência financeira.",
    bg: "linear-gradient(135deg, #C8A46E, #E8D5C4)",
  },
  {
    icon: "🧠",
    name: "Organiza Minha Cabeça",
    desc: "Dump mental, triagem automática e lista do dia com no máximo 3 itens.",
    bg: "linear-gradient(135deg, var(--lilac), var(--lilac-light))",
  },
  {
    icon: "👩‍👧",
    name: "Mãe Empreendedora",
    desc: "Blocos de trabalho para quem divide atenção entre filhos, casa e negócio.",
    bg: "linear-gradient(135deg, var(--sage), var(--sage-dark))",
  },
  {
    icon: "🚀",
    name: "Lançamento em 30 Dias",
    desc: "Cronograma reverso para vender uma oferta específica em um mês.",
    bg: "linear-gradient(135deg, var(--red-soft), #E8B4A0)",
  },
];

export default function FlowMindApp({
  initialSection = "hoje",
}: {
  initialSection?: Section;
}) {
  const [section, setSection] = useState<Section>(initialSection);
  const [alertVisible, setAlertVisible] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [doneTasks, setDoneTasks] = useState<string[]>(["post", "casa"]);
  const [doneHabits, setDoneHabits] = useState<string[]>([
    "cam-1",
    "cam-2",
    "cam-3",
    "agua-1",
    "postar-1",
    "postar-2",
    "postar-3",
  ]);
  const [chats, setChats] = useState(initialChats);
  const [inputs, setInputs] = useState<Record<AgentKey, string>>({
    vera: "",
    dona: "",
    rica: "",
  });

  const activeAgent = useMemo(() => {
    if (section === "vera" || section === "dona" || section === "rica") {
      return section;
    }
    return "dona";
  }, [section]);

  function openSection(id: Section) {
    setSection(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleTask(id: string) {
    setDoneTasks((old) =>
      old.includes(id) ? old.filter((item) => item !== id) : [...old, id]
    );
  }

  function toggleHabit(id: string) {
    setDoneHabits((old) =>
      old.includes(id) ? old.filter((item) => item !== id) : [...old, id]
    );
  }

  function sendReply(agent: AgentKey, text: string) {
    setChats((old) => ({
      ...old,
      [agent]: [
        ...old[agent].map((msg) => ({ ...msg, replies: undefined })),
        { from: "user", text, time: "agora" },
        {
          from: "agent",
          text:
            agentResponses[agent][
              Math.floor(Math.random() * agentResponses[agent].length)
            ],
          time: "agora",
        },
      ],
    }));
  }

  function sendMessage(agent: AgentKey) {
    const text = inputs[agent].trim();
    if (!text) return;

    setInputs((old) => ({ ...old, [agent]: "" }));
    setChats((old) => ({
      ...old,
      [agent]: [
        ...old[agent],
        { from: "user", text, time: "agora" },
        {
          from: "agent",
          text:
            agent === "vera"
              ? "Entendido. Vou atualizar seu plano com essa informação. 🧭"
              : agent === "dona"
              ? "Anotado. Vou ajustar sua lista de hoje com base nisso. ⚡"
              : "Boa. Cada ação conta. Vou registrar isso no seu histórico de vendas. 💰",
          time: "agora",
        },
      ],
    }));
  }

  return (
    <div className="flowmind-page">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-name">FlowMind</div>
          <div className="logo-tagline">Seu GPS Mental</div>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">🌿</div>
          <div className="user-info">
            <div className="user-name">Olá, Ana!</div>
            <div className="user-plan">Semana 4 de 12</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Principal</div>

          <Link
            href="/flowmind"
            className={section === "hoje" ? "nav-item active" : "nav-item"}
            onClick={() => openSection("hoje")}
          >
            <span className="nav-icon">🏠</span> Hoje
          </Link>

          <Link
            href="/flowmind/minhacasa"
            className={section === "minhacasa" ? "nav-item active" : "nav-item"}
            onClick={() => openSection("minhacasa")}
          >
            <span className="nav-icon">🌿</span> Minha casa
          </Link>

          <Link
            href="/flowmind/minhaempresa"
            className={
              section === "minhaempresa" ? "nav-item active" : "nav-item"
            }
            onClick={() => openSection("minhaempresa")}
          >
            <span className="nav-icon">💼</span> Minha empresa
          </Link>

          <button
            className={section === "plano" ? "nav-item active" : "nav-item"}
            onClick={() => openSection("plano")}
          >
            <span className="nav-icon">🗺️</span> Meu plano
          </button>

          <button
            className={section === "habitos" ? "nav-item active" : "nav-item"}
            onClick={() => openSection("habitos")}
          >
            <span className="nav-icon">🌱</span> Hábitos
          </button>

          <button
            className={section === "agenda" ? "nav-item active" : "nav-item"}
            onClick={() => openSection("agenda")}
          >
            <span className="nav-icon">📅</span> Agenda
          </button>

          <div className="nav-section-label">Agentes</div>

          <Link
            href="/flowmind/agentes"
            className={section === "agentes" ? "nav-item active" : "nav-item"}
            onClick={() => openSection("agentes")}
          >
            <span className="nav-icon">🤖</span> Meus agentes
            <span className="nav-badge">2</span>
          </Link>

          <button
            className={section === "vera" ? "nav-item active" : "nav-item"}
            onClick={() => openSection("vera")}
          >
            <span className="nav-icon">🧭</span> Vera
          </button>

          <button
            className={section === "dona" ? "nav-item active" : "nav-item"}
            onClick={() => openSection("dona")}
          >
            <span className="nav-icon">⚡</span> Dona
          </button>

          <button
            className={section === "rica" ? "nav-item active" : "nav-item"}
            onClick={() => openSection("rica")}
          >
            <span className="nav-icon">💰</span> Rica
          </button>

          <div className="nav-section-label">Ferramentas</div>

          <button
            className={section === "financeiro" ? "nav-item active" : "nav-item"}
            onClick={() => openSection("financeiro")}
          >
            <span className="nav-icon">💳</span> Financeiro
          </button>

          <Link
            href="/flowmind/templates"
            className={section === "templates" ? "nav-item active" : "nav-item"}
            onClick={() => openSection("templates")}
          >
            <span className="nav-icon">✨</span> Templates
          </Link>
        </nav>

        <div className="sidebar-bottom">
          <div className="energy-label">Energia hoje</div>
          <div className="energy-bar-wrap">
            <div className="energy-bar" />
          </div>
          <div className="energy-text">72% · Boa, foca no essencial 💪</div>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div>
            <div className="topbar-greeting">
              Bom dia, <strong>Ana!</strong> ☀️
            </div>
            <div className="topbar-date">Semana 4 de 12 · Painel FlowMind</div>
          </div>

          <div className="topbar-right">
            <button className="topbar-btn" onClick={() => setModalOpen(true)}>
              ⚡ Check-in do dia
            </button>
            <button
              className="topbar-btn primary"
              onClick={() => openSection("rica")}
            >
              💰 Foco em vender
            </button>
          </div>
        </div>

        <div className="content">
          {section === "hoje" && (
            <section className="section active">
              {alertVisible && (
                <div className="alert-banner">
                  <div className="alert-icon">🔔</div>
                  <div className="alert-text">
                    <strong>Rica diz:</strong> Você ainda não prospectou hoje.
                    Uma mensagem pode mudar a semana.
                  </div>
                  <button
                    className="alert-dismiss"
                    onClick={() => setAlertVisible(false)}
                  >
                    Ignorar
                  </button>
                </div>
              )}

              <div className="today-hero">
                <div className="hero-tag">📍 Sua missão de hoje</div>
                <div className="hero-title">3 coisas. Só 3.</div>
                <div className="hero-subtitle">
                  Foco maior que quantidade. Você só precisa aparecer.
                </div>

                <div className="hero-stats">
                  <div className="hero-stat">
                    <span className="hero-stat-num">2</span>
                    <div className="hero-stat-label">feitas</div>
                  </div>
                  <div className="hero-divider" />
                  <div className="hero-stat">
                    <span className="hero-stat-num">1</span>
                    <div className="hero-stat-label">pendente</div>
                  </div>
                  <div className="hero-divider" />
                  <div className="hero-stat">
                    <span className="hero-stat-num">67%</span>
                    <div className="hero-stat-label">do dia</div>
                  </div>
                </div>
              </div>

              <div className="checkin-card">
                <div className="checkin-emoji">⚡</div>
                <div className="checkin-text">
                  <strong>Hora do check-in noturno</strong>
                  <p>Como foi seu dia? Vale 2 minutos para registrar.</p>
                </div>
                <div className="checkin-btns">
                  <button
                    className="checkin-btn yes"
                    onClick={() => setModalOpen(true)}
                  >
                    Fazer agora
                  </button>
                  <button className="checkin-btn no">Depois</button>
                </div>
              </div>

              <div className="grid-3-1">
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">📋 Tarefas de hoje</div>
                    <button
                      className="card-action"
                      onClick={() => setModalOpen(true)}
                    >
                      + Adicionar
                    </button>
                  </div>

                  <Task
                    id="post"
                    label="Postar conteúdo no Instagram"
                    tag="Trabalho"
                    tagClass="tag-work"
                    doneTasks={doneTasks}
                    toggleTask={toggleTask}
                  />
                  <Task
                    id="casa"
                    label="Limpar cozinha e sala"
                    tag="Casa"
                    tagClass="tag-home"
                    doneTasks={doneTasks}
                    toggleTask={toggleTask}
                  />
                  <Task
                    id="vender"
                    label="Enviar proposta para 3 pessoas"
                    tag="💰 Vender"
                    tagClass="tag-sell"
                    doneTasks={doneTasks}
                    toggleTask={toggleTask}
                  />
                  <Task
                    id="caminhar"
                    label="Caminhar 20 minutos"
                    tag="Mente"
                    tagClass="tag-mind"
                    doneTasks={doneTasks}
                    toggleTask={toggleTask}
                  />
                </div>

                <div className="side-stack">
                  <div className="focus-card">
                    <div className="focus-label">🎯 Foco desta semana</div>
                    <div className="focus-main">Primeiros 3 clientes</div>
                    <div className="focus-tag">Semana 4 de 12 ✦</div>
                  </div>

                  <ProgressCard />
                </div>
              </div>

              <WeekCard openAgenda={() => openSection("agenda")} />
              <ActiveAgents openSection={openSection} />
            </section>
          )}

          {section === "minhacasa" && (
            <section className="section active">
              <div className="section-heading">🌿 Minha casa</div>
              <div className="section-sub">
                Casa, rotina, energia, autocuidado e vida real.
              </div>

              <div className="grid-2">
                <div className="card">
                  <div className="card-title">🏠 Essencial de hoje</div>
                  <div className="big-title">Não é para resolver a casa inteira.</div>
                  <p className="muted">
                    A regra da Dona aqui é simples: uma tarefa de casa, um cuidado
                    com você e nenhuma culpa por não fazer tudo.
                  </p>

                  <div className="divider" />

                  <Task
                    id="lavar"
                    label="Lavar uma leva de roupa"
                    tag="Casa"
                    tagClass="tag-home"
                    doneTasks={doneTasks}
                    toggleTask={toggleTask}
                  />
                  <Task
                    id="cozinha"
                    label="Organizar apenas a pia"
                    tag="15 min"
                    tagClass="tag-home"
                    doneTasks={doneTasks}
                    toggleTask={toggleTask}
                  />
                  <Task
                    id="respirar"
                    label="Respirar 5 minutos sem celular"
                    tag="Mente"
                    tagClass="tag-mind"
                    doneTasks={doneTasks}
                    toggleTask={toggleTask}
                  />
                </div>

                <div className="card">
                  <div className="card-title">🌱 Calma recomenda</div>
                  <p className="quote">
                    “Quando a vida está pesada, reduzir também é produtividade.
                    Hoje você só precisa deixar o ambiente 1% mais leve.”
                  </p>
                  <button
                    className="btn btn-primary full"
                    onClick={() => setModalOpen(true)}
                  >
                    Fazer check-in emocional
                  </button>
                </div>
              </div>

              <HabitsBlock doneHabits={doneHabits} toggleHabit={toggleHabit} />
            </section>
          )}

          {section === "minhaempresa" && (
            <section className="section active">
              <div className="section-heading">💼 Minha empresa</div>
              <div className="section-sub">
                Vendas, clientes, entregas, financeiro e ações de crescimento.
              </div>

              <div className="grid-3">
                <MetricCard label="Faturado este mês" value="R$ 800" sub="27% da meta" />
                <MetricCard label="Conversas de venda" value="12" sub="Meta: 20" />
                <MetricCard label="Clientes ativos" value="2" sub="Próxima meta: 3" />
              </div>

              <div className="grid-2">
                <div className="card">
                  <div className="card-title">💰 Ação de venda do dia</div>
                  <p className="muted">
                    Rica quer que você faça uma ação simples, sem esperar
                    coragem perfeita.
                  </p>
                  <Task
                    id="prospectar-empresa"
                    label="Mandar mensagem para 3 possíveis clientes"
                    tag="Vender"
                    tagClass="tag-sell"
                    doneTasks={doneTasks}
                    toggleTask={toggleTask}
                  />
                  <Task
                    id="follow"
                    label="Fazer follow-up de uma conversa antiga"
                    tag="Follow-up"
                    tagClass="tag-sell"
                    doneTasks={doneTasks}
                    toggleTask={toggleTask}
                  />
                </div>

                <div className="card">
                  <div className="card-title">📊 Próximo gargalo</div>
                  <p className="quote">
                    “Você está criando bastante, mas precisa transformar criação
                    em conversa de venda.”
                  </p>
                  <button
                    className="btn btn-primary full"
                    onClick={() => openSection("rica")}
                  >
                    Abrir Rica
                  </button>
                </div>
              </div>

              <FinanceiroResumo />
            </section>
          )}

          {section === "plano" && <PlanoSection setModalOpen={setModalOpen} />}

          {section === "habitos" && (
            <section className="section active">
              <div className="section-heading">🌱 Tabela de Hábitos</div>
              <div className="section-sub">7 dias desta semana · Semana 4 de 52</div>
              <HabitsBlock doneHabits={doneHabits} toggleHabit={toggleHabit} />
            </section>
          )}

          {section === "agenda" && (
            <section className="section active">
              <div className="section-heading">📅 Agenda da Semana</div>
              <div className="section-sub">Semana 4 · plano leve e executável</div>
              <AgendaSection />
            </section>
          )}

          {section === "agentes" && (
            <section className="section active">
              <div className="section-heading">🤖 Meus Agentes</div>
              <div className="section-sub">5 agentes disponíveis · 3 ativos</div>

              <div className="grid-3">
                {agents.map((agent) => (
                  <button
                    key={agent.name}
                    className="card agent-full-card"
                    onClick={() =>
                      agent.key === "vera" ||
                      agent.key === "dona" ||
                      agent.key === "rica"
                        ? openSection(agent.key)
                        : undefined
                    }
                  >
                    <div className="agent-big-emoji">{agent.emoji}</div>
                    <div className="agent-big-name">{agent.name}</div>
                    <div className="agent-big-role">{agent.role}</div>
                    <p>{agent.desc}</p>
                    <span className={`agent-status ${agent.statusClass}`}>
                      {agent.status}
                    </span>
                  </button>
                ))}

                <div className="card create-agent-card">
                  <div className="create-plus">+</div>
                  <div>Criar agente personalizado</div>
                  <small>Em breve</small>
                </div>
              </div>
            </section>
          )}

          {(section === "vera" || section === "dona" || section === "rica") && (
            <ChatSection
              agent={activeAgent}
              openSection={openSection}
              chats={chats}
              inputs={inputs}
              setInputs={setInputs}
              sendReply={sendReply}
              sendMessage={sendMessage}
            />
          )}

          {section === "financeiro" && (
            <section className="section active">
              <div className="section-heading">💳 Financeiro</div>
              <div className="section-sub">Visão geral · Maio</div>
              <FinanceiroResumo full />
            </section>
          )}

          {section === "templates" && (
            <section className="section active">
              <div className="section-heading">✨ Templates</div>
              <div className="section-sub">
                Escolha um modelo ou comece do zero.
              </div>

              <div className="template-grid">
                {templates.map((template) => (
                  <div className="template-card" key={template.name}>
                    <div
                      className="template-thumb"
                      style={{ background: template.bg }}
                    >
                      {template.icon}
                    </div>
                    <div className="template-body">
                      <div className="template-name">{template.name}</div>
                      <div className="template-desc">{template.desc}</div>
                      <button
                        className="template-use"
                        onClick={() => setModalOpen(true)}
                      >
                        ✦ Usar este template →
                      </button>
                    </div>
                  </div>
                ))}

                <div className="template-card blank-template">
                  <div className="template-thumb blank-thumb">+</div>
                  <div className="template-body">
                    <div className="template-name muted-title">Criar do zero</div>
                    <div className="template-desc">
                      Comece uma área em branco e organize do seu jeito.
                    </div>
                    <button className="template-use muted-title">
                      ✦ Começar em branco →
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      {modalOpen && <CheckinModal close={() => setModalOpen(false)} />}
    </div>
  );
}

function Task({
  id,
  label,
  tag,
  tagClass,
  doneTasks,
  toggleTask,
}: {
  id: string;
  label: string;
  tag: string;
  tagClass: string;
  doneTasks: string[];
  toggleTask: (id: string) => void;
}) {
  const done = doneTasks.includes(id);

  return (
    <button
      className={done ? "task-item done" : "task-item"}
      onClick={() => toggleTask(id)}
    >
      <div className="task-check" />
      <div className="task-text">{label}</div>
      <span className={`task-tag ${tagClass}`}>{tag}</span>
    </button>
  );
}

function ProgressCard() {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">📊 Progresso</div>
      </div>

      <div className="progress-ring-wrap">
        <div className="ring-container">
          <svg className="ring-svg" viewBox="0 0 100 100">
            <circle className="ring-bg" cx="50" cy="50" r="39" />
            <circle className="ring-fill" cx="50" cy="50" r="39" />
          </svg>
          <div className="ring-text">
            <span className="ring-num">72%</span>
            <span className="ring-label">semana</span>
          </div>
        </div>
      </div>

      <div className="mini-stat-row">
        <div className="mini-stat">
          <span className="mini-stat-num">4</span>
          <div className="mini-stat-label">hábitos</div>
        </div>
        <div className="mini-divider" />
        <div className="mini-stat">
          <span className="mini-stat-num">2</span>
          <div className="mini-stat-label">vendas</div>
        </div>
      </div>
    </div>
  );
}

function WeekCard({ openAgenda }: { openAgenda: () => void }) {
  const days = [
    ["Seg", "29", "done"],
    ["Ter", "30", "done"],
    ["Qua", "1", "done"],
    ["Qui", "2", "done"],
    ["Sex", "3", "today"],
    ["Sáb", "4", ""],
    ["Dom", "5", ""],
  ];

  return (
    <div className="card week-card">
      <div className="card-header">
        <div className="card-title">📅 Esta semana</div>
        <button className="card-action" onClick={openAgenda}>
          Ver agenda completa →
        </button>
      </div>

      <div className="week-grid">
        {days.map(([name, num, state]) => (
          <div className={`week-day has-tasks ${state}`} key={name}>
            <div className="wd-name">{name}</div>
            <span className="wd-num">{num}</span>
            <div className="wd-dot" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ActiveAgents({ openSection }: { openSection: (s: Section) => void }) {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">🤖 Agentes ativos</div>
        <button className="card-action" onClick={() => openSection("agentes")}>
          Ver todos →
        </button>
      </div>

      <button className="agent-card" onClick={() => openSection("dona")}>
        <div className="agent-avatar sage-bg">⚡</div>
        <div className="agent-info">
          <div className="agent-name">Dona</div>
          <div className="agent-desc">Ajustou sua lista para hoje às 8h</div>
        </div>
        <span className="agent-status status-active">Ativa</span>
      </button>

      <button className="agent-card" onClick={() => openSection("rica")}>
        <div className="agent-avatar red-bg">💰</div>
        <div className="agent-info">
          <div className="agent-name">Rica</div>
          <div className="agent-desc">Aguardando seu update de vendas</div>
        </div>
        <span className="agent-status status-alert">1 alerta</span>
      </button>

      <button className="agent-card" onClick={() => openSection("vera")}>
        <div className="agent-avatar lilac-bg">🧭</div>
        <div className="agent-info">
          <div className="agent-name">Vera</div>
          <div className="agent-desc">Revisão semanal pronta para domingo</div>
        </div>
        <span className="agent-status status-waiting">Aguardando</span>
      </button>
    </div>
  );
}

function HabitsBlock({
  doneHabits,
  toggleHabit,
}: {
  doneHabits: string[];
  toggleHabit: (id: string) => void;
}) {
  const rows = [
    ["🚶 Caminhar", "cam", "🔥 4"],
    ["💧 2L de água", "agua", "🔥 3"],
    ["📱 Postar", "postar", "🔥 5"],
    ["💬 Prospectar", "prospectar", "🔥 3"],
    ["🧘 Respirar", "respirar", "⚡ 2"],
  ];

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">🌱 Hábitos da semana</div>
      </div>

      <div className="habit-week-labels">
        {["S", "T", "Q", "Q", "S", "S", "D"].map((day, index) => (
          <span key={`${day}-${index}`}>{day}</span>
        ))}
      </div>

      {rows.map(([name, key, streak]) => (
        <div className="habit-row" key={key}>
          <div className="habit-name">{name}</div>
          <div className="habit-dots">
            {[1, 2, 3, 4, 5, 6, 7].map((num) => {
              const id = `${key}-${num}`;
              const done = doneHabits.includes(id);
              return (
                <button
                  key={id}
                  className={done ? "habit-dot done" : "habit-dot"}
                  onClick={() => toggleHabit(id)}
                />
              );
            })}
          </div>
          <div className="habit-streak">{streak}</div>
        </div>
      ))}
    </div>
  );
}

function PlanoSection({
  setModalOpen,
}: {
  setModalOpen: (value: boolean) => void;
}) {
  return (
    <section className="section active">
      <div className="plan-header">
        <div className="plan-title-wrap">
          <h2>Meu Plano — 1 Ano, 12 Semanas</h2>
          <p>Meta anual: R$ 3.000/mês · Semana 4 de 12</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          ✏️ Editar plano
        </button>
      </div>

      <div className="card dark-card">
        <div className="hero-tag">🎯 Sua meta de 12 meses</div>
        <div className="dark-card-title">
          Ganhar R$ 3.000/mês e não depender de ninguém
        </div>
        <div className="dark-card-sub">241 dias restantes</div>

        <div className="dark-stats">
          <div>
            <strong>R$ 800</strong>
            <span>faturado este mês</span>
          </div>
          <div>
            <strong>27%</strong>
            <span>da meta mensal</span>
          </div>
          <div>
            <strong>4ª</strong>
            <span>semana do plano</span>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div>
          <PhaseCard
            active
            period="Semanas 1–12 · Trimestre 1"
            name="📦 Estruturar e vender"
            desc="Criar oferta clara, ter 10 conversas de venda e fechar primeiros 3 clientes."
            progress="33%"
          />
          <PhaseCard
            period="Semanas 13–24 · Trimestre 2"
            name="📈 Crescer e estabilizar"
            desc="Ter clientes recorrentes, processo de venda consistente e renda de R$ 1.500+."
            progress="0%"
          />
          <PhaseCard
            period="Semanas 25–36 · Trimestre 3"
            name="🚀 Escalar e automatizar"
            desc="Criar produto, grupo ou mensalidade. Meta: R$ 3.000/mês."
            progress="0%"
          />
        </div>

        <div className="card">
          <div className="card-title">💡 Mensagem da Vera</div>
          <p className="quote">
            “Você está na semana 4. Isso significa que passou pelos dias mais
            difíceis: quando é fácil desistir. Agora é hora de conversar com
            pessoas reais, não buscar perfeição.”
          </p>
          <div className="quote-author">— Vera, sua estrategista 🧭</div>
        </div>
      </div>
    </section>
  );
}

function PhaseCard({
  active,
  period,
  name,
  desc,
  progress,
}: {
  active?: boolean;
  period: string;
  name: string;
  desc: string;
  progress: string;
}) {
  return (
    <div className={active ? "phase-card active-phase" : "phase-card upcoming"}>
      <div className="phase-top">
        <span className="phase-period">{period}</span>
        <span className={active ? "phase-badge badge-active" : "phase-badge badge-upcoming"}>
          {active ? "Em andamento" : "Planejado"}
        </span>
      </div>
      <div className="phase-name">{name}</div>
      <div className="phase-desc">{desc}</div>
      <div className="phase-progress-bar">
        <div className="phase-progress-fill" style={{ width: progress }} />
      </div>
    </div>
  );
}

function AgendaSection() {
  const rows = [
    ["Manhã", "📱 Conteúdo", "💬 Prospectar", "📱 Conteúdo", "💰 VENDER", "📊 Financeiro", "✨ Livre", "🧭 Revisão"],
    ["Tarde", "🏠 Casa", "💌 Follow-up", "🏠 Casa", "💬 Prospectar", "🏠 Casa", "✨ Descanso", "🌱 Planejar"],
  ];

  return (
    <div className="card agenda-card">
      <div className="agenda-grid agenda-head">
        <div />
        {["SEG 29", "TER 30", "QUA 1", "QUI 2", "SEX 3", "SÁB 4", "DOM 5"].map(
          (day) => (
            <div key={day}>{day}</div>
          )
        )}
      </div>

      {rows.map((row) => (
        <div className="agenda-grid" key={row[0]}>
          {row.map((cell, index) => (
            <div key={`${row[0]}-${index}`} className={index === 0 ? "agenda-time" : "agenda-pill"}>
              {cell}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function ChatSection({
  agent,
  openSection,
  chats,
  inputs,
  setInputs,
  sendReply,
  sendMessage,
}: {
  agent: AgentKey;
  openSection: (s: Section) => void;
  chats: Record<AgentKey, ChatMessage[]>;
  inputs: Record<AgentKey, string>;
  setInputs: React.Dispatch<React.SetStateAction<Record<AgentKey, string>>>;
  sendReply: (agent: AgentKey, text: string) => void;
  sendMessage: (agent: AgentKey) => void;
}) {
  const meta = {
    vera: ["🧭", "Vera", "Sua Estrategista · Plano Anual & 12 Semanas"],
    dona: ["⚡", "Dona", "Gerente do Dia · Organização & Rotina"],
    rica: ["💰", "Rica", "Coach de Vendas · Prospecção & Resultados"],
  }[agent];

  return (
    <section className="section active">
      <div className="section-heading">
        {meta[0]} {meta[1]}
      </div>
      <div className="section-sub">{meta[2]}</div>

      <div className="chat-container">
        <div className="agent-list">
          <button
            className={agent === "vera" ? "agent-btn active-agent" : "agent-btn"}
            onClick={() => openSection("vera")}
          >
            <div className="agent-btn-emoji">🧭</div>
            <div className="agent-btn-info">
              <div className="agent-btn-name">Vera</div>
              <div className="agent-btn-desc">Estrategista</div>
            </div>
          </button>

          <button
            className={agent === "dona" ? "agent-btn active-agent" : "agent-btn"}
            onClick={() => openSection("dona")}
          >
            <div className="agent-btn-emoji">⚡</div>
            <div className="agent-btn-info">
              <div className="agent-btn-name">Dona</div>
              <div className="agent-btn-desc">Gerente do Dia</div>
            </div>
          </button>

          <button
            className={agent === "rica" ? "agent-btn active-agent" : "agent-btn"}
            onClick={() => openSection("rica")}
          >
            <div className="agent-btn-emoji">💰</div>
            <div className="agent-btn-info">
              <div className="agent-btn-name">Rica</div>
              <div className="agent-btn-desc">Coach de Vendas</div>
            </div>
          </button>
        </div>

        <div className="chat-area">
          <div className="chat-header">
            <div className="chat-agent-emoji">{meta[0]}</div>
            <div>
              <div className="chat-agent-name">{meta[1]}</div>
              <div className="chat-agent-role">{meta[2]}</div>
            </div>
            <div className="chat-online">
              <div className="online-dot" /> Online
            </div>
          </div>

          <div className="chat-messages">
            {chats[agent].map((msg, index) => (
              <div className={`message ${msg.from}`} key={`${msg.text}-${index}`}>
                <div className="msg-bubble">{msg.text}</div>
                <div className="msg-time">{msg.time}</div>

                {msg.replies && (
                  <div className="quick-replies">
                    {msg.replies.map((reply) => (
                      <button
                        className="quick-reply"
                        key={reply}
                        onClick={() => sendReply(agent, reply)}
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="chat-input-area">
            <textarea
              className="chat-input"
              placeholder={`Escreva para ${meta[1]}…`}
              rows={1}
              value={inputs[agent]}
              onChange={(e) =>
                setInputs((old) => ({ ...old, [agent]: e.target.value }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(agent);
                }
              }}
            />
            <button className="chat-send" onClick={() => sendMessage(agent)}>
              ➤
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinanceiroResumo({ full = false }: { full?: boolean }) {
  return (
    <>
      <div className="grid-3">
        <div className="fin-card">
          <div className="fin-label">Faturado este mês</div>
          <div className="fin-amount">R$ 800</div>
          <div className="fin-sub">Meta: R$ 3.000 · 27% concluído</div>
          <div className="fin-progress">
            <div />
          </div>
        </div>

        <div className="card center-card">
          <div className="fin-label light">Para a meta</div>
          <div className="center-amount">R$ 2.200</div>
          <p>faltam este mês</p>
        </div>

        <div className="card center-card">
          <div className="fin-label light">Dias restantes</div>
          <div className="center-amount">28</div>
          <p className="danger">R$ 78/dia necessário</p>
        </div>
      </div>

      {full && (
        <div className="grid-2">
          <div className="card">
            <div className="card-title">📥 Entradas — Maio</div>
            <div className="fin-row">
              <span>Cliente A — Consultoria</span>
              <strong className="fin-positive">+ R$ 500</strong>
            </div>
            <div className="fin-row">
              <span>Cliente B — Design</span>
              <strong className="fin-positive">+ R$ 300</strong>
            </div>
          </div>

          <div className="card">
            <div className="card-title">📤 Saídas — Maio</div>
            <div className="fin-row">
              <span>Ferramentas digitais</span>
              <strong className="fin-negative">- R$ 120</strong>
            </div>
            <div className="fin-row">
              <span>Transporte</span>
              <strong className="fin-negative">- R$ 80</strong>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MetricCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="card metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-sub">{sub}</div>
    </div>
  );
}

function CheckinModal({ close }: { close: () => void }) {
  const [selected, setSelected] = useState<string[]>(["📱 Postei conteúdo"]);

  function toggle(value: string) {
    setSelected((old) =>
      old.includes(value) ? old.filter((item) => item !== value) : [...old, value]
    );
  }

  const options = [
    "😊 Bem",
    "😐 Ok",
    "😔 Cansada",
    "😤 Estressada",
    "🤯 Sobrecarregada",
    "📱 Postei conteúdo",
    "💬 Prospectei",
    "💰 Vendi algo",
    "🏠 Cuidei da casa",
    "🚶 Me exercitei",
  ];

  return (
    <div className="modal-overlay" onClick={close}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-step">Check-in — Passo 1 de 3</div>
          <div className="modal-title">Como foi seu dia? 🌙</div>
          <div className="modal-subtitle">
            2 minutinhos. Esse registro ajuda a Dona a organizar seu amanhã.
          </div>
        </div>

        <div className="modal-body">
          <div className="form-field">
            <label className="form-label">Como você se sentiu hoje?</label>
            <div className="form-options">
              {options.slice(0, 5).map((option) => (
                <button
                  key={option}
                  className={
                    selected.includes(option)
                      ? "form-option selected"
                      : "form-option"
                  }
                  onClick={() => toggle(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">O que você conseguiu fazer?</label>
            <div className="form-options">
              {options.slice(5).map((option) => (
                <button
                  key={option}
                  className={
                    selected.includes(option)
                      ? "form-option selected"
                      : "form-option"
                  }
                  onClick={() => toggle(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">
              Uma coisa importante para amanhã:
            </label>
            <input
              className="form-input"
              placeholder="Ex: Enviar proposta para 2 pessoas..."
            />
          </div>
        </div>

        <div className="modal-footer">
          <div className="modal-progress">
            <div className="modal-dot done" />
            <div className="modal-dot active" />
            <div className="modal-dot" />
          </div>

          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={close}>
              Agora não
            </button>
            <button className="btn btn-primary" onClick={close}>
              Salvar →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
