import Link from "next/link";
import FlowmaticCheckoutButton from "../components/FlowmaticCheckoutButton";

const plans = [
  {
    slug: "comecar",
    name: "Começar",
    price: "R$ 0",
    period: "/mês",
    desc: "Para testar o Flowmatic e organizar o básico do dia.",
    badge: "Entrada",
    featured: false,
    cta: "Começar grátis",
    features: [
      "Painel Hoje",
      "3 tarefas essenciais por dia",
      "Template Organiza Minha Cabeça",
      "Acesso limitado à Dona",
      "Histórico simples de hábitos",
    ],
  },
  {
    slug: "rotina-pro",
    name: "Rotina Pro",
    price: "R$ 29",
    period: "/mês",
    desc: "Para quem quer separar casa, mente e trabalho sem se perder.",
    badge: "Mais leve",
    featured: false,
    cta: "Escolher Rotina Pro",
    features: [
      "Tudo do plano Começar",
      "Agente Dona completo",
      "Agente Calma",
      "Templates de casa e rotina",
      "Check-in diário e noturno",
      "Relatório semanal simples",
    ],
  },
  {
    slug: "solo-ceo",
    name: "Solo CEO",
    price: "R$ 59",
    period: "/mês",
    desc: "Para solopreneurs que querem organizar a vida e vender mais.",
    badge: "Recomendado",
    featured: true,
    cta: "Escolher Solo CEO",
    features: [
      "Tudo do Rotina Pro",
      "Agente Vera para plano anual",
      "Agente Rica para vendas",
      "Template 1 Ano, 12 Semanas",
      "Template Lançamento em 30 dias",
      "Agenda semanal inteligente",
      "Financeiro simples do negócio",
    ],
  },
  {
    slug: "imperio-solo",
    name: "Império Solo",
    price: "R$ 97",
    period: "/mês",
    desc: "Para quem quer transformar rotina, vendas e metas em sistema.",
    badge: "Completo",
    featured: false,
    cta: "Escolher Império Solo",
    features: [
      "Tudo do Solo CEO",
      "Agente Bússola completo",
      "Todos os templates liberados",
      "Loja com descontos em novos templates",
      "Modo lançamento com Rica Turbo",
      "Relatórios visuais avançados",
      "Área de metas de 12 meses",
    ],
  },
];

const comparisons = [
  ["Painel Hoje", "✓", "✓", "✓", "✓"],
  ["Dona — Gerente do Dia", "Limitado", "✓", "✓", "✓"],
  ["Vera — Estrategista", "—", "—", "✓", "✓"],
  ["Rica — Vendas", "—", "—", "✓", "✓"],
  ["Calma — Produtividade leve", "—", "✓", "✓", "✓"],
  ["Bússola — Relatório semanal", "—", "Simples", "✓", "Avançado"],
  ["Templates inclusos", "1", "3", "5", "Todos"],
];

export default function Page() {
  return (
    <main className="fm-commerce">
      <header className="fm-commerce-hero">
        <nav className="fm-commerce-nav">
          <Link href="/flowmind">← Voltar ao app</Link>
          <div>
            <Link href="/flowmind/templates">Loja de templates</Link>
            <Link href="/flowmind/agentes">Agentes</Link>
          </div>
        </nav>

        <div className="fm-commerce-kicker">FLOWMATIC PLANOS</div>
        <h1>Escolha o nível de organização que sua vida precisa agora.</h1>
        <p>
          Planos pensados para quem trabalha sozinha, cuida da casa, precisa vender
          e não quer viver refém da própria cabeça.
        </p>

        <div className="fm-commerce-hero-actions">
          <a href="#planos" className="fm-commerce-btn primary">
            Ver planos
          </a>
          <Link href="/flowmind/templates" className="fm-commerce-btn">
            Ver templates
          </Link>
        </div>
      </header>

      <section className="fm-plan-grid" id="planos">
        {plans.map((plan) => (
          <article
            className={plan.featured ? "fm-plan-card featured" : "fm-plan-card"}
            key={plan.name}
          >
            <div className="fm-plan-badge">{plan.badge}</div>
            <h2>{plan.name}</h2>
            <p>{plan.desc}</p>

            <div className="fm-plan-price">
              <strong>{plan.price}</strong>
              <span>{plan.period}</span>
            </div>

            <FlowmaticCheckoutButton kind="plan" slug={plan.slug}>
              {plan.cta}
            </FlowmaticCheckoutButton>

            <ul>
              {plan.features.map((feature) => (
                <li key={feature}>✓ {feature}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="fm-commerce-section">
        <div className="fm-commerce-section-head">
          <span>COMPARATIVO</span>
          <h2>O que muda entre os planos?</h2>
          <p>Uma visão simples para a pessoa escolher sem confusão.</p>
        </div>

        <div className="fm-compare-table">
          <div className="fm-compare-row head">
            <span>Recurso</span>
            <span>Começar</span>
            <span>Rotina Pro</span>
            <span>Solo CEO</span>
            <span>Império Solo</span>
          </div>

          {comparisons.map((row) => (
            <div className="fm-compare-row" key={row[0]}>
              {row.map((cell) => (
                <span key={cell}>{cell}</span>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="fm-commerce-final">
        <h2>O plano recomendado para o MVP é o Solo CEO.</h2>
        <p>
          Ele junta o coração do produto: plano de 12 semanas, rotina diária,
          vendas e relatórios. É o melhor para validar valor e conversão.
        </p>
        <Link href="/flowmind/templates" className="fm-commerce-btn primary">
          Abrir loja de templates
        </Link>
      </section>
    </main>
  );
}
