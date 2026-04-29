"use client";

import Link from "next/link";
import { useMemo, useRef, useState, type PointerEvent } from "react";

type StudioView =
  | "visao"
  | "ux"
  | "relatorios"
  | "blog"
  | "email"
  | "tarefas"
  | "suporte"
  | "cnpj"
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

const tabs: { id: StudioView; label: string; icon: string; badge?: string }[] = [
  { id: "visao", label: "Visão Geral", icon: "🏠" },
  { id: "ux", label: "UX", icon: "🌳" },
  { id: "relatorios", label: "Relatórios", icon: "📊" },
  { id: "blog", label: "Relatórios Blog", icon: "📝", badge: "Novo" },
  { id: "email", label: "Relatórios E-mail", icon: "📨", badge: "Novo" },
  { id: "tarefas", label: "Tarefas do Sistema", icon: "✅", badge: "24" },
  { id: "suporte", label: "Suporte", icon: "🛟", badge: "5" },
  { id: "sitemap", label: "Subdomínios", icon: "🧬", badge: "12" },
  { id: "cnpj", label: "CNPJ", icon: "🧾", badge: "Novo" },
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


const uxStatusLabel: Record<JourneyStatus, string> = {
  ativo: "Ativo",
  andamento: "Em andamento",
  risco: "Em risco",
  alerta: "Alerta",
};

const uxStatusClass: Record<JourneyStatus, string> = {
  ativo: "ux-status-pink",
  andamento: "ux-status-green",
  risco: "ux-status-red",
  alerta: "ux-status-yellow",
};

const uxNodes: JourneyNode[] = [
  {
    id: "entrada",
    title: "Entrada do usuário",
    icon: "👤",
    status: "ativo",
    position: { left: "18%", top: "12%" },
    steps: ["Viu conteúdo", "Clicou no link", "Chegou na home"],
    description: "Mostra por onde o usuário chega antes de conhecer o ecossistema Sualuma.",
  },
  {
    id: "home",
    title: "Home",
    icon: "🏠",
    status: "ativo",
    position: { left: "50%", top: "8%" },
    steps: ["Acessa a home", "Lê a promessa", "Escolhe uma ação"],
    description: "Primeiro contato real com a plataforma, promessa principal e caminhos de entrada.",
  },
  {
    id: "minha-empresa",
    title: "Minha empresa",
    icon: "🏢",
    status: "ativo",
    position: { left: "64%", top: "21%" },
    steps: ["Entrou na área", "Visualizou dados da empresa", "Consultou documentos", "Acompanhou situação do CNPJ"],
    description: "Mostra a jornada do usuário quando ele acessa a área Minha empresa para acompanhar situação, documentos e ações do negócio.",
  },
  {
    id: "cadastro",
    title: "Cadastro/Login",
    icon: "🔐",
    status: "ativo",
    position: { left: "15%", top: "29%" },
    steps: ["Clica em entrar", "Cria conta", "Confirma acesso"],
    description: "Fluxo de autenticação, cadastro, login e possíveis limites de acesso.",
  },
  {
    id: "onboarding",
    title: "Onboarding",
    icon: "🤖",
    status: "andamento",
    position: { left: "15%", top: "48%" },
    steps: ["Boas-vindas", "Tour guiado", "Primeira ação", "Usuário pronto"],
    description: "Explica o que acontece depois do cadastro e como o usuário aprende a usar.",
  },
  {
    id: "suporte",
    title: "Dúvida/Suporte",
    icon: "🎧",
    status: "ativo",
    position: { left: "18%", top: "67%" },
    steps: ["Abriu dúvida", "IA responde", "Ticket criado", "Resolvido"],
    description: "Mostra o caminho quando o usuário tem uma dúvida ou precisa de atendimento.",
  },
  {
    id: "email",
    title: "E-mail enviado?",
    icon: "✉️",
    status: "alerta",
    position: { left: "33%", top: "81%" },
    steps: ["Evento disparado", "E-mail preparado", "Envio validado", "Entrega monitorada"],
    description: "Confere se o usuário recebeu o e-mail certo depois de cada ação importante.",
  },
  {
    id: "compra",
    title: "Compra",
    icon: "🛒",
    status: "ativo",
    position: { left: "82%", top: "12%" },
    steps: ["Carrinho aberto", "Pagamento iniciado", "Pagamento concluído", "Confirmação enviada"],
    description: "Acompanha o caminho completo de compra, pagamento e confirmação.",
  },
  {
    id: "indicacao",
    title: "Indicação",
    icon: "👥",
    status: "andamento",
    position: { left: "78%", top: "30%" },
    steps: ["Usuário indica", "Link rastreado", "Novo lead entra", "Recompensa registrada"],
    description: "Mostra o que acontece quando alguém indica a plataforma para outra pessoa.",
  },
  {
    id: "prestador",
    title: "Prestador de serviço",
    icon: "🧰",
    status: "andamento",
    position: { left: "78%", top: "49%" },
    steps: ["Entra na área", "Completa perfil", "Ativa serviços", "Recebe oportunidades"],
    description: "Fluxo para transformar um usuário em prestador dentro da plataforma.",
  },
  {
    id: "empresa",
    title: "Empresa cria proposta",
    icon: "📄",
    status: "alerta",
    position: { left: "78%", top: "68%" },
    steps: ["Empresa entra", "Publica demanda", "Recebe propostas", "Escolhe profissional"],
    description: "Mostra como uma empresa consegue criar uma proposta ou contratar serviços.",
  },
  {
    id: "contratacao",
    title: "Contratação",
    icon: "✅",
    status: "ativo",
    position: { left: "58%", top: "82%" },
    steps: ["Proposta aceita", "Pagamento combinado", "Projeto iniciado", "Entrega acompanhada"],
    description: "Acompanha o momento em que uma contratação acontece dentro do ecossistema.",
  },
  {
    id: "retencao",
    title: "Retenção",
    icon: "💗",
    status: "ativo",
    position: { left: "82%", top: "84%" },
    steps: ["Usuário volta", "Recebe novidades", "Gera novo valor", "Continua ativo"],
    description: "Mostra o que mantém o usuário voltando, comprando e usando a plataforma.",
  },
];

function UXTreeInline() {
  const [selectedNode, setSelectedNode] = useState<JourneyNode | null>(null);
  const [customNodes, setCustomNodes] = useState<JourneyNode[]>([]);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const dragState = useRef({
    active: false,
    x: 0,
    y: 0,
    moved: false,
  });

  const activePath = useMemo(() => {
    if (!selectedNode) return "";
    return selectedNode.steps.join(" → ");
  }, [selectedNode]);

  const customSlots = [
    { left: "63%", top: "36%" },
    { left: "42%", top: "26%" },
    { left: "64%", top: "58%" },
    { left: "40%", top: "62%" },
  ];

  function addCustomBranch() {
    if (dragState.current.moved) return;

    const index = customNodes.length + 1;
    const slot = customSlots[(index - 1) % customSlots.length];

    setCustomNodes((current) => [
      ...current,
      {
        id: `custom-${Date.now()}`,
        title: index === 1 ? "Novo galho" : `Novo galho ${index}`,
        icon: "✨",
        status: "alerta",
        position: slot,
        steps: ["Galho criado", "Escolher destino", "Conectar fluxo", "Salvar jornada"],
        description: "Novo ponto criado a partir do tronco para conectar uma nova área, fluxo ou jornada.",
      },
    ]);
  }

  function getPoint(position: { left: string; top: string }) {
    return {
      x: (parseFloat(position.left) / 100) * 1000,
      y: (parseFloat(position.top) / 100) * 680,
    };
  }

  function customBranchPath(position: { left: string; top: string }) {
    const point = getPoint(position);
    const middleX = (500 + point.x) / 2;
    const middleY = (520 + point.y) / 2;

    return `M500 520 C${middleX} ${middleY + 40} ${middleX} ${point.y - 40} ${point.x} ${point.y}`;
  }

  function handleStagePointerDown(event: PointerEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;

    if (target.closest("button, a, input, textarea, .ux-popup")) return;

    dragState.current = {
      active: true,
      x: event.clientX,
      y: event.clientY,
      moved: false,
    };

    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleStagePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragState.current.active) return;

    const dx = event.clientX - dragState.current.x;
    const dy = event.clientY - dragState.current.y;

    if (Math.abs(dx) + Math.abs(dy) > 3) {
      dragState.current.moved = true;
    }

    dragState.current.x = event.clientX;
    dragState.current.y = event.clientY;

    setPan((current) => ({
      x: current.x + dx,
      y: current.y + dy,
    }));
  }

  function handleStagePointerUp() {
    dragState.current.active = false;
    setIsDragging(false);
  }

  return (
    <section className="ux-inline-shell">
      <div
        className={`ux-inline-stage ${isDragging ? "dragging" : ""}`}
        onPointerDown={handleStagePointerDown}
        onPointerMove={handleStagePointerMove}
        onPointerUp={handleStagePointerUp}
        onPointerLeave={handleStagePointerUp}
      >
        <div
          className="ux-pan-layer"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}
        >
        <svg className="ux-branches" viewBox="0 0 1000 680" preserveAspectRatio="none">
          <defs>
            <linearGradient id="uxBranchGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ff4fbd" />
              <stop offset="45%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
            <filter id="uxGlow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <path d="M500 390 C420 260 300 120 180 82" />
          <path d="M500 310 C500 200 500 110 500 54" />
          <path d="M500 340 C555 255 605 175 650 140" />
          <path d="M500 420 C385 330 260 220 150 197" />
          <path d="M500 470 C380 420 260 340 150 326" />
          <path d="M500 525 C390 520 285 460 180 456" />
          <path d="M500 575 C435 570 380 545 330 551" />
          <path d="M500 390 C610 255 720 120 820 82" />
          <path d="M500 435 C610 360 700 240 780 204" />
          <path d="M500 492 C620 465 700 355 780 333" />
          <path d="M500 545 C620 540 710 470 780 462" />
          <path d="M500 585 C535 562 560 552 580 558" />
          <path d="M500 600 C620 615 725 578 820 571" />

          {customNodes.map((node) => {
            const point = getPoint(node.position);
            return (
              <g key={`branch-${node.id}`}>
                <path className="ux-custom-branch" d={customBranchPath(node.position)} />
                <circle cx={point.x} cy={point.y} r="7" />
              </g>
            );
          })}

          <circle cx="180" cy="82" r="7" />
          <circle cx="500" cy="54" r="7" />
          <circle cx="650" cy="140" r="7" />
          <circle cx="150" cy="197" r="7" />
          <circle cx="150" cy="326" r="7" />
          <circle cx="180" cy="456" r="7" />
          <circle cx="330" cy="551" r="7" />
          <circle cx="820" cy="82" r="7" />
          <circle cx="780" cy="204" r="7" />
          <circle cx="780" cy="333" r="7" />
          <circle cx="780" cy="462" r="7" />
          <circle cx="580" cy="558" r="7" />
          <circle cx="820" cy="571" r="7" />
        </svg>

        <div
          className="ux-tree-trunk"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={addCustomBranch}
          title="Clique para criar um novo galho"
        >
          <div className="ux-trunk-shine" />
          <div className="ux-face">
            <span className="ux-eye left" />
            <span className="ux-eye right" />
            <span className="ux-mouth" />
          </div>
          <div className="ux-speech one">Tá tudo bem? 😊</div>
          <div className="ux-speech two">Vamos ver essa área? 👀</div>
        </div>

        {[...uxNodes, ...customNodes].map((node) => (
          <button
            key={node.id}
            onClick={() => setSelectedNode(node)}
            onPointerDown={(event) => event.stopPropagation()}
            className={`ux-node ${uxStatusClass[node.status]} ${selectedNode?.id === node.id ? "selected" : ""}`}
            style={{ left: node.position.left, top: node.position.top }}
          >
            <span className="ux-leaf a" />
            <span className="ux-leaf b" />
            <span className="ux-node-icon">{node.icon}</span>
            <strong>{node.title}</strong>
            <small>
              <i /> {uxStatusLabel[node.status]}
            </small>
          </button>
        ))}

        {selectedNode && (
          <div className={`ux-popup ${uxStatusClass[selectedNode.status]}`}>
            <button className="ux-close" onClick={() => setSelectedNode(null)} aria-label="Fechar">
              ×
            </button>

            <div className="ux-popup-icon">{selectedNode.icon}</div>
            <h3>{selectedNode.title}</h3>
            <p>{selectedNode.description}</p>

            <div className="ux-flow-path">{activePath}</div>

            <div className="ux-timeline">
              {selectedNode.steps.map((step, index) => (
                <div key={step} className={index === selectedNode.steps.length - 1 ? "done" : ""}>
                  <span>{index + 1}</span>
                  <strong>{step}</strong>
                  <small>{index === selectedNode.steps.length - 1 ? "Concluído" : "Mapeado"}</small>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      </div>

      <style>{`
        .ux-inline-shell {
          min-height: calc(100vh - 170px);
          border-radius: 28px;
          border: 1px solid rgba(255,255,255,.10);
          background:
            radial-gradient(circle at 50% 45%, rgba(255,79,189,.16), transparent 34%),
            radial-gradient(circle at 75% 20%, rgba(56,189,248,.11), transparent 28%),
            linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,.018));
          box-shadow: 0 24px 90px rgba(0,0,0,.28);
          overflow: hidden;
        }

        .ux-inline-stage {
          position: relative;
          height: calc(100vh - 170px);
          min-height: 760px;
          width: 100%;
          overflow: hidden;
          cursor: grab;
          touch-action: none;
        }

        .ux-inline-stage.dragging {
          cursor: grabbing;
        }

        .ux-pan-layer {
          position: absolute;
          inset: 0;
          transform-origin: 0 0;
          will-change: transform;
        }

        .ux-branches {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          pointer-events: none;
        }

        .ux-branches path {
          fill: none;
          stroke: url(#uxBranchGradient);
          stroke-width: 6;
          stroke-linecap: round;
          filter: url(#uxGlow);
          opacity: .86;
          animation: uxBranchPulse 5s ease-in-out infinite;
        }

        .ux-custom-branch {
          stroke-dasharray: 12 10;
          animation: uxBranchPulse 2.6s ease-in-out infinite;
        }

        .ux-branches circle {
          fill: #ff9be6;
          stroke: rgba(255,255,255,.92);
          stroke-width: 2;
          filter: drop-shadow(0 0 12px #ff4fbd);
        }

        @keyframes uxBranchPulse {
          0%, 100% { opacity: .62; }
          50% { opacity: 1; }
        }

        .ux-tree-trunk {
          position: absolute;
          cursor: pointer;
          z-index: 2;
          left: 50%;
          bottom: -8px;
          transform: translateX(-50%);
          width: 250px;
          height: 465px;
          background:
            linear-gradient(95deg, rgba(255,79,189,.25), rgba(168,85,247,.15), rgba(56,189,248,.11)),
            linear-gradient(180deg, #ff4fbd, #a855f7 55%, #4f46e5);
          clip-path: polygon(43% 0, 57% 0, 70% 38%, 84% 100%, 16% 100%, 30% 38%);
          box-shadow:
            0 0 45px rgba(255,79,189,.65),
            0 0 120px rgba(168,85,247,.42);
          animation: uxTrunkGlow 3.5s ease-in-out infinite;
        }

        .ux-trunk-shine {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(120deg, transparent, rgba(255,255,255,.36), transparent),
            radial-gradient(circle at 50% 38%, rgba(255,255,255,.35), transparent 18%);
          transform: translateX(-100%);
          animation: uxEnergy 3s linear infinite;
        }

        @keyframes uxEnergy {
          0% { transform: translateX(-120%) rotate(8deg); opacity: .2; }
          45% { opacity: .7; }
          100% { transform: translateX(120%) rotate(8deg); opacity: .15; }
        }

        @keyframes uxTrunkGlow {
          0%, 100% {
            filter: saturate(1);
            box-shadow: 0 0 45px rgba(255,79,189,.58), 0 0 120px rgba(168,85,247,.38);
          }
          50% {
            filter: saturate(1.25);
            box-shadow: 0 0 70px rgba(255,79,189,.95), 0 0 160px rgba(56,189,248,.38);
          }
        }

        .ux-face {
          position: absolute;
          left: 50%;
          top: 46%;
          transform: translate(-50%, -50%);
          width: 90px;
          height: 60px;
          z-index: 3;
        }

        .ux-eye {
          position: absolute;
          top: 7px;
          width: 20px;
          height: 28px;
          border-radius: 50%;
          background: #ff9be6;
          box-shadow: 0 0 22px #ff4fbd;
          animation: uxBlink 4s infinite;
        }

        .ux-eye.left { left: 15px; }
        .ux-eye.right { right: 15px; }

        @keyframes uxBlink {
          0%, 92%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(.12); }
        }

        .ux-mouth {
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

        .ux-speech {
          position: absolute;
          padding: 9px 12px;
          border-radius: 13px;
          color: #fff;
          font-size: 12px;
          background: rgba(20,14,32,.78);
          border: 1px solid rgba(255,79,189,.28);
          box-shadow: 0 0 20px rgba(255,79,189,.20);
          animation: uxFloat 4s ease-in-out infinite;
          white-space: nowrap;
        }

        .ux-speech.one {
          left: -108px;
          top: 205px;
        }

        .ux-speech.two {
          right: -128px;
          top: 292px;
          animation-delay: 1s;
        }

        @keyframes uxFloat {
          0%, 100% { transform: translateY(0); opacity: .75; }
          50% { transform: translateY(-9px); opacity: 1; }
        }

        .ux-node {
          position: absolute;
          z-index: 4;
          width: 176px;
          min-height: 88px;
          transform: translate(-50%, -50%);
          border-radius: 17px;
          padding: 13px 14px;
          color: #fff;
          text-align: left;
          cursor: pointer;
          background: rgba(10,12,26,.82);
          backdrop-filter: blur(18px);
          transition: .25s ease;
        }

        .ux-node:hover,
        .ux-node.selected {
          transform: translate(-50%, -50%) scale(1.05);
          z-index: 10;
        }

        .ux-node-icon {
          font-size: 20px;
        }

        .ux-node strong {
          display: block;
          font-size: 14px;
          line-height: 1.18;
          margin-top: 6px;
        }

        .ux-node small {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 8px;
          color: rgba(255,255,255,.72);
        }

        .ux-node small i {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
        }

        .ux-leaf {
          position: absolute;
          width: 22px;
          height: 12px;
          border-radius: 100% 0;
          opacity: .85;
          z-index: -1;
          filter: blur(.1px) drop-shadow(0 0 10px currentColor);
          animation: uxLeaf 3.8s ease-in-out infinite;
        }

        .ux-leaf.a {
          left: -21px;
          top: 14px;
          transform: rotate(-28deg);
        }

        .ux-leaf.b {
          right: -18px;
          bottom: 20px;
          transform: rotate(145deg);
          animation-delay: .9s;
        }

        @keyframes uxLeaf {
          0%, 100% { translate: 0 0; }
          50% { translate: 0 -5px; }
        }

        .ux-status-pink {
          border: 1px solid rgba(255,79,189,.75);
          box-shadow: 0 0 24px rgba(255,79,189,.28), inset 0 0 22px rgba(255,79,189,.08);
        }

        .ux-status-pink .ux-leaf,
        .ux-status-pink small i {
          color: #ff4fbd;
          background: #ff4fbd;
        }

        .ux-status-green {
          border: 1px solid rgba(34,197,94,.75);
          box-shadow: 0 0 24px rgba(34,197,94,.24), inset 0 0 22px rgba(34,197,94,.07);
        }

        .ux-status-green .ux-leaf,
        .ux-status-green small i {
          color: #22c55e;
          background: #22c55e;
        }

        .ux-status-red {
          border: 1px solid rgba(248,63,94,.75);
          box-shadow: 0 0 24px rgba(248,63,94,.24), inset 0 0 22px rgba(248,63,94,.07);
        }

        .ux-status-red .ux-leaf,
        .ux-status-red small i {
          color: #fb395f;
          background: #fb395f;
        }

        .ux-status-yellow {
          border: 1px solid rgba(250,204,21,.78);
          box-shadow: 0 0 24px rgba(250,204,21,.22), inset 0 0 22px rgba(250,204,21,.07);
        }

        .ux-status-yellow .ux-leaf,
        .ux-status-yellow small i {
          color: #facc15;
          background: #facc15;
        }

        .ux-popup {
          position: absolute;
          z-index: 30;
          right: 18px;
          top: 120px;
          width: 335px;
          border-radius: 22px;
          padding: 18px;
          background: rgba(12,13,30,.90);
          backdrop-filter: blur(26px);
        }

        .ux-close {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 34px;
          height: 34px;
          border: 1px solid rgba(255,255,255,.10);
          color: rgba(255,255,255,.8);
          font-size: 24px;
          line-height: 1;
          background: rgba(255,255,255,.05);
          border-radius: 12px;
          cursor: pointer;
        }

        .ux-popup-icon {
          width: 58px;
          height: 58px;
          border-radius: 17px;
          display: grid;
          place-items: center;
          font-size: 25px;
          background: rgba(255,79,189,.15);
          margin-bottom: 12px;
        }

        .ux-popup h3 {
          margin: 0 0 8px;
          font-size: 20px;
        }

        .ux-popup p {
          margin: 0;
          color: rgba(255,255,255,.62);
          font-size: 13px;
          line-height: 1.5;
        }

        .ux-flow-path {
          margin: 14px 0;
          border-radius: 13px;
          padding: 11px;
          color: #ff92dc;
          background: rgba(255,79,189,.08);
          font-size: 12px;
          line-height: 1.5;
        }

        .ux-timeline {
          display: grid;
          gap: 10px;
          margin: 14px 0 0;
        }

        .ux-timeline div {
          display: grid;
          grid-template-columns: 30px 1fr auto;
          align-items: center;
          gap: 10px;
        }

        .ux-timeline span {
          width: 27px;
          height: 27px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: rgba(255,255,255,.08);
          color: #fff;
          font-size: 12px;
        }

        .ux-timeline strong {
          font-size: 13px;
        }

        .ux-timeline small {
          color: rgba(255,255,255,.43);
          font-size: 11px;
        }

        .ux-timeline .done span {
          background: #ff4fbd;
          box-shadow: 0 0 18px rgba(255,79,189,.55);
        }

        @media (max-width: 980px) {
          .ux-inline-shell {
            overflow: auto;
          }

          .ux-inline-stage {
            width: 1040px;
            height: 760px;
          }
        }
      `}</style>
    </section>
  );
}



const blogReportCards = [
  { title: "Posts publicados", value: "38", detail: "Conteúdos ativos no blog", tone: "pink" as Tone },
  { title: "Acessos no blog", value: "12.480", detail: "Últimos 30 dias", tone: "blue" as Tone },
  { title: "Cliques para loja/site", value: "1.284", detail: "Tráfego enviado para conversão", tone: "green" as Tone },
  { title: "Posts com problema", value: "4", detail: "Revisar links, SEO ou imagem", tone: "yellow" as Tone },
];

const blogReportRows = [
  { title: "Melhor post da semana", detail: "Como automatizar atendimento e vender mais", value: "2.140 acessos", tone: "pink" as Tone },
  { title: "Post com maior conversão", detail: "Guia de criação de site profissional", value: "18,4%", tone: "green" as Tone },
  { title: "Alerta SEO", detail: "4 posts sem meta description forte", value: "corrigir", tone: "yellow" as Tone },
  { title: "Link quebrado encontrado", detail: "Um CTA antigo pode estar indo para página errada", value: "verificar", tone: "red" as Tone },
];


const blogSeoCards = [
  { title: "SEO geral", value: "74/100", detail: "Bom, mas ainda tem espaço para crescer", tone: "yellow" as Tone },
  { title: "Posts indexáveis", value: "34", detail: "Conteúdos prontos para ranquear", tone: "green" as Tone },
  { title: "Problemas SEO", value: "9", detail: "Títulos, metas, links e imagens", tone: "red" as Tone },
  { title: "Oportunidades", value: "18", detail: "Novas pautas e palavras-chave", tone: "pink" as Tone },
];

const blogSeoRows = [
  { title: "Meta descriptions fracas", detail: "Alguns posts precisam de descrição mais persuasiva para melhorar clique no Google.", value: "4 posts", tone: "yellow" as Tone },
  { title: "Títulos pouco estratégicos", detail: "Criar títulos com promessa clara, palavra-chave e benefício direto.", value: "3 posts", tone: "pink" as Tone },
  { title: "Imagens sem ALT forte", detail: "Adicionar texto alternativo com contexto e palavra-chave principal.", value: "7 imagens", tone: "red" as Tone },
  { title: "Links internos insuficientes", detail: "Conectar posts do blog com páginas de serviço, planos e loja.", value: "alta prioridade", tone: "blue" as Tone },
  { title: "Posts com potencial de ranqueamento", detail: "Conteúdos sobre IA, automação, sites e captação podem puxar tráfego qualificado.", value: "18 ideias", tone: "green" as Tone },
];

const blogKeywordRows = [
  { title: "automação para pequenos negócios", detail: "Boa intenção comercial para atrair empreendedores.", value: "prioridade", tone: "pink" as Tone },
  { title: "site profissional para empresa", detail: "Pode levar para página de construção de sites.", value: "vendas", tone: "green" as Tone },
  { title: "como usar IA para vender mais", detail: "Boa pauta para topo de funil e autoridade.", value: "conteúdo", tone: "blue" as Tone },
  { title: "ferramentas para microempreendedor", detail: "Pode conectar com Minha Empresa, serviços e automações.", value: "estratégico", tone: "yellow" as Tone },
];

const blogSeoChecklist = [
  { title: "Sitemap do blog", detail: "Confirmar se o sitemap do blog está atualizado e enviado ao Google Search Console.", value: "verificar", tone: "blue" as Tone },
  { title: "Canonical das páginas", detail: "Evitar duplicação e deixar claro qual URL deve ranquear.", value: "técnico", tone: "yellow" as Tone },
  { title: "Schema/JSON-LD", detail: "Adicionar estrutura de Article, Breadcrumb e Organization.", value: "ganho SEO", tone: "pink" as Tone },
  { title: "Velocidade mobile", detail: "O blog precisa carregar rápido no celular para melhorar experiência e ranking.", value: "importante", tone: "green" as Tone },
];

const emailReportCards = [
  { title: "E-mails enviados", value: "8.420", detail: "Campanhas e automações", tone: "pink" as Tone },
  { title: "Taxa de abertura", value: "41,8%", detail: "Média dos últimos envios", tone: "green" as Tone },
  { title: "Cliques", value: "1.126", detail: "Pessoas que clicaram nos CTAs", tone: "blue" as Tone },
  { title: "Falhas/Bounces", value: "72", detail: "E-mails que precisam limpeza", tone: "red" as Tone },
];

const emailReportRows = [
  { title: "Campanha com melhor resultado", detail: "Lista de espera do Studio Sualuma", value: "52% abertura", tone: "pink" as Tone },
  { title: "Automação principal", detail: "Boas-vindas após cadastro", value: "ativa", tone: "green" as Tone },
  { title: "Alerta de entregabilidade", detail: "Limpar contatos inválidos e revisar assunto", value: "prioridade", tone: "yellow" as Tone },
  { title: "Oportunidade", detail: "Criar sequência para leads que não compraram", value: "alto impacto", tone: "blue" as Tone },
];


const financeDashboardCards = [
  { title: "Receita do mês", value: "R$ 48.750", detail: "+18,6% vs mês anterior", tone: "pink" as Tone },
  { title: "Lucro líquido", value: "R$ 36.320", detail: "Margem estimada de 74,5%", tone: "green" as Tone },
  { title: "Gastos totais", value: "R$ 12.430", detail: "Ferramentas, operação e marketing", tone: "red" as Tone },
  { title: "Reinvestimento", value: "R$ 8.600", detail: "Reserva sugerida para crescer", tone: "blue" as Tone },
];

const financeRevenueRows = [
  { title: "Planos e assinaturas", detail: "Receita recorrente dos usuários ativos no Studio e áreas membros.", value: "R$ 21.400", tone: "pink" as Tone },
  { title: "Serviços contratados", detail: "Construção de sites, automações, suporte e projetos vendidos.", value: "R$ 14.200", tone: "green" as Tone },
  { title: "Indicações / afiliados", detail: "Comissões, indicações internas e parcerias estratégicas.", value: "R$ 7.150", tone: "yellow" as Tone },
  { title: "Marketplace e extras", detail: "Produtos digitais, upgrades, templates e recursos adicionais.", value: "R$ 6.000", tone: "blue" as Tone },
];

const financeCostRows = [
  { title: "Infraestrutura", detail: "VPS, domínios, banco de dados, armazenamento e serviços técnicos.", value: "R$ 2.150", tone: "blue" as Tone },
  { title: "IA e ferramentas", detail: "APIs, modelos, automações, editores e ferramentas de produtividade.", value: "R$ 3.280", tone: "yellow" as Tone },
  { title: "Marketing", detail: "Testes de aquisição, criativos, tráfego, influenciadores e distribuição.", value: "R$ 2.900", tone: "pink" as Tone },
  { title: "Operação", detail: "Equipe, suporte, freelancers, manutenção e execução de entregas.", value: "R$ 4.100", tone: "green" as Tone },
];

const financeProjectionRows = [
  { title: "Projeção conservadora", detail: "Mantendo o ritmo atual sem escalar campanha.", value: "R$ 58 mil", tone: "blue" as Tone },
  { title: "Projeção agressiva", detail: "Com correção de funil, blog, e-mail e melhoria de conversão.", value: "R$ 92 mil", tone: "pink" as Tone },
  { title: "Meta de caixa", detail: "Reserva mínima para operar com segurança e reinvestir.", value: "R$ 20 mil", tone: "green" as Tone },
  { title: "Ponto de atenção", detail: "Custo com ferramentas pode crescer se agentes não forem otimizados.", value: "monitorar", tone: "yellow" as Tone },
];

const financeMiaRows = [
  { title: "Prioridade 1", detail: "Separar receita recorrente de receita avulsa para enxergar previsibilidade.", value: "fazer agora", tone: "pink" as Tone },
  { title: "Prioridade 2", detail: "Criar categoria de reinvestimento para marketing, produto e infraestrutura.", value: "essencial", tone: "green" as Tone },
  { title: "Prioridade 3", detail: "Medir ROI de cada agente: quanto economiza, vende ou evita suporte.", value: "alto impacto", tone: "blue" as Tone },
  { title: "Alerta", detail: "Sem integração no banco, os números ainda são demonstrativos.", value: "mockado", tone: "yellow" as Tone },
];

const financeBars = [
  { label: "Planos", value: "44%", tone: "pink" as Tone },
  { label: "Serviços", value: "29%", tone: "green" as Tone },
  { label: "Indicações", value: "15%", tone: "yellow" as Tone },
  { label: "Marketplace", value: "12%", tone: "blue" as Tone },
];

const financeCostBars = [
  { label: "Operação", value: "33%", tone: "green" as Tone },
  { label: "Ferramentas/IA", value: "26%", tone: "yellow" as Tone },
  { label: "Marketing", value: "23%", tone: "pink" as Tone },
  { label: "Infra", value: "18%", tone: "blue" as Tone },
];


const systemTaskRows = [
  { title: "Corrigir páginas de entrada", detail: "Home, blog, planos e páginas de captura precisam estar sem erro para receber leads.", value: "em risco", tone: "red" as Tone, tag: "Sistema" },
  { title: "Ativar rastreio por subdomínio", detail: "Monitorar tráfego e origem dos leads por área do ecossistema.", value: "em andamento", tone: "yellow" as Tone, tag: "Marketing" },
  { title: "Finalizar UX da árvore", detail: "Mapear jornadas principais e transformar em fluxos conectados ao banco.", value: "ativo", tone: "pink" as Tone, tag: "UX" },
  { title: "Criar Agente Sitemap", detail: "Detectar páginas quebradas automaticamente e alimentar notificações.", value: "em andamento", tone: "green" as Tone, tag: "Agentes" },
  { title: "Melhorar onboarding", detail: "Diminuir abandono depois do cadastro e guiar usuário até a primeira ação.", value: "em risco", tone: "red" as Tone, tag: "Usuários" },
  { title: "Conectar financeiro ao banco", detail: "Trocar dados mockados por dados reais do Supabase e Stripe depois.", value: "ativo", tone: "blue" as Tone, tag: "Financeiro" },
];

const supportRows = [
  { title: "Usuário travou no login", detail: "Falha provável: confirmação de e-mail ou sessão expirada.", value: "urgente", tone: "red" as Tone },
  { title: "Pagamento pendente", detail: "Usuário tentou contratar plano, mas não completou checkout.", value: "verificar", tone: "yellow" as Tone },
  { title: "Erro ao abrir área de serviços", detail: "Possível falha de permissão ou plano sem acesso liberado.", value: "suporte", tone: "pink" as Tone },
  { title: "Dúvida sobre proposta", detail: "Empresa quer contratar, mas não sabe qual fluxo seguir.", value: "oportunidade", tone: "green" as Tone },
];

const serviceDeepRows = [
  { title: "Catálogo de serviços", detail: "Listagem de serviços ativos, pausados, em análise e sem categoria.", value: "42 ativos", tone: "green" as Tone },
  { title: "Empresas sem contratação", detail: "Entraram, visualizaram, mas não fecharam nenhum prestador.", value: "13 empresas", tone: "yellow" as Tone },
  { title: "Gargalo de briefing", detail: "Muitas empresas param antes de explicar o que precisam.", value: "alto impacto", tone: "red" as Tone },
  { title: "Prestadores parados", detail: "Profissionais cadastrados que ainda não receberam oportunidade.", value: "8 perfis", tone: "blue" as Tone },
  { title: "Serviços mais procurados", detail: "Sites, automação, social media e suporte com IA.", value: "top 4", tone: "pink" as Tone },
];

const userControlRows = [
  { title: "Ana Paula", detail: "Premium • última sessão há 4 min • usando área de serviços normalmente.", value: "ativo", tone: "green" as Tone },
  { title: "Carlos Lima", detail: "Free • parou na tela de login • possível e-mail não confirmado.", value: "erro login", tone: "red" as Tone },
  { title: "Marina Alves", detail: "Prime • checkout iniciado, pagamento pendente, acesso ainda não liberado.", value: "pendente", tone: "yellow" as Tone },
  { title: "João Pedro", detail: "Pro • sessão ativa • pediu suporte em proposta de serviço.", value: "suporte", tone: "blue" as Tone },
];

const userActionRows = [
  { title: "Liberar acesso", detail: "Ativar acesso manual para um usuário sem entrar no Supabase.", value: "ação futura", tone: "green" as Tone },
  { title: "Cancelar acesso", detail: "Bloquear plano, área ou recurso específico de um usuário.", value: "ação futura", tone: "red" as Tone },
  { title: "Ver jornada", detail: "Abrir histórico de páginas, erros, cliques e último ponto onde parou.", value: "prioridade", tone: "pink" as Tone },
  { title: "Reenviar e-mail", detail: "Reenviar confirmação, boas-vindas ou link de acesso.", value: "útil", tone: "blue" as Tone },
];

const subdomainRows = [
  {
    name: "sualuma.online",
    status: "Online",
    tone: "green" as Tone,
    links: ["/", "/planos", "/login", "/cadastro", "/site-service", "/site-demo-request"],
  },
  {
    name: "blog.sualuma.online",
    status: "Online",
    tone: "green" as Tone,
    links: ["/", "/posts", "/categorias/ia", "/categorias/automacao", "/sitemap.xml"],
  },
  {
    name: "studio.sualuma.online",
    status: "Ativo",
    tone: "pink" as Tone,
    links: ["/studio-lab", "/studio", "/studio/ux-tree", "/admin", "/admin/leads"],
  },
  {
    name: "trabalhosja.sualuma.online",
    status: "Atenção",
    tone: "yellow" as Tone,
    links: ["/", "/comunidade", "/perfil", "/posts", "/api/comunidade/posts"],
  },
  {
    name: "sospublicidade.sualuma.online",
    status: "Verificar",
    tone: "red" as Tone,
    links: ["/", "/obrigada", "/campanha", "/api/leads"],
  },
];

const cnpjNotificationRows = [
  { title: "Declaração mensal", detail: "Verificar se há pendência ou obrigação recorrente do mês.", value: "atenção", tone: "yellow" as Tone },
  { title: "Comprovantes e notas", detail: "Organizar documentos enviados e pendentes para não perder histórico.", value: "organizar", tone: "blue" as Tone },
  { title: "Situação cadastral", detail: "Monitorar se o CNPJ segue regular e sem alerta crítico.", value: "ok", tone: "green" as Tone },
];

const cnpjDeepRows = [
  { title: "Situação do CNPJ", detail: "Acompanhar se está ativo, regular, pendente ou com alguma restrição.", value: "regular", tone: "green" as Tone },
  { title: "Obrigações do mês", detail: "Guias, declarações, notas, comprovantes e prazos importantes.", value: "3 itens", tone: "yellow" as Tone },
  { title: "Documentos salvos", detail: "Notas fiscais, comprovantes, certificados e documentos do negócio.", value: "28 docs", tone: "blue" as Tone },
  { title: "Alertas importantes", detail: "Pendências que podem prejudicar emissão, venda ou regularidade.", value: "1 alerta", tone: "red" as Tone },
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
  const [selectedSubdomain, setSelectedSubdomain] = useState(subdomainRows[0]);

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
                    ["UX", "🌳", "Árvore", "left-1"],
                    ["Tarefas", "✅", "24 itens", "left-2"],
                    ["Subdomínios", "🧬", "5 áreas", "left-3"],
                    ["Usuários", "👥", "3 alertas", "right-1"],
                    ["Suporte", "🛟", "5 tickets", "right-2"],
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
                  <p className="muted">O sistema está bem, mas onboarding, suporte e páginas quebradas precisam revisão.</p>
                </div>

                <div className="panel compact">
                  <PanelTitle eyebrow="Sugestão da Mia" title="Próxima melhoria" />
                  <DataRow
                    title="Criar central de suporte"
                    detail="Ver erro, acesso, sessão e histórico do usuário sem abrir Supabase."
                    value="alto impacto"
                    tone="green"
                  />
                </div>
              </div>
            </section>

            <section className="lower-grid">
              <div className="panel">
                <PanelTitle eyebrow="CNPJ" title="Notificações rápidas da empresa" action="Ver CNPJ" />
                {cnpjNotificationRows.map((item) => (
                  <DataRow key={item.title} title={item.title} detail={item.detail} value={item.value} tone={item.tone} />
                ))}
              </div>

              <div className="panel">
                <PanelTitle eyebrow="Tarefas do Sistema" title="O que precisa atenção agora" />
                {systemTaskRows.slice(0, 4).map((item) => (
                  <DataRow key={item.title} title={item.title} detail={item.detail} value={item.value} tone={item.tone} />
                ))}
              </div>
            </section>
          </>
        )}

        {activeView === "ux" && (
          <UXTreeInline />
        )}

        {activeView === "relatorios" && (
          <>
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

        {activeView === "blog" && (
          <>
            <section className="metric-grid">
              {blogReportCards.map((item) => (
                <MetricCard key={item.title} title={item.title} value={item.value} detail={item.detail} tone={item.tone} />
              ))}
            </section>

            <section className="metric-grid seo-grid">
              {blogSeoCards.map((item) => (
                <MetricCard key={item.title} title={item.title} value={item.value} detail={item.detail} tone={item.tone} />
              ))}
            </section>

            <section className="lower-grid">
              <div className="panel">
                <PanelTitle eyebrow="Relatórios Blog" title="Performance de conteúdo" action="Novo post" />
                {blogReportRows.map((item) => (
                  <DataRow key={item.title} title={item.title} detail={item.detail} value={item.value} tone={item.tone} />
                ))}
              </div>

              <div className="panel">
                <PanelTitle eyebrow="SEO do Blog" title="Diagnóstico técnico e editorial" action="Auditar agora" />
                {blogSeoRows.map((item) => (
                  <DataRow key={item.title} title={item.title} detail={item.detail} value={item.value} tone={item.tone} />
                ))}
              </div>
            </section>

            <section className="lower-grid">
              <div className="panel">
                <PanelTitle eyebrow="Palavras-chave" title="Oportunidades para atrair leads" />
                {blogKeywordRows.map((item) => (
                  <DataRow key={item.title} title={item.title} detail={item.detail} value={item.value} tone={item.tone} />
                ))}
              </div>

              <div className="panel">
                <PanelTitle eyebrow="Checklist SEO" title="O que precisa estar funcionando" />
                {blogSeoChecklist.map((item) => (
                  <DataRow key={item.title} title={item.title} detail={item.detail} value={item.value} tone={item.tone} />
                ))}
              </div>
            </section>
          </>
        )}

        {activeView === "email" && (
          <>
            <section className="metric-grid">
              {emailReportCards.map((item) => (
                <MetricCard key={item.title} title={item.title} value={item.value} detail={item.detail} tone={item.tone} />
              ))}
            </section>

            <section className="lower-grid">
              <div className="panel">
                <PanelTitle eyebrow="Relatórios E-mail" title="Campanhas e automações" action="Nova campanha" />
                {emailReportRows.map((item) => (
                  <DataRow key={item.title} title={item.title} detail={item.detail} value={item.value} tone={item.tone} />
                ))}
              </div>

              <div className="panel">
                <PanelTitle eyebrow="Lista e entrega" title="Saúde dos envios" />
                <DataRow title="Limpar lista" detail="Remover e-mails inválidos para melhorar entregabilidade" value="72 contatos" tone="red" />
                <DataRow title="Criar sequência de nutrição" detail="Leads que entraram e ainda não compraram" value="prioridade" tone="pink" />
                <DataRow title="Testar assunto novo" detail="Melhorar abertura dos próximos disparos" value="A/B test" tone="blue" />
              </div>
            </section>
          </>
        )}

        {activeView === "tarefas" && (
          <>
            <section className="metric-grid">
              <MetricCard title="Em risco" value="6" detail="Itens que travam leads, venda ou acesso" tone="red" />
              <MetricCard title="Em andamento" value="9" detail="Tarefas sendo construídas agora" tone="yellow" />
              <MetricCard title="Ativas" value="7" detail="Áreas funcionando e monitoradas" tone="green" />
              <MetricCard title="Backlog" value="12" detail="Ideias e melhorias futuras" tone="blue" />
            </section>

            <section className="panel full">
              <PanelTitle eyebrow="Tarefas do Sistema" title="Tudo catalogado por status e prioridade" action="Nova tarefa" />
              <div className="task-board">
                {["em risco", "em andamento", "ativo"].map((status) => (
                  <div key={status} className="task-column">
                    <h3>{status}</h3>
                    {systemTaskRows.filter((item) => item.value === status).map((item) => (
                      <div key={item.title} className={`task-card ${item.tone}`}>
                        <strong>{item.title}</strong>
                        <p>{item.detail}</p>
                        <span>{item.tag}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {activeView === "suporte" && (
          <>
            <section className="metric-grid">
              <MetricCard title="Tickets abertos" value="5" detail="Pedidos que precisam resposta" tone="red" />
              <MetricCard title="Tempo médio" value="8.2s" detail="Tempo de análise da Mia" tone="blue" />
              <MetricCard title="Resolvidos" value="18" detail="Últimos 7 dias" tone="green" />
              <MetricCard title="Oportunidades" value="4" detail="Suporte que pode virar venda" tone="pink" />
            </section>

            <section className="lower-grid">
              <div className="panel">
                <PanelTitle eyebrow="Central de Suporte" title="Chamados e travas dos usuários" action="Novo ticket" />
                {supportRows.map((item) => (
                  <DataRow key={item.title} title={item.title} detail={item.detail} value={item.value} tone={item.tone} />
                ))}
              </div>

              <div className="panel">
                <PanelTitle eyebrow="O que resolver" title="Diagnóstico rápido" />
                <DataRow title="Login e acesso" detail="Principal motivo de suporte nos primeiros usuários." value="prioridade" tone="red" />
                <DataRow title="Pagamento e plano" detail="Usuário precisa enxergar status e liberação." value="importante" tone="yellow" />
                <DataRow title="Área de serviços" detail="Dúvidas podem virar contratação se a resposta for boa." value="vendas" tone="green" />
              </div>
            </section>
          </>
        )}

        {activeView === "cnpj" && (
          <>
            <section className="metric-grid">
              <MetricCard title="Situação" value="Regular" detail="Resumo demonstrativo do CNPJ" tone="green" />
              <MetricCard title="Pendências" value="1" detail="Item para verificar no mês" tone="yellow" />
              <MetricCard title="Documentos" value="28" detail="Notas e comprovantes salvos" tone="blue" />
              <MetricCard title="Alertas" value="3" detail="Notificações importantes" tone="pink" />
            </section>

            <section className="lower-grid">
              <div className="panel">
                <PanelTitle eyebrow="Relatório CNPJ" title="O que preciso saber sobre minha empresa" action="Atualizar" />
                {cnpjDeepRows.map((item) => (
                  <DataRow key={item.title} title={item.title} detail={item.detail} value={item.value} tone={item.tone} />
                ))}
              </div>

              <div className="panel">
                <PanelTitle eyebrow="Notificações" title="Acompanhamento do mês" />
                {cnpjNotificationRows.map((item) => (
                  <DataRow key={item.title} title={item.title} detail={item.detail} value={item.value} tone={item.tone} />
                ))}
              </div>
            </section>
          </>
        )}

        {activeView === "sitemap" && (
          <>
            <section className="panel full">
              <PanelTitle eyebrow="Subdomínios" title="Mapa do ecossistema Sualuma" action="Verificar todos" />

              <div className="subdomain-grid">
                {subdomainRows.map((item) => (
                  <button
                    key={item.name}
                    className={`subdomain-card ${selectedSubdomain.name === item.name ? "selected" : ""} ${item.tone}`}
                    onClick={() => setSelectedSubdomain(item)}
                  >
                    <ToneDot tone={item.tone} />
                    <strong>{item.name}</strong>
                    <span>{item.status}</span>
                  </button>
                ))}
              </div>

              <div className="sitemap-detail">
                <PanelTitle eyebrow="Sitemap do subdomínio" title={selectedSubdomain.name} />
                <div className="sitemap-list">
                  {selectedSubdomain.links.map((link) => (
                    <div key={link} className="sitemap-line">
                      <ToneDot tone={selectedSubdomain.tone} />
                      <strong>{link}</strong>
                      <span>monitorar</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
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
          <>
            <section className="metric-grid">
              {serviceSignals.map((item) => (
                <MetricCard key={item.title} title={item.title} value={item.value} detail={item.detail} tone={item.tone} />
              ))}
            </section>

            <section className="lower-grid">
              <div className="panel">
                <PanelTitle eyebrow="Painel de Serviços" title="Controle da área de serviços" action="Novo serviço" />
                {serviceDeepRows.map((item) => (
                  <DataRow key={item.title} title={item.title} detail={item.detail} value={item.value} tone={item.tone} />
                ))}
              </div>

              <div className="panel">
                <PanelTitle eyebrow="Diagnóstico" title="Onde empresas e prestadores travam" />
                <DataRow title="Empresa entra, mas não contrata" detail="Precisa melhorar explicação, confiança e exemplos de entrega." value="prioridade" tone="red" />
                <DataRow title="Prestador cadastra, mas não ativa perfil" detail="Criar checklist guiado para completar portfólio e serviço." value="em andamento" tone="yellow" />
                <DataRow title="Serviços sem categoria" detail="Catalogar melhor para busca, marketplace e recomendação da Mia." value="organizar" tone="blue" />
                <DataRow title="Oportunidade" detail="Criar agente que monta briefing e sugere prestador ideal." value="alto ROI" tone="green" />
              </div>
            </section>
          </>
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
          <>
            <section className="metric-grid">
              <MetricCard title="Usuários ativos" value="1.248" detail="Usuários com sessão ou acesso recente" tone="green" />
              <MetricCard title="Com erro recente" value="11" detail="Login, pagamento, acesso ou upload" tone="red" />
              <MetricCard title="Aguardando acesso" value="7" detail="Precisam liberação ou confirmação" tone="yellow" />
              <MetricCard title="Pedidos de suporte" value="5" detail="Chamados ligados a contas" tone="pink" />
            </section>

            <section className="panel full">
              <PanelTitle eyebrow="Controle de acesso" title="Monitoramento de usuários" action="Buscar usuário" />
              <div className="user-search">🔎 Pesquisar por nome, e-mail, ID, plano, erro ou última página acessada...</div>

              <div className="user-table enhanced">
                {userControlRows.map((user) => (
                  <div key={user.title} className="user-row">
                    <ToneDot tone={user.tone} />
                    <div>
                      <strong>{user.title}</strong>
                      <p>{user.detail}</p>
                    </div>
                    <span>{user.value}</span>
                    <button>Abrir histórico</button>
                  </div>
                ))}
              </div>
            </section>

            <section className="lower-grid">
              <div className="panel">
                <PanelTitle eyebrow="Ações futuras" title="O que controlar sem abrir Supabase" />
                {userActionRows.map((item) => (
                  <DataRow key={item.title} title={item.title} detail={item.detail} value={item.value} tone={item.tone} />
                ))}
              </div>

              <div className="panel">
                <PanelTitle eyebrow="Diagnóstico de jornada" title="O que quero enxergar por usuário" />
                <DataRow title="Onde parou" detail="Última página, último clique e etapa da jornada." value="essencial" tone="pink" />
                <DataRow title="Por que travou" detail="Erro técnico, limite de acesso, falta de permissão ou dúvida." value="suporte" tone="yellow" />
                <DataRow title="Como resolver" detail="Botões de ação rápida: liberar, reenviar, resetar, abrir ticket." value="futuro" tone="green" />
              </div>
            </section>
          </>
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
          <>
            <section className="finance-hero">
              <div className="finance-main-card">
                <PanelTitle eyebrow="Financeiro estratégico" title="Painel de dinheiro, custos e reinvestimento" action="Conectar banco" />

                <div className="finance-big-number">
                  <small>Saldo operacional estimado</small>
                  <strong>R$ 36.320,00</strong>
                  <span>Lucro líquido após custos principais do mês</span>
                </div>

                <div className="finance-mini-grid">
                  <div>
                    <small>Receita</small>
                    <strong>R$ 48.750</strong>
                    <em>+18,6%</em>
                  </div>
                  <div>
                    <small>Gastos</small>
                    <strong>R$ 12.430</strong>
                    <em className="negative">monitorar</em>
                  </div>
                  <div>
                    <small>Reinvestir</small>
                    <strong>R$ 8.600</strong>
                    <em>produto + marketing</em>
                  </div>
                </div>
              </div>

              <div className="finance-side-card">
                <PanelTitle eyebrow="Mia Financeira" title="Leitura rápida" />
                <p>
                  O financeiro está saudável, mas precisa separar origem da receita,
                  custos fixos, custos variáveis e ROI dos agentes antes de escalar.
                </p>
                <div className="finance-score">
                  <strong>82%</strong>
                  <span>Saúde financeira</span>
                </div>
              </div>
            </section>

            <section className="metric-grid finance-metrics">
              {financeDashboardCards.map((item) => (
                <MetricCard key={item.title} title={item.title} value={item.value} detail={item.detail} tone={item.tone} />
              ))}
            </section>

            <section className="lower-grid">
              <div className="panel">
                <PanelTitle eyebrow="Origem do dinheiro" title="De onde está vindo a receita" />
                {financeRevenueRows.map((item) => (
                  <DataRow key={item.title} title={item.title} detail={item.detail} value={item.value} tone={item.tone} />
                ))}
              </div>

              <div className="panel">
                <PanelTitle eyebrow="Distribuição" title="Receita por fonte" />
                <div className="finance-bars">
                  {financeBars.map((item) => (
                    <div key={item.label} className={`finance-bar ${item.tone}`}>
                      <div>
                        <strong>{item.label}</strong>
                        <span>{item.value}</span>
                      </div>
                      <b style={{ width: item.value }} />
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="lower-grid">
              <div className="panel">
                <PanelTitle eyebrow="Custos da plataforma" title="Onde o dinheiro está sendo gasto" />
                {financeCostRows.map((item) => (
                  <DataRow key={item.title} title={item.title} detail={item.detail} value={item.value} tone={item.tone} />
                ))}
              </div>

              <div className="panel">
                <PanelTitle eyebrow="Distribuição" title="Gastos por categoria" />
                <div className="finance-bars">
                  {financeCostBars.map((item) => (
                    <div key={item.label} className={`finance-bar ${item.tone}`}>
                      <div>
                        <strong>{item.label}</strong>
                        <span>{item.value}</span>
                      </div>
                      <b style={{ width: item.value }} />
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="lower-grid">
              <div className="panel">
                <PanelTitle eyebrow="Projeção" title="Cenários do mês" />
                {financeProjectionRows.map((item) => (
                  <DataRow key={item.title} title={item.title} detail={item.detail} value={item.value} tone={item.tone} />
                ))}
              </div>

              <div className="panel">
                <PanelTitle eyebrow="Sugestões da Mia" title="Próximas decisões financeiras" />
                {financeMiaRows.map((item) => (
                  <DataRow key={item.title} title={item.title} detail={item.detail} value={item.value} tone={item.tone} />
                ))}
              </div>
            </section>
          </>
        )}
      </section>

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #050611; }

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

        .lab-brand { display: flex; align-items: center; gap: 13px; margin-bottom: 26px; }

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

        .lab-brand strong { display: block; font-size: 18px; }
        .lab-brand span { color: #ff9be6; font-size: 13px; }

        .lab-menu { display: grid; gap: 9px; }

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

        .lab-menu strong { font-size: 14px; font-weight: 700; }

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

        .mia-robot b:nth-child(2) { left: 40px; }
        .mia-robot b:nth-child(3) { right: 40px; }

        .mia-card strong { display: block; }
        .mia-card p { color: rgba(255,255,255,.58); font-size: 13px; line-height: 1.45; }

        .lab-workspace { width: calc(100% - 292px); padding: 26px; }

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

        .lab-topbar h1 { margin: 0; font-size: 32px; letter-spacing: -.04em; }
        .lab-topbar p { margin: 6px 0 0; color: rgba(255,255,255,.62); }

        .command-center { display: flex; align-items: center; gap: 12px; }

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

        .hero-grid { display: grid; grid-template-columns: 1.9fr .8fr; gap: 18px; }

        .hero-panel,
        .panel { border-radius: 28px; padding: 22px; }

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

        .panel-title h2 { margin: 5px 0 0; font-size: 23px; letter-spacing: -.03em; }

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
        }

        .core-orb span { font-size: 36px; font-weight: 950; text-shadow: 0 0 25px rgba(0,0,0,.5); }

        .core-orb i {
          position: absolute;
          width: 13px;
          height: 13px;
          background: #ff9be6;
          top: 72px;
          border-radius: 50%;
          box-shadow: 0 0 18px #ff4fbd;
        }

        .core-orb i:nth-child(2) { left: 68px; }
        .core-orb i:nth-child(3) { right: 68px; }

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

        .orbit-node span { font-size: 25px; }
        .orbit-node small { color: #ff9be6; }

        .left-1 { left: 12%; top: 12%; }
        .left-2 { left: 6%; top: 42%; }
        .left-3 { left: 17%; bottom: 10%; }
        .right-1 { right: 12%; top: 12%; }
        .right-2 { right: 6%; top: 42%; }
        .right-3 { right: 17%; bottom: 10%; }

        .side-stack { display: grid; gap: 18px; }
        .compact { min-height: 240px; }

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

        .health-ring strong { font-size: 31px; margin-top: 20px; }
        .health-ring span { color: rgba(255,255,255,.58); margin-top: -24px; }
        .muted { color: rgba(255,255,255,.58); line-height: 1.5; }

        .metric-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-top: 18px;
        }

        .seo-grid {
          margin-top: 16px;
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

        .metric-card p { margin: 0; color: rgba(255,255,255,.62); }

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

        .finance-hero {
          display: grid;
          grid-template-columns: 1.7fr .9fr;
          gap: 18px;
          margin-top: 18px;
        }

        .finance-main-card,
        .finance-side-card {
          border: 1px solid rgba(255,255,255,.10);
          background: linear-gradient(180deg, rgba(255,255,255,.065), rgba(255,255,255,.025));
          box-shadow: 0 24px 80px rgba(0,0,0,.28);
          backdrop-filter: blur(24px);
          border-radius: 28px;
          padding: 22px;
        }

        .finance-big-number {
          margin-top: 18px;
          padding: 22px;
          border-radius: 24px;
          background:
            radial-gradient(circle at 18% 0%, rgba(255,79,189,.22), transparent 34%),
            rgba(255,255,255,.04);
          border: 1px solid rgba(255,79,189,.18);
        }

        .finance-big-number small,
        .finance-mini-grid small {
          display: block;
          color: rgba(255,255,255,.58);
        }

        .finance-big-number strong {
          display: block;
          margin: 8px 0;
          font-size: clamp(34px, 4vw, 58px);
          letter-spacing: -.06em;
          color: #ff9be6;
          text-shadow: 0 0 32px rgba(255,79,189,.28);
        }

        .finance-big-number span,
        .finance-side-card p {
          color: rgba(255,255,255,.62);
          line-height: 1.55;
        }

        .finance-mini-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 14px;
        }

        .finance-mini-grid div {
          padding: 14px;
          border-radius: 18px;
          background: rgba(255,255,255,.045);
          border: 1px solid rgba(255,255,255,.08);
        }

        .finance-mini-grid strong {
          display: block;
          margin: 5px 0;
          font-size: 22px;
        }

        .finance-mini-grid em {
          font-style: normal;
          color: #22c55e;
          font-size: 12px;
        }

        .finance-mini-grid em.negative {
          color: #facc15;
        }

        .finance-score {
          width: 170px;
          height: 170px;
          margin: 22px auto 0;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: conic-gradient(#ff4fbd 0 82%, rgba(255,255,255,.08) 82% 100%);
          box-shadow: 0 0 48px rgba(255,79,189,.30);
        }

        .finance-score strong {
          display: block;
          font-size: 36px;
          margin-top: 24px;
        }

        .finance-score span {
          margin-top: -34px;
          color: rgba(255,255,255,.58);
          font-size: 12px;
        }

        .finance-metrics {
          margin-top: 18px;
        }

        .finance-bars {
          display: grid;
          gap: 16px;
        }

        .finance-bar {
          display: grid;
          gap: 8px;
        }

        .finance-bar div {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .finance-bar strong {
          color: #fff;
        }

        .finance-bar span {
          color: rgba(255,255,255,.62);
          font-size: 13px;
        }

        .finance-bar b {
          display: block;
          height: 14px;
          border-radius: 999px;
          background: currentColor;
          box-shadow: 0 0 22px currentColor;
        }

        .full { min-height: 650px; }

        .subdomain-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-bottom: 18px;
        }

        .subdomain-card {
          min-height: 130px;
          border-radius: 22px;
          padding: 18px;
          color: #fff;
          text-align: left;
          cursor: pointer;
          border: 1px solid rgba(255,255,255,.10);
          background: linear-gradient(180deg, rgba(255,255,255,.065), rgba(255,255,255,.025));
          box-shadow: 0 24px 80px rgba(0,0,0,.24);
        }

        .subdomain-card.selected {
          outline: 2px solid rgba(255,79,189,.55);
          box-shadow: 0 0 40px rgba(255,79,189,.22);
        }

        .subdomain-card strong {
          display: block;
          margin: 14px 0 6px;
          font-size: 18px;
        }

        .subdomain-card span {
          color: rgba(255,255,255,.62);
        }

        .sitemap-detail {
          margin-top: 18px;
          padding: 18px;
          border-radius: 24px;
          background: rgba(255,255,255,.035);
          border: 1px solid rgba(255,255,255,.08);
        }

        .sitemap-list {
          display: grid;
          gap: 10px;
        }

        .sitemap-line {
          display: grid;
          grid-template-columns: 18px 1fr auto;
          align-items: center;
          gap: 12px;
          padding: 13px;
          border-radius: 16px;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.07);
        }

        .sitemap-line span {
          color: #ff9be6;
          font-size: 12px;
        }

        .task-board {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .task-column {
          min-height: 430px;
          padding: 14px;
          border-radius: 22px;
          background: rgba(255,255,255,.035);
          border: 1px solid rgba(255,255,255,.08);
        }

        .task-column h3 {
          margin: 0 0 14px;
          text-transform: uppercase;
          letter-spacing: .08em;
          color: #ff9be6;
          font-size: 13px;
        }

        .task-card {
          padding: 14px;
          border-radius: 18px;
          margin-bottom: 10px;
          border: 1px solid rgba(255,255,255,.10);
          background: rgba(255,255,255,.045);
        }

        .task-card strong {
          display: block;
          color: #fff;
        }

        .task-card p {
          margin: 6px 0 10px;
          color: rgba(255,255,255,.58);
          font-size: 13px;
          line-height: 1.45;
        }

        .task-card span {
          display: inline-flex;
          padding: 6px 9px;
          border-radius: 999px;
          color: #fff;
          background: rgba(255,255,255,.07);
          font-size: 11px;
        }

        .user-table.enhanced .user-row {
          grid-template-columns: 20px 1fr auto auto;
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

        .site-card div { display: flex; align-items: center; gap: 9px; }
        .site-card h3 { font-size: 22px; margin: 15px 0 8px; }
        .site-card em { font-style: normal; color: rgba(255,255,255,.66); }

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

        .data-row strong { display: block; }
        .data-row p { margin: 4px 0 0; font-size: 13px; }

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

        .pulse-chart svg { width: 100%; height: 100%; }

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

        .agent-card span { font-size: 25px; }
        .agent-card strong { display: block; margin: 10px 0 6px; }
        .agent-card em { font-style: normal; color: #ff9be6; }

        .idea-list {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }

        .idea-card strong { font-size: 18px; }

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

        .user-table { margin-top: 16px; display: grid; gap: 10px; }

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

        .user-row p { margin: 3px 0 0; color: rgba(255,255,255,.55); font-size: 13px; }
        .user-row span { color: rgba(255,255,255,.72); }
        .user-row em { font-style: normal; color: #ff9be6; }

        .ux-only-wrap {
          border-radius: 24px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.08);
          background: rgba(255,255,255,.02);
          min-height: 780px;
        }

        .ux-frame {
          width: 100%;
          height: 780px;
          border: 0;
          display: block;
          background: #050611;
        }

        @media (max-width: 1280px) {
          .hero-grid,
          .finance-hero,
          .lower-grid,
          .brain-layout {
            grid-template-columns: 1fr;
          }

          .metric-grid,
          .sitemap-grid,
          .agent-grid,
          .subdomain-grid,
          .task-board {
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

          .search-box { width: 100%; }
        }

        @media (max-width: 880px) {
          .lab-page { display: block; }

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
          .idea-list,
          .subdomain-grid,
          .task-board {
            grid-template-columns: 1fr;
          }

          .empire-map { height: 760px; }
          .orbit-node { width: 145px; }

          .left-1 { left: 8%; top: 6%; }
          .right-1 { right: 8%; top: 6%; }
          .left-2 { left: 8%; top: 35%; }
          .right-2 { right: 8%; top: 35%; }
          .left-3 { left: 8%; bottom: 6%; }
          .right-3 { right: 8%; bottom: 6%; }

          .user-row { grid-template-columns: 20px 1fr; }
          .finance-mini-grid { grid-template-columns: 1fr; }
          .ux-frame { height: 680px; }
          .ux-only-wrap { min-height: 680px; }
        }
      `}</style>
    </main>
  );
}
