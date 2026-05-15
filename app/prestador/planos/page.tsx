"use client";

import { useState } from "react";
import PrestadorPlanosChat from "./PrestadorPlanosChat";
import "./planos-prestador.css";

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
    taxaAdministrativa: "12% por contrato fechado",
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
    taxaAdministrativa: "12% por contrato fechado",
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
    taxaAdministrativa: "10% por contrato fechado",
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
    taxaAdministrativa: "8% por contrato fechado",
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
                  <small>Taxa administrativa</small>
                  <strong>{plano.taxaAdministrativa}</strong>
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

          <article className="faq-card">
            <strong>O que é a taxa administrativa?</strong>
            <p
              style={{
                marginTop: "10px",
                maxWidth: "760px",
                color: "rgba(255,255,255,.78)",
                fontSize: "15px",
                lineHeight: "1.7",
                fontWeight: 500,
                letterSpacing: "0",
                textTransform: "none",
              }}
            >
              Essa taxa ajuda a manter a plataforma funcionando com segurança,
              suporte, manutenção, organização das propostas e melhorias
              constantes para os prestadores.
            </p>
          </article>

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
      <PrestadorPlanosChat />

</main>
  );
}
