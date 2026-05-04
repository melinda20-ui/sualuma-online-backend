"use client";

import { useState } from "react";
import type { CSSProperties } from "react";

type Stage = {
  id: string;
  number: number;
  title: string;
  tag: string;
  color: string;
  soft: string;
  desc: string;
  example?: string;
  details: string[];
};

const stages: Stage[] = [
  {
    id: "presenca",
    number: 1,
    title: "Presença digital",
    tag: "Antes da abordagem",
    color: "#6ee7b7",
    soft: "rgba(110,231,183,.16)",
    desc: "Antes de chamar alguém, a Sualuma precisa parecer real, pesquisável e segura. A pessoa vai procurar no Google, Instagram, LinkedIn, Reclame Aqui e YouTube.",
    details: [
      "Página Sobre clara, com explicação simples do que é a Sualuma.",
      "LinkedIn com bastidores, visão da empresa e conteúdo para pequenos negócios.",
      "Blog com artigos úteis para aparecer no Google.",
      "Instagram com presença real, não só logo e promessa.",
      "Reclame Aqui criado e monitorado.",
      "Página de privacidade e LGPD acessível.",
    ],
  },
  {
    id: "contato-frio",
    number: 2,
    title: "Primeiro contato frio",
    tag: "Pergunta humana",
    color: "#67e8f9",
    soft: "rgba(103,232,249,.16)",
    desc: "A primeira mensagem não vende, não manda link e não fala de robôs. Ela só abre uma conversa para descobrir se a pessoa sente uma dor real.",
    example:
      "Oi, tudo bem? Estou conversando com pequenos negócios para entender uma coisa: hoje o que mais pesa na rotina de vocês — atendimento, divulgação, organização, orçamento ou conseguir novos clientes? Não vou te mandar link nem te colocar em lista. É só uma pergunta mesmo.",
    details: [
      "Sem link no primeiro contato.",
      "Sem promessa exagerada.",
      "Sem falar que encontrou e-mail ou WhatsApp na internet.",
      "Meta: gerar resposta, não venda.",
      "Quem não responde não entra em campanha.",
    ],
  },
  {
    id: "interesse",
    number: 3,
    title: "Interesse demonstrado",
    tag: "Ela respondeu",
    color: "#818cf8",
    soft: "rgba(129,140,248,.16)",
    desc: "A pessoa respondeu. Agora o sistema registra que existe um sinal real de interesse e você pede permissão para enviar algo útil.",
    example:
      "Entendi. Isso apareceu bastante nas respostas que estou recebendo. Estou montando um diagnóstico gratuito para pequenos negócios entenderem onde podem estar perdendo tempo ou clientes. Quando estiver pronto, posso te mandar? Só envio se você quiser.",
    details: [
      "Validar a dor que a pessoa mencionou.",
      "Não explicar o sistema inteiro ainda.",
      "Pedir permissão antes de enviar página ou formulário.",
      "CRM muda o status para Interesse demonstrado.",
    ],
  },
  {
    id: "diagnostico",
    number: 4,
    title: "Diagnóstico gratuito",
    tag: "Página interativa",
    color: "#c084fc",
    soft: "rgba(192,132,252,.16)",
    desc: "A pessoa entra em uma página simples, responde perguntas e recebe uma leitura parcial do negócio. Isso aumenta confiança e desejo.",
    details: [
      "Perguntas sobre atendimento, organização, presença digital e follow-up.",
      "Resultado parcial aparece na tela imediatamente.",
      "A pessoa entende o problema antes de ver a solução.",
      "A página explica a Sualuma de forma simples, sem parecer golpe.",
      "Para receber o diagnóstico completo, ela confirma o opt-in.",
    ],
  },
  {
    id: "optin",
    number: 5,
    title: "Opt-in confirmado",
    tag: "Permissão real",
    color: "#fb923c",
    soft: "rgba(251,146,60,.16)",
    desc: "Aqui nasce o consentimento. A pessoa pede para receber o diagnóstico completo e conteúdos da Sualuma. Só depois disso ela entra nos e-mails.",
    example:
      "Quero receber meu diagnóstico gratuito por e-mail e aceito receber conteúdos da Sualuma sobre organização, presença digital, automações, IA e crescimento para pequenos negócios. Posso cancelar quando quiser.",
    details: [
      "Salvar data, origem, canal e texto aceito.",
      "Marcar lead como optIn: true.",
      "Registrar finalidade do consentimento.",
      "Permitir descadastro em todos os e-mails.",
      "Campaign Agent só pode agir depois desta etapa.",
    ],
  },
  {
    id: "nutricao",
    number: 6,
    title: "Sequência de nutrição",
    tag: "Campaign Agent",
    color: "#fb7185",
    soft: "rgba(251,113,133,.16)",
    desc: "Agora o Campaign Agent pode enviar e-mails porque a pessoa pediu. A sequência educa, entrega valor e prepara para a oferta.",
    details: [
      "E-mail 1: diagnóstico completo + checklist.",
      "E-mail 2: conteúdo sobre perda de clientes por falta de acompanhamento.",
      "E-mail 3: agentes digitais explicados de forma simples.",
      "E-mail 4: demonstração curta do sistema.",
      "E-mail 5: convite para trial, demo ou plano inicial.",
    ],
  },
  {
    id: "venda",
    number: 7,
    title: "Venda",
    tag: "Conversão",
    color: "#4ade80",
    soft: "rgba(74,222,128,.16)",
    desc: "A oferta vem baseada no diagnóstico da pessoa. Não é empurrão: é uma continuação lógica do problema que ela mesma reconheceu.",
    example:
      "Pelo seu diagnóstico, você indicou que perde oportunidades por falta de follow-up e presença digital organizada. A Sualuma resolve exatamente esse ponto. Quer experimentar por alguns dias sem custo?",
    details: [
      "Trial gratuito por tempo determinado.",
      "Demonstração rápida para quem preferir contato humano.",
      "Oferta ligada ao problema identificado.",
      "Pagamento transforma lead em cliente ativo.",
      "Depois disso, Mia e agentes liberados conforme plano.",
    ],
  },
];

