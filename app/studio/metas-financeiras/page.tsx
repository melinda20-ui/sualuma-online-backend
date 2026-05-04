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
  monthlyGoal: number;

  realRevenue: number;
  realSales: number;
  realInvestment: number;

  investmentAsk: number;
  equityOffered: number;
  ipoReadiness: number;
};

type AgentMessage = {
  role: "user" | "agent";
  text: string;
};

const STORAGE_KEY = "sualuma:metas-financeiras:v2";

const DEFAULT_METRICS: Metrics = {
  coldLeads: 5000,
  responseRate: 10,
  optinRate: 5,
  conversionRate: 1,
  ticket: 97,
  monthlyFee: 47,
  retentionMonths: 8,
  investment: 2500,
  fixedCosts: 1800,
  variableCostRate: 12,
  taxRate: 6,
  monthlyGoal: 10000,

  realRevenue: 0,
  realSales: 0,
  realInvestment: 0,

  investmentAsk: 50000,
  equityOffered: 10,
  ipoReadiness: 8
};

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0
});

const int = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 0
});

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function safeDiv(a: number, b: number) {
  return b === 0 ? 0 : a / b;
}

function money(value: number) {
  if (!Number.isFinite(value)) return brl.format(0);
  return brl.format(value);
}

function percent(value: number) {
  if (!Number.isFinite(value)) return "0%";
  return `${value.toFixed(value >= 10 ? 0 : 1)}%`;
}

