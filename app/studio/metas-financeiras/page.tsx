"use client";

import { useEffect, useMemo, useState } from "react";

type Metrics = {
  coldLeads: number;
  responseRate: number;
  optinRate: number;
  conversionRate: number;
  ticket: number;
  monthlyFee: number;
  retentionMonths: number;
  investment: number;
  fixedCosts: number;
  variableCostRate: number;
  taxRate: number;

  realRevenue: number;
  realSales: number;
  realInvestment: number;
  realCosts: number;

  investorCheck: number;
  equityPercent: number;
  futureValuation: number;

  contentAssets: number;
  visitsPerAsset: number;
  organicConversionRate: number;

  ipoAnnualRevenueGoal: number;
  governanceScore: number;
};

const DEFAULTS: Metrics = {
  coldLeads: 5000,
  responseRate: 10,
  optinRate: 5,
  conversionRate: 1,
  ticket: 197,
  monthlyFee: 97,
  retentionMonths: 12,
  investment: 1000,
  fixedCosts: 800,
  variableCostRate: 12,
  taxRate: 8,

  realRevenue: 0,
  realSales: 0,
  realInvestment: 0,
  realCosts: 0,

  investorCheck: 50000,
  equityPercent: 10,
  futureValuation: 1000000,

  contentAssets: 30,
  visitsPerAsset: 80,
  organicConversionRate: 1,

  ipoAnnualRevenueGoal: 12000000,
  governanceScore: 5
};

const dictionary = [
  ["CAC / CAQ", "Quanto custa para conquistar um cliente.", "/blog/o-que-e-cac-caq"],
  ["LTV", "Quanto um cliente pode gerar durante todo o relacionamento.", "/blog/o-que-e-ltv"],
  ["Break-even", "O ponto em que a empresa para de perder dinheiro.", "/blog/o-que-e-break-even"],
  ["Equity", "Participação que um investidor recebe na empresa.", "/blog/o-que-e-equity"],
  ["Lucro", "O que sobra depois de custos, investimento e impostos.", "/blog/o-que-e-lucro"],
  ["Cauda longa", "Receita futura gerada por conteúdo, SEO e ativos digitais.", "/blog/o-que-e-cauda-longa"],
  ["Impostos", "Parte estimada que precisa ser reservada para tributos.", "/blog/impostos-para-micronegocios"],
  ["IPO / Bolsa", "O caminho de maturidade para abrir capital no futuro.", "/blog/o-que-e-ipo"]
];

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0
  }).format(Number.isFinite(value) ? value : 0);
}

function pct(value: number) {
  return `${Number.isFinite(value) ? value.toFixed(1) : "0.0"}%`;
}

function safeDiv(a: number, b: number) {
  return b > 0 ? a / b : 0;
}

