"use client";

import { useState } from "react";

const planosServicos = [
  {
    nome: "Gratuito",
    preco: "R$ 0/mês",
    propostas: "3 propostas grátis por mês",
    prioridade: "Sem prioridade",
    comissao: "12% por contrato fechado",
    ideal: "Prestador novo testando a plataforma",
    slug: "",
    cta: "Plano gratuito",
  },
  {
    nome: "Pacote de Propostas",
    preco: "R$ 19,90",
    propostas: "10 propostas extras",
    prioridade: "Sem mensalidade",
    comissao: "12% por contrato fechado",
    ideal: "Prestador que quer comprar créditos avulsos",
    slug: "pacote-propostas",
    cta: "Comprar propostas",
  },
  {
    nome: "Prestador Prioritário",
    preco: "R$ 49,90/mês",
    propostas: "40 propostas por mês",
    prioridade: "Prioridade alta na listagem",
    comissao: "10% por contrato fechado",
    ideal: "Freelancer que quer aparecer mais",
    slug: "prioritario",
    cta: "Assinar prioridade",
  },
  {
    nome: "Agência / Time",
    preco: "R$ 97/mês",
    propostas: "120 propostas por mês",
    prioridade: "Prioridade máxima",
    comissao: "8% por contrato fechado",
    ideal: "Agência, especialista ou prestador forte",
    slug: "agencia-time",
    cta: "Assinar plano agência",
  },
];

const produtosAvulsos = [
  ["Pacote 5 propostas", "R$ 9,90", "Para quem acabou as propostas grátis."],
  ["Pacote 15 propostas", "R$ 19,90", "Mais chances de fechar serviço."],
  ["Destaque em proposta", "R$ 7,90", "A proposta sobe visualmente na lista do cliente."],
  ["Prioridade 24h", "R$ 17,90", "Aparece primeiro nas oportunidades por 24h."],
];

const regrasComissao = [
  ["Contrato de R$ 500", "12%", "R$ 60 para a plataforma", "R$ 440 para o prestador"],
  ["Contrato de R$ 1.000", "10%", "R$ 100 para a plataforma", "R$ 900 para o prestador"],
  ["Contrato de R$ 2.500", "8%", "R$ 200 para a plataforma", "R$ 2.300 para o prestador"],
  ["Contrato de R$ 5.000", "6%", "R$ 300 para a plataforma", "R$ 4.700 para o prestador"],
];

const indicacoes = [
  {
    tipo: "Indicação de cliente",
    recompensa: "10% do primeiro pagamento ou cupom",
    exemplo: "Cliente indicado contrata R$ 1.000 → indicador recebe R$ 100.",
  },
  {
    tipo: "Indicação de prestador",
    recompensa: "Crédito de propostas ou prêmio fixo",
    exemplo: "Prestador indicado fecha primeiro contrato → indicador ganha R$ 20 ou 20 propostas.",
  },
  {
    tipo: "Indicação recorrente premium",
    recompensa: "Comissão por mensalidade ativa",
    exemplo: "Assinatura de R$ 49/mês → indicador ganha R$ 4,90/mês enquanto estiver ativo.",
  },
];

const movimentos = [
  ["Entrada", "Comissão contrato #1042", "R$ 120,00", "Pago pelo cliente", "Confirmado"],
  ["Saída", "Prêmio indicação Ana", "R$ 30,00", "Indicação validada", "Pendente"],
  ["Entrada", "Pacote de propostas", "R$ 19,90", "Prestador comprou créditos", "Confirmado"],
  ["Saída", "Cupom de indicação", "R$ 15,00", "Desconto concedido", "Aplicado"],
];

