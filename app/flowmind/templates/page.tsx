import Link from "next/link";

const templates = [
  {
    icon: "🗺️",
    name: "1 Ano, 12 Semanas",
    category: "Planejamento",
    price: "Incluso no Solo CEO",
    tag: "Principal",
    desc: "Transforma uma meta anual em trimestres, semanas e tarefas diárias.",
    includes: ["Onboarding guiado", "Plano anual", "Semana ideal", "Check-ins"],
  },
  {
    icon: "🧠",
    name: "Organiza Minha Cabeça",
    category: "Mente",
    price: "Grátis",
    tag: "Entrada",
    desc: "Captura pensamentos soltos e transforma bagunça mental em 3 prioridades.",
    includes: ["Dump mental", "Triagem", "Lista do dia", "Modo TDAH-friendly"],
  },
  {
    icon: "💸",
    name: "Saída Financeira",
    category: "Dinheiro",
    price: "R$ 29",
    tag: "Independência",
    desc: "Plano de 90 dias para quem quer começar a criar renda própria.",
    includes: ["Mapa financeiro", "Meta de renda", "Plano de ação", "Checkpoints"],
  },
  {
    icon: "👩‍👧",
    name: "Mãe Empreendedora",
    category: "Rotina",
    price: "R$ 29",
    tag: "Vida real",
    desc: "Organiza blocos de trabalho em uma rotina com filhos, casa e imprevistos.",
    includes: ["Blocos de foco", "Rotina flexível", "Plano 1h/dia", "Agenda leve"],
  },
  {
    icon: "🚀",
    name: "Lançamento em 30 Dias",
    category: "Vendas",
    price: "R$ 39",
    tag: "Rica Turbo",
    desc: "Cronograma reverso para vender uma oferta específica em um mês.",
    includes: ["Checklist diário", "Oferta", "Conteúdo", "Follow-up"],
  },
  {
    icon: "🏠",
    name: "Casa Sem Caos",
    category: "Casa",
    price: "R$ 19",
    tag: "Leveza",
    desc: "Sistema simples para manter a casa funcionando sem tentar fazer tudo.",
    includes: ["Rotina mínima", "Tarefas por energia", "Lista semanal", "Sem culpa"],
  },
  {
    icon: "💬",
    name: "Prospecção Sem Vergonha",
    category: "Vendas",
    price: "R$ 29",
    tag: "Conversas",
    desc: "Mensagens, follow-ups e rotina de venda para quem trava na abordagem.",
    includes: ["Scripts", "CRM simples", "Follow-up", "Métrica semanal"],
  },
  {
    icon: "🌱",
    name: "Recomeço Gentil",
    category: "Mente",
    price: "R$ 19",
    tag: "Calma",
    desc: "Para semanas em que a pessoa sumiu, travou ou perdeu o ritmo.",
    includes: ["Reset de rotina", "Plano de 3 dias", "Autocuidado", "Revisão leve"],
  },
  {
    icon: "📊",
    name: "Bússola Semanal",
    category: "Análise",
    price: "R$ 19",
    tag: "Relatório",
    desc: "Mostra evolução, hábitos, vendas e pontos de ajuste da semana.",
    includes: ["Resumo visual", "Pontuação", "Vitórias", "Próximos ajustes"],
  },
];

const bundles = [
  {
    name: "Kit Começar Leve",
    price: "R$ 49",
    desc: "Organiza Minha Cabeça + Casa Sem Caos + Recomeço Gentil.",
  },
  {
    name: "Kit Vender Sem Travar",
    price: "R$ 69",
    desc: "Prospecção Sem Vergonha + Lançamento em 30 Dias + Bússola Semanal.",
  },
  {
    name: "Kit Solo CEO",
    price: "Incluso no plano",
    desc: "1 Ano, 12 Semanas + Rica + Vera + Agenda semanal.",
  },
];

export default function Page() {
  return (
    <main className="fm-commerce">
      <header className="fm-commerce-hero template-hero">
        <nav className="fm-commerce-nav">
          <Link href="/flowmind">← Voltar ao app</Link>
          <div>
            <Link href="/flowmind/planos">Planos</Link>
            <Link href="/flowmind/agentes">Agentes</Link>
          </div>
        </nav>

        <div className="fm-commerce-kicker">LOJA DE TEMPLATES</div>
        <h1>Templates prontos para organizar vida, casa, mente e dinheiro.</h1>
        <p>
          Cada template vira uma estrutura prática dentro do Flowmatic, com tarefas,
          check-ins, agentes recomendados e acompanhamento.
        </p>

        <div className="fm-commerce-hero-actions">
          <a href="#templates" className="fm-commerce-btn primary">
            Ver templates
          </a>
          <a href="#kits" className="fm-commerce-btn">
            Ver kits
          </a>
        </div>
      </header>

      <section className="fm-store-featured">
        <div>
          <span>MAIS IMPORTANTE</span>
          <h2>Template “1 Ano, 12 Semanas”</h2>
          <p>
            Esse é o coração do Flowmatic: ele pega o sonho de 12 meses e transforma
            em trimestre, semana, dia e check-in.
          </p>
        </div>
        <Link href="/flowmind/planos" className="fm-commerce-btn primary">
          Ver plano que libera
        </Link>
      </section>

      <section className="fm-template-shop" id="templates">
        {templates.map((template) => (
          <article className="fm-template-product" key={template.name}>
            <div className="fm-template-product-top">
              <div className="fm-template-icon">{template.icon}</div>
              <div>
                <span>{template.category}</span>
                <strong>{template.tag}</strong>
              </div>
            </div>

            <h2>{template.name}</h2>
            <p>{template.desc}</p>

            <div className="fm-template-includes">
              {template.includes.map((item) => (
                <small key={item}>✓ {item}</small>
              ))}
            </div>

            <div className="fm-template-bottom">
              <strong>{template.price}</strong>
              <button>Usar template</button>
            </div>
          </article>
        ))}
      </section>

      <section className="fm-commerce-section" id="kits">
        <div className="fm-commerce-section-head">
          <span>KITS</span>
          <h2>Pacotes para vender mais fácil.</h2>
          <p>Em vez de vender só um template, dá para vender combinações por dor.</p>
        </div>

        <div className="fm-bundle-grid">
          {bundles.map((bundle) => (
            <article className="fm-bundle-card" key={bundle.name}>
              <h3>{bundle.name}</h3>
              <p>{bundle.desc}</p>
              <strong>{bundle.price}</strong>
              <button>Ver kit</button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
