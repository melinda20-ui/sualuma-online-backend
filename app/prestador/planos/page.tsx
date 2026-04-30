"use client";

import { useState } from "react";

const planos = [
  {
    slug: "gratuito",
    nome: "Gratuito",
    preco: "R$ 0",
    periodo: "/mês",
    destaque: "Comece sem pagar nada",
    descricao: "Ideal para prestadores que querem testar a plataforma e receber as primeiras oportunidades.",
    propostas: "3 propostas por mês",
    prioridade: "Visibilidade padrão",
    comissao: "12% por contrato fechado",
    botao: "Começar grátis",
    popular: false,
    gratuito: true,
    beneficios: [
      "Perfil público de prestador",
      "Acesso às oportunidades abertas",
      "3 propostas gratuitas por mês",
      "Sem mensalidade",
    ],
  },
  {
    slug: "pacote-propostas",
    nome: "Pacote de Propostas",
    preco: "R$ 19,90",
    periodo: "pagamento único",
    destaque: "Compre mais chances de fechar serviço",
    descricao: "Para quem acabou as propostas gratuitas e quer continuar enviando propostas sem assinar um plano mensal.",
    propostas: "10 propostas extras",
    prioridade: "Visibilidade padrão",
    comissao: "12% por contrato fechado",
    botao: "Comprar créditos",
    popular: false,
    gratuito: false,
    beneficios: [
      "10 propostas extras",
      "Sem mensalidade",
      "Pagamento único",
      "Liberação após confirmação",
    ],
  },
  {
    slug: "prioritario",
    nome: "Prestador Prioritário",
    preco: "R$ 49,90",
    periodo: "/mês",
    destaque: "Mais destaque dentro da plataforma",
    descricao: "Para prestadores que querem aparecer melhor, enviar mais propostas e aumentar as chances de fechar contratos.",
    propostas: "40 propostas por mês",
    prioridade: "Prioridade alta",
    comissao: "10% por contrato fechado",
    botao: "Assinar plano",
    popular: true,
    gratuito: false,
    beneficios: [
      "40 propostas mensais",
      "Prioridade na listagem",
      "Selo de prestador verificado",
      "Taxa menor por contrato fechado",
    ],
  },
  {
    slug: "agencia-time",
    nome: "Agência / Time",
    preco: "R$ 97,00",
    periodo: "/mês",
    destaque: "Para quem quer operar em volume",
    descricao: "Plano para equipes, agências e prestadores fortes que querem mais oportunidades e mais escala.",
    propostas: "120 propostas por mês",
    prioridade: "Prioridade máxima",
    comissao: "8% por contrato fechado",
    botao: "Assinar plano Pro",
    popular: false,
    gratuito: false,
    beneficios: [
      "120 propostas mensais",
      "Prioridade máxima",
      "Perfil de equipe",
      "Taxa reduzida sobre contratos",
    ],
  },
];

