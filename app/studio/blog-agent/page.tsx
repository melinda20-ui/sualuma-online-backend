"use client";

import { useEffect, useMemo, useState } from "react";

type BlogStatus = {
  ok?: boolean;
  agent?: string;
  updatedAt?: string;
  metrics?: {
    total: number;
    published: number;
    drafts: number;
    withImage: number;
    withoutImage: number;
    withSeo: number;
    withoutSeo: number;
    indexed: number;
    indexUnknown: number;
    qualityScore: number;
  };
  posts?: Array<{
    id: string;
    title: string;
    status: string;
    source: string;
    hasImage: boolean;
    hasSeo: boolean;
    indexed: boolean;
  }>;
  recommendations?: string[];
  notes?: string[];
};

const emptyMetrics = {
  total: 0,
  published: 0,
  drafts: 0,
  withImage: 0,
  withoutImage: 0,
  withSeo: 0,
  withoutSeo: 0,
  indexed: 0,
  indexUnknown: 0,
  qualityScore: 0
};

export default function BlogAgentPage() {
  const [status, setStatus] = useState<BlogStatus>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const metrics = status.metrics || emptyMetrics;

  async function refresh() {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/studio/blog-agent", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "refresh" })
      });

      const json = await res.json();
      setStatus(json);
      setMessage("Agente de Blog atualizado e tarefa enviada para o Agente de Tarefas.");
    } catch {
      setMessage("Não consegui atualizar o Agente de Blog agora.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const health = useMemo(() => {
    if (metrics.total === 0) return "Sem posts ainda";
    if (metrics.qualityScore >= 80) return "Saudável";
    if (metrics.qualityScore >= 50) return "Precisa melhorar";
    return "Crítico";
  }, [metrics]);

  const cards = [
    ["Posts totais", metrics.total, "Tudo que o agente encontrou no blog/admin"],
    ["Publicados", metrics.published, "Conteúdos ativos"],
    ["Rascunhos", metrics.drafts, "Conteúdos que ainda precisam publicar"],
    ["Com imagem", metrics.withImage, `${metrics.withoutImage} sem imagem`],
    ["Com SEO", metrics.withSeo, `${metrics.withoutSeo} precisam melhorar SEO`],
    ["Indexados", metrics.indexed, `${metrics.indexUnknown} sem confirmação real`],
    ["Saúde do blog", `${metrics.qualityScore}%`, health]
  ];

  return (
    <main className="blogAgent">
      <section className="hero">
        <div>
          <p className="eyebrow">Studio Sualuma · Agente de Blog</p>
          <h1>Nova agora monitora o blog, SEO e publicações</h1>
          <p>
            Este painel lê os posts existentes, mede publicação, imagem, SEO e
            envia um resumo para o Agente de Tarefas. A indexação real no Google
            será confirmada de verdade quando conectarmos o Search Console.
          </p>
        </div>

        <button onClick={refresh} disabled={loading}>
          {loading ? "Atualizando..." : "Atualizar agora"}
        </button>
      </section>

      {message ? <div className="notice">{message}</div> : null}

      <section className="grid">
        {cards.map(([label, value, detail]) => (
          <article className="card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{detail}</small>
          </article>
        ))}
      </section>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <p className="eyebrow">Próximas ações</p>
            <h2>O que a Nova recomenda fazer</h2>
          </div>
          <a href="/admin/conteudo">Abrir Admin de Conteúdo →</a>
        </div>

        <div className="recommendations">
          {(status.recommendations || []).map((item) => (
            <div className="rec" key={item}>
              <b>•</b>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <p className="eyebrow">Posts encontrados</p>
            <h2>Últimos conteúdos analisados</h2>
          </div>
          <span>{status.updatedAt ? new Date(status.updatedAt).toLocaleString("pt-BR") : ""}</span>
        </div>

        <div className="table">
          <div className="row head">
            <span>Título</span>
            <span>Status</span>
            <span>Imagem</span>
            <span>SEO</span>
            <span>Google</span>
          </div>

          {(status.posts || []).length === 0 ? (
            <div className="empty">Nenhum post encontrado ainda.</div>
          ) : null}

          {(status.posts || []).map((post) => (
            <div className="row" key={post.id}>
              <span>{post.title}</span>
              <span>{post.status || "sem status"}</span>
              <span>{post.hasImage ? "sim" : "não"}</span>
              <span>{post.hasSeo ? "sim" : "não"}</span>
              <span>{post.indexed ? "marcado" : "não verificado"}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel soft">
        <h2>Leitura leiga</h2>
        <p>
          Publicado significa que o conteúdo está ativo. Imagem ajuda a passar
          confiança e melhorar compartilhamento. SEO é o conjunto de título,
          descrição e estrutura para o Google entender o post. Indexado significa
          que o Google reconheceu aquela página; para saber isso com certeza,
          precisamos conectar o Google Search Console.
        </p>
      </section>

      <style jsx>{`
        .blogAgent {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(236, 72, 153, 0.22), transparent 32%),
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.2), transparent 30%),
            #020617;
          color: #e5e7eb;
          padding: 48px 22px 80px;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .hero,
        .panel,
        .notice {
          max-width: 1180px;
          margin: 0 auto;
        }

        .hero {
          display: flex;
          justify-content: space-between;
          gap: 24px;
          align-items: center;
          padding: 28px;
          border: 1px solid rgba(148, 163, 184, 0.22);
          border-radius: 30px;
          background: rgba(15, 23, 42, 0.86);
          box-shadow: 0 30px 90px rgba(0, 0, 0, 0.35);
        }

        .eyebrow {
          margin: 0 0 10px;
          color: #f9a8d4;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          font-size: 11px;
          font-weight: 900;
        }

        h1 {
          margin: 0;
          max-width: 760px;
          font-size: clamp(32px, 5vw, 58px);
          line-height: 0.95;
          letter-spacing: -0.05em;
        }

        h2 {
          margin: 0;
          font-size: 22px;
        }

        p {
          color: #94a3b8;
          line-height: 1.7;
          max-width: 760px;
        }

        button,
        a {
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 999px;
          padding: 13px 18px;
          color: white;
          background: linear-gradient(135deg, #ec4899, #8b5cf6);
          text-decoration: none;
          font-weight: 900;
          cursor: pointer;
          white-space: nowrap;
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .notice {
          margin-top: 16px;
          padding: 14px 18px;
          border-radius: 18px;
          background: rgba(34, 197, 94, 0.12);
          border: 1px solid rgba(34, 197, 94, 0.24);
          color: #bbf7d0;
        }

        .grid {
          max-width: 1180px;
          margin: 22px auto;
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 12px;
        }

        .card {
          padding: 18px;
          border-radius: 22px;
          background: rgba(15, 23, 42, 0.82);
          border: 1px solid rgba(148, 163, 184, 0.18);
        }

        .card span,
        .card small {
          display: block;
          color: #94a3b8;
          font-size: 12px;
        }

        .card strong {
          display: block;
          margin: 8px 0;
          color: #fff;
          font-size: 28px;
          letter-spacing: -0.04em;
        }

        .panel {
          margin-top: 22px;
          padding: 24px;
          border-radius: 26px;
          background: rgba(15, 23, 42, 0.82);
          border: 1px solid rgba(148, 163, 184, 0.18);
        }

        .soft {
          background: rgba(236, 72, 153, 0.08);
        }

        .panelHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
        }

        .panelHeader a {
          background: rgba(255, 255, 255, 0.06);
        }

        .recommendations {
          display: grid;
          gap: 10px;
        }

        .rec {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          padding: 14px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.04);
          color: #cbd5e1;
        }

        .rec b {
          color: #f472b6;
        }

        .table {
          overflow: auto;
          border-radius: 18px;
          border: 1px solid rgba(148, 163, 184, 0.14);
        }

        .row {
          display: grid;
          grid-template-columns: 2.2fr 0.8fr 0.6fr 0.6fr 0.8fr;
          gap: 12px;
          padding: 13px 14px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.12);
          min-width: 760px;
          color: #cbd5e1;
        }

        .row.head {
          color: #f9a8d4;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-weight: 900;
          background: rgba(255, 255, 255, 0.04);
        }

        .empty {
          padding: 18px;
          color: #94a3b8;
        }

        @media (max-width: 900px) {
          .hero,
          .panelHeader {
            flex-direction: column;
            align-items: flex-start;
          }

          .grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>
    </main>
  );
}