const crmStages = [
  ["Encontrado", "#6ee7b7"],
  ["Revisado", "#67e8f9"],
  ["Contato inicial feito", "#818cf8"],
  ["Interesse demonstrado", "#c084fc"],
  ["Opt-in confirmado", "#fb923c"],
  ["Em nutrição", "#fb7185"],
  ["Cliente", "#4ade80"],
];

export default function FunilSualumaPage() {
  const [openStage, setOpenStage] = useState(stages[0].id);

  return (
    <main className="funnel-page">
      <section className="hero">
        <a className="back" href="/studio">← Voltar ao Studio</a>
        <div className="label">Sualuma · Estratégia de crescimento</div>
        <h1>
          Funil completo: <span>do contato frio ao pagamento</span>
        </h1>
        <p>
          Manual interno para a Mia, Agente de Leads, Campaign Agent e equipe seguirem
          uma abordagem segura, humana e com opt-in real.
        </p>
      </section>

      <section className="warning">
        <strong>Regra de ouro:</strong> a Sualuma não tenta convencer todo mundo.
        Ela filtra quem já sente a dor, gera confiança, pede permissão e só então
        entra com e-mails e oferta.
      </section>

      <section className="funnel">
        {stages.map((stage) => {
          const isOpen = openStage === stage.id;
          const style = {
            "--stage-color": stage.color,
            "--stage-soft": stage.soft,
          } as CSSProperties;

          return (
            <article
              key={stage.id}
              className={`stage ${isOpen ? "open" : ""}`}
              style={style}
            >
              <button
                type="button"
                className="stage-button"
                onClick={() => setOpenStage(isOpen ? "" : stage.id)}
                aria-expanded={isOpen}
              >
                <span className="stage-number">{stage.number}</span>

                <span className="stage-card">
                  <span className="stage-top">
                    <strong>{stage.title}</strong>
                    <em>{stage.tag}</em>
                  </span>

                  <span className="stage-desc">{stage.desc}</span>

                  <span className="hint">
                    {isOpen ? "Clique para fechar" : "Clique para abrir detalhes"}
                  </span>
                </span>
              </button>

              {isOpen && (
                <div className="stage-details">
                  {stage.example && (
                    <div className="example">
                      <span>Exemplo de mensagem</span>
                      <p>{stage.example}</p>
                    </div>
                  )}

                  <div className="details-grid">
                    {stage.details.map((detail) => (
                      <div key={detail} className="detail-item">
                        <i />
                        <p>{detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </section>

      <section className="crm-strip">
        <div>
          <strong>Etapas que devem existir no CRM</strong>
          <p>Esses status vão guiar a automação real depois.</p>
        </div>

        <div className="badges">
          {crmStages.map(([name, color]) => (
            <span key={name} className="badge">
              <i style={{ background: color }} />
              {name}
            </span>
          ))}
        </div>
      </section>

      <section className="metrics">
        <h2>Expectativa realista para 5.000 contatos frios</h2>
        <p>
          Não é para 5.000 pessoas comprarem. É para o funil filtrar quem tem
          dor real e transformar parte delas em opt-in confirmado.
        </p>

        <div className="metric-grid">
          <div>
            <strong>5.000</strong>
            <span>contatos frios no topo</span>
          </div>
          <div>
            <strong>~500</strong>
            <span>respostas ou sinais de interesse</span>
          </div>
          <div>
            <strong>~250</strong>
            <span>opt-ins confirmados</span>
          </div>
          <div>
            <strong>~25</strong>
            <span>clientes ou demos sérias</span>
          </div>
        </div>
      </section>

      <section className="next-actions">
        <h2>Próximas tarefas técnicas</h2>
        <div className="actions-grid">
          <div>
            <strong>1. CRM de Leads</strong>
            <p>Criar os status reais: encontrado, revisado, contato feito, interesse, opt-in, nutrição e cliente.</p>
          </div>
          <div>
            <strong>2. Página de diagnóstico</strong>
            <p>Criar a página pública onde a pessoa responde perguntas e confirma o opt-in.</p>
          </div>
          <div>
            <strong>3. Campaign Agent</strong>
            <p>Bloquear envio para qualquer lead que não tenha opt-in confirmado.</p>
          </div>
        </div>
      </section>

      <style>{`
        .funnel-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(124,58,237,.22), transparent 34%),
            radial-gradient(circle at top right, rgba(6,182,212,.18), transparent 30%),
            #050713;
          color: #e5e7eb;
          padding: 44px 22px 80px;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .hero,
        .funnel,
        .warning,
        .crm-strip,
        .metrics,
        .next-actions {
          max-width: 980px;
          margin-left: auto;
          margin-right: auto;
        }

        .back {
          display: inline-flex;
          color: #bae6fd;
          text-decoration: none;
          font-weight: 800;
          margin-bottom: 22px;
        }

        .hero {
          text-align: center;
          padding: 20px 0 38px;
        }

        .label {
          display: inline-flex;
          border: 1px solid rgba(110,231,183,.28);
          color: #6ee7b7;
          border-radius: 999px;
          padding: 7px 14px;
          text-transform: uppercase;
          letter-spacing: .18em;
          font-size: 11px;
          font-weight: 900;
          margin-bottom: 18px;
          background: rgba(15,23,42,.62);
        }

        h1 {
          margin: 0;
          font-size: clamp(34px, 6vw, 68px);
          line-height: .96;
          letter-spacing: -.06em;
          color: #fff;
        }

        h1 span {
          display: block;
          background: linear-gradient(135deg, #6ee7b7, #67e8f9, #c084fc);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .hero p {
          max-width: 700px;
          margin: 20px auto 0;
          color: #94a3b8;
          font-size: 17px;
          line-height: 1.8;
        }

        .warning {
          border: 1px solid rgba(251,146,60,.28);
          background: linear-gradient(135deg, rgba(251,146,60,.12), rgba(15,23,42,.72));
          border-radius: 24px;
          padding: 18px 22px;
          color: #fed7aa;
          line-height: 1.7;
          margin-bottom: 22px;
        }

        .funnel {
          display: grid;
          gap: 16px;
        }

        .stage {
          border: 1px solid rgba(148,163,184,.18);
          background: rgba(15,23,42,.72);
          border-radius: 26px;
          overflow: hidden;
          box-shadow: 0 24px 80px rgba(0,0,0,.18);
        }

        .stage.open {
          border-color: var(--stage-color);
          box-shadow: 0 0 0 1px var(--stage-color), 0 30px 90px rgba(0,0,0,.28);
        }

        .stage-button {
          width: 100%;
          border: 0;
          background: transparent;
          display: flex;
          gap: 16px;
          padding: 20px;
          color: inherit;
          text-align: left;
          cursor: pointer;
        }

        .stage-number {
          width: 48px;
          height: 48px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
          border: 2px solid var(--stage-color);
          color: var(--stage-color);
          font-weight: 1000;
          background: rgba(2,6,23,.92);
          box-shadow: 0 0 34px var(--stage-soft);
        }

        .stage-card {
          flex: 1;
          min-width: 0;
        }

        .stage-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 10px;
        }

        .stage-top strong {
          color: #fff;
          font-size: 18px;
          font-weight: 1000;
        }

        .stage-top em {
          font-style: normal;
          color: var(--stage-color);
          border: 1px solid var(--stage-color);
          background: var(--stage-soft);
          padding: 5px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .08em;
          white-space: nowrap;
        }

        .stage-desc {
          display: block;
          color: #cbd5e1;
          line-height: 1.7;
          font-size: 14px;
        }

        .hint {
          display: block;
          margin-top: 10px;
          color: #64748b;
          font-size: 12px;
          font-weight: 800;
        }

        .stage-details {
          border-top: 1px solid rgba(148,163,184,.14);
          background: linear-gradient(180deg, var(--stage-soft), rgba(2,6,23,.32));
          padding: 20px;
        }

        .example {
          border-left: 3px solid var(--stage-color);
          background: rgba(2,6,23,.45);
          border-radius: 18px;
          padding: 15px 17px;
          margin-bottom: 16px;
        }

        .example span {
          display: block;
          color: var(--stage-color);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: .16em;
          font-weight: 1000;
          margin-bottom: 8px;
        }

        .example p {
          margin: 0;
          color: #e2e8f0;
          line-height: 1.7;
          font-style: italic;
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .detail-item {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 16px;
          padding: 12px 14px;
        }

        .detail-item i {
          width: 8px;
          height: 8px;
          margin-top: 7px;
          border-radius: 999px;
          background: var(--stage-color);
          flex: 0 0 auto;
        }

        .detail-item p {
          margin: 0;
          color: #cbd5e1;
          line-height: 1.55;
          font-size: 13px;
        }

        .crm-strip,
        .metrics,
        .next-actions {
          margin-top: 24px;
          border: 1px solid rgba(148,163,184,.18);
          background: rgba(15,23,42,.72);
          border-radius: 28px;
          padding: 24px;
        }

        .crm-strip {
          display: grid;
          grid-template-columns: .8fr 1.2fr;
          gap: 18px;
          align-items: center;
        }

        .crm-strip strong,
        .metrics h2,
        .next-actions h2 {
          color: #fff;
          margin: 0;
        }

        .crm-strip p,
        .metrics p,
        .next-actions p {
          color: #94a3b8;
          line-height: 1.7;
        }

        .badges {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
        }

        .badge {
          display: inline-flex;
          gap: 7px;
          align-items: center;
          border: 1px solid rgba(255,255,255,.1);
          background: rgba(255,255,255,.05);
          color: #e2e8f0;
          border-radius: 999px;
          padding: 7px 11px;
          font-size: 12px;
          font-weight: 800;
        }

        .badge i {
          width: 8px;
          height: 8px;
          border-radius: 999px;
        }

        .metric-grid,
        .actions-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-top: 20px;
        }

        .metric-grid div,
        .actions-grid div {
          border: 1px solid rgba(148,163,184,.16);
          background: rgba(2,6,23,.38);
          border-radius: 20px;
          padding: 18px;
        }

        .metric-grid strong {
          display: block;
          color: #6ee7b7;
          font-size: 30px;
          line-height: 1;
          margin-bottom: 8px;
        }

        .metric-grid span {
          color: #94a3b8;
          font-size: 13px;
          line-height: 1.5;
        }

        .actions-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .actions-grid strong {
          color: #fff;
          display: block;
          margin-bottom: 8px;
        }

        .actions-grid p {
          margin: 0;
          font-size: 14px;
        }

        @media (max-width: 780px) {
          .details-grid,
          .crm-strip,
          .metric-grid,
          .actions-grid {
            grid-template-columns: 1fr;
          }

          .stage-button {
            padding: 16px;
          }

          .stage-top {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>
    </main>
  );
}
