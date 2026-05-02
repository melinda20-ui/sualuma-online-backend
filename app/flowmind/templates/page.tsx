import Link from "next/link";
import { getAllTemplates } from "../lib/templates";

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
  const templates = getAllTemplates();

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
          Cada template agora tem página própria, conteúdo em Markdown e botão para
          registrar uso dentro do Flowmatic.
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
        <Link
          href="/flowmind/templates/1-ano-12-semanas"
          className="fm-commerce-btn primary"
        >
          Abrir template
        </Link>
      </section>

      <section className="fm-template-shop" id="templates">
        {templates.map((template) => (
          <article className="fm-template-product" key={template.slug}>
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
              <Link href={`/flowmind/templates/${template.slug}`}>
                Ver template
              </Link>
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