export default function MetasFinanceirasPage() {
  const [metrics, setMetrics] = useState<Metrics>(DEFAULT_METRICS);
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState("");
  const [agentInput, setAgentInput] = useState("");
  const [agentMessages, setAgentMessages] = useState<AgentMessage[]>([
    {
      role: "agent",
      text:
        "Sou a Mia Financeira. Me diga o que mudou no seu funil, faturamento, custos, imposto, meta, equity ou investimento que eu atualizo o painel para você."
    }
  ]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setMetrics({ ...DEFAULT_METRICS, ...JSON.parse(saved) });
      }
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(metrics));
  }, [metrics, loaded]);

  function update(key: keyof Metrics, value: string) {
    setMetrics((current) => ({
      ...current,
      [key]: Number(value) || 0
    }));
  }

  function notify(message: string) {
    setToast(message);
    setTimeout(() => setToast(""), 2800);
  }


  function normalizeAgentText(text: string) {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function parseAgentNumber(token: string) {
    let raw = token.toLowerCase().replace(/r\$/g, "").replace(/\s/g, "");
    const multiplier = raw.includes("mil") || raw.includes("k") ? 1000 : 1;

    raw = raw.replace(/mil|k/g, "");

    if (raw.includes(",") && raw.includes(".")) {
      raw = raw.replace(/\./g, "").replace(",", ".");
    } else if (raw.includes(".") && !raw.includes(",") && /\.\d{3}/.test(raw)) {
      raw = raw.replace(/\./g, "");
    } else {
      raw = raw.replace(",", ".");
    }

    raw = raw.replace(/[^\d.]/g, "");
    const parsed = Number(raw);

    if (!Number.isFinite(parsed)) return null;
    return parsed * multiplier;
  }

  function getNumberNear(text: string, patterns: string[]) {
    const normalized = normalizeAgentText(text);

    for (const pattern of patterns) {
      const normalizedPattern = normalizeAgentText(pattern);
      const index = normalized.indexOf(normalizedPattern);

      if (index === -1) continue;

      const start = Math.max(0, index - 38);
      const end = Math.min(text.length, index + normalizedPattern.length + 90);
      const windowText = text.slice(start, end);

      const matches = windowText.match(/(?:r\$\s*)?\d+(?:[.,]\d{1,3})?(?:\s*(?:mil|k))?/gi);

      if (!matches?.length) continue;

      const parsed = matches
        .map(parseAgentNumber)
        .find((value): value is number => typeof value === "number" && Number.isFinite(value));

      if (typeof parsed === "number") return parsed;
    }

    return null;
  }

  function formatAgentChange(key: keyof Metrics, value: number) {
    const moneyFields: Array<keyof Metrics> = [
      "ticket",
      "monthlyFee",
      "investment",
      "fixedCosts",
      "monthlyGoal",
      "realRevenue",
      "realInvestment",
      "investmentAsk"
    ];

    const percentFields: Array<keyof Metrics> = [
      "responseRate",
      "optinRate",
      "conversionRate",
      "variableCostRate",
      "taxRate",
      "equityOffered",
      "ipoReadiness"
    ];

    if (moneyFields.includes(key)) return money(value);
    if (percentFields.includes(key)) return `${value}%`;
    return int.format(value);
  }

  function runFinancialAgent() {
    const text = agentInput.trim();
    if (!text) return;

    const normalized = normalizeAgentText(text);

    setAgentMessages((current) => [...current, { role: "user", text }]);
    setAgentInput("");

    if (
      normalized.includes("resetar") ||
      normalized.includes("reset") ||
      normalized.includes("voltar padrao") ||
      normalized.includes("valores padrao")
    ) {
      setMetrics(DEFAULT_METRICS);
      setAgentMessages((current) => [
        ...current,
        {
          role: "agent",
          text:
            "Pronto. Voltei o painel para os valores padrão e recalculei a projeção inteira."
        }
      ]);
      notify("Painel resetado pela Mia Financeira.");
      return;
    }

    const updates: Partial<Metrics> = {};
    const changes: string[] = [];

    function apply(key: keyof Metrics, label: string, patterns: string[]) {
      const value = getNumberNear(text, patterns);
      if (value === null) return;

      updates[key] = value;
      changes.push(`${label}: ${formatAgentChange(key, value)}`);
    }

    apply("coldLeads", "Contatos frios", [
      "contatos frios",
      "leads frios",
      "leads no topo",
      "topo do funil",
      "prospectos",
      "contatos no topo"
    ]);

    apply("responseRate", "Taxa de resposta", [
      "taxa de resposta",
      "resposta",
      "responderam",
      "respostas",
      "sinais de interesse"
    ]);

    apply("optinRate", "Opt-in confirmado", [
      "opt-in",
      "optin",
      "opt in",
      "confirmaram",
      "confirmados",
      "consentimento"
    ]);

    apply("conversionRate", "Conversão", [
      "conversao",
      "converter",
      "viraram cliente",
      "clientes convertidos",
      "taxa de cliente"
    ]);

    apply("ticket", "Ticket inicial", [
      "ticket",
      "preco inicial",
      "valor inicial",
      "entrada",
      "setup"
    ]);

    apply("monthlyFee", "Mensalidade média", [
      "mensalidade",
      "mrr",
      "recorrencia",
      "recorrente",
      "plano mensal"
    ]);

    apply("retentionMonths", "Retenção média", [
      "retencao",
      "ficam por",
      "meses de retencao",
      "tempo medio",
      "permanencia"
    ]);

    apply("investment", "Investimento previsto", [
      "investimento previsto",
      "verba de campanha",
      "orcamento de campanha",
      "vou colocar na campanha",
      "campanha vai custar"
    ]);

    apply("fixedCosts", "Custos fixos", [
      "custo fixo",
      "custos fixos",
      "despesa fixa",
      "despesas fixas"
    ]);

    apply("variableCostRate", "Custo variável", [
      "custo variavel",
      "custos variaveis",
      "taxa variavel",
      "comissao"
    ]);

    apply("taxRate", "Imposto estimado", [
      "imposto",
      "impostos",
      "tributo",
      "taxa de imposto",
      "simples nacional"
    ]);

    apply("monthlyGoal", "Meta mensal", [
      "meta mensal",
      "meta do mes",
      "quero faturar",
      "objetivo mensal",
      "alvo mensal"
    ]);

    apply("realRevenue", "Faturamento real", [
      "faturei",
      "faturamento real",
      "receita real",
      "entrou no caixa",
      "vendi em reais",
      "recebemos"
    ]);

    apply("realSales", "Vendas reais", [
      "vendas reais",
      "fiz vendas",
      "fiz venda",
      "vendi",
      "clientes reais",
      "compraram"
    ]);

    apply("realInvestment", "Investimento real", [
      "investi",
      "gastei",
      "investimento real",
      "gasto real",
      "desembolso real"
    ]);

    apply("investmentAsk", "Investimento pedido", [
      "investimento pedido",
      "pedir para investidor",
      "investidor colocar",
      "aporte",
      "captar",
      "captacao"
    ]);

    apply("equityOffered", "Equity oferecido", [
      "equity",
      "participacao",
      "sociedade",
      "por cento da empresa",
      "percentual da empresa"
    ]);

    apply("ipoReadiness", "Maturidade para bolsa", [
      "ipo",
      "bolsa",
      "abrir capital",
      "maturidade para bolsa",
      "pronta para bolsa"
    ]);

    if (!changes.length) {
      setAgentMessages((current) => [
        ...current,
        {
          role: "agent",
          text:
            "Entendi sua mensagem, mas não encontrei um número ligado a uma métrica. Tente algo como: “faturei R$ 1200”, “muda a meta mensal para R$ 15000”, “simula 5000 contatos frios” ou “investidor: R$ 50000 por 10% de equity”."
        }
      ]);
      return;
    }

    setMetrics((current) => ({
      ...current,
      ...updates
    }));

    setAgentMessages((current) => [
      ...current,
      {
        role: "agent",
        text: `Atualizei o painel: ${changes.join(" · ")}. A projeção, lucro, imposto, CAQ, LTV e equity já foram recalculados.`
      }
    ]);

    notify("Mia Financeira atualizou as métricas.");
  }

  const result = useMemo(() => {
    const responses = metrics.coldLeads * (metrics.responseRate / 100);
    const optins = metrics.coldLeads * (metrics.optinRate / 100);
    const clients = metrics.coldLeads * (metrics.conversionRate / 100);

    const projectedSetupRevenue = clients * metrics.ticket;
    const projectedMRR = clients * metrics.monthlyFee;
    const projectedMonthRevenue = projectedSetupRevenue + projectedMRR;

    const ltv = metrics.ticket + metrics.monthlyFee * metrics.retentionMonths;
    const projectedLtvRevenue = clients * ltv;

    const variableCosts = projectedMonthRevenue * (metrics.variableCostRate / 100);
    const tax = projectedMonthRevenue * (metrics.taxRate / 100);
    const totalCost = metrics.investment + metrics.fixedCosts + variableCosts + tax;
    const profit = projectedMonthRevenue - totalCost;
    const margin = safeDiv(profit, projectedMonthRevenue) * 100;
    const caq = safeDiv(metrics.investment, clients);

    const contributionPerClient =
      metrics.ticket +
      metrics.monthlyFee -
      (metrics.ticket + metrics.monthlyFee) * ((metrics.variableCostRate + metrics.taxRate) / 100);

    const breakEvenClients = Math.max(
      0,
      Math.ceil(safeDiv(metrics.investment + metrics.fixedCosts, contributionPerClient))
    );

    const roi = safeDiv(profit, metrics.investment) * 100;
    const longTail = Math.max(0, projectedLtvRevenue - projectedMonthRevenue);

    const realProfitEstimate =
      metrics.realRevenue -
      metrics.realInvestment -
      metrics.fixedCosts -
      metrics.realRevenue * (metrics.variableCostRate / 100) -
      metrics.realRevenue * (metrics.taxRate / 100);

    const monthlyProgress = clamp(safeDiv(metrics.realRevenue, metrics.monthlyGoal) * 100);
    const projectedProgress = clamp(safeDiv(projectedMonthRevenue, metrics.monthlyGoal) * 100);

    const postMoney = metrics.equityOffered > 0
      ? metrics.investmentAsk / (metrics.equityOffered / 100)
      : 0;

    const preMoney = Math.max(0, postMoney - metrics.investmentAsk);

    const investorShareProjectedLtv = projectedLtvRevenue * (metrics.equityOffered / 100);

    return {
      responses,
      optins,
      clients,
      projectedSetupRevenue,
      projectedMRR,
      projectedMonthRevenue,
      ltv,
      projectedLtvRevenue,
      variableCosts,
      tax,
      totalCost,
      profit,
      margin,
      caq,
      breakEvenClients,
      roi,
      longTail,
      realProfitEstimate,
      monthlyProgress,
      projectedProgress,
      postMoney,
      preMoney,
      investorShareProjectedLtv
    };
  }, [metrics]);

  const missionCards = [
    {
      tone: "pink",
      icon: "🚀",
      badge: "Funil",
      title: "Projeção do lançamento",
      desc: "Mostra a jornada do topo do funil até clientes, usando suas taxas atuais.",
      current: `${int.format(result.clients)} clientes`,
      target: `${int.format(metrics.coldLeads)} contatos`,
      pct: result.projectedProgress,
      footer: `${int.format(result.responses)} respostas · ${int.format(result.optins)} opt-ins`
    },
    {
      tone: "yellow",
      icon: "💰",
      badge: "Receita",
      title: "Faturamento esperado",
      desc: "Quanto o mês pode gerar se a projeção de conversão acontecer.",
      current: money(result.projectedMonthRevenue),
      target: `meta ${money(metrics.monthlyGoal)}`,
      pct: result.projectedProgress,
      footer: `MRR esperado: ${money(result.projectedMRR)}`
    },
    {
      tone: "mint",
      icon: "📈",
      badge: "Lucro",
      title: "Lucro estimado",
      desc: "Receita menos investimento, custo fixo, custo variável e imposto estimado.",
      current: money(result.profit),
      target: `${percent(result.margin)} margem`,
      pct: clamp(result.margin),
      footer: `ROI: ${percent(result.roi)}`
    },
    {
      tone: "purple",
      icon: "🧲",
      badge: "CAQ",
      title: "Custo por aquisição",
      desc: "Quanto custa, em média, conquistar cada cliente dentro desta campanha.",
      current: money(result.caq),
      target: `${int.format(result.breakEvenClients)} clientes para breakeven`,
      pct: clamp(100 - safeDiv(result.caq, metrics.ticket + metrics.monthlyFee) * 100),
      footer: `Breakeven: ${int.format(result.breakEvenClients)} vendas`
    },
    {
      tone: "pink",
      icon: "💎",
      badge: "LTV",
      title: "Cauda longa e LTV",
      desc: "Mostra quanto cada cliente pode render ao longo dos meses, não só na primeira compra.",
      current: money(result.ltv),
      target: `${metrics.retentionMonths} meses`,
      pct: clamp(safeDiv(result.longTail, result.projectedLtvRevenue) * 100),
      footer: `Cauda longa: ${money(result.longTail)}`
    },
    {
      tone: "mint",
      icon: "🤝",
      badge: "Equity",
      title: "Simulação para investidor",
      desc: "Mostra valuation simples baseado em quanto você pediria e quanto de participação ofereceria.",
      current: money(result.postMoney),
      target: `${metrics.equityOffered}% equity`,
      pct: clamp(metrics.equityOffered * 5),
      footer: `Pré-money: ${money(result.preMoney)}`
    }
  ];

  const glossary = [
    ["LTV", "Valor que um cliente pode gerar ao longo do tempo.", "/blog/glossario/ltv"],
    ["CAQ/CAC", "Quanto custa conquistar um cliente.", "/blog/glossario/caq-cac"],
    ["Break-even", "Ponto onde para de perder e começa a lucrar.", "/blog/glossario/breakeven"],
    ["ROI", "Retorno sobre o investimento.", "/blog/glossario/roi"],
    ["Equity", "Participação societária oferecida a investidor.", "/blog/glossario/equity"],
    ["MRR", "Receita recorrente mensal.", "/blog/glossario/mrr"],
    ["Margem", "Quanto sobra depois dos custos.", "/blog/glossario/margem"],
    ["IPO/Bolsa", "Etapa futura de abertura de capital.", "/blog/glossario/ipo"]
  ];

  function Field({
    label,
    valueKey,
    suffix,
    prefix
  }: {
    label: string;
    valueKey: keyof Metrics;
    suffix?: string;
    prefix?: string;
  }) {
    return (
      <label className="field">
        <span>{label}</span>
        <div className="inputWrap">
          {prefix ? <b>{prefix}</b> : null}
          <input
            type="number"
            value={metrics[valueKey]}
            onChange={(event) => update(valueKey, event.target.value)}
          />
          {suffix ? <b>{suffix}</b> : null}
        </div>
      </label>
    );
  }

  return (
    <main className="page">
      <div className="particles" aria-hidden="true">
        {Array.from({ length: 28 }).map((_, index) => (
          <i key={index} style={{ ["--i" as string]: index }} />
        ))}
      </div>

      {toast ? (
        <div className="toast">
          <span>✨</span>
          <b>{toast}</b>
        </div>
      ) : null}

      <div className="wrapper">
        <nav className="topbar">
          <div className="brand">💸 Sualuma Finance OS</div>
          <div className="topActions">
            <div className="pill">🔒 Privado no Studio</div>
            <div className="level">✨ NÍVEL: INVESTIDORA</div>
          </div>
        </nav>

        <section className="hero">
          <span className="heroEmoji">🎯</span>
          <h1>Metas Financeiras e Projeção de Crescimento</h1>
          <p>
            Um painel privado para entender o que o Sualuma pode faturar, quanto
            já faturou, onde está o lucro, quanto custa vender, quanto vale um
            cliente e como explicar isso para uma investidora ou investidor anjo.
          </p>

          <div className="heroBadges">
            <button onClick={() => notify("Projeção recalculada com suas premissas atuais.")}>
              Recalcular cenário
            </button>
            <a href="/studio/blog-agent">Ver Agente de Blog</a>
            <a href="/admin/conteudo">Criar artigos das siglas</a>
          </div>
        </section>


        <section className="agentPanel">
          <div className="agentIntro">
            <p className="eyebrow">Mia Financeira</p>
            <h2>Atualize o painel conversando</h2>
            <p>
              Escreva como se estivesse falando comigo. Eu leio sua frase,
              encontro as métricas e atualizo a página automaticamente.
            </p>
          </div>

          <div className="agentChat">
            {agentMessages.slice(-6).map((message, index) => (
              <div className={`agentBubble ${message.role}`} key={`${message.role}-${index}`}>
                <b>{message.role === "agent" ? "Mia" : "Você"}</b>
                <span>{message.text}</span>
              </div>
            ))}
          </div>

          <div className="agentInputRow">
            <textarea
              value={agentInput}
              onChange={(event) => setAgentInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  runFinancialAgent();
                }
              }}
              placeholder="Ex: Faturei R$ 1200, fiz 8 vendas reais e investi R$ 300."
            />
            <button onClick={runFinancialAgent}>Atualizar painel</button>
          </div>

          <div className="quickPrompts">
            <button
              onClick={() =>
                setAgentInput("Simula 5000 contatos frios, 10% resposta, 5% opt-in e 1% conversão.")
              }
            >
              Simular funil
            </button>
            <button
              onClick={() =>
                setAgentInput("Faturei R$ 1200 esse mês, fiz 8 vendas reais e investi R$ 300.")
              }
            >
              Atualizar realidade
            </button>
            <button
              onClick={() =>
                setAgentInput("Muda a meta mensal para R$ 15000 e imposto para 6%.")
              }
            >
              Ajustar meta/imposto
            </button>
            <button
              onClick={() =>
                setAgentInput("Investidor: pedir R$ 50000 por 10% de equity.")
              }
            >
              Simular investidor
            </button>
          </div>
        </section>

        <section className="globalBar">
          <div className="barHead">
            <div>
              <strong>🌟 Progresso real da meta mensal</strong>
              <small>
                Realizado: {money(metrics.realRevenue)} · Meta: {money(metrics.monthlyGoal)}
              </small>
            </div>
            <b>{percent(result.monthlyProgress)}</b>
          </div>

          <div className="barTrack">
            <div className="barFill" style={{ width: `${result.monthlyProgress}%` }} />
          </div>

          <div className="milestones">
            <span>🥚 início</span>
            <span>25% 🌱</span>
            <span>50% 🌿</span>
            <span>75% 🌳</span>
            <span>100% 👑</span>
          </div>
        </section>

        <section className="statsRow">
          <article className="statCard">
            <span>💰</span>
            <b>{money(result.projectedMonthRevenue)}</b>
            <small>faturamento projetado</small>
          </article>

          <article className="statCard">
            <span>✅</span>
            <b>{money(metrics.realRevenue)}</b>
            <small>faturamento real</small>
          </article>

          <article className="statCard">
            <span>📉</span>
            <b>{money(Math.max(0, metrics.monthlyGoal - metrics.realRevenue))}</b>
            <small>falta para meta</small>
          </article>

          <article className="statCard">
            <span>📈</span>
            <b>{money(result.profit)}</b>
            <small>lucro projetado</small>
          </article>

          <article className="statCard">
            <span>🧲</span>
            <b>{money(result.caq)}</b>
            <small>CAQ estimado</small>
          </article>

          <article className="statCard">
            <span>🧾</span>
            <b>{money(result.tax)}</b>
            <small>imposto estimado</small>
          </article>
        </section>

        <div className="secTitle">🧮 <span>Premissas</span> editáveis</div>

        <section className="inputGrid">
          <div className="inputPanel">
            <h2>Topo do funil</h2>
            <Field label="Contatos frios" valueKey="coldLeads" />
            <Field label="Taxa de resposta" valueKey="responseRate" suffix="%" />
            <Field label="Opt-in confirmado" valueKey="optinRate" suffix="%" />
            <Field label="Conversão em cliente" valueKey="conversionRate" suffix="%" />
          </div>

          <div className="inputPanel">
            <h2>Receita por cliente</h2>
            <Field label="Ticket inicial" valueKey="ticket" prefix="R$" />
            <Field label="Mensalidade média" valueKey="monthlyFee" prefix="R$" />
            <Field label="Retenção média" valueKey="retentionMonths" suffix="meses" />
            <Field label="Meta mensal" valueKey="monthlyGoal" prefix="R$" />
          </div>

          <div className="inputPanel">
            <h2>Custos e impostos</h2>
            <Field label="Investimento previsto" valueKey="investment" prefix="R$" />
            <Field label="Custos fixos" valueKey="fixedCosts" prefix="R$" />
            <Field label="Custo variável" valueKey="variableCostRate" suffix="%" />
            <Field label="Imposto estimado" valueKey="taxRate" suffix="%" />
          </div>

          <div className="inputPanel">
            <h2>Realidade do mês</h2>
            <Field label="Faturamento real" valueKey="realRevenue" prefix="R$" />
            <Field label="Vendas reais" valueKey="realSales" />
            <Field label="Investimento real" valueKey="realInvestment" prefix="R$" />
            <Field label="Maturidade para bolsa" valueKey="ipoReadiness" suffix="%" />
          </div>
        </section>

        <div className="secTitle">🗺️ <span>Missões</span> de crescimento</div>

        <section className="missionsGrid">
          {missionCards.map((card) => (
            <article className={`mission ${card.tone}`} key={card.title}>
              <div className="missionTop">
                <div className="missionIcon">{card.icon}</div>
                <div className="badge">{card.badge}</div>
              </div>

              <h2>{card.title}</h2>
              <p>{card.desc}</p>

              <div className="missionLabel">
                <span>{card.current}</span>
                <small>{card.target}</small>
              </div>

              <div className="miniBar">
                <div style={{ width: `${clamp(card.pct)}%` }} />
              </div>

              <footer>
                <span>⭐ métrica-chave</span>
                <b>{card.footer}</b>
              </footer>
            </article>
          ))}
        </section>

        <button
          className="addButton"
          onClick={() => notify("Depois conectaremos esta tela com CRM, Stripe, Blog Agent e Search Console.")}
        >
          <span>+</span>
          Criar novo cenário de metas
        </button>

        <section className="investorPanel">
          <div>
            <p className="eyebrow">Investidor anjo</p>
            <h2>O que ele ganha ou deixa de ganhar se entrar agora?</h2>
            <p>
              Se alguém investir {money(metrics.investmentAsk)} por {metrics.equityOffered}%,
              o valuation pós-money simulado fica em {money(result.postMoney)}. Pela projeção
              de LTV, a participação proporcional sobre o potencial da base seria de{" "}
              {money(result.investorShareProjectedLtv)}.
            </p>
          </div>

          <div className="investorInputs">
            <Field label="Investimento pedido" valueKey="investmentAsk" prefix="R$" />
            <Field label="Equity oferecido" valueKey="equityOffered" suffix="%" />
          </div>
        </section>

        <section className="ipoPanel">
          <div>
            <p className="eyebrow">Bolsa de valores / IPO</p>
            <h2>Distância até abrir capital</h2>
            <p>
              Esta parte é uma régua didática, não uma promessa. Para pensar em bolsa,
              ainda precisa histórico financeiro, receita recorrente forte, governança,
              auditoria, jurídico, contabilidade robusta, conselho, compliance e escala.
            </p>
          </div>

          <div className="ipoScore">
            <strong>{metrics.ipoReadiness}%</strong>
            <span>maturidade estimada</span>
            <div className="barTrack small">
              <div className="barFill" style={{ width: `${clamp(metrics.ipoReadiness)}%` }} />
            </div>
          </div>
        </section>

        <div className="secTitle">📚 <span>Glossário</span> para blog e investidores</div>

        <section className="glossaryGrid">
          {glossary.map(([term, desc, href]) => (
            <a className="glossaryCard" href={href} key={term}>
              <b>{term}</b>
              <span>{desc}</span>
              <small>Artigo didático →</small>
            </a>
          ))}
        </section>

        <section className="tips">
          <article>
            <h3>💡 Próximo passo de conteúdo</h3>
            <p>
              Como o Blog Agent encontrou 4 posts, 0 publicados, 0 com imagem e saúde de 25%,
              a prioridade é transformar este glossário em artigos simples e indexáveis.
            </p>
          </article>

          <article>
            <h3>🔒 Segurança estratégica</h3>
            <p>
              Esta página continua privada dentro do Studio. Os números não aparecem para
              o público. Para investidor, depois criamos uma versão pitch sem dados sensíveis.
            </p>
          </article>

          <article>
            <h3>🎯 Regra de ouro</h3>
            <p>
              O painel não serve para adivinhar o futuro. Ele serve para testar cenários:
              “se eu investir X, converter Y e reter Z meses, quanto posso crescer?”
            </p>
          </article>
        </section>
      </div>

      <style jsx>{`
        :global(*) {
          box-sizing: border-box;
        }

        .page {
          min-height: 100vh;
          background:
            radial-gradient(ellipse 60% 40% at 10% 20%, rgba(255,45,120,0.22) 0%, transparent 70%),
            radial-gradient(ellipse 50% 50% at 90% 70%, rgba(176,20,255,0.18) 0%, transparent 70%),
            radial-gradient(ellipse 40% 30% at 50% 100%, rgba(0,245,196,0.10) 0%, transparent 70%),
            #0d0014;
          color: #fff;
          overflow-x: hidden;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          position: relative;
          padding-bottom: 80px;
        }

        .wrapper {
          position: relative;
          z-index: 1;
          max-width: 1180px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .particles {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .particles i {
          position: absolute;
          width: calc(3px + (var(--i) % 5) * 1px);
          height: calc(3px + (var(--i) % 5) * 1px);
          left: calc((var(--i) * 37) % 100 * 1%);
          bottom: -10vh;
          border-radius: 999px;
          background: #ff2d78;
          opacity: 0;
          animation: floatUp calc(8s + (var(--i) % 8) * 1s) linear infinite;
          animation-delay: calc((var(--i) % 10) * -1s);
        }

        .particles i:nth-child(3n) {
          background: #ffd600;
        }

        .particles i:nth-child(4n) {
          background: #00f5c4;
        }

        .particles i:nth-child(5n) {
          background: #b014ff;
        }

        @keyframes floatUp {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.75;
          }
          90% {
            opacity: 0.45;
          }
          100% {
            transform: translateY(-115vh) rotate(720deg);
            opacity: 0;
          }
        }

        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          padding: 22px 0 8px;
        }

        .brand {
          font-size: 1.05rem;
          font-weight: 950;
          color: #ff2d78;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .topActions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
        }

        .pill {
          background: rgba(255,45,120,0.10);
          border: 1px solid rgba(255,45,120,0.22);
          border-radius: 999px;
          padding: 7px 15px;
          font-size: 0.84rem;
          font-weight: 850;
        }

        .level {
          background: linear-gradient(135deg, #ff2d78, #b014ff);
          border-radius: 999px;
          padding: 8px 16px;
          font-size: 0.78rem;
          font-weight: 950;
          box-shadow: 0 0 22px rgba(255,45,120,0.35);
          animation: pulseBadge 2.5s ease-in-out infinite;
        }

        @keyframes pulseBadge {
          0%, 100% {
            box-shadow: 0 0 18px rgba(255,45,120,0.35);
          }
          50% {
            box-shadow: 0 0 36px rgba(255,45,120,0.45), 0 0 60px rgba(176,20,255,0.25);
          }
        }

        .hero {
          text-align: center;
          padding: 42px 0 26px;
        }

        .heroEmoji {
          display: block;
          font-size: 3.4rem;
          animation: bounce 1.6s ease-in-out infinite;
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        h1 {
          margin: 14px auto 10px;
          max-width: 860px;
          font-size: clamp(2.1rem, 6vw, 4.3rem);
          line-height: 0.96;
          letter-spacing: -0.07em;
          font-weight: 950;
          background: linear-gradient(135deg, #fff 0%, #ff6ea8 50%, #ffd600 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero p {
          max-width: 680px;
          margin: 0 auto;
          color: rgba(255,255,255,0.62);
          line-height: 1.7;
        }

        .heroBadges {
          display: flex;
          justify-content: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 22px;
        }

        button,
        a {
          color: #fff;
          text-decoration: none;
          cursor: pointer;
          font-weight: 900;
          font-family: inherit;
        }

        .heroBadges button,
        .heroBadges a {
          border: 1px solid rgba(255,45,120,0.28);
          border-radius: 999px;
          background: rgba(255,45,120,0.10);
          padding: 10px 15px;
        }

        .heroBadges button:first-child {
          background: linear-gradient(135deg, #ff2d78, #b014ff);
          border-color: transparent;
          box-shadow: 0 0 24px rgba(255,45,120,0.28);
        }


        .agentPanel {
          display: grid;
          grid-template-columns: 0.8fr 1.2fr;
          gap: 18px;
          background:
            linear-gradient(135deg, rgba(255,45,120,0.12), rgba(176,20,255,0.08)),
            rgba(255,255,255,0.04);
          border: 1px solid rgba(255,45,120,0.22);
          border-radius: 26px;
          padding: 22px;
          margin: 10px 0 24px;
          backdrop-filter: blur(16px);
          box-shadow: 0 20px 70px rgba(0,0,0,0.22);
        }

        .agentIntro h2 {
          margin: 0 0 8px;
          font-size: 1.45rem;
          letter-spacing: -0.04em;
        }

        .agentIntro p:not(.eyebrow) {
          color: rgba(255,255,255,0.62);
          line-height: 1.65;
          margin: 0;
        }

        .agentChat {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 260px;
          overflow: auto;
          padding-right: 4px;
        }

        .agentBubble {
          border-radius: 18px;
          padding: 12px 14px;
          border: 1px solid rgba(255,255,255,0.09);
          background: rgba(0,0,0,0.22);
        }

        .agentBubble.user {
          background: rgba(255,45,120,0.13);
          border-color: rgba(255,45,120,0.25);
        }

        .agentBubble b {
          display: block;
          color: #ffd600;
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          margin-bottom: 5px;
        }

        .agentBubble span {
          color: rgba(255,255,255,0.78);
          line-height: 1.55;
          font-size: 0.88rem;
        }

        .agentInputRow {
          grid-column: 1 / -1;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
        }

        .agentInputRow textarea {
          min-height: 58px;
          resize: vertical;
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 16px;
          outline: none;
          background: rgba(0,0,0,0.24);
          color: #fff;
          padding: 14px;
          font-family: inherit;
          line-height: 1.45;
        }

        .agentInputRow button {
          border: 0;
          border-radius: 16px;
          padding: 0 20px;
          background: linear-gradient(135deg, #ff2d78, #b014ff);
          box-shadow: 0 0 24px rgba(255,45,120,0.28);
          white-space: nowrap;
        }

        .quickPrompts {
          grid-column: 1 / -1;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .quickPrompts button {
          border: 1px solid rgba(255,45,120,0.22);
          background: rgba(255,45,120,0.08);
          color: #fff;
          border-radius: 999px;
          padding: 8px 12px;
          font-size: 0.78rem;
        }

        .quickPrompts button:hover {
          background: rgba(255,45,120,0.16);
        }

        .globalBar {
          margin: 14px 0 30px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,45,120,0.18);
          border-radius: 22px;
          padding: 23px 26px;
          backdrop-filter: blur(14px);
        }

        .barHead {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          align-items: center;
          margin-bottom: 14px;
        }

        .barHead strong {
          display: block;
          font-size: 1rem;
        }

        .barHead small {
          display: block;
          color: rgba(255,255,255,0.54);
          margin-top: 4px;
        }

        .barHead b {
          color: #ff2d78;
          font-size: 1.35rem;
        }

        .barTrack {
          background: rgba(255,255,255,0.07);
          border-radius: 999px;
          height: 14px;
          overflow: hidden;
        }

        .barTrack.small {
          height: 10px;
          margin-top: 12px;
        }

        .barFill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #ff2d78, #b014ff, #ff6ea8);
          background-size: 200% 100%;
          animation: shine 2s linear infinite;
          transition: width 0.6s ease;
        }

        @keyframes shine {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        .milestones {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          margin-top: 9px;
          font-size: 0.75rem;
          color: rgba(255,255,255,0.52);
        }

        .statsRow {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 32px;
        }

        .statCard {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,45,120,0.18);
          border-radius: 18px;
          padding: 16px;
          text-align: center;
          backdrop-filter: blur(12px);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .statCard:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 12px 40px rgba(255,45,120,0.24);
        }

        .statCard span {
          display: block;
          font-size: 1.5rem;
          margin-bottom: 7px;
        }

        .statCard b {
          display: block;
          font-size: clamp(1rem, 2vw, 1.35rem);
          font-weight: 950;
          letter-spacing: -0.04em;
          background: linear-gradient(135deg, #ff2d78, #ffd600);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .statCard small {
          display: block;
          color: rgba(255,255,255,0.55);
          margin-top: 5px;
          font-size: 0.73rem;
        }

        .secTitle {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 30px 0 15px;
          font-size: 1.15rem;
          font-weight: 950;
        }

        .secTitle span {
          color: #ff2d78;
        }

        .inputGrid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 36px;
        }

        .inputPanel {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,45,120,0.18);
          border-radius: 20px;
          padding: 18px;
          backdrop-filter: blur(12px);
        }

        .inputPanel h2 {
          margin: 0 0 14px;
          font-size: 1rem;
        }

        .field {
          display: block;
          margin-bottom: 12px;
        }

        .field span {
          display: block;
          color: rgba(255,255,255,0.60);
          font-size: 0.78rem;
          margin-bottom: 5px;
        }

        .inputWrap {
          display: flex;
          align-items: center;
          gap: 7px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(0,0,0,0.22);
          border-radius: 12px;
          padding: 9px 10px;
        }

        .inputWrap b {
          color: #ffd600;
          font-size: 0.78rem;
        }

        input {
          width: 100%;
          border: 0;
          outline: none;
          background: transparent;
          color: #fff;
          font-size: 0.95rem;
          font-weight: 800;
        }

        .missionsGrid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
          margin-bottom: 26px;
        }

        .mission {
          --accent: #ff2d78;
          position: relative;
          overflow: hidden;
          background: rgba(255,255,255,0.04);
          border: 1.5px solid rgba(255,45,120,0.18);
          border-radius: 22px;
          padding: 22px;
          backdrop-filter: blur(14px);
          transition: transform 0.25s, border-color 0.25s, box-shadow 0.25s;
        }

        .mission::before {
          content: "";
          position: absolute;
          inset: 0 0 auto 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, var(--accent), transparent);
          opacity: 0;
          transition: opacity 0.25s;
        }

        .mission:hover {
          transform: translateY(-6px);
          border-color: var(--accent);
          box-shadow: 0 16px 48px rgba(0,0,0,0.40), 0 0 0 1px var(--accent);
        }

        .mission:hover::before {
          opacity: 1;
        }

        .mission.pink {
          --accent: #ff2d78;
        }

        .mission.yellow {
          --accent: #ffd600;
        }

        .mission.mint {
          --accent: #00f5c4;
        }

        .mission.purple {
          --accent: #b014ff;
        }

        .missionTop {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 16px;
        }

        .missionIcon {
          width: 50px;
          height: 50px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.10);
        }

        .badge {
          border: 1px solid color-mix(in srgb, var(--accent), transparent 65%);
          background: color-mix(in srgb, var(--accent), transparent 86%);
          color: var(--accent);
          border-radius: 999px;
          padding: 5px 10px;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          font-size: 0.68rem;
          font-weight: 950;
        }

        .mission h2 {
          margin: 0 0 6px;
          font-size: 1.08rem;
        }

        .mission p {
          min-height: 62px;
          color: rgba(255,255,255,0.56);
          line-height: 1.5;
          font-size: 0.84rem;
          margin: 0 0 15px;
        }

        .missionLabel {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 7px;
          font-size: 0.78rem;
        }

        .missionLabel span {
          color: var(--accent);
          font-weight: 950;
        }

        .missionLabel small {
          color: rgba(255,255,255,0.52);
        }

        .miniBar {
          background: rgba(255,255,255,0.07);
          border-radius: 999px;
          height: 8px;
          overflow: hidden;
        }

        .miniBar div {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, var(--accent), rgba(255,255,255,0.7));
          transition: width 0.6s ease;
        }

        .mission footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 14px;
          padding-top: 12px;
          border-top: 1px solid rgba(255,255,255,0.07);
          font-size: 0.74rem;
          color: rgba(255,255,255,0.54);
        }

        .mission footer b {
          color: #ffd600;
          text-align: right;
        }

        .addButton {
          width: 100%;
          border: 2px dashed rgba(255,45,120,0.32);
          border-radius: 22px;
          padding: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: transparent;
          color: #ff2d78;
          font-size: 0.95rem;
          transition: all 0.25s;
          margin-bottom: 32px;
        }

        .addButton:hover {
          background: rgba(255,45,120,0.07);
          border-color: #ff2d78;
          box-shadow: 0 0 30px rgba(255,45,120,0.30);
        }

        .addButton span {
          width: 36px;
          height: 36px;
          border-radius: 999px;
          background: linear-gradient(135deg, #ff2d78, #b014ff);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          box-shadow: 0 0 18px rgba(255,45,120,0.35);
        }

        .investorPanel,
        .ipoPanel {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 20px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,45,120,0.18);
          border-radius: 24px;
          padding: 24px;
          margin-bottom: 20px;
          backdrop-filter: blur(14px);
        }

        .eyebrow {
          margin: 0 0 8px;
          color: #ff6ea8;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          font-size: 0.72rem;
          font-weight: 950;
        }

        .investorPanel h2,
        .ipoPanel h2 {
          margin: 0 0 10px;
          font-size: 1.4rem;
        }

        .investorPanel p,
        .ipoPanel p {
          color: rgba(255,255,255,0.60);
          line-height: 1.7;
          margin: 0;
        }

        .investorInputs {
          display: grid;
          gap: 8px;
          align-content: center;
        }

        .ipoScore {
          border-radius: 20px;
          background: rgba(0,0,0,0.22);
          border: 1px solid rgba(255,255,255,0.08);
          padding: 20px;
          align-self: center;
        }

        .ipoScore strong {
          display: block;
          font-size: 3rem;
          color: #ffd600;
          letter-spacing: -0.08em;
        }

        .ipoScore span {
          color: rgba(255,255,255,0.58);
        }

        .glossaryGrid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 32px;
        }

        .glossaryCard {
          background: linear-gradient(135deg, rgba(255,45,120,0.10), rgba(176,20,255,0.07));
          border: 1px solid rgba(255,45,120,0.16);
          border-radius: 18px;
          padding: 16px;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .glossaryCard:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 34px rgba(255,45,120,0.18);
        }

        .glossaryCard b {
          display: block;
          color: #fff;
          margin-bottom: 7px;
          font-size: 1.05rem;
        }

        .glossaryCard span {
          display: block;
          color: rgba(255,255,255,0.58);
          line-height: 1.45;
          font-size: 0.82rem;
          min-height: 48px;
        }

        .glossaryCard small {
          display: block;
          margin-top: 12px;
          color: #ffd600;
          font-weight: 900;
        }

        .tips {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .tips article {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,45,120,0.15);
          border-radius: 18px;
          padding: 18px;
        }

        .tips h3 {
          margin: 0 0 8px;
        }

        .tips p {
          margin: 0;
          color: rgba(255,255,255,0.58);
          line-height: 1.6;
          font-size: 0.88rem;
        }

        .toast {
          position: fixed;
          bottom: 28px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 50;
          background: linear-gradient(135deg, #1a0030, #0d0014);
          border: 1.5px solid #ff2d78;
          border-radius: 16px;
          padding: 14px 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.50), 0 0 30px rgba(255,45,120,0.35);
          animation: toastIn 0.35s ease;
        }

        @keyframes toastIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        @media (max-width: 1000px) {
          .statsRow {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .inputGrid,
          .missionsGrid,
          .glossaryGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .investorPanel,
          .ipoPanel,
          .tips {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 620px) {
          .wrapper {
            padding: 0 14px;
          }

          .statsRow,
          .inputGrid,
          .missionsGrid,
          .glossaryGrid,
          .agentPanel,
          .agentInputRow {
            grid-template-columns: 1fr;
          }

          .hero {
            padding-top: 30px;
          }

          h1 {
            font-size: 2.25rem;
          }

          .milestones {
            font-size: 0.64rem;
          }

          .barHead {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>
    </main>
  );
}
