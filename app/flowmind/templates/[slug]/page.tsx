import Link from "next/link";
import { notFound } from "next/navigation";
import TemplateUseButton from "../../components/TemplateUseButton";
import {
  getAllTemplates,
  getTemplateBySlug,
  getTemplateMarkdown,
} from "../../lib/templates";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function inlineMarkdown(value: string) {
  return escapeHtml(value)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.*?)`/g, "<code>$1</code>");
}

function markdownToHtml(markdown: string) {
  const lines = markdown.split("\n");
  const html: string[] = [];
  let inList = false;

  function closeList() {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      closeList();
      continue;
    }

    if (line.startsWith("### ")) {
      closeList();
      html.push(`<h3>${inlineMarkdown(line.slice(4))}</h3>`);
      continue;
    }

    if (line.startsWith("## ")) {
      closeList();
      html.push(`<h2>${inlineMarkdown(line.slice(3))}</h2>`);
      continue;
    }

    if (line.startsWith("# ")) {
      closeList();
      html.push(`<h1>${inlineMarkdown(line.slice(2))}</h1>`);
      continue;
    }

    if (line.startsWith("- ")) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }

      html.push(`<li>${inlineMarkdown(line.slice(2))}</li>`);
      continue;
    }

    closeList();
    html.push(`<p>${inlineMarkdown(line)}</p>`);
  }

  closeList();

  return html.join("\n");
}

export function generateStaticParams() {
  return getAllTemplates().map((template) => ({
    slug: template.slug,
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const template = getTemplateBySlug(slug);

  if (!template) {
    return {
      title: "Template não encontrado | Flowmatic",
    };
  }

  return {
    title: `${template.name} | Flowmatic Templates`,
    description: template.desc,
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const template = getTemplateBySlug(slug);

  if (!template) {
    notFound();
  }

  const markdown = getTemplateMarkdown(template.slug);
  const html = markdownToHtml(markdown);

  return (
    <main className="fm-commerce">
      <header className="fm-template-detail-hero">
        <nav className="fm-commerce-nav dark-links">
          <Link href="/flowmind/templates">← Voltar para loja</Link>
          <div>
            <Link href="/flowmind/planos">Planos</Link>
            <Link href="/flowmind">App</Link>
          </div>
        </nav>

        <div className="fm-template-detail-grid">
          <section>
            <div className="fm-template-detail-icon">{template.icon}</div>
            <div className="fm-commerce-kicker">{template.category}</div>
            <h1>{template.name}</h1>
            <p>{template.desc}</p>
          </section>

          <aside className="fm-template-detail-card">
            <span>{template.tag}</span>
            <strong>{template.price}</strong>

            <div className="fm-template-meta-list">
              <div>
                <small>Agente recomendado</small>
                <b>{template.agent}</b>
              </div>
              <div>
                <small>Nível</small>
                <b>{template.difficulty}</b>
              </div>
              <div>
                <small>Tempo para começar</small>
                <b>{template.timeToStart}</b>
              </div>
            </div>

            <TemplateUseButton slug={template.slug} name={template.name} price={template.price} />
          </aside>
        </div>
      </header>

      <section className="fm-template-detail-content">
        <article
          className="fm-markdown"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        <aside className="fm-template-side-card">
          <h2>O que esse template cria</h2>
          <ul>
            {template.includes.map((item) => (
              <li key={item}>✓ {item}</li>
            ))}
          </ul>

          <Link href="/flowmind/templates" className="fm-commerce-btn full">
            Ver outros templates
          </Link>
        </aside>
      </section>
    </main>
  );
}