export default function ServicosEIndiquePage() {
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState("");

  async function comprarPlano(slug: string) {
    if (!slug || loadingSlug) return;

    try {
      setCheckoutError("");
      setLoadingSlug(slug);

      const response = await fetch("/api/stripe/checkout-service-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });

      const data = await response.json();

      if (!response.ok || !data?.checkoutUrl) {
        throw new Error(data?.error || data?.message || "Não consegui abrir o checkout agora.");
      }

      window.location.href = data.checkoutUrl;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro inesperado ao abrir o checkout.";
      setCheckoutError(message);
      setLoadingSlug(null);
    }
  }

  return (
    <main className="serviceStudio">
      <section className="hero">
        <div>
          <p className="eyebrow">Studio Sualuma • Serviços</p>
          <h1>Economia interna de serviços e indicações</h1>
          <p className="lead">
            Painel para desenhar o modelo estilo Workana/99Freelas: plano grátis,
            venda de propostas, prioridade, comissão por contrato e rastreio de indicações.
          </p>
        </div>

        <div className="heroCard">
          <span>Modelo base</span>
          <strong>Gratuito + créditos + comissão</strong>
          <small>Supabase + Stripe conectados. Botões levam para checkout real.</small>
        </div>
      </section>

      <section className="grid four">
        <div className="metric">
          <span>Comissão padrão</span>
          <strong>12%</strong>
          <small>No plano gratuito</small>
        </div>
        <div className="metric">
          <span>Propostas grátis</span>
          <strong>3/mês</strong>
          <small>Depois compra créditos</small>
        </div>
        <div className="metric">
          <span>Prioridade</span>
          <strong>Paga</strong>
          <small>Destaque por proposta ou por 24h</small>
        </div>
        <div className="metric">
          <span>Indicações</span>
          <strong>Rastreáveis</strong>
          <small>Link, cupom, entrada e saída</small>
        </div>
      </section>

      <section className="panel">
        <div className="panelTitle">
          <p>Planos de prestadores</p>
          <h2>Plano gratuito + upgrades pagos</h2>
        </div>

        {checkoutError ? (
          <div className="checkoutFeedback">{checkoutError}</div>
        ) : null}

        <div className="plans">
          {planosServicos.map((plano) => (
            <article className="plan" key={plano.nome}>
              <div>
                <p className="tag">{plano.nome}</p>
                <h3>{plano.preco}</h3>
              </div>
              <ul>
                <li>{plano.propostas}</li>
                <li>{plano.prioridade}</li>
                <li>{plano.comissao}</li>
                <li>{plano.ideal}</li>
              </ul>

              <button
                className={`checkoutButton ${!plano.slug ? "disabled" : ""}`}
                type="button"
                disabled={!plano.slug || loadingSlug === plano.slug}
                onClick={() => comprarPlano(plano.slug)}
              >
                {loadingSlug === plano.slug ? "Abrindo checkout..." : plano.cta}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="grid two">
        <div className="panel">
          <div className="panelTitle">
            <p>Produtos avulsos</p>
            <h2>O que o prestador pode comprar</h2>
          </div>

          <div className="table">
            {produtosAvulsos.map(([nome, preco, detalhe]) => (
              <div className="row" key={nome}>
                <div>
                  <strong>{nome}</strong>
                  <small>{detalhe}</small>
                </div>
                <span>{preco}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panelTitle">
            <p>Comissão</p>
            <h2>Como a plataforma ganha</h2>
          </div>

          <div className="table">
            {regrasComissao.map(([contrato, taxa, plataforma, prestador]) => (
              <div className="row" key={contrato}>
                <div>
                  <strong>{contrato}</strong>
                  <small>{plataforma} • {prestador}</small>
                </div>
                <span>{taxa}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panelTitle">
          <p>Indique</p>
          <h2>Links rastreados, prêmios, cupons e dinheiro</h2>
        </div>

        <div className="refBox">
          <div>
            <span>Exemplo de link rastreado</span>
            <strong>https://sualuma.online/servicos?ref=ANA2026</strong>
            <small>
              Esse link identifica quem indicou, qual campanha trouxe a pessoa e
              quanto entrou ou saiu por causa dessa indicação.
            </small>
          </div>
        </div>

        <div className="plans compact">
          {indicacoes.map((item) => (
            <article className="plan" key={item.tipo}>
              <p className="tag">{item.tipo}</p>
              <h3>{item.recompensa}</h3>
              <small>{item.exemplo}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panelTitle">
          <p>Financeiro de indicações</p>
          <h2>Rastreio de entrada e saída</h2>
        </div>

        <div className="table">
          {movimentos.map(([tipo, origem, valor, detalhe, status]) => (
            <div className="row money" key={origem}>
              <div>
                <strong>{tipo} • {origem}</strong>
                <small>{detalhe}</small>
              </div>
              <span>{valor}</span>
              <em>{status}</em>
            </div>
          ))}
        </div>
      </section>

      <section className="panel next">
        <div className="panelTitle">
          <p>Próxima conexão</p>
          <h2>Tabelas que vamos criar no Supabase</h2>
        </div>

        <div className="chips">
          <span>service_plans</span>
          <span>proposal_credits</span>
          <span>service_contracts</span>
          <span>platform_commissions</span>
          <span>referral_links</span>
          <span>referral_ledger</span>
        </div>
      </section>

      <style>{`
        .serviceStudio {
          min-height: 100vh;
          padding: 44px 24px 80px;
          color: #f8fbff;
          background:
            radial-gradient(circle at top left, rgba(255, 0, 190, .22), transparent 34%),
            radial-gradient(circle at top right, rgba(0, 240, 255, .16), transparent 28%),
            linear-gradient(135deg, #070815, #08101f 55%, #040610);
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .hero {
          max-width: 1180px;
          margin: 0 auto 24px;
          display: grid;
          grid-template-columns: 1.4fr .8fr;
          gap: 22px;
          align-items: stretch;
        }

        .eyebrow, .panelTitle p {
          margin: 0 0 10px;
          text-transform: uppercase;
          letter-spacing: .2em;
          color: #7ff7ff;
          font-size: 12px;
          font-weight: 800;
        }

        h1 {
          margin: 0;
          font-size: clamp(38px, 6vw, 76px);
          line-height: .95;
          letter-spacing: -0.06em;
        }

        .lead {
          max-width: 760px;
          color: #b8c0d8;
          font-size: 20px;
          line-height: 1.6;
        }

        .heroCard, .panel, .metric {
          border: 1px solid rgba(255,255,255,.12);
          background: rgba(10, 13, 31, .74);
          box-shadow: 0 24px 80px rgba(0,0,0,.35);
          border-radius: 34px;
        }

        .heroCard {
          padding: 34px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .heroCard span, .metric span {
          color: #ff8edf;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: .12em;
          font-size: 12px;
        }

        .heroCard strong {
          display: block;
          margin: 12px 0;
          font-size: 30px;
          line-height: 1.05;
        }

        small {
          color: #9ea7c2;
          line-height: 1.5;
        }

        .grid {
          max-width: 1180px;
          margin: 0 auto 22px;
          display: grid;
          gap: 18px;
        }

        .four { grid-template-columns: repeat(4, 1fr); }
        .two { grid-template-columns: repeat(2, 1fr); }

        .metric {
          padding: 22px;
        }

        .metric strong {
          display: block;
          font-size: 32px;
          margin: 8px 0;
        }

        .panel {
          max-width: 1180px;
          margin: 0 auto 22px;
          padding: 28px;
        }

        .panelTitle h2 {
          margin: 0 0 20px;
          font-size: clamp(26px, 4vw, 44px);
          letter-spacing: -0.04em;
        }

        .plans {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .plans.compact {
          grid-template-columns: repeat(3, 1fr);
          margin-top: 18px;
        }

        .plan {
          border: 1px solid rgba(255,255,255,.12);
          background: linear-gradient(145deg, rgba(255,255,255,.08), rgba(255,255,255,.03));
          border-radius: 26px;
          padding: 22px;
        }

        .tag {
          display: inline-flex;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(255, 43, 184, .16);
          color: #ff9ee4;
          font-weight: 900;
          margin: 0 0 12px;
        }

        .plan h3 {
          margin: 0 0 16px;
          font-size: 25px;
        }

        .checkoutFeedback {
          margin: 0 0 18px;
          padding: 14px 16px;
          border-radius: 18px;
          background: rgba(255, 54, 122, .14);
          border: 1px solid rgba(255, 54, 122, .28);
          color: #ffd8e5;
          font-weight: 800;
        }

        .checkoutButton {
          width: 100%;
          margin-top: 18px;
          border: 0;
          border-radius: 18px;
          padding: 14px 16px;
          color: #06101f;
          background: linear-gradient(135deg, #7ff7ff, #ff9ee4);
          font-weight: 950;
          cursor: pointer;
          box-shadow: 0 18px 40px rgba(0, 240, 255, .18);
        }

        .checkoutButton:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .checkoutButton:disabled {
          cursor: not-allowed;
          opacity: .72;
        }

        .checkoutButton.disabled {
          color: #dce7ff;
          background: rgba(255,255,255,.08);
          border: 1px solid rgba(255,255,255,.12);
          box-shadow: none;
        }

        ul {
          padding-left: 18px;
          margin: 0;
          color: #cdd4ea;
          line-height: 1.8;
        }

        .table {
          display: grid;
          gap: 12px;
        }

        .row {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 18px;
          align-items: center;
          padding: 16px 18px;
          border-radius: 20px;
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.08);
        }

        .row strong {
          display: block;
          margin-bottom: 4px;
        }

        .row span {
          font-weight: 900;
          color: #7ff7ff;
          white-space: nowrap;
        }

        .row.money {
          grid-template-columns: 1fr auto auto;
        }

        .row em {
          font-style: normal;
          color: #ff9ee4;
          border: 1px solid rgba(255, 43, 184, .22);
          border-radius: 999px;
          padding: 8px 10px;
          white-space: nowrap;
        }

        .refBox {
          padding: 22px;
          border-radius: 24px;
          background: linear-gradient(135deg, rgba(124,58,237,.35), rgba(6,182,212,.18));
          border: 1px solid rgba(255,255,255,.14);
          word-break: break-word;
        }

        .refBox span {
          display: block;
          color: #7ff7ff;
          font-weight: 900;
          margin-bottom: 8px;
        }

        .refBox strong {
          display: block;
          font-size: 20px;
          margin-bottom: 8px;
        }

        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .chips span {
          padding: 12px 14px;
          border-radius: 999px;
          background: rgba(255,255,255,.08);
          border: 1px solid rgba(255,255,255,.12);
          color: #dce7ff;
          font-weight: 800;
        }

        @media (max-width: 900px) {
          .serviceStudio { padding: 26px 14px 70px; }
          .hero, .two, .four { grid-template-columns: 1fr; }
          .plans, .plans.compact { grid-template-columns: 1fr; }
          .panel, .heroCard { border-radius: 26px; padding: 20px; }
          .row, .row.money { grid-template-columns: 1fr; }
          .lead { font-size: 17px; }
        }
      `}</style>
    </main>
  );
}