export default function PlanosPrestadorPage() {
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);
  const [erro, setErro] = useState("");

  async function comprarPlano(slug: string) {
    setErro("");

    if (slug === "gratuito") {
      window.location.href = "/cadastro?tipo=prestador&plano=gratuito";
      return;
    }

    try {
      setLoadingSlug(slug);

      const response = await fetch("/api/stripe/checkout-service-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug,
          successUrl: `${window.location.origin}/prestador/checkout/sucesso`,
          cancelUrl: `${window.location.origin}/prestador/planos`,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.checkoutUrl) {
        throw new Error(data?.error || "Não foi possível abrir o checkout agora.");
      }

      window.location.href = data.checkoutUrl;
    } catch (error: any) {
      setErro(error?.message || "Erro ao abrir o checkout.");
      setLoadingSlug(null);
    }
  }

  return (
    <main className="page">
      <section className="hero">
        <div className="heroText">
          <p className="eyebrow">Sualuma Serviços</p>
          <h1>Planos para prestadores que querem receber mais oportunidades</h1>
          <p className="lead">
            Escolha seu plano, envie propostas, ganhe destaque e feche contratos com mais segurança dentro da plataforma.
          </p>

          <div className="heroActions">
            <a href="#planos" className="primaryLink">Ver planos</a>
            <a href="/cadastro?tipo=prestador" className="secondaryLink">Criar conta grátis</a>
          </div>

          <div className="trustLine">
            <span>🔒 Pagamento seguro</span>
            <span>💳 Checkout protegido</span>
            <span>🇧🇷 Tudo em português</span>
          </div>
        </div>

        <div className="heroCard">
          <span>Modelo para prestadores</span>
          <strong>Grátis para começar. Pago para acelerar.</strong>
          <small>
            Você pode começar no plano gratuito e comprar créditos ou assinar um plano quando quiser mais alcance.
          </small>
        </div>
      </section>

      <section className="security">
        <div>
          <strong>Pagamento protegido</strong>
          <small>Você será redirecionado para um ambiente seguro de pagamento.</small>
        </div>
        <div>
          <strong>Planos simples</strong>
          <small>Escolha entre plano gratuito, créditos avulsos ou assinatura mensal.</small>
        </div>
        <div>
          <strong>Mais chances de fechar</strong>
          <small>Use propostas e prioridade para aparecer melhor nas oportunidades.</small>
        </div>
      </section>

      {erro && (
        <section className="errorBox">
          <strong>Ops, não conseguimos abrir o pagamento.</strong>
          <span>{erro}</span>
        </section>
      )}

      <section className="plansSection" id="planos">
        <div className="sectionTitle">
          <p>Escolha seu plano</p>
          <h2>Comece grátis ou acelere com mais propostas</h2>
        </div>

        <div className="plans">
          {planos.map((plano) => (
            <article className={`plan ${plano.popular ? "popular" : ""}`} key={plano.slug}>
              {plano.popular && <div className="popularBadge">Mais indicado</div>}

              <div className="planTop">
                <p className="planName">{plano.nome}</p>
                <h3>{plano.preco}</h3>
                <span>{plano.periodo}</span>
              </div>

              <p className="highlight">{plano.destaque}</p>
              <p className="description">{plano.descricao}</p>

              <div className="miniGrid">
                <div>
                  <small>Propostas</small>
                  <strong>{plano.propostas}</strong>
                </div>
                <div>
                  <small>Prioridade</small>
                  <strong>{plano.prioridade}</strong>
                </div>
                <div>
                  <small>Comissão</small>
                  <strong>{plano.comissao}</strong>
                </div>
              </div>

              <ul>
                {plano.beneficios.map((beneficio) => (
                  <li key={beneficio}>{beneficio}</li>
                ))}
              </ul>

              <button
                type="button"
                className={`checkoutButton ${plano.popular ? "hot" : ""}`}
                onClick={() => comprarPlano(plano.slug)}
                disabled={loadingSlug === plano.slug}
              >
                {loadingSlug === plano.slug ? "Abrindo checkout..." : plano.botao}
              </button>

              {!plano.gratuito && (
                <small className="safeNote">
                  Você será enviado para um checkout seguro.
                </small>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="howItWorks">
        <div className="sectionTitle">
          <p>Como funciona</p>
          <h2>Simples, direto e sem confusão</h2>
        </div>

        <div className="steps">
          <div>
            <span>1</span>
            <strong>Escolha o plano</strong>
            <small>Veja qual combina melhor com seu momento como prestador.</small>
          </div>
          <div>
            <span>2</span>
            <strong>Pague com segurança</strong>
            <small>O pagamento acontece em ambiente protegido.</small>
          </div>
          <div>
            <span>3</span>
            <strong>Use seus benefícios</strong>
            <small>Depois da confirmação, seus créditos ou plano ficam vinculados à sua conta.</small>
          </div>
        </div>
      </section>

      <section className="faq">
        <div className="sectionTitle">
          <p>Dúvidas comuns</p>
          <h2>Perguntas rápidas</h2>
        </div>

        <div className="faqGrid">
          <div>
            <strong>Preciso pagar para começar?</strong>
            <small>Não. Você pode começar pelo plano gratuito e testar a plataforma.</small>
          </div>
          <div>
            <strong>O pacote de propostas é assinatura?</strong>
            <small>Não. O pacote de propostas é pagamento único.</small>
          </div>
          <div>
            <strong>Os planos pagos são mensais?</strong>
            <small>Sim. Os planos Prioritário e Agência / Time são assinaturas mensais.</small>
          </div>
          <div>
            <strong>O pagamento é seguro?</strong>
            <small>Sim. Você será redirecionado para um checkout protegido.</small>
          </div>
        </div>
      </section>

      <style>{`
        .page {
          min-height: 100vh;
          color: #f8fbff;
          background:
            radial-gradient(circle at top left, rgba(255, 0, 190, .20), transparent 34%),
            radial-gradient(circle at top right, rgba(0, 240, 255, .16), transparent 30%),
            linear-gradient(135deg, #060711, #08101f 55%, #03040a);
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          padding: 42px 20px 80px;
        }

        .hero,
        .security,
        .plansSection,
        .howItWorks,
        .faq,
        .errorBox {
          max-width: 1180px;
          margin-left: auto;
          margin-right: auto;
        }

        .hero {
          display: grid;
          grid-template-columns: 1.25fr .75fr;
          gap: 24px;
          align-items: stretch;
          margin-bottom: 22px;
        }

        .eyebrow,
        .sectionTitle p {
          margin: 0 0 12px;
          color: #7ff7ff;
          text-transform: uppercase;
          letter-spacing: .2em;
          font-size: 12px;
          font-weight: 900;
        }

        h1 {
          margin: 0;
          font-size: clamp(38px, 6vw, 76px);
          line-height: .93;
          letter-spacing: -0.07em;
        }

        .lead {
          max-width: 760px;
          color: #b8c0d8;
          font-size: 20px;
          line-height: 1.6;
          margin: 22px 0;
        }

        .heroActions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 18px;
        }

        .primaryLink,
        .secondaryLink,
        .checkoutButton {
          border: 0;
          cursor: pointer;
          text-decoration: none;
          border-radius: 999px;
          font-weight: 900;
          transition: .2s ease;
        }

        .primaryLink,
        .checkoutButton {
          color: #041018;
          background: linear-gradient(135deg, #7ff7ff, #ff8edf);
          box-shadow: 0 18px 40px rgba(0, 240, 255, .18);
        }

        .primaryLink,
        .secondaryLink {
          padding: 14px 18px;
          display: inline-flex;
        }

        .secondaryLink {
          color: #f8fbff;
          border: 1px solid rgba(255,255,255,.16);
          background: rgba(255,255,255,.07);
        }

        .trustLine {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          color: #dce7ff;
          font-size: 13px;
          font-weight: 800;
        }

        .trustLine span {
          border: 1px solid rgba(255,255,255,.12);
          background: rgba(255,255,255,.06);
          padding: 9px 11px;
          border-radius: 999px;
        }

        .heroCard,
        .security,
        .plansSection,
        .howItWorks,
        .faq,
        .errorBox {
          border: 1px solid rgba(255,255,255,.12);
          background: rgba(10, 13, 31, .76);
          box-shadow: 0 24px 80px rgba(0,0,0,.35);
          border-radius: 34px;
        }

        .heroCard {
          padding: 32px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .heroCard span {
          color: #ff8edf;
          text-transform: uppercase;
          letter-spacing: .14em;
          font-size: 12px;
          font-weight: 900;
        }

        .heroCard strong {
          display: block;
          margin: 12px 0;
          font-size: 34px;
          line-height: 1;
          letter-spacing: -0.05em;
        }

        small,
        .description {
          color: #9ea7c2;
          line-height: 1.5;
        }

        .security {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          padding: 18px;
          margin-bottom: 22px;
        }

        .security div,
        .steps div,
        .faqGrid div {
          border: 1px solid rgba(255,255,255,.10);
          background: rgba(255,255,255,.05);
          border-radius: 22px;
          padding: 18px;
        }

        .security strong,
        .steps strong,
        .faqGrid strong {
          display: block;
          margin-bottom: 6px;
        }

        .plansSection,
        .howItWorks,
        .faq,
        .errorBox {
          padding: 28px;
          margin-bottom: 22px;
        }

        .sectionTitle h2 {
          margin: 0 0 22px;
          font-size: clamp(28px, 4vw, 48px);
          line-height: 1;
          letter-spacing: -0.05em;
        }

        .plans {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .plan {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 16px;
          border: 1px solid rgba(255,255,255,.12);
          background: linear-gradient(145deg, rgba(255,255,255,.08), rgba(255,255,255,.03));
          border-radius: 28px;
          padding: 22px;
        }

        .plan.popular {
          border-color: rgba(127, 247, 255, .45);
          box-shadow: 0 24px 60px rgba(0, 240, 255, .14);
        }

        .popularBadge {
          position: absolute;
          top: -12px;
          left: 20px;
          padding: 8px 12px;
          border-radius: 999px;
          color: #041018;
          background: linear-gradient(135deg, #7ff7ff, #ff8edf);
          font-size: 12px;
          font-weight: 950;
        }

        .planName {
          display: inline-flex;
          margin: 0 0 10px;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(255, 43, 184, .16);
          color: #ff9ee4;
          font-weight: 950;
        }

        .plan h3 {
          margin: 0;
          font-size: 34px;
          letter-spacing: -0.06em;
        }

        .planTop span {
          color: #9ea7c2;
          font-size: 13px;
          font-weight: 800;
        }

        .highlight {
          margin: 0;
          color: #7ff7ff;
          font-weight: 900;
        }

        .description {
          margin: 0;
        }

        .miniGrid {
          display: grid;
          gap: 8px;
        }

        .miniGrid div {
          border-radius: 16px;
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.08);
          padding: 10px;
        }

        .miniGrid small {
          display: block;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: .1em;
        }

        .miniGrid strong {
          display: block;
          margin-top: 4px;
          font-size: 14px;
        }

        ul {
          margin: 0;
          padding-left: 18px;
          color: #dce7ff;
          line-height: 1.8;
        }

        .checkoutButton {
          width: 100%;
          margin-top: auto;
          padding: 15px 16px;
          font-size: 15px;
        }

        .checkoutButton:hover:not(:disabled),
        .primaryLink:hover,
        .secondaryLink:hover {
          transform: translateY(-2px);
        }

        .checkoutButton:disabled {
          cursor: wait;
          opacity: .7;
        }

        .safeNote {
          text-align: center;
        }

        .steps,
        .faqGrid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }

        .faqGrid {
          grid-template-columns: repeat(4, 1fr);
        }

        .steps span {
          display: inline-flex;
          width: 34px;
          height: 34px;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          color: #041018;
          background: #7ff7ff;
          font-weight: 950;
          margin-bottom: 12px;
        }

        .errorBox {
          border-color: rgba(255, 80, 140, .35);
          background: rgba(255, 80, 140, .10);
          display: grid;
          gap: 6px;
        }

        .errorBox span {
          color: #ffd3df;
        }

        @media (max-width: 980px) {
          .hero,
          .security,
          .plans,
          .steps,
          .faqGrid {
            grid-template-columns: 1fr;
          }

          .page {
            padding: 26px 14px 70px;
          }

          .heroCard,
          .plansSection,
          .howItWorks,
          .faq,
          .errorBox {
            border-radius: 26px;
            padding: 20px;
          }

          h1 {
            font-size: 42px;
          }

          .lead {
            font-size: 17px;
          }
        }
      `}</style>
    </main>
  );
}
