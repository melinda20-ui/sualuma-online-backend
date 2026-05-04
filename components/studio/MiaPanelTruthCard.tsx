"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type Tone = "danger" | "warn" | "ok" | "info";

type PanelTruth = {
  title: string;
  tone: Tone;
  truth: string;
  suggestion: string;
  next: string;
  source: string;
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function detectCurrentPanel(pathname: string, pageText: string): PanelTruth {
  const text = normalizeText(pageText);

  if (pathname.includes("/studio/agentesadms") || text.includes("central de agentes")) {
    return {
      title: "Agentes Admin",
      tone: "ok",
      truth:
        "Este painel já lê tarefas reais do arquivo local de tarefas dos agentes. Ainda precisa ganhar filtros, Kanban e avisos automáticos mais claros.",
      suggestion:
        "Use esta central como o lugar onde a Mia despeja tudo que precisa virar tarefa, alerta, bug ou checklist.",
      next: "Criar filtros por painel, prioridade e tipo de agente.",
      source: "Página atual: Agentes Admin",
    };
  }

  if (pathname.includes("/studio/mia-brain") || text.includes("mia brain") || text.includes("cerebro da mia")) {
    return {
      title: "Mia Brain",
      tone: "warn",
      truth:
        "Este painel precisa separar claramente memória real, prompt salvo, log real e conteúdo visual. Se um card não mostra fonte, pode estar misturando real com demonstrativo.",
      suggestion:
        "Colocar etiqueta em cada bloco: banco, JSON local, fallback ou visual.",
      next: "Auditar prompts, logs, cards e conexões reais do cérebro da Mia.",
      source: "Página atual: Mia Brain",
    };
  }

  if (pathname.includes("/studio/usuarios") || text.includes("usuarios") || text.includes("usuários")) {
    return {
      title: "Usuários",
      tone: "danger",
      truth:
        "Área crítica. Login, sessão, plano, permissões e acesso por subdomínio precisam ser 100% reais. Qualquer dado ilustrativo aqui pode causar decisão errada no lançamento.",
      suggestion:
        "Testar usuário comum, cliente IA, prestador e admin separadamente.",
      next: "Conferir se cada papel vê apenas o que o plano permite.",
      source: "Página atual: Usuários",
    };
  }

  if (pathname.includes("/studio/campaign-agent") || text.includes("campanha")) {
    return {
      title: "Campanhas",
      tone: "warn",
      truth:
        "Campanhas precisam diferenciar rascunho, fila real, enviado, erro e bloqueado por consentimento. Métrica sem log não deve ser tratada como verdade.",
      suggestion:
        "Mostrar fonte da fila: banco, JSON local ou provedor de e-mail.",
      next: "Garantir LGPD, opt-in, descadastro e revisão manual antes dos disparos.",
      source: "Página atual: Campanhas",
    };
  }

  if (text.includes("flowmind")) {
    return {
      title: "FlowMind",
      tone: "warn",
      truth:
        "FlowMind mistura produto, templates e vitrine. Precisa separar o que já funciona depois do checkout do que ainda é apresentação visual.",
      suggestion:
        "Deixar claro o que o usuário realmente recebe após comprar ou usar um template.",
      next: "Auditar checkout, templates, workspace, Minha Casa e Minha Empresa.",
      source: "Página atual: FlowMind",
    };
  }

  if (text.includes("cliente") || pathname.includes("/member-user")) {
    return {
      title: "Dashboard Cliente",
      tone: "danger",
      truth:
        "O dashboard do cliente não pode mostrar agentes, serviços, reuniões ou entregas que não existem no banco ou que o usuário não comprou.",
      suggestion:
        "Cada card precisa respeitar plano, compras extras e histórico real do usuário.",
      next: "Testar cadastro grátis, compra de plano e acesso pelo chat da Mia.",
      source: "Página atual: Cliente",
    };
  }

  if (text.includes("prestador") || pathname.includes("/provider")) {
    return {
      title: "Dashboard Prestador",
      tone: "danger",
      truth:
        "A área de prestador precisa bloquear divulgação, anúncios e serviços para quem não tem plano de prestador. Dados visuais aqui podem liberar coisa errada.",
      suggestion:
        "Separar usuário comum, cliente IA e prestador pago com regras reais.",
      next: "Testar oportunidades, Kanban, reuniões, portfólio e permissões.",
      source: "Página atual: Prestador",
    };
  }

  if (text.includes("comunidade")) {
    return {
      title: "Comunidade",
      tone: "warn",
      truth:
        "A comunidade precisa ter moderação, denúncias, regras contra WhatsApp/link externo e limites para quem não tem plano de prestador.",
      suggestion:
        "Mostrar alertas claros quando um post violar regras comerciais.",
      next: "Auditar posts, comentários, denúncias e bloqueio de links externos.",
      source: "Página atual: Comunidade",
    };
  }

  if (text.includes("cerebro operacional") || text.includes("seu imperio em tempo real") || text.includes("seu império em tempo real")) {
    return {
      title: "Visão Geral",
      tone: "warn",
      truth:
        "Essa visão ainda tem vários números que parecem ilustrativos: 24 tarefas, 5 áreas, 3 alertas, +18% financeiro e saúde geral. Ela é bonita para navegação, mas nem tudo é banco real.",
      suggestion:
        "Use como mapa visual. Para decisão real, confirme se cada card tem API ou banco conectado.",
      next: "Marcar cards visuais como ilustrativos ou conectar aos dados reais.",
      source: "Aba atual: Visão Geral",
    };
  }

  return {
    title: "Painel atual",
    tone: "info",
    truth:
      "A Mia está analisando esta página. Ainda precisa confirmar se os dados vêm de banco/API ou se são apenas visuais.",
    suggestion:
      "Números fixos, listas mockadas e textos genéricos devem ser marcados como ilustrativos.",
    next: "Se houver dado falso ou incompleto, enviar para o Agente de Tarefas.",
    source: "Página atual",
  };
}

const toneStyle: Record<Tone, { label: string; bg: string; border: string; color: string }> = {
  danger: {
    label: "Risco alto",
    bg: "rgba(127,29,29,.88)",
    border: "rgba(248,113,113,.42)",
    color: "#fecaca",
  },
  warn: {
    label: "Misto/Ilustrativo",
    bg: "rgba(120,53,15,.88)",
    border: "rgba(251,191,36,.42)",
    color: "#fde68a",
  },
  ok: {
    label: "Mais real",
    bg: "rgba(20,83,45,.88)",
    border: "rgba(74,222,128,.38)",
    color: "#bbf7d0",
  },
  info: {
    label: "Analisar",
    bg: "rgba(30,64,175,.88)",
    border: "rgba(96,165,250,.38)",
    color: "#bfdbfe",
  },
};

export default function MiaPanelTruthCard() {
  const pathname = usePathname() || "/";
  const [pageText, setPageText] = useState("");

  useEffect(() => {
    let timer: number | undefined;

    function readPage() {
      const bodyText = document.body?.innerText || "";
      setPageText(bodyText.slice(0, 12000));
    }

    readPage();

    const observer = new MutationObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(readPage, 250);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    const interval = window.setInterval(readPage, 1800);

    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
      window.clearInterval(interval);
    };
  }, [pathname]);

  const panel = useMemo(() => detectCurrentPanel(pathname, pageText), [pathname, pageText]);
  const tone = toneStyle[panel.tone];

  return (
    <aside className="miaTruthCard">
      <div className="miaTruthHeader">
        <div className="miaTruthEyebrow">💌 Sugestões da Mia</div>
        <strong>{panel.title}</strong>
      </div>

      <div className="miaTruthBody">
        <div className="truthBadge">Detector de verdade: {tone.label}</div>

        <section>
          <strong>O que está acontecendo aqui</strong>
          <p>{panel.truth}</p>
        </section>

        <section>
          <strong>Sugestão prática</strong>
          <p>{panel.suggestion}</p>
        </section>

        <section className="nextBox">
          <strong>Próximo passo único</strong>
          <p>{panel.next}</p>
        </section>

        <a href="/studio/agentesadms">Ver no Agente de Tarefas →</a>

        <small>Fonte: {panel.source}. Este card muda conforme a página/aba aberta.</small>
      </div>

      <style jsx>{`
        .miaTruthCard {
          width: 100%;
          min-width: 0;
          position: sticky;
          top: 18px;
          overflow: hidden;
          border-radius: 26px;
          border: 1px solid ${tone.border};
          background: linear-gradient(145deg, rgba(15,23,42,.96), rgba(30,27,75,.92));
          color: #f8fafc;
          box-shadow: 0 28px 90px rgba(0,0,0,.32);
          backdrop-filter: blur(18px);
        }

        .miaTruthHeader {
          padding: 14px 16px;
          background: ${tone.bg};
          border-bottom: 1px solid ${tone.border};
        }

        .miaTruthEyebrow {
          font-size: 10px;
          font-weight: 950;
          letter-spacing: .16em;
          text-transform: uppercase;
          color: ${tone.color};
        }

        .miaTruthHeader strong {
          display: block;
          margin-top: 4px;
          font-size: 17px;
        }

        .miaTruthBody {
          padding: 16px;
          display: grid;
          gap: 12px;
        }

        .truthBadge {
          width: fit-content;
          padding: 7px 10px;
          border-radius: 999px;
          background: rgba(255,255,255,.08);
          border: 1px solid ${tone.border};
          color: ${tone.color};
          font-size: 12px;
          font-weight: 950;
        }

        section strong {
          font-size: 13px;
          color: #e0f2fe;
        }

        section p {
          margin: 6px 0 0;
          color: #cbd5e1;
          font-size: 13px;
          line-height: 1.5;
        }

        .nextBox {
          padding: 12px;
          border-radius: 18px;
          background: rgba(6,182,212,.10);
          border: 1px solid rgba(103,232,249,.18);
        }

        .nextBox strong {
          color: #67e8f9;
        }

        a {
          display: inline-flex;
          justify-content: center;
          text-align: center;
          padding: 11px 13px;
          border-radius: 16px;
          text-decoration: none;
          color: #fff;
          font-weight: 950;
          background: linear-gradient(135deg, #7c3aed, #06b6d4);
          box-shadow: 0 16px 34px rgba(124,58,237,.25);
        }

        small {
          color: #94a3b8;
          line-height: 1.45;
        }

        @media (max-width: 980px) {
          .miaTruthCard {
            position: relative;
            top: auto;
          }
        }
      `}</style>
    </aside>
  );
}