export default function MetasFinanceirasPage() {
  const [metrics, setMetrics] = useState<Metrics>(DEFAULTS);

  useEffect(() => {
    const saved = localStorage.getItem("sualuma-metas-financeiras");
    if (saved) {
      try {
        setMetrics({ ...DEFAULTS, ...JSON.parse(saved) });
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("sualuma-metas-financeiras", JSON.stringify(metrics));
  }, [metrics]);

  function update(key: keyof Metrics, value: string) {
    setMetrics((current) => ({
      ...current,
      [key]: Number(value || 0)
    }));
  }

  const calc = useMemo(() => {
    const responses = metrics.coldLeads * (metrics.responseRate / 100);
    const optins = metrics.coldLeads * (metrics.optinRate / 100);
    const projectedSales = metrics.coldLeads * (metrics.conversionRate / 100);

    const projectedRevenue = projectedSales * metrics.ticket;
    const projectedMonthlyRecurring = projectedSales * metrics.monthlyFee;
    const variableCosts = projectedRevenue * (metrics.variableCostRate / 100);
    const taxes = projectedRevenue * (metrics.taxRate / 100);
    const projectedProfit =
      projectedRevenue - metrics.investment - metrics.fixedCosts - variableCosts - taxes;

    const cac = safeDiv(metrics.investment, projectedSales);
    const grossMarginRate = 1 - metrics.variableCostRate / 100 - metrics.taxRate / 100;
    const ltv =
      metrics.ticket + metrics.monthlyFee * metrics.retentionMonths * Math.max(grossMarginRate, 0);

    const profitPerClient =
      metrics.ticket * Math.max(grossMarginRate, 0) - safeDiv(metrics.investment, projectedSales);

    const breakEvenClients = safeDiv(metrics.fixedCosts + metrics.investment, Math.max(profitPerClient, 1));

    const realTaxes = metrics.realRevenue * (metrics.taxRate / 100);
    const realProfit = metrics.realRevenue - metrics.realInvestment - metrics.realCosts - realTaxes;
    const realCac = safeDiv(metrics.realInvestment, metrics.realSales);

    const equityValueToday = safeDiv(metrics.investorCheck, metrics.equityPercent / 100);
    const investorFutureStakeValue = metrics.futureValuation * (metrics.equityPercent / 100);
    const investorGain = investorFutureStakeValue - metrics.investorCheck;

    const longTailVisits = metrics.contentAssets * metrics.visitsPerAsset;
    const longTailSales = longTailVisits * (metrics.organicConversionRate / 100);
    const longTailRevenue = longTailSales * metrics.ticket;

    const annualRevenueNow = metrics.realRevenue * 12;
    const ipoRevenueProgress = Math.min(100, safeDiv(annualRevenueNow, metrics.ipoAnnualRevenueGoal) * 100);
    const ipoReadiness = Math.min(100, (ipoRevenueProgress * 0.6) + (metrics.governanceScore * 10 * 0.4));
    const missingToIpoGoal = Math.max(metrics.ipoAnnualRevenueGoal - annualRevenueNow, 0);

    return {
      responses,
      optins,
      projectedSales,
      projectedRevenue,
      projectedMonthlyRecurring,
      variableCosts,
      taxes,
      projectedProfit,
      cac,
      ltv,
      breakEvenClients,
      realTaxes,
      realProfit,
      realCac,
      equityValueToday,
      investorFutureStakeValue,
      investorGain,
      longTailVisits,
      longTailSales,
      longTailRevenue,
      ipoReadiness,
      missingToIpoGoal
    };
  }, [metrics]);

  const fields: { key: keyof Metrics; label: string; suffix?: string; group: string }[] = [
    { key: "coldLeads", label: "Contatos frios planejados", group: "Projeção" },
    { key: "responseRate", label: "Taxa esperada de resposta", suffix: "%", group: "Projeção" },
    { key: "optinRate", label: "Taxa esperada de opt-in", suffix: "%", group: "Projeção" },
    { key: "conversionRate", label: "Taxa esperada de venda", suffix: "%", group: "Projeção" },
    { key: "ticket", label: "Ticket médio inicial", group: "Oferta" },
    { key: "monthlyFee", label: "Mensalidade média esperada", group: "Oferta" },
    { key: "retentionMonths", label: "Meses médios de permanência", group: "Oferta" },
    { key: "investment", label: "Investimento planejado no mês", group: "Custos" },
    { key: "fixedCosts", label: "Custos fixos do mês", group: "Custos" },
    { key: "variableCostRate", label: "Custo variável estimado", suffix: "%", group: "Custos" },
    { key: "taxRate", label: "Imposto estimado", suffix: "%", group: "Custos" },
    { key: "realRevenue", label: "Faturamento real do mês", group: "Realidade" },
    { key: "realSales", label: "Vendas reais do mês", group: "Realidade" },
    { key: "realInvestment", label: "Investimento real do mês", group: "Realidade" },
    { key: "realCosts", label: "Custos reais do mês", group: "Realidade" },
    { key: "investorCheck", label: "Aporte simulado do investidor", group: "Investidor" },
    { key: "equityPercent", label: "Equity oferecido", suffix: "%", group: "Investidor" },
    { key: "futureValuation", label: "Valor futuro simulado da empresa", group: "Investidor" },
    { key: "contentAssets", label: "Artigos/páginas ativos", group: "Cauda longa" },
    { key: "visitsPerAsset", label: "Visitas mensais por ativo", group: "Cauda longa" },
    { key: "organicConversionRate", label: "Conversão orgânica esperada", suffix: "%", group: "Cauda longa" },
    { key: "ipoAnnualRevenueGoal", label: "Meta anual simbólica para maturidade de bolsa", group: "Bolsa" },
    { key: "governanceScore", label: "Nota de governança atual de 0 a 10", group: "Bolsa" }
  ];

  const groups = Array.from(new Set(fields.map((field) => field.group)));

  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">Studio Sualuma · Privado</p>
        <h1>Painel de Metas, Faturamento e Investidor</h1>
        <p>
          Simule metas, projeções, lucro, impostos, LTV, CAC/CAQ, break-even,
          equity, cauda longa e distância simbólica até maturidade de bolsa.
          Seus números ficam apenas nesta área privada.
        </p>
      </section>

      <section className="summaryGrid">
        <Card title="Faturamento projetado" value={money(calc.projectedRevenue)} note={`${calc.projectedSales.toFixed(0)} vendas esperadas`} />
        <Card title="Faturamento real" value={money(metrics.realRevenue)} note={`${metrics.realSales} vendas realizadas`} />
        <Card title="Lucro projetado" value={money(calc.projectedProfit)} note={`Impostos estimados: ${money(calc.taxes)}`} />
        <Card title="Lucro real" value={money(calc.realProfit)} note={`Impostos reais estimados: ${money(calc.realTaxes)}`} />
      </section>

      <section className="comparison">
        <div>
          <h2>Projeção do lançamento</h2>
          <div className="bubbles">
            <Bubble label="Contatos frios" value={metrics.coldLeads.toFixed(0)} />
            <Bubble label="Respostas/sinais" value={calc.responses.toFixed(0)} />
            <Bubble label="Opt-ins" value={calc.optins.toFixed(0)} />
            <Bubble label="Vendas esperadas" value={calc.projectedSales.toFixed(0)} />
            <Bubble label="Recorrência mensal" value={money(calc.projectedMonthlyRecurring)} />
          </div>
        </div>

        <div>
          <h2>Realidade do mês</h2>
          <div className="bubbles">
            <Bubble label="Faturamento real" value={money(metrics.realRevenue)} />
            <Bubble label="Vendas reais" value={String(metrics.realSales)} />
            <Bubble label="CAC real" value={money(calc.realCac)} />
            <Bubble label="Lucro real" value={money(calc.realProfit)} />
            <Bubble label="Impostos estimados" value={money(calc.realTaxes)} />
          </div>
        </div>
      </section>

      <section className="summaryGrid">
        <Card title="CAC / CAQ projetado" value={money(calc.cac)} note="custo para conquistar cada cliente" />
        <Card title="LTV projetado" value={money(calc.ltv)} note="valor estimado por cliente ao longo do tempo" />
        <Card title="Break-even" value={`${calc.breakEvenClients.toFixed(0)} clientes`} note="quantos clientes para empatar custos" />
        <Card title="Cauda longa mensal" value={money(calc.longTailRevenue)} note={`${calc.longTailVisits.toFixed(0)} visitas orgânicas estimadas`} />
      </section>

      <section className="investor">
        <div>
          <p className="eyebrow">Simulação para investidor anjo</p>
          <h2>O que ele ganha ou deixa de ganhar</h2>
          <p>
            Com um aporte de <b>{money(metrics.investorCheck)}</b> por{" "}
            <b>{pct(metrics.equityPercent)}</b> de equity, a empresa estaria sendo
            avaliada simbolicamente em <b>{money(calc.equityValueToday)}</b>.
          </p>
          <p>
            Se no futuro a empresa valer <b>{money(metrics.futureValuation)}</b>,
            essa participação poderia valer <b>{money(calc.investorFutureStakeValue)}</b>,
            com ganho potencial de <b>{money(calc.investorGain)}</b>.
          </p>
        </div>

        <div className="ctaBox">
          <h3>CTA para projeto</h3>
          <p>
            A Sualuma está criando uma infraestrutura de agentes, automações,
            CRM, produtividade e presença digital para pequenos negócios.
          </p>
          <button onClick={() => navigator.clipboard.writeText("A Sualuma está criando uma infraestrutura de agentes, automações, CRM, produtividade e presença digital para pequenos negócios. O objetivo é reduzir a sobrecarga operacional de microempreendedores e transformar IA em crescimento real.")}>
            Copiar resumo para investidor
          </button>
        </div>
      </section>

      <section className="ipo">
        <h2>Distância simbólica até maturidade para bolsa</h2>
        <p>
          Esta não é uma análise jurídica. É um termômetro interno de maturidade:
          receita anualizada, governança, previsibilidade, controle financeiro,
          compliance e histórico.
        </p>

        <div className="progress">
          <div style={{ width: `${calc.ipoReadiness}%` }} />
        </div>

        <div className="ipoStats">
          <span>Maturidade estimada: <b>{pct(calc.ipoReadiness)}</b></span>
          <span>Falta para a meta anual simbólica: <b>{money(calc.missingToIpoGoal)}</b></span>
        </div>
      </section>

      <section className="formGrid">
        {groups.map((group) => (
          <div className="formCard" key={group}>
            <h3>{group}</h3>
            {fields.filter((field) => field.group === group).map((field) => (
              <label key={field.key}>
                <span>{field.label}</span>
                <div className="inputWrap">
                  <input
                    type="number"
                    value={metrics[field.key]}
                    onChange={(event) => update(field.key, event.target.value)}
                  />
                  {field.suffix && <em>{field.suffix}</em>}
                </div>
              </label>
            ))}
          </div>
        ))}
      </section>

      <section className="dictionary">
        <h2>Dicionário leigo das métricas</h2>
        <p>
          Cada sigla deve puxar para um artigo público do blog. O artigo explica
          o conceito, mas não mostra seus números internos.
        </p>

        <div className="dictGrid">
          {dictionary.map(([term, desc, href]) => (
            <a href={href} key={term}>
              <strong>{term}</strong>
              <span>{desc}</span>
            </a>
          ))}
        </div>
      </section>

      <p className="warning">
        Observação: imposto, abertura de capital e valuation precisam ser validados
        com contador, advogado e especialista financeiro. Aqui é um painel de simulação
        estratégica, não uma promessa legal ou contábil.
      </p>

      <style jsx>{`
        .page {
          min-height: 100vh;
          padding: 48px 22px 80px;
          background:
            radial-gradient(circle at top left, rgba(168, 85, 247, 0.22), transparent 34%),
            radial-gradient(circle at top right, rgba(34, 211, 238, 0.16), transparent 30%),
            #020617;
          color: #e5e7eb;
        }

        .hero,
        .summaryGrid,
        .comparison,
        .investor,
        .ipo,
        .formGrid,
        .dictionary,
        .warning {
          max-width: 1180px;
          margin-left: auto;
          margin-right: auto;
        }

        .hero {
          margin-bottom: 26px;
        }

        .eyebrow {
          color: #67e8f9;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          font-size: 12px;
          font-weight: 900;
        }

        h1 {
          max-width: 880px;
          margin: 12px 0;
          font-size: clamp(34px, 5vw, 72px);
          line-height: 0.92;
          letter-spacing: -0.06em;
          color: white;
        }

        .hero p {
          max-width: 820px;
          color: #94a3b8;
          font-size: 16px;
          line-height: 1.7;
        }

        .summaryGrid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-top: 22px;
        }

        .card,
        .comparison,
        .investor,
        .ipo,
        .formCard,
        .dictionary {
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(15, 23, 42, 0.78);
          border-radius: 24px;
          box-shadow: 0 20px 70px rgba(0, 0, 0, 0.28);
        }

        .card {
          padding: 18px;
        }

        .card span,
        .bubble span {
          display: block;
          color: #94a3b8;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .card strong {
          display: block;
          margin-top: 10px;
          font-size: 28px;
          color: #fff;
          letter-spacing: -0.04em;
        }

        .card small {
          display: block;
          margin-top: 8px;
          color: #64748b;
        }

        .comparison {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
          padding: 20px;
          margin-top: 18px;
        }

        h2 {
          margin: 0 0 14px;
          color: white;
          letter-spacing: -0.03em;
        }

        .bubbles {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 10px;
        }

        .bubble {
          min-height: 96px;
          padding: 14px;
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(2, 6, 23, 0.55);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .bubble strong {
          color: #fff;
          font-size: 22px;
          letter-spacing: -0.05em;
        }

        .investor {
          display: grid;
          grid-template-columns: 1.3fr 0.7fr;
          gap: 20px;
          padding: 24px;
          margin-top: 18px;
        }

        .investor p,
        .ipo p,
        .dictionary p,
        .warning {
          color: #94a3b8;
          line-height: 1.7;
        }

        .ctaBox {
          border-radius: 20px;
          padding: 18px;
          background: linear-gradient(135deg, rgba(236, 72, 153, 0.16), rgba(59, 130, 246, 0.12));
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        button {
          width: 100%;
          margin-top: 12px;
          border: 0;
          border-radius: 999px;
          padding: 13px 16px;
          background: linear-gradient(135deg, #a855f7, #22d3ee);
          color: white;
          font-weight: 950;
          cursor: pointer;
        }

        .ipo {
          padding: 24px;
          margin-top: 18px;
        }

        .progress {
          height: 14px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.1);
          overflow: hidden;
          margin-top: 18px;
        }

        .progress div {
          height: 100%;
          background: linear-gradient(90deg, #22c55e, #22d3ee, #a855f7);
        }

        .ipoStats {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
          margin-top: 14px;
          color: #cbd5e1;
        }

        .formGrid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          margin-top: 18px;
        }

        .formCard {
          padding: 18px;
        }

        .formCard h3 {
          margin: 0 0 14px;
          color: white;
        }

        label {
          display: block;
          margin-bottom: 12px;
        }

        label span {
          display: block;
          margin-bottom: 6px;
          color: #cbd5e1;
          font-size: 13px;
        }

        .inputWrap {
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          background: rgba(2, 6, 23, 0.55);
          padding: 0 10px;
        }

        input {
          width: 100%;
          padding: 12px 4px;
          background: transparent;
          border: 0;
          color: white;
          outline: none;
          font-size: 15px;
        }

        em {
          color: #94a3b8;
          font-style: normal;
        }

        .dictionary {
          padding: 24px;
          margin-top: 18px;
        }

        .dictGrid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-top: 16px;
        }

        .dictGrid a {
          text-decoration: none;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 18px;
          padding: 14px;
          background: rgba(2, 6, 23, 0.55);
        }

        .dictGrid strong {
          display: block;
          color: #67e8f9;
          margin-bottom: 8px;
        }

        .dictGrid span {
          color: #94a3b8;
          font-size: 13px;
          line-height: 1.5;
        }

        .warning {
          margin-top: 20px;
          font-size: 12px;
        }

        @media (max-width: 980px) {
          .summaryGrid,
          .comparison,
          .investor,
          .formGrid,
          .dictGrid {
            grid-template-columns: 1fr;
          }

          .bubbles {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>
    </main>
  );
}

function Card({ title, value, note }: { title: string; value: string; note: string }) {
  return (
    <div className="card">
      <span>{title}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}

function Bubble({ label, value }: { label: string; value: string }) {
  return (
    <div className="bubble">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
