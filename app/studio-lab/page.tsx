"use client";

import MiaPanelTruthCard from "@/components/studio/MiaPanelTruthCard";
import SystemTruthPanel from "@/components/studio/SystemTruthPanel";

import SualumaPublicChat from "@/components/SualumaPublicChat";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";

const AGENT_API = "/api/agent-api";

type SystemStatus = {
  api: string;
  gemini: string;
  ollama: { online: boolean; models: string[] } | string;
  uptime: number;
  memory?: { heapUsed: number; heapTotal: number; rss: number };
};

function fmtUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function fmtMemory(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

type StudioView =
  | "visao"
  | "ux"
  | "relatorios"
  | "blog"
  | "email"
  | "google"
  | "noticias"
  | "organico"
  | "tarefas"
  | "loja"
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
  | "financeiro"
  | "stripe";

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
  { id: "google", label: "Google", icon: "🔎" },
  { id: "noticias", label: "Notícias & Trends", icon: "🔥", badge: "24h" },
  { id: "organico", label: "Marketing Orgânico", icon: "🚀", badge: "Radar" },
  { id: "tarefas", label: "Tarefas do Sistema", icon: "✅", badge: "24" },
  { id: "loja", label: "Admin Loja", icon: "🛍️", badge: "Hub" },
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
  { id: "stripe", label: "Stripe", icon: "💳", badge: "Pagamentos" },
];

const IS_DEMO = true; // Sem fonte de dados real — substitua conectando um backend

const empireHealth = [
  { title: "Sistema", value: IS_DEMO ? "—" : "92%", tone: "blue" as Tone, detail: "Conecte o backend para ver dados reais" },
  { title: "UX", value: IS_DEMO ? "—" : "78%", tone: "blue" as Tone, detail: "Conecte o backend para ver dados reais" },
  { title: "Agentes", value: IS_DEMO ? "—" : "84%", tone: "blue" as Tone, detail: "Conecte o backend para ver dados reais" },
  { title: "Financeiro", value: IS_DEMO ? "—" : "+18%", tone: "blue" as Tone, detail: "Conecte o backend para ver dados reais" },
];

const sitemapItems: { area: string; path: string; status: string; tone: Tone; response: string }[] = [];

const agents: { name: string; task: string; status: string; roi: string; tone: Tone }[] = [];

const serviceSignals: { title: string; value: string; detail: string; tone: Tone }[] = [];

const communitySignals: { title: string; value: string; detail: string; tone: Tone }[] = [];

const ideaStore: { idea: string; score: string; impact: string; effort: string; tone: Tone }[] = [];

const users: { name: string; email: string; plan: string; last: string; issue: string; tone: Tone }[] = [];

const notifications: { title: string; detail: string; tone: Tone }[] = [];


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



const blogReportCards: { title: string; value: string; detail: string; tone: Tone }[] = [];

const blogReportRows: { title: string; detail: string; value: string; tone: Tone }[] = [];


const blogSeoCards: { title: string; value: string; detail: string; tone: Tone }[] = [];

const blogSeoRows: { title: string; detail: string; value: string; tone: Tone }[] = [];

const blogKeywordRows: { title: string; detail: string; value: string; tone: Tone }[] = [];

const blogSeoChecklist: { title: string; detail: string; value: string; tone: Tone }[] = [];

const emailReportCards: { title: string; value: string; detail: string; tone: Tone }[] = [];

const emailReportRows: { title: string; detail: string; value: string; tone: Tone }[] = [];


const financeDashboardCards: { title: string; value: string; detail: string; tone: Tone }[] = [];

const financeRevenueRows: { title: string; detail: string; value: string; tone: Tone }[] = [];

const financeCostRows: { title: string; detail: string; value: string; tone: Tone }[] = [];

const financeProjectionRows: { title: string; detail: string; value: string; tone: Tone }[] = [];

const financeMiaRows: { title: string; detail: string; value: string; tone: Tone }[] = [];

const financeBars: { label: string; value: string; tone: Tone }[] = [];

const financeCostBars: { label: string; value: string; tone: Tone }[] = [];


const systemTaskRows: { title: string; detail: string; value: string; tone: Tone; tag?: string }[] = [];

const supportRows: { title: string; detail: string; value: string; tone: Tone }[] = [];

const serviceDeepRows: { title: string; detail: string; value: string; tone: Tone; tag?: string }[] = [];

const userControlRows: { title: string; detail: string; value: string; tone: Tone }[] = [];

const userActionRows: { title: string; detail: string; value: string; tone: Tone }[] = [];

const subdomainRows: { name: string; status: string; tone: Tone; links: string[] }[] = [];

const cnpjNotificationRows: { title: string; detail: string; value: string; tone: Tone }[] = [];

const cnpjDeepRows: { title: string; detail: string; value: string; tone: Tone }[] = [];


const storeHubCards: { title: string; value: string; detail: string; tone: Tone }[] = [];

const storeProductRows: { title: string; detail?: string; value?: string; tone?: Tone; category?: string; status?: string }[] = [];

const marketplaceRows: { title: string; detail: string; value: string; tone: Tone }[] = [];

const storeActionRows: { title: string; detail: string; value: string; tone: Tone }[] = [];

const storeCategoryRows: { title: string; detail: string; value: string; tone: Tone }[] = [];

const communityDeepCards: { title: string; value: string; detail: string; tone: Tone }[] = [];

const communityModerationRows: { title: string; detail?: string; value?: string; tone?: Tone; reported_user?: string; reporter_user?: string; reason?: string; status?: string }[] = [];

const communityRetentionRows: { title: string; detail: string; value: string; tone: Tone }[] = [];

const communityTopicRows: { title: string; detail: string; value: string; tone: Tone }[] = [];

const communityHashtagRows: { title: string; detail: string; value: string; tone: Tone }[] = [];

const communitySeoRows: { title: string; detail: string; value: string; tone: Tone }[] = [];

const communityMiaRows: { title: string; detail: string; value: string; tone: Tone }[] = [];


const googlePresenceCards: { title: string; value: string; detail: string; tone: Tone }[] = [];

const googleAdsRows: { title: string; detail: string; value: string; tone: Tone }[] = [];

const googleSearchRows: { title: string; detail: string; value: string; tone: Tone }[] = [];

const googleKeywordRows: { title: string; detail: string; value: string; tone: Tone }[] = [];

const googleBacklinkRows: { title: string; detail: string; value: string; tone: Tone }[] = [];

const googleMiaRows: { title: string; detail: string; value: string; tone: Tone }[] = [];

const googleTrendBars: { label: string; value: string; tone: Tone }[] = [];

const socialMentionRows: { title: string; detail: string; value: string; tone: Tone }[] = [];

const socialSentimentRows: { title: string; detail: string; value: string; tone: Tone }[] = [];


const trendNewsCards: { title: string; value: string; detail: string; tone: Tone }[] = [];

const socialTrendRows: { title: string; detail: string; value: string; tone: Tone }[] = [];

const googleHotSearchRows: { title: string; detail: string; value: string; tone: Tone }[] = [];

const techNewsRows: { title: string; detail: string; value: string; tone: Tone }[] = [];

const entrepreneurNewsRows: { title: string; detail: string; value: string; tone: Tone }[] = [];

const organicMarketingCards: { title: string; value: string; detail: string; tone: Tone }[] = [];

const organicIdeaRows: { title: string; detail: string; value: string; tone: Tone }[] = [];

const forumRadarRows: { title: string; detail: string; value: string; tone: Tone }[] = [];

const forumAlertRows: { title: string; detail: string; value: string; tone: Tone }[] = [];

const miaOrganicRows: { title: string; detail: string; value: string; tone: Tone }[] = [];

const hotOpportunityRows: { title: string; detail: string; value: string; tone: Tone }[] = [];


const stripeDashboardCards: { title: string; value: string; detail: string; tone: Tone }[] = [];

const stripePaymentRows: { title: string; detail: string; value: string; tone: Tone }[] = [];

const stripeSubscriptionRows: { title: string; detail: string; value: string; tone: Tone }[] = [];

const stripeActionRows: { title: string; detail: string; value: string; tone: Tone }[] = [];

const stripeAlertRows: { title: string; detail: string; value: string; tone: Tone }[] = [];

const stripeRevenueBars: { label: string; value: string; tone: Tone }[] = [];


const healthGeneralCards: { title: string; value: string; detail: string; tone: Tone }[] = [];

const healthSystemRows: { title: string; detail: string; value: string; tone: Tone }[] = [];

const healthApiRows: { title: string; detail: string; value: string; tone: Tone }[] = [];

const healthJourneyRows: { title: string; detail: string; value: string; tone: Tone }[] = [];

const healthBusinessRows: { title: string; detail: string; value: string; tone: Tone }[] = [];

const healthRiskRows: { title: string; detail: string; value: string; tone: Tone }[] = [];

const healthMiaRows: { title: string; detail: string; value: string; tone: Tone }[] = [];

const healthChecklistRows: { title: string; detail: string; value: string; tone: Tone }[] = [];

const healthBars: { label: string; value: string; tone: Tone }[] = [];

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
  value?: string | null;
  detail?: string;
  tone: Tone;
}) {
  const displayValue = value && value !== "" ? value : "—";
  const displayDetail = detail && detail !== "" ? detail : "Sem dados disponíveis";
  return (
    <div className={`metric-card ${tone}`}>
      <span className="metric-glow" />
      <small>{title}</small>
      <strong>{displayValue}</strong>
      <p>{displayDetail}</p>
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


type LiveSystemTask = {
  title: string;
  detail?: string;
  value?: string;
  tone?: Tone;
  tag?: string;
  priority?: number;
};

function LiveSystemTasksView({ fallbackRows }: { fallbackRows: LiveSystemTask[] }) {
  const [rows, setRows] = useState<LiveSystemTask[]>(fallbackRows);
  const [source, setSource] = useState("visual");

  useEffect(() => {
    let cancelled = false;

    async function loadTasks() {
      try {
        const response = await fetch("/api/studio/dashboard", {
          cache: "no-store",
        });

        const payload = await response.json();
        const liveRows = payload?.data?.systemTaskRows;

        if (!cancelled && Array.isArray(liveRows) && liveRows.length > 0) {
          setRows(liveRows);
          setSource(payload?.source || "api");
        }
      } catch (error) {
        console.error("[Studio Lab] Falha ao carregar tarefas do banco:", error);
      }
    }

    loadTasks();

    return () => {
      cancelled = true;
    };
  }, []);

  const riskRows = rows.filter((item) => item.value === "em risco");
  const progressRows = rows.filter((item) => item.value === "em andamento");
  const activeRows = rows.filter((item) => item.value === "ativo");

  return (
    <>
      <section className="metric-grid">
        <MetricCard title="Em risco" value={String(riskRows.length)} detail="Itens que travam leads, venda ou acesso" tone="red" />
        <MetricCard title="Em andamento" value={String(progressRows.length)} detail="Tarefas sendo construídas agora" tone="yellow" />
        <MetricCard title="Ativas" value={String(activeRows.length)} detail="Áreas funcionando e monitoradas" tone="green" />
        <MetricCard title="Fonte" value={source === "postgres" ? "Banco" : "Visual"} detail="Dados carregados da API do Studio" tone="blue" />
      </section>

      <section className="panel full">
        <PanelTitle eyebrow="Tarefas do Sistema" title="Tudo catalogado por status e prioridade" action={source === "postgres" ? "Banco conectado" : "Visual"} />

        <div className="task-board">
          {[
            ["em risco", riskRows],
            ["em andamento", progressRows],
            ["ativo", activeRows],
          ].map(([status, items]) => (
            <div key={String(status)} className="task-column">
              <h3>{String(status)}</h3>

              {(items as LiveSystemTask[]).map((item) => (
                <div key={item.title} className={`task-card ${item.tone || "blue"}`}>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                  <span>{item.tag || "Sistema"}</span>
                </div>
              ))}

              {(items as LiveSystemTask[]).length === 0 && (
                <div className="task-card blue">
                  <strong>Nenhuma tarefa aqui</strong>
                  <p>Quando tiver uma tarefa com esse status no banco, ela aparece automaticamente.</p>
                  <span>vazio</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}



type LiveStoreProduct = {
  title: string;
  detail?: string;
  value?: string;
  tone?: Tone;
  category?: string;
  status?: string;
  priority?: number;
};

function LiveStoreProductsView({ fallbackRows }: { fallbackRows: LiveStoreProduct[] }) {
  const [rows, setRows] = useState<LiveStoreProduct[]>(fallbackRows);
  const [source, setSource] = useState("visual");

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        const response = await fetch("/api/studio/dashboard", {
          cache: "no-store",
        });

        const payload = await response.json();
        const liveRows = payload?.data?.storeProductRows;

        if (!cancelled && Array.isArray(liveRows) && liveRows.length > 0) {
          setRows(liveRows);
          setSource(payload?.source || "api");
        }
      } catch (error) {
        console.error("[Studio Lab] Falha ao carregar Admin Loja do banco:", error);
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  const activeRows = rows.filter((item) => item.status === "ativo" || item.value === "ativo");
  const reviewRows = rows.filter((item) => item.status === "revisar" || item.value === "revisar" || item.value === "editar");
  const categories = Array.from(new Set(rows.map((item) => item.category || "Sem categoria")));

  return (
    <>
      <section className="metric-grid">
        <MetricCard title="Produtos no banco" value={String(rows.length)} detail="Agentes, automações, skills e templates" tone="pink" />
        <MetricCard title="Ativos" value={String(activeRows.length)} detail="Produtos publicados ou prontos para vitrine" tone="green" />
        <MetricCard title="Para revisar" value={String(reviewRows.length)} detail="Itens que precisam ajuste antes de escalar" tone="yellow" />
        <MetricCard title="Fonte" value={source === "postgres" ? "Banco" : "Visual"} detail="Dados carregados da API do Studio" tone="blue" />
      </section>

      <section className="lower-grid">
        <div className="panel">
          <PanelTitle eyebrow="Admin Loja" title="Produtos digitais cadastrados" action={source === "postgres" ? "Banco conectado" : "Visual"} />

          {rows.map((item) => (
            <DataRow
              key={item.title}
              title={item.title}
              detail={item.detail || "Produto sem descrição cadastrada."}
              value={item.value || item.status || "ativo"}
              tone={item.tone || "blue"}
            />
          ))}
        </div>

        <div className="panel">
          <PanelTitle eyebrow="Categorias" title="Organização da loja" />

          {categories.map((category) => {
            const count = rows.filter((item) => (item.category || "Sem categoria") === category).length;

            return (
              <DataRow
                key={category}
                title={category}
                detail="Categoria puxada do banco de produtos da loja."
                value={`${count} itens`}
                tone="pink"
              />
            );
          })}
        </div>
      </section>

      <section className="panel full">
        <PanelTitle eyebrow="Operação da Loja" title="Tabela rápida para gestão dos produtos" action="Ações futuras" />

        <div className="store-table">
          {rows.map((item) => (
            <div key={item.title} className="store-row">
              <ToneDot tone={item.tone || "blue"} />
              <div>
                <strong>{item.title}</strong>
                <p>{item.detail || "Produto cadastrado no banco do Studio."}</p>
              </div>
              <button>{item.category || "Categoria"}</button>
              <button>{item.status || item.value || "Status"}</button>
              <button>Editar depois</button>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}



type LiveCommunityReport = {
  title: string;
  detail?: string;
  value?: string;
  tone?: Tone;
  reported_user?: string;
  reporter_user?: string;
  reason?: string;
  status?: string;
  created_at?: string;
};

function LiveCommunityView({ fallbackRows }: { fallbackRows: LiveCommunityReport[] }) {
  const [rows, setRows] = useState<LiveCommunityReport[]>(fallbackRows);
  const [source, setSource] = useState("visual");

  useEffect(() => {
    let cancelled = false;

    async function loadCommunity() {
      try {
        const response = await fetch("/api/studio/dashboard", {
          cache: "no-store",
        });

        const payload = await response.json();
        const liveRows = payload?.data?.communityModerationRows;

        if (!cancelled && Array.isArray(liveRows) && liveRows.length > 0) {
          setRows(liveRows);
          setSource(payload?.source || "api");
        }
      } catch (error) {
        console.error("[Studio Lab] Falha ao carregar Comunidade do banco:", error);
      }
    }

    loadCommunity();

    return () => {
      cancelled = true;
    };
  }, []);

  const openRows = rows.filter((item) => item.status === "aberto");
  const reviewedRows = rows.filter((item) => item.status === "revisado");
  const warningRows = rows.filter((item) => item.tone === "red" || item.value === "enviar aviso");

  return (
    <>
      <section className="metric-grid">
        <MetricCard title="Denúncias no banco" value={String(rows.length)} detail="Casos puxados da moderação" tone="pink" />
        <MetricCard title="Abertas" value={String(openRows.length)} detail="Precisam análise ou ação" tone="red" />
        <MetricCard title="Revisadas" value={String(reviewedRows.length)} detail="Casos já tratados" tone="green" />
        <MetricCard title="Fonte" value={source === "postgres" ? "Banco" : "Visual"} detail="Dados carregados da API do Studio" tone="blue" />
      </section>

      <section className="community-hero">
        <div className="panel">
          <PanelTitle eyebrow="Comunidade" title="Moderação e denúncias reais" action={source === "postgres" ? "Banco conectado" : "Visual"} />

          {rows.map((item) => (
            <div key={item.title} className="moderation-row">
              <ToneDot tone={item.tone || "yellow"} />
              <div>
                <strong>{item.title}</strong>
                <p>{item.detail || item.reason || "Caso registrado no banco da comunidade."}</p>
              </div>
              <button>{item.status || "ver"}</button>
              <button>{item.value || "ação"}</button>
            </div>
          ))}
        </div>

        <div className="panel">
          <PanelTitle eyebrow="Resumo" title="Estado da rede social" />

          <DataRow title="Casos abertos" detail="Denúncias ou alertas que ainda precisam decisão." value={String(openRows.length)} tone="red" />
          <DataRow title="Casos revisados" detail="Itens já tratados ou encerrados pela moderação." value={String(reviewedRows.length)} tone="green" />
          <DataRow title="Avisos necessários" detail="Usuários que podem precisar receber e-mail ou alerta." value={String(warningRows.length)} tone="yellow" />
          <DataRow title="Próxima ação" detail="Criar botões reais para enviar aviso, bloquear ou liberar usuário." value="fase 2" tone="pink" />
        </div>
      </section>

      <section className="panel full">
        <PanelTitle eyebrow="Detalhes dos casos" title="Quem denunciou, quem foi denunciado e por quê" action="Ações futuras" />

        <div className="store-table">
          {rows.map((item) => (
            <div key={`${item.title}-${item.reported_user || ""}`} className="store-row">
              <ToneDot tone={item.tone || "yellow"} />
              <div>
                <strong>{item.reported_user || item.title}</strong>
                <p>
                  Denunciante: {item.reporter_user || "não informado"} • Motivo: {item.reason || item.detail || "sem motivo detalhado"}
                </p>
              </div>
              <button>{item.status || "aberto"}</button>
              <button>Ver caso</button>
              <button>Enviar aviso</button>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}



type LiveCnpjNotification = {
  title: string;
  detail?: string;
  value?: string;
  tone?: Tone;
  status?: string;
  due_date?: string;
  created_at?: string;
};

function LiveCnpjView({ fallbackRows }: { fallbackRows: LiveCnpjNotification[] }) {
  const [rows, setRows] = useState<LiveCnpjNotification[]>(fallbackRows);
  const [source, setSource] = useState("visual");

  useEffect(() => {
    let cancelled = false;

    async function loadCnpj() {
      try {
        const response = await fetch("/api/studio/dashboard", {
          cache: "no-store",
        });

        const payload = await response.json();
        const liveRows = payload?.data?.cnpjNotificationRows;

        if (!cancelled && Array.isArray(liveRows) && liveRows.length > 0) {
          setRows(liveRows);
          setSource(payload?.source || "api");
        }
      } catch (error) {
        console.error("[Studio Lab] Falha ao carregar CNPJ do banco:", error);
      }
    }

    loadCnpj();

    return () => {
      cancelled = true;
    };
  }, []);

  const openRows = rows.filter((item) => item.status === "aberto");
  const okRows = rows.filter((item) => item.status === "ok");
  const attentionRows = rows.filter((item) => item.tone === "yellow" || item.value === "atenção");

  return (
    <>
      <section className="metric-grid">
        <MetricCard title="Notificações CNPJ" value={String(rows.length)} detail="Pendências e lembretes cadastrados" tone="pink" />
        <MetricCard title="Em aberto" value={String(openRows.length)} detail="Itens que precisam conferência" tone="yellow" />
        <MetricCard title="Regular" value={String(okRows.length)} detail="Itens marcados como ok" tone="green" />
        <MetricCard title="Fonte" value={source === "postgres" ? "Banco" : "Visual"} detail="Dados carregados da API do Studio" tone="blue" />
      </section>

      <section className="health-hero">
        <div className="panel">
          <PanelTitle eyebrow="CNPJ" title="Central de notificações da empresa" action={source === "postgres" ? "Banco conectado" : "Visual"} />

          {rows.map((item) => (
            <DataRow
              key={item.title}
              title={item.title}
              detail={item.detail || "Notificação cadastrada no banco do Studio."}
              value={item.value || item.status || "verificar"}
              tone={item.tone || "yellow"}
            />
          ))}
        </div>

        <div className="panel">
          <PanelTitle eyebrow="Diagnóstico" title="O que precisa atenção" />

          <DataRow title="Pendências abertas" detail="Obrigações, documentos ou verificações ainda não concluídas." value={String(openRows.length)} tone="yellow" />
          <DataRow title="Itens em atenção" detail="Pontos que podem virar problema se ficarem esquecidos." value={String(attentionRows.length)} tone="red" />
          <DataRow title="Documentos" detail="Notas, comprovantes e registros precisam ficar organizados por mês." value="organizar" tone="blue" />
          <DataRow title="Próxima fase" detail="Conectar consulta real de CNPJ e histórico de obrigações." value="fase 2" tone="pink" />
        </div>
      </section>

      <section className="panel full">
        <PanelTitle eyebrow="Relatório CNPJ" title="Histórico e tarefas administrativas" action="Ações futuras" />

        <div className="store-table">
          {rows.map((item) => (
            <div key={`${item.title}-${item.created_at || ""}`} className="store-row">
              <ToneDot tone={item.tone || "yellow"} />
              <div>
                <strong>{item.title}</strong>
                <p>{item.detail || "Item administrativo registrado no banco."}</p>
              </div>
              <button>{item.status || "aberto"}</button>
              <button>{item.value || "verificar"}</button>
              <button>Marcar depois</button>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}



type LiveSubdomain = {
  name: string;
  status?: string;
  tone?: Tone;
  links?: string[];
};

function LiveSubdomainsView({ fallbackRows }: { fallbackRows: LiveSubdomain[] }) {
  const [rows, setRows] = useState<LiveSubdomain[]>(fallbackRows);
  const [source, setSource] = useState("visual");
  const [selected, setSelected] = useState<LiveSubdomain | null>(fallbackRows?.[0] || null);

  useEffect(() => {
    let cancelled = false;

    async function loadSubdomains() {
      try {
        const response = await fetch("/api/studio/dashboard", {
          cache: "no-store",
        });

        const payload = await response.json();
        const liveRows = payload?.data?.subdomainRows;

        if (!cancelled && Array.isArray(liveRows) && liveRows.length > 0) {
          setRows(liveRows);
          setSelected(liveRows[0]);
          setSource(payload?.source || "api");
        }
      } catch (error) {
        console.error("[Studio Lab] Falha ao carregar Subdomínios do banco:", error);
      }
    }

    loadSubdomains();

    return () => {
      cancelled = true;
    };
  }, []);

  const onlineRows = rows.filter((item) => item.status === "Online" || item.status === "Ativo");
  const attentionRows = rows.filter((item) => item.tone === "yellow" || item.tone === "red");
  const totalLinks = rows.reduce((acc, item) => acc + (item.links?.length || 0), 0);

  return (
    <>
      <section className="metric-grid">
        <MetricCard title="Subdomínios" value={String(rows.length)} detail="Áreas principais do ecossistema" tone="pink" />
        <MetricCard title="Online/ativos" value={String(onlineRows.length)} detail="Subdomínios funcionando" tone="green" />
        <MetricCard title="Links mapeados" value={String(totalLinks)} detail="Rotas cadastradas no sitemap interno" tone="blue" />
        <MetricCard title="Fonte" value={source === "postgres" ? "Banco" : "Visual"} detail="Dados carregados da API do Studio" tone="yellow" />
      </section>

      <section className="panel">
        <div style={{ display: "grid", gap: 14 }}>
          <PanelTitle
            eyebrow="Catálogo automático"
            title="Páginas e subdomínios criados na VPS"
            action="Atualiza sozinho"
          />

          <p style={{ margin: 0, color: "rgba(226,232,240,.76)", lineHeight: 1.7 }}>
            Aqui você abre a lista completa das páginas que já existem no projeto, incluindo rotas do Next.js
            e sites estáticos criados direto na VPS. Use quando quiser encontrar um link sem ficar adivinhando.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <a
              href="/studio/catalogo-paginas"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "13px 18px",
                borderRadius: 999,
                background: "linear-gradient(135deg, #38bdf8, #a855f7)",
                color: "#fff",
                fontWeight: 900,
                textDecoration: "none",
                boxShadow: "0 18px 44px rgba(56,189,248,.22)"
              }}
            >
              Abrir catálogo de páginas
            </a>

            <span style={{ color: "rgba(148,163,184,.9)", fontSize: 13 }}>
              Mostra últimas páginas criadas hoje, busca por nome, rota, subdomínio, arquivo e status.
            </span>
          </div>
        </div>
      </section>

      <section className="lower-grid">
        <div className="panel">
          <PanelTitle eyebrow="Raiz do Site" title="Subdomínios monitorados" action={source === "postgres" ? "Banco conectado" : "Visual"} />

          <div className="subdomain-grid">
            {rows.map((item) => (
              <button
                key={item.name}
                className={`subdomain-card ${selected?.name === item.name ? "active" : ""}`}
                onClick={() => setSelected(item)}
                type="button"
              >
                <ToneDot tone={item.tone || "blue"} />
                <strong>{item.name}</strong>
                <span>{item.status || "monitorar"}</span>
                <small>{item.links?.length || 0} links</small>
              </button>
            ))}
          </div>
        </div>

        <div className="panel">
          <PanelTitle eyebrow="Sitemap" title={selected?.name || "Selecione um subdomínio"} />

          {(selected?.links || []).map((link) => (
            <DataRow
              key={`${selected?.name}-${link}`}
              title={link}
              detail={`Rota cadastrada dentro de ${selected?.name}`}
              value="monitorar"
              tone={selected?.tone || "blue"}
            />
          ))}

          {(!selected?.links || selected.links.length === 0) && (
            <DataRow
              title="Nenhum link cadastrado"
              detail="Quando adicionarmos links no banco, eles aparecem aqui."
              value="vazio"
              tone="yellow"
            />
          )}
        </div>
      </section>

      <section className="panel full">
        <PanelTitle eyebrow="Monitoramento" title="Alertas e próximos passos dos subdomínios" action="Agente Sitemap futuro" />

        <div className="store-table">
          {rows.map((item) => (
            <div key={item.name} className="store-row">
              <ToneDot tone={item.tone || "blue"} />
              <div>
                <strong>{item.name}</strong>
                <p>
                  Status: {item.status || "monitorar"} • Links cadastrados: {item.links?.length || 0}
                </p>
              </div>
              <button>{item.status || "status"}</button>
              <button>Ver sitemap</button>
              <button>Checar depois</button>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}



function LiveHealthView() {
  const [payload, setPayload] = useState<any>(null);
  const [source, setSource] = useState("visual");

  useEffect(() => {
    let cancelled = false;

    async function loadHealth() {
      try {
        const response = await fetch("/api/studio/dashboard", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!cancelled) {
          setPayload(data?.data || null);
          setSource(data?.source || "api");
        }
      } catch (error) {
        console.error("[Studio Lab] Falha ao carregar Saúde Geral:", error);
      }
    }

    loadHealth();

    return () => {
      cancelled = true;
    };
  }, []);

  const tasks = payload?.systemTaskRows || [];
  const products = payload?.storeProductRows || [];
  const reports = payload?.communityModerationRows || [];
  const cnpj = payload?.cnpjNotificationRows || [];
  const subdomains = payload?.subdomainRows || [];

  const riskyTasks = tasks.filter((item: any) => item.tone === "red" || item.value === "em risco");
  const activeProducts = products.filter((item: any) => item.status === "ativo" || item.value === "ativo");
  const reviewProducts = products.filter((item: any) => item.status === "revisar" || item.status === "editar" || item.value === "revisar");
  const openReports = reports.filter((item: any) => item.status === "aberto");
  const pendingCnpj = cnpj.filter((item: any) => item.status === "aberto" || item.tone === "yellow" || item.value === "atenção");
  const onlineSubdomains = subdomains.filter((item: any) => item.status === "Online" || item.status === "Ativo");
  const totalLinks = subdomains.reduce((acc: number, item: any) => acc + (item.links?.length || 0), 0);

  const score =
    100
    - riskyTasks.length * 12
    - reviewProducts.length * 5
    - openReports.length * 8
    - pendingCnpj.length * 6
    + onlineSubdomains.length * 3;

  const healthScore = Math.max(0, Math.min(100, score || 88));

  const healthTone: Tone =
    healthScore >= 85 ? "green" :
    healthScore >= 70 ? "yellow" :
    "red";

  const healthLabel =
    healthScore >= 85 ? "Saudável" :
    healthScore >= 70 ? "Atenção" :
    "Crítico";

  return (
    <>
      <section className="metric-grid">
        <MetricCard title="Saúde geral" value={`${healthScore}%`} detail={`Status atual: ${healthLabel}`} tone={healthTone} />
        <MetricCard title="Fonte" value={source === "postgres" ? "Banco" : "Visual"} detail="Dados puxados da API do Studio" tone="blue" />
        <MetricCard title="Alertas reais" value={String(riskyTasks.length + openReports.length + pendingCnpj.length)} detail="Tarefas, comunidade e CNPJ" tone="red" />
        <MetricCard title="Áreas online" value={String(onlineSubdomains.length)} detail="Subdomínios ativos no ecossistema" tone="green" />
      </section>

      <section className="health-hero">
        <div className="panel">
          <PanelTitle eyebrow="Saúde Geral" title="Diagnóstico vivo do ecossistema" action={source === "postgres" ? "Banco conectado" : "Visual"} />

          <DataRow title="Tarefas do sistema" detail="Pontos operacionais que precisam ser resolvidos para o sistema vender e receber leads." value={`${tasks.length} tarefas`} tone={riskyTasks.length ? "red" : "green"} />
          <DataRow title="Admin Loja" detail="Produtos digitais cadastrados: agentes, automações, skills e templates." value={`${products.length} produtos`} tone={reviewProducts.length ? "yellow" : "green"} />
          <DataRow title="Comunidade" detail="Denúncias, moderação e possíveis violações de regra." value={`${openReports.length} abertas`} tone={openReports.length ? "red" : "green"} />
          <DataRow title="CNPJ" detail="Pendências administrativas, lembretes e obrigações da empresa." value={`${pendingCnpj.length} atenção`} tone={pendingCnpj.length ? "yellow" : "green"} />
          <DataRow title="Subdomínios" detail="Raiz do site, áreas online e sitemap interno." value={`${totalLinks} links`} tone="blue" />
        </div>

        <div className="panel">
          <PanelTitle eyebrow="Sugestão da Mia" title="Prioridade inteligente de hoje" />

          <DataRow title="1. Resolver riscos vermelhos" detail="Comece pelas tarefas em risco e pelas denúncias abertas." value={`${riskyTasks.length + openReports.length} itens`} tone="red" />
          <DataRow title="2. Revisar loja" detail="Produtos com status revisar/editar podem travar vendas no marketplace." value={`${reviewProducts.length} itens`} tone="yellow" />
          <DataRow title="3. Conferir CNPJ" detail="Pendências administrativas precisam ficar visíveis antes de virarem problema." value={`${pendingCnpj.length} itens`} tone="pink" />
          <DataRow title="4. Fortalecer sitemap" detail="Quanto mais links monitorados, mais fácil achar página quebrada depois." value={`${totalLinks} links`} tone="blue" />
        </div>
      </section>

      <section className="panel full">
        <PanelTitle eyebrow="Mapa de saúde" title="Leitura por área conectada ao banco" action="Fase 1 conectada" />

        <div className="store-table">
          <div className="store-row">
            <ToneDot tone={riskyTasks.length ? "red" : "green"} />
            <div>
              <strong>Tarefas do Sistema</strong>
              <p>{tasks.length} tarefas no banco • {riskyTasks.length} em risco</p>
            </div>
            <button>{riskyTasks.length ? "corrigir" : "ok"}</button>
          </div>

          <div className="store-row">
            <ToneDot tone={reviewProducts.length ? "yellow" : "green"} />
            <div>
              <strong>Admin Loja</strong>
              <p>{products.length} produtos no banco • {activeProducts.length} ativos • {reviewProducts.length} em revisão</p>
            </div>
            <button>ver loja</button>
          </div>

          <div className="store-row">
            <ToneDot tone={openReports.length ? "red" : "green"} />
            <div>
              <strong>Comunidade</strong>
              <p>{reports.length} casos no banco • {openReports.length} denúncias abertas</p>
            </div>
            <button>moderar</button>
          </div>

          <div className="store-row">
            <ToneDot tone={pendingCnpj.length ? "yellow" : "green"} />
            <div>
              <strong>CNPJ</strong>
              <p>{cnpj.length} notificações no banco • {pendingCnpj.length} precisam atenção</p>
            </div>
            <button>ver CNPJ</button>
          </div>

          <div className="store-row">
            <ToneDot tone="blue" />
            <div>
              <strong>Raiz do Site</strong>
              <p>{subdomains.length} subdomínios no banco • {totalLinks} links mapeados</p>
            </div>
            <button>ver sitemap</button>
          </div>
        </div>
      </section>
    </>
  );
}



type StudioShortcut = {
  id: string;
  title: string;
  url: string;
  createdAt: string;
};

const defaultStudioShortcuts: StudioShortcut[] = [
  { id: "default-studio-lab", title: "Studio Lab", url: "/studio-lab", createdAt: "default" },
  { id: "default-admin", title: "Admin", url: "/admin", createdAt: "default" },
  { id: "default-leads", title: "Leads", url: "/admin/leads", createdAt: "default" },
  { id: "default-emails", title: "Emails", url: "/admin/emails", createdAt: "default" },
  { id: "default-catalogo", title: "Catálogo de páginas", url: "/studio/catalogo-paginas", createdAt: "default" },
  { id: "default-stripe", title: "Stripe Planos", url: "/studio/stripe-planos", createdAt: "default" },
  { id: "default-mia-brain", title: "Mia Brain", url: "/studio/mia-brain", createdAt: "default" },
  { id: "default-copilot", title: "Copilot", url: "/estudio-lab/copilot", createdAt: "default" },
  { id: "default-usuarios", title: "Usuários", url: "/studio/usuarios", createdAt: "default" },
  { id: "default-diagnostico", title: "Diagnóstico de usuários", url: "/studio/usuarios-diagnostico", createdAt: "default" },
  { id: "default-prospector", title: "Prospector de Leads", url: "/leads-prospector", createdAt: "default" },
  { id: "default-agentes-admins", title: "Agentes Admins", url: "/studio/agentesadms", createdAt: "default" },
  { id: "default-funil-sualuma", title: "Funil Sualuma", url: "/studio/funil-sualuma", createdAt: "default" },
  { id: "default-metas-financeiras", title: "Metas Financeiras", url: "/studio/metas-financeiras", createdAt: "default" },
  { id: "default-blog-agent", title: "Agente de Blog", url: "/studio/blog-agent", createdAt: "default" },
  { id: "default-hostinger", title: "Hostinger", url: "https://hpanel.hostinger.com", createdAt: "default" },
];

function normalizeStudioShortcutUrl(rawUrl: string) {
  const cleanUrl = rawUrl.trim();

  if (!cleanUrl) return "";
  if (cleanUrl.startsWith("/") || cleanUrl.startsWith("#")) return cleanUrl;
  if (/^https?:\/\//i.test(cleanUrl)) return cleanUrl;

  return `https://${cleanUrl}`;
}

function StudioQuickShortcutsPanel() {
  const [ready, setReady] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [shortcuts, setShortcuts] = useState<StudioShortcut[]>([]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("studio_quick_shortcuts");
      const parsed = saved ? JSON.parse(saved) : null;

      if (Array.isArray(parsed) && parsed.length > 0) {
        setShortcuts(parsed);
      } else {
        setShortcuts(defaultStudioShortcuts);
      }
    } catch {
      setShortcuts(defaultStudioShortcuts);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;

    window.localStorage.setItem("studio_quick_shortcuts", JSON.stringify(shortcuts));
  }, [ready, shortcuts]);

  function addShortcut(event: { preventDefault: () => void }) {
    event.preventDefault();

    const normalizedUrl = normalizeStudioShortcutUrl(url);
    const cleanTitle = title.trim() || normalizedUrl.replace(/^https?:\/\//i, "").replace(/\/$/, "");

    if (!normalizedUrl) return;

    const newShortcut: StudioShortcut = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title: cleanTitle,
      url: normalizedUrl,
      createdAt: new Date().toISOString(),
    };

    setShortcuts((current) => [newShortcut, ...current].slice(0, 30));
    setTitle("");
    setUrl("");
  }

  function removeShortcut(id: string) {
    setShortcuts((current) => current.filter((item) => item.id !== id));
  }

  return (
    <section className="panel" style={{ marginBottom: 24 }}>
      <div style={{ display: "grid", gap: 18 }}>
        <PanelTitle
          eyebrow="Acesso rápido"
          title="Atalhos"
          action={`${shortcuts.length} salvos`}
        />

        <form
          onSubmit={addShortcut}
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(140px, 220px) 1fr auto",
            gap: 10,
            alignItems: "center",
          }}
        >
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Nome do botão"
            style={{
              width: "100%",
              border: "1px solid rgba(148,163,184,.26)",
              background: "rgba(15,23,42,.72)",
              color: "#fff",
              borderRadius: 16,
              padding: "13px 14px",
              outline: "none",
              fontWeight: 700,
            }}
          />

          <input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="Cole o link aqui. Ex: https://studio.sualuma.online/studio/catalogo-paginas"
            style={{
              width: "100%",
              border: "1px solid rgba(148,163,184,.26)",
              background: "rgba(15,23,42,.72)",
              color: "#fff",
              borderRadius: 16,
              padding: "13px 14px",
              outline: "none",
              fontWeight: 700,
            }}
          />

          <button
            type="submit"
            style={{
              border: 0,
              borderRadius: 16,
              padding: "13px 18px",
              background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
              color: "#fff",
              fontWeight: 900,
              cursor: "pointer",
              boxShadow: "0 16px 36px rgba(124,58,237,.28)",
              whiteSpace: "nowrap",
            }}
          >
            + Adicionar
          </button>
        </form>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          {shortcuts.length === 0 ? (
            <div
              style={{
                border: "1px dashed rgba(148,163,184,.35)",
                background: "rgba(15,23,42,.35)",
                color: "rgba(226,232,240,.78)",
                borderRadius: 18,
                padding: "16px 18px",
                width: "100%",
                fontWeight: 700,
              }}
            >
              Nenhum atalho salvo ainda. Cole um link acima para transformar em botão.
            </div>
          ) : (
            shortcuts.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  border: "1px solid rgba(148,163,184,.24)",
                  background: "rgba(255,255,255,.07)",
                  borderRadius: 999,
                  padding: "7px 8px 7px 14px",
                }}
              >
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: "#fff",
                    textDecoration: "none",
                    fontWeight: 900,
                    fontSize: 13,
                  }}
                >
                  🔗 {item.title}
                </a>

                <button
                  type="button"
                  onClick={() => removeShortcut(item.id)}
                  title="Remover atalho"
                  style={{
                    border: 0,
                    width: 24,
                    height: 24,
                    borderRadius: 999,
                    background: "rgba(248,113,113,.18)",
                    color: "#fecaca",
                    cursor: "pointer",
                    fontWeight: 900,
                    lineHeight: "24px",
                  }}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

export default function StudioLabPage() {
  const [activeView, setActiveView] = useState<StudioView>("visao");
  const [stripeLiveData, setStripeLiveData] = useState<any>(null);
  const [selectedAgent, setSelectedAgent] = useState(agents[0]);
  const [selectedSubdomain, setSelectedSubdomain] = useState(subdomainRows[0]);

  
  useEffect(() => {
    let cancelled = false;

    async function loadStripeData() {
      try {
        const response = await fetch("/api/studio/dashboard", {
          cache: "no-store",
        });

        const payload = await response.json();
        const liveStripe = payload?.data?.stripeData;

        if (!cancelled && liveStripe) {
          setStripeLiveData(liveStripe);
        }
      } catch (error) {
        console.error("Erro ao carregar stripeData:", error);
      }
    }

    loadStripeData();

    return () => {
      cancelled = true;
    };
  }, []);

  const liveStripeDashboardCards =
    Array.isArray(stripeLiveData?.stripeDashboardCards) && stripeLiveData.stripeDashboardCards.length > 0
      ? stripeLiveData.stripeDashboardCards
      : stripeDashboardCards;

  const liveStripePaymentRows =
    Array.isArray(stripeLiveData?.stripePaymentRows) && stripeLiveData.stripePaymentRows.length > 0
      ? stripeLiveData.stripePaymentRows
      : stripePaymentRows;

  const liveStripeSubscriptionRows =
    Array.isArray(stripeLiveData?.stripeSubscriptionRows) && stripeLiveData.stripeSubscriptionRows.length > 0
      ? stripeLiveData.stripeSubscriptionRows
      : stripeSubscriptionRows;

  const liveStripeActionRows =
    Array.isArray(stripeLiveData?.stripeActionRows) && stripeLiveData.stripeActionRows.length > 0
      ? stripeLiveData.stripeActionRows
      : stripeActionRows;

  const liveStripeAlertRows =
    Array.isArray(stripeLiveData?.stripeAlertRows) && stripeLiveData.stripeAlertRows.length > 0
      ? stripeLiveData.stripeAlertRows
      : stripeAlertRows;

  const liveStripeRevenueBars =
    Array.isArray(stripeLiveData?.stripeRevenueBars) && stripeLiveData.stripeRevenueBars.length > 0
      ? stripeLiveData.stripeRevenueBars
      : stripeRevenueBars;

  const liveStripeSummary = stripeLiveData?.summary || {};
  const liveStripeHealthScore =
    typeof liveStripeSummary.healthScore === "number" ? liveStripeSummary.healthScore : 0;

const currentTab = useMemo(() => tabs.find((tab) => tab.id === activeView) || tabs[0], [activeView]);

  const [financeLiveData, setFinanceLiveData] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadFinanceData() {
      try {
        const response = await fetch("/api/studio/dashboard", {
          cache: "no-store",
        });

        const payload = await response.json();
        const liveFinance = payload?.data?.financeData;

        if (!cancelled && liveFinance) {
          setFinanceLiveData(liveFinance);
        }
      } catch (error) {
        console.error("Erro ao carregar financeiro do Studio:", error);
      }
    }

    loadFinanceData();

    return () => {
      cancelled = true;
    };
  }, []);

  const liveFinanceSummary = financeLiveData?.summary || {};
  const liveFinanceHealthScore =
    typeof liveFinanceSummary.healthScore === "number" ? liveFinanceSummary.healthScore : 82;

  const liveFinanceDashboardCards =
    Array.isArray(financeLiveData?.financeDashboardCards) && financeLiveData.financeDashboardCards.length > 0
      ? financeLiveData.financeDashboardCards
      : financeDashboardCards;

  const liveFinanceRevenueRows =
    Array.isArray(financeLiveData?.financeRevenueRows) && financeLiveData.financeRevenueRows.length > 0
      ? financeLiveData.financeRevenueRows
      : financeRevenueRows;

  const liveFinanceBars =
    Array.isArray(financeLiveData?.financeBars) && financeLiveData.financeBars.length > 0
      ? financeLiveData.financeBars
      : financeBars;

  const liveFinanceCostRows =
    Array.isArray(financeLiveData?.financeCostRows) && financeLiveData.financeCostRows.length > 0
      ? financeLiveData.financeCostRows
      : financeCostRows;

  const liveFinanceCostBars =
    Array.isArray(financeLiveData?.financeCostBars) && financeLiveData.financeCostBars.length > 0
      ? financeLiveData.financeCostBars
      : financeCostBars;

  const liveFinanceProjectionRows =
    Array.isArray(financeLiveData?.financeProjectionRows) && financeLiveData.financeProjectionRows.length > 0
      ? financeLiveData.financeProjectionRows
      : financeProjectionRows;

  const liveFinanceMiaRows =
    Array.isArray(financeLiveData?.financeMiaRows) && financeLiveData.financeMiaRows.length > 0
      ? financeLiveData.financeMiaRows
      : financeMiaRows;

  return (
    <main className="lab-page">
      <a
        className="studio-links-quick-button"
        href="/studio/catalogo-paginas"
        title="Abrir catálogo de links, páginas e subdomínios"
        style={{
          position: "fixed",
          right: 18,
          bottom: 18,
          zIndex: 9999,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "13px 18px",
          borderRadius: 999,
          background: "linear-gradient(135deg, #38bdf8, #a855f7)",
          color: "#fff",
          fontWeight: 900,
          textDecoration: "none",
          border: "1px solid rgba(255,255,255,.25)",
          boxShadow: "0 18px 50px rgba(56,189,248,.28)"
        }}
      >
        🔗 Links
      </a>

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

        <div className="mia-inline-truth-slot">
          <MiaPanelTruthCard panelKey={activeView} />
        </div>

        {activeView === "visao" && (
          <>

          <SystemTruthPanel />

          <StudioQuickShortcutsPanel />
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

        {activeView === "google" && (
          <>
            <section className="metric-grid">
              {googlePresenceCards.map((item) => (
                <MetricCard key={item.title} title={item.title} value={item.value} detail={item.detail} tone={item.tone} />
              ))}
            </section>

            <section className="google-hero">
              <div className="panel">
                <PanelTitle eyebrow="Google Ads / AdSense" title="Monetização dos anúncios do blog" action="Conectar conta" />
                {googleAdsRows.map((item) => (
                  <DataRow key={item.title} title={item.title} detail={item.detail} value={item.value} tone={item.tone} />
                ))}
              </div>

              <div className="panel">
                <PanelTitle eyebrow="Search Console" title="Presença orgânica no Google" action="Auditar SEO" />
                {googleSearchRows.map((item) => (
                  <DataRow key={item.title} title={item.title} detail={item.detail} value={item.value} tone={item.tone} />
                ))}
              </div>
            </section>

            <section className="lower-grid">
              <div className="panel">
                <PanelTitle eyebrow="Ranking" title="Palavras-chave para ganhar espaço" />
                {googleKeywordRows.map((item) => (
                  <DataRow key={item.title} title={item.title} detail={item.detail} value={item.value} tone={item.tone} />
                ))}
              </div>

              <div className="panel">
                <PanelTitle eyebrow="Interesse do Google" title="Temas que mais puxam tráfego" />
                <div className="google-bars">
                  {googleTrendBars.map((item) => (
                    <div key={item.label} className={`google-bar ${item.tone}`}>
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
                <PanelTitle eyebrow="Backlinks" title="Quem está falando ou linkando a Sualuma" />
                {googleBacklinkRows.map((item) => (
                  <DataRow key={item.title} title={item.title} detail={item.detail} value={item.value} tone={item.tone} />
                ))}
              </div>

              <div className="panel">
                <PanelTitle eyebrow="Mia para Google" title="Como conquistar mais espaço" />
                {googleMiaRows.map((item) => (
                  <DataRow key={item.title} title={item.title} detail={item.detail} value={item.value} tone={item.tone} />
                ))}
              </div>
            </section>

            <section className="google-social-panel">
              <div className="panel">
                <PanelTitle eyebrow="Presença social" title="O que estão falando da Sualuma nas redes" action="Criar alerta" />
                {socialMentionRows.map((item) => (
                  <DataRow key={item.title} title={item.title} detail={item.detail} value={item.value} tone={item.tone} />
                ))}
              </div>

              <div className="panel">
                <PanelTitle eyebrow="Sentimento da marca" title="Resumo do que o público está sentindo" />
                <div className="social-sentiment">
                  <div className="sentiment-circle">
                    <strong>72%</strong>
                    <span>positivo</span>
                  </div>
                  <div>
                    {socialSentimentRows.map((item) => (
                      <DataRow key={item.title} title={item.title} detail={item.detail} value={item.value} tone={item.tone} />
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {activeView === "noticias" && (
          <>
            <section className="metric-grid">
              {trendNewsCards.map((item) => (
                <MetricCard key={item.title} title={item.title} value={item.value} detail={item.detail} tone={item.tone} />
              ))}
            </section>

            <section className="trend-hero">
              <div className="panel">
                <PanelTitle eyebrow="Trends sociais" title="O que está bombando nas redes" action="Atualizar radar" />
                {socialTrendRows.map((item) => (
                  <DataRow key={item.title} title={item.title} detail={item.detail} value={item.value} tone={item.tone} />
                ))}
              </div>

              <div className="panel">
                <PanelTitle eyebrow="Google 24h" title="Pesquisas quentes do nicho" action="Ver buscas" />
                {googleHotSearchRows.map((item) => (
                  <DataRow key={item.title} title={item.title} detail={item.detail} value={item.value} tone={item.tone} />
                ))}
              </div>
            </section>

            <section className="lower-grid">
              <div className="panel">
                <PanelTitle eyebrow="Tecnologia" title="Notícias quentes de IA, SaaS e automação" />
                {techNewsRows.map((item) => (
                  <DataRow key={item.title} title={item.title} detail={item.detail} value={item.value} tone={item.tone} />
                ))}
              </div>

              <div className="panel">
                <PanelTitle eyebrow="Empresários e empreendedores" title="Sinais do mercado" />
                {entrepreneurNewsRows.map((item) => (
                  <DataRow key={item.title} title={item.title} detail={item.detail} value={item.value} tone={item.tone} />
                ))}
              </div>
            </section>

            <section className="panel full">
              <PanelTitle eyebrow="Oportunidades de hoje" title="Como transformar notícia em conteúdo, lead e venda" />
              <div className="opportunity-grid">
                {hotOpportunityRows.map((item) => (
                  <div key={item.title} className={`opportunity-card ${item.tone}`}>
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                    <span>{item.value}</span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {activeView === "organico" && (
          <>
            <section className="metric-grid">
              {organicMarketingCards.map((item) => (
                <MetricCard key={item.title} title={item.title} value={item.value} detail={item.detail} tone={item.tone} />
              ))}
            </section>

            <section className="organic-hero">
              <div className="panel">
                <PanelTitle eyebrow="Ruby de Marketing Orgânico" title="Testes para trazer clientes sem pagar tráfego" action="Criar experimento" />
                {organicIdeaRows.map((item) => (
                  <DataRow key={item.title} title={item.title} detail={item.detail} value={item.value} tone={item.tone} />
                ))}
              </div>

              <div className="panel">
                <PanelTitle eyebrow="Sugestões da Mia" title="Sistema de crescimento orgânico" />
                {miaOrganicRows.map((item) => (
                  <DataRow key={item.title} title={item.title} detail={item.detail} value={item.value} tone={item.tone} />
                ))}
              </div>
            </section>

            <section className="lower-grid">
              <div className="panel">
                <PanelTitle eyebrow="Fóruns do nicho" title="Onde estão falando sobre nossos temas" action="Adicionar fórum" />
                {forumRadarRows.map((item) => (
                  <DataRow key={item.title} title={item.title} detail={item.detail} value={item.value} tone={item.tone} />
                ))}
              </div>

              <div className="panel">
                <PanelTitle eyebrow="Alertas dos fóruns" title="O que apareceu agora para virar conteúdo" />
                {forumAlertRows.map((item) => (
                  <DataRow key={item.title} title={item.title} detail={item.detail} value={item.value} tone={item.tone} />
                ))}
              </div>
            </section>
          </>
        )}

        {activeView === "tarefas" && (
          <LiveSystemTasksView fallbackRows={systemTaskRows} />
        )}

        {activeView === "loja" && (
          <LiveStoreProductsView fallbackRows={storeProductRows} />
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
          <LiveCnpjView fallbackRows={cnpjNotificationRows} />
        )}

        {activeView === "sitemap" && (
          <LiveSubdomainsView fallbackRows={subdomainRows} />
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
          <LiveCommunityView fallbackRows={communityModerationRows} />
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
          <LiveHealthView />
        )}

        {activeView === "stripe" && (
          <>
            <section className="stripe-hero">
              <div className="stripe-main-card">
                <PanelTitle eyebrow="Stripe / Pagamentos" title="Central de assinaturas, cobranças e checkout" action={stripeLiveData ? "Banco conectado" : "Conectar Stripe"} />

                <div id="stripe-planos-studio-lab" style={{ marginTop: 24, border: "1px solid rgba(148,163,184,.22)", borderRadius: 28, overflow: "hidden", background: "linear-gradient(180deg, rgba(88,28,135,.22), rgba(2,6,23,.92))", boxShadow: "0 24px 80px rgba(0,0,0,.35)" }}>
                  <div style={{ padding: 18, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                    <div>
                      <p style={{ margin: "0 0 6px", color: "#67e8f9", fontSize: 12, letterSpacing: ".22em", textTransform: "uppercase", fontWeight: 800 }}>
                        Studio • Stripe
                      </p>
                      <h3 style={{ margin: 0, color: "#fff", fontSize: 24 }}>
                        Produtos, serviços e planos Stripe
                      </h3>
                      <p style={{ margin: "8px 0 0", color: "rgba(226,232,240,.72)", maxWidth: 760 }}>
                        Lista real dos produtos já criados na Stripe + formulário para criar novos planos.
                      </p>
                    </div>

                    <a href="/studio/stripe-planos" style={{ color: "#fff", textDecoration: "none", border: "1px solid rgba(255,255,255,.22)", borderRadius: 999, padding: "12px 18px", fontWeight: 800, background: "rgba(255,255,255,.08)" }}>
                      Abrir tela cheia
                    </a>
                  </div>

                  <iframe
                    title="Produtos e planos Stripe"
                    src="/studio/stripe-planos?embed=1"
                    style={{ width: "100%", height: "1280px", border: 0, background: "#050816", display: "block" }}
                  />
                </div>


                <div className="stripe-big-number">
                  <small>Receita processada no mês</small>
                  <strong>{liveStripeDashboardCards?.[0]?.value || "R$ 0,00"}</strong>
                  <span>{stripeLiveData ? "Dados vindos do banco do Studio. A integração real do Stripe entra quando a chave secreta for configurada." : "Dados demonstrativos até conectar a API do Stripe com segurança no backend."}</span>
                </div>

                <div className="stripe-mini-grid">
                  <div>
                    <small>MRR</small>
                    <strong>R$ 18.900</strong>
                    <em>recorrente</em>
                  </div>
                  <div>
                    <small>Falhas</small>
                    <strong>7</strong>
                    <em className="negative">recuperar</em>
                  </div>
                  <div>
                    <small>Ativas</small>
                    <strong>126</strong>
                    <em>assinaturas</em>
                  </div>
                </div>
              </div>

              <div className="stripe-side-card">
                <PanelTitle eyebrow="Mia Pagamentos" title="Leitura rápida" />
                <p>
                  A operação de pagamentos está saudável, mas precisa recuperar checkouts abandonados
                  e pagamentos falhados para aumentar receita sem comprar mais tráfego.
                </p>
                <div className="stripe-score">
                  <strong>86%</strong>
                  <span>saúde Stripe</span>
                </div>
              </div>
            </section>

            <section className="metric-grid stripe-metrics">
              {liveStripeDashboardCards.map((item: any) => (
                <MetricCard key={item.title} title={item.title} value={item.value} detail={item.detail} tone={item.tone} />
              ))}
            </section>

            <section className="lower-grid">
              <div className="panel">
                <PanelTitle eyebrow="Pagamentos" title="Últimos eventos importantes" action="Ver eventos" />
                {liveStripePaymentRows.map((item: any) => (
                  <DataRow key={item.title} title={item.title} detail={item.detail} value={item.value} tone={item.tone} />
                ))}
              </div>

              <div className="panel">
                <PanelTitle eyebrow="Assinaturas" title="Planos e recorrência" />
                {liveStripeSubscriptionRows.map((item: any) => (
                  <DataRow key={item.title} title={item.title} detail={item.detail} value={item.value} tone={item.tone} />
                ))}
              </div>
            </section>

            <section className="lower-grid">
              <div className="panel">
                <PanelTitle eyebrow="Distribuição de receita" title="Receita por plano/produto" />
                <div className="stripe-bars">
                  {liveStripeRevenueBars.map((item: any) => (
                    <div key={item.label} className={`stripe-bar ${item.tone}`}>
                      <div>
                        <strong>{item.label}</strong>
                        <span>{item.value}</span>
                      </div>
                      <b style={{ width: item.value }} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel">
                <PanelTitle eyebrow="Ações rápidas" title="Controle sem abrir o Stripe" />
                {liveStripeActionRows.map((item: any) => (
                  <DataRow key={item.title} title={item.title} detail={item.detail} value={item.value} tone={item.tone} />
                ))}
              </div>
            </section>

            <section className="panel full">
              <PanelTitle eyebrow="Alertas da Mia" title="O que fazer para recuperar e aumentar receita" />
              <div className="stripe-alert-grid">
                {liveStripeAlertRows.map((item: any) => (
                  <div key={item.title} className={`stripe-alert-card ${item.tone}`}>
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                    <span>{item.value}</span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {activeView === "financeiro" && (
          <>
            <section className="finance-hero">
              <div className="finance-main-card">
                <PanelTitle eyebrow="Financeiro estratégico" title="Painel de dinheiro, custos e reinvestimento" action="Banco conectado" />
                
                <div className="finance-live-badge">
                  <span>Banco conectado ao Postgres</span>
                  <strong>Dados demonstrativos até conectar Stripe</strong>
                </div>

                <div className="finance-big-number">
                  <small>Saldo operacional estimado</small>
                  <strong>{liveFinanceSummary.operatingBalance || "R$ 36.320,00"}</strong>
                  <span>{liveFinanceSummary.profitLabel || "Lucro líquido após custos principais do mês"}</span>
                </div>

                <div className="finance-mini-grid">
                  <div>
                    <small>Receita</small>
                    <strong>{liveFinanceSummary.revenue || "R$ 48.750"}</strong>
                    <em>{liveFinanceSummary.revenueGrowth || "+18,6%"}</em>
                  </div>
                  <div>
                    <small>Gastos</small>
                    <strong>{liveFinanceSummary.costs || "R$ 12.430"}</strong>
                    <em className="negative">monitorar</em>
                  </div>
                  <div>
                    <small>Reinvestir</small>
                    <strong>{liveFinanceSummary.reinvestment || "R$ 8.600"}</strong>
                    <em>produto + marketing</em>
                  </div>
                </div>
              </div>

              <div className="finance-side-card">
                <PanelTitle eyebrow="Mia Financeira" title="Leitura rápida" />
                <p>{liveFinanceSummary.miaSummary || "O financeiro está saudável, mas precisa separar origem da receita, custos fixos, custos variáveis e ROI dos agentes antes de escalar."}</p>
                <div className="finance-score">
                  <strong>{liveFinanceHealthScore}%</strong>
                  <span>Saúde financeira</span>
                </div>
              </div>
            </section>

            <section className="metric-grid finance-metrics">
              {liveFinanceDashboardCards.map((item: any) => (
                <MetricCard key={item.title} title={item.title} value={item.value} detail={item.detail} tone={item.tone} />
              ))}
            </section>

            <section className="lower-grid">
              <div className="panel">
                <PanelTitle eyebrow="Origem do dinheiro" title="De onde está vindo a receita" />
                {liveFinanceRevenueRows.map((item: any) => (
                  <DataRow key={item.title} title={item.title} detail={item.detail} value={item.value} tone={item.tone} />
                ))}
              </div>

              <div className="panel">
                <PanelTitle eyebrow="Distribuição" title="Receita por fonte" />
                <div className="finance-bars">
                  {liveFinanceBars.map((item: any) => (
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
                {liveFinanceCostRows.map((item: any) => (
                  <DataRow key={item.title} title={item.title} detail={item.detail} value={item.value} tone={item.tone} />
                ))}
              </div>

              <div className="panel">
                <PanelTitle eyebrow="Distribuição" title="Gastos por categoria" />
                <div className="finance-bars">
                  {liveFinanceCostBars.map((item: any) => (
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
                {liveFinanceProjectionRows.map((item: any) => (
                  <DataRow key={item.title} title={item.title} detail={item.detail} value={item.value} tone={item.tone} />
                ))}
              </div>

              <div className="panel">
                <PanelTitle eyebrow="Sugestões da Mia" title="Próximas decisões financeiras" />
                {liveFinanceMiaRows.map((item: any) => (
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

        .mia-inline-truth-slot {
          float: right;
          width: min(370px, 34vw);
          margin: 0 0 18px 18px;
          position: relative;
          z-index: 1;
        }

        .mia-inline-truth-slot :global(.miaTruthCard) {
          position: relative !important;
          top: auto !important;
        }
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

        .finance-live-badge {
          display: inline-flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 14px;
          padding: 10px 12px;
          border-radius: 999px;
          border: 1px solid rgba(250,204,21,.25);
          background: rgba(250,204,21,.08);
          color: rgba(255,255,255,.72);
          font-size: 12px;
        }

        .finance-live-badge span {
          color: #22c55e;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .08em;
        }

        .finance-live-badge strong {
          color: #facc15;
          font-weight: 900;
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

        .health-hero {
          display: grid;
          grid-template-columns: 1.45fr .95fr;
          gap: 18px;
          margin-top: 18px;
        }

        .health-main-card,
        .health-side-card {
          border: 1px solid rgba(255,255,255,.10);
          background: linear-gradient(180deg, rgba(255,255,255,.065), rgba(255,255,255,.025));
          box-shadow: 0 24px 80px rgba(0,0,0,.28);
          backdrop-filter: blur(24px);
          border-radius: 28px;
          padding: 22px;
        }

        .health-big-score {
          margin-top: 18px;
          padding: 24px;
          border-radius: 26px;
          background:
            radial-gradient(circle at 22% 0%, rgba(34,197,94,.22), transparent 34%),
            radial-gradient(circle at 84% 10%, rgba(255,79,189,.18), transparent 28%),
            rgba(255,255,255,.04);
          border: 1px solid rgba(34,197,94,.18);
        }

        .health-big-score small {
          display: block;
          color: rgba(255,255,255,.58);
        }

        .health-big-score strong {
          display: block;
          margin: 8px 0;
          font-size: clamp(44px, 6vw, 82px);
          letter-spacing: -.07em;
          color: #86efac;
          text-shadow: 0 0 36px rgba(34,197,94,.30);
        }

        .health-big-score span,
        .health-side-card p {
          color: rgba(255,255,255,.64);
          line-height: 1.6;
        }

        .health-status-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-top: 14px;
        }

        .health-status-grid div {
          padding: 14px;
          border-radius: 18px;
          background: rgba(255,255,255,.045);
          border: 1px solid rgba(255,255,255,.08);
        }

        .health-status-grid strong {
          display: block;
          margin: 8px 0 3px;
          color: #fff;
          font-size: 14px;
        }

        .health-status-grid small {
          color: rgba(255,255,255,.55);
          font-size: 12px;
        }

        .health-dot {
          width: 11px;
          height: 11px;
          display: inline-block;
          border-radius: 999px;
          box-shadow: 0 0 18px currentColor;
        }

        .health-dot.green { color: #22c55e; background: #22c55e; }
        .health-dot.yellow { color: #facc15; background: #facc15; }
        .health-dot.red { color: #fb7185; background: #fb7185; }

        .health-mini-bars {
          display: grid;
          gap: 14px;
          margin-top: 18px;
        }

        .health-mini-bar {
          display: grid;
          gap: 8px;
        }

        .health-mini-bar div {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .health-mini-bar strong {
          color: #fff;
        }

        .health-mini-bar span {
          color: rgba(255,255,255,.62);
          font-size: 13px;
        }

        .health-mini-bar b {
          display: block;
          height: 12px;
          border-radius: 999px;
          background: currentColor;
          box-shadow: 0 0 22px currentColor;
        }

        .health-metrics {
          margin-top: 18px;
        }

        .health-mia-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }

        .health-mia-card {
          min-height: 175px;
          border-radius: 22px;
          padding: 18px;
          border: 1px solid rgba(255,255,255,.10);
          background: linear-gradient(180deg, rgba(255,255,255,.065), rgba(255,255,255,.025));
          box-shadow: 0 24px 80px rgba(0,0,0,.24);
        }

        .health-mia-card strong {
          display: block;
          color: #fff;
          font-size: 17px;
          margin-bottom: 8px;
        }

        .health-mia-card p {
          color: rgba(255,255,255,.62);
          line-height: 1.5;
          margin: 0 0 14px;
          font-size: 13px;
        }

        .health-mia-card span {
          display: inline-flex;
          padding: 7px 10px;
          border-radius: 999px;
          background: rgba(255,255,255,.07);
          color: #ff9be6;
          font-size: 12px;
        }

        .stripe-hero {
          display: grid;
          grid-template-columns: 1.7fr .9fr;
          gap: 18px;
          margin-top: 18px;
        }

        .stripe-main-card,
        .stripe-side-card {
          border: 1px solid rgba(255,255,255,.10);
          background: linear-gradient(180deg, rgba(255,255,255,.065), rgba(255,255,255,.025));
          box-shadow: 0 24px 80px rgba(0,0,0,.28);
          backdrop-filter: blur(24px);
          border-radius: 28px;
          padding: 22px;
        }

        .stripe-big-number {
          margin-top: 18px;
          padding: 22px;
          border-radius: 24px;
          background:
            radial-gradient(circle at 18% 0%, rgba(56,189,248,.22), transparent 34%),
            rgba(255,255,255,.04);
          border: 1px solid rgba(56,189,248,.18);
        }

        .stripe-big-number small,
        .stripe-mini-grid small {
          display: block;
          color: rgba(255,255,255,.58);
        }

        .stripe-big-number strong {
          display: block;
          margin: 8px 0;
          font-size: clamp(34px, 4vw, 58px);
          letter-spacing: -.06em;
          color: #93c5fd;
          text-shadow: 0 0 32px rgba(56,189,248,.28);
        }

        .stripe-big-number span,
        .stripe-side-card p {
          color: rgba(255,255,255,.62);
          line-height: 1.55;
        }

        .stripe-mini-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 14px;
        }

        .stripe-mini-grid div {
          padding: 14px;
          border-radius: 18px;
          background: rgba(255,255,255,.045);
          border: 1px solid rgba(255,255,255,.08);
        }

        .stripe-mini-grid strong {
          display: block;
          margin: 5px 0;
          font-size: 22px;
        }

        .stripe-mini-grid em {
          font-style: normal;
          color: #22c55e;
          font-size: 12px;
        }

        .stripe-mini-grid em.negative {
          color: #facc15;
        }

        .stripe-score {
          width: 170px;
          height: 170px;
          margin: 22px auto 0;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: conic-gradient(#38bdf8 0 86%, rgba(255,255,255,.08) 86% 100%);
          box-shadow: 0 0 48px rgba(56,189,248,.30);
        }

        .stripe-score strong {
          display: block;
          font-size: 36px;
          margin-top: 24px;
        }

        .stripe-score span {
          margin-top: -34px;
          color: rgba(255,255,255,.58);
          font-size: 12px;
        }

        .stripe-metrics {
          margin-top: 18px;
        }

        .stripe-bars {
          display: grid;
          gap: 16px;
        }

        .stripe-bar {
          display: grid;
          gap: 8px;
        }

        .stripe-bar div {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .stripe-bar strong {
          color: #fff;
        }

        .stripe-bar span {
          color: rgba(255,255,255,.62);
          font-size: 13px;
        }

        .stripe-bar b {
          display: block;
          height: 14px;
          border-radius: 999px;
          background: currentColor;
          box-shadow: 0 0 22px currentColor;
        }

        .stripe-alert-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }

        .stripe-alert-card {
          min-height: 170px;
          border-radius: 22px;
          padding: 18px;
          border: 1px solid rgba(255,255,255,.10);
          background: linear-gradient(180deg, rgba(255,255,255,.065), rgba(255,255,255,.025));
          box-shadow: 0 24px 80px rgba(0,0,0,.24);
        }

        .stripe-alert-card strong {
          display: block;
          color: #fff;
          font-size: 17px;
          margin-bottom: 8px;
        }

        .stripe-alert-card p {
          color: rgba(255,255,255,.62);
          line-height: 1.5;
          margin: 0 0 14px;
          font-size: 13px;
        }

        .stripe-alert-card span {
          display: inline-flex;
          padding: 7px 10px;
          border-radius: 999px;
          background: rgba(255,255,255,.07);
          color: #ff9be6;
          font-size: 12px;
        }

        .trend-hero,
        .organic-hero {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
          margin-top: 18px;
        }

        .opportunity-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }

        .opportunity-card {
          min-height: 180px;
          border-radius: 22px;
          padding: 18px;
          border: 1px solid rgba(255,255,255,.10);
          background: linear-gradient(180deg, rgba(255,255,255,.065), rgba(255,255,255,.025));
          box-shadow: 0 24px 80px rgba(0,0,0,.24);
        }

        .opportunity-card strong {
          display: block;
          color: #fff;
          font-size: 17px;
          margin-bottom: 8px;
        }

        .opportunity-card p {
          color: rgba(255,255,255,.62);
          line-height: 1.5;
          margin: 0 0 14px;
          font-size: 13px;
        }

        .opportunity-card span {
          display: inline-flex;
          padding: 7px 10px;
          border-radius: 999px;
          background: rgba(255,255,255,.07);
          color: #ff9be6;
          font-size: 12px;
        }

        .google-hero,
        .google-social-panel {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
          margin-top: 18px;
        }

        .google-bars {
          display: grid;
          gap: 16px;
        }

        .google-bar {
          display: grid;
          gap: 8px;
        }

        .google-bar div {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
        }

        .google-bar strong {
          color: #fff;
        }

        .google-bar span {
          color: rgba(255,255,255,.62);
          font-size: 13px;
        }

        .google-bar b {
          display: block;
          height: 14px;
          border-radius: 999px;
          background: currentColor;
          box-shadow: 0 0 22px currentColor;
        }

        .social-sentiment {
          display: grid;
          grid-template-columns: 170px 1fr;
          gap: 18px;
          align-items: start;
        }

        .sentiment-circle {
          width: 155px;
          height: 155px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: conic-gradient(#22c55e 0 72%, rgba(255,255,255,.08) 72% 100%);
          box-shadow: 0 0 42px rgba(34,197,94,.24);
        }

        .sentiment-circle strong {
          display: block;
          font-size: 34px;
          margin-top: 25px;
        }

        .sentiment-circle span {
          margin-top: -36px;
          color: rgba(255,255,255,.62);
          font-size: 12px;
        }

        .store-table {
          display: grid;
          gap: 12px;
        }

        .store-row {
          display: grid;
          grid-template-columns: 18px 1fr auto auto auto;
          gap: 12px;
          align-items: center;
          padding: 14px;
          border-radius: 18px;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.08);
        }

        .store-row p {
          margin: 4px 0 0;
          color: rgba(255,255,255,.58);
          font-size: 13px;
        }

        .store-row button,
        .moderation-row button {
          border: 1px solid rgba(255,79,189,.28);
          color: #fff;
          background: rgba(255,79,189,.10);
          border-radius: 12px;
          padding: 10px 12px;
          cursor: pointer;
        }

        .community-hero {
          display: grid;
          grid-template-columns: 1.45fr .9fr;
          gap: 18px;
          margin-top: 18px;
        }

        .moderation-row {
          display: grid;
          grid-template-columns: 18px 1fr auto auto;
          gap: 12px;
          align-items: center;
          padding: 14px 0;
          border-bottom: 1px solid rgba(255,255,255,.07);
        }

        .moderation-row p {
          margin: 4px 0 0;
          color: rgba(255,255,255,.58);
          font-size: 13px;
          line-height: 1.45;
        }

        .community-retention-chart {
          display: grid;
          grid-template-columns: 150px 1fr;
          gap: 16px;
          align-items: center;
          margin-bottom: 16px;
        }

        .retention-circle {
          width: 140px;
          height: 140px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: conic-gradient(#22c55e 0 68%, rgba(255,255,255,.08) 68% 100%);
          box-shadow: 0 0 42px rgba(34,197,94,.25);
        }

        .retention-circle strong {
          display: block;
          font-size: 32px;
          margin-top: 25px;
        }

        .retention-circle span {
          margin-top: -34px;
          color: rgba(255,255,255,.58);
        }

        .community-retention-chart p {
          color: rgba(255,255,255,.62);
          line-height: 1.55;
        }

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
          .mia-inline-truth-slot {
            float: none;
            width: 100%;
            margin: 0 0 18px 0;
          }

          .hero-grid,
          .health-hero,
          .stripe-hero,
          .finance-hero,
          .community-hero,
          .google-hero,
          .google-social-panel,
          .trend-hero,
          .organic-hero,
          .lower-grid,
          .brain-layout {
            grid-template-columns: 1fr;
          }

          .metric-grid,
          .sitemap-grid,
          .agent-grid,
          .subdomain-grid,
          .task-board,
          .opportunity-grid,
          .stripe-alert-grid,
          .health-mia-grid,
          .health-status-grid {
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
          .task-board,
          .opportunity-grid,
          .stripe-alert-grid,
          .health-mia-grid,
          .health-status-grid {
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

          .user-row,
          .store-row,
          .moderation-row {
            grid-template-columns: 20px 1fr;
          }
          .community-retention-chart,
          .social-sentiment {
            grid-template-columns: 1fr;
          }
          .finance-mini-grid { grid-template-columns: 1fr; }
          .ux-frame { height: 680px; }
          .ux-only-wrap { min-height: 680px; }
        }
      `}</style>
          <SualumaPublicChat sourcePage="Dashboard Studio Lab" />
    </main>
  );
}
