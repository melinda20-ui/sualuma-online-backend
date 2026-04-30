"use client";

import { useEffect, useMemo, useState } from "react";

type CatalogPage = {
  route: string;
  title: string;
  area: string;
  source: string;
  url: string;
  file: string;
  updatedAtFormatted: string;
  status: string;
};

type CatalogData = {
  ok: boolean;
  today: string;
  summary: {
    totalPages: number;
    totalHoje: number;
    nextPages: number;
    staticSites: number;
  };
  ultimasHoje: CatalogPage[];
  pages: CatalogPage[];
};

export default function CatalogoPaginasStudioPage() {
  const [data, setData] = useState<CatalogData | null>(null);
  const [busca, setBusca] = useState("");
  const [area, setArea] = useState("Todas");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarCatalogo() {
    try {
      setLoading(true);
      setErro("");

      const res = await fetch("/api/studio/catalogo-paginas", {
        cache: "no-store",
      });

      const json = await res.json();

      if (!json.ok) {
        throw new Error(json.error || "Erro ao carregar catálogo.");
      }

      setData(json);
    } catch (error: any) {
      setErro(error?.message || "Erro ao carregar catálogo.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarCatalogo();
  }, []);

  const areas = useMemo(() => {
    const lista = new Set<string>();
    data?.pages?.forEach((page) => lista.add(page.area));
    return ["Todas", ...Array.from(lista).sort()];
  }, [data]);

  const paginasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return (data?.pages || []).filter((page) => {
      const bateArea = area === "Todas" || page.area === area;

      const texto = [
        page.route,
        page.title,
        page.area,
        page.source,
        page.url,
        page.file,
        page.status,
      ]
        .join(" ")
        .toLowerCase();

      return bateArea && (!termo || texto.includes(termo));
    });
  }, [data, busca, area]);

  return (
    <main className="catalogPage">
      <section className="hero">
        <div>
          <p className="eyebrow">Studio Sualuma • Catálogo</p>
          <h1>Catálogo de páginas e subdomínios</h1>
          <p className="lead">
            Aqui você vê as páginas criadas no projeto e os sites estáticos da VPS,
            sem precisar ficar caçando links no terminal.
          </p>
        </div>

        <button className="refresh" onClick={carregarCatalogo} disabled={loading}>
          {loading ? "Atualizando..." : "Atualizar catálogo"}
        </button>
      </section>

      {erro && <div className="error">{erro}</div>}

      <section className="metrics">
        <div>
          <span>Total de páginas</span>
          <strong>{data?.summary?.totalPages || 0}</strong>
        </div>
        <div>
          <span>Criadas/alteradas hoje</span>
          <strong>{data?.summary?.totalHoje || 0}</strong>
        </div>
        <div>
          <span>Páginas Next</span>
          <strong>{data?.summary?.nextPages || 0}</strong>
        </div>
        <div>
          <span>Sites estáticos VPS</span>
          <strong>{data?.summary?.staticSites || 0}</strong>
        </div>
      </section>

      <section className="panel">
        <div className="panelTitle">
          <div>
            <p>Hoje • {data?.today || "--"}</p>
            <h2>Últimas páginas atualizadas hoje</h2>
          </div>
        </div>

        <div className="miniList">
          {(data?.ultimasHoje || []).length === 0 ? (
            <div className="empty">Nenhuma página criada ou atualizada hoje.</div>
          ) : (
            data?.ultimasHoje?.map((page) => (
              <a className="miniItem" href={page.url} target="_blank" key={`${page.file}-${page.updatedAtFormatted}`}>
                <div>
                  <strong>{page.title}</strong>
                  <small>{page.route}</small>
                </div>
                <span>{page.area}</span>
              </a>
            ))
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panelTitle">
          <div>
            <p>Busca geral</p>
            <h2>Pesquisar páginas do sistema inteiro</h2>
          </div>
        </div>

        <div className="filters">
          <input
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Pesquise por nome, rota, subdomínio, arquivo ou status..."
          />

          <select value={area} onChange={(event) => setArea(event.target.value)}>
            {areas.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="resultCount">
          Mostrando {paginasFiltradas.length} de {data?.pages?.length || 0} páginas
        </div>

        <div className="catalogList">
          {loading ? (
            <div className="empty">Carregando catálogo...</div>
          ) : (
            paginasFiltradas.map((page) => (
              <article className="pageCard" key={`${page.file}-${page.url}`}>
                <div className="cardTop">
                  <div>
                    <p className="area">{page.area}</p>
                    <h3>{page.title}</h3>
                    <small>{page.route}</small>
                  </div>

                  <span className="status">{page.status}</span>
                </div>

                <div className="info">
                  <span>Fonte: {page.source}</span>
                  <span>Atualizada: {page.updatedAtFormatted}</span>
                  <span>Arquivo: {page.file}</span>
                </div>

                <div className="actions">
                  <a href={page.url} target="_blank">Abrir página</a>
                  <button onClick={() => navigator.clipboard.writeText(page.url)}>
                    Copiar link
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <style>{`
        .catalogPage {
          min-height: 100vh;
          padding: 42px 20px 80px;
          color: #f8fbff;
          background:
            radial-gradient(circle at 10% 0%, rgba(124,58,237,.34), transparent 28%),
            radial-gradient(circle at 90% 0%, rgba(6,182,212,.22), transparent 28%),
            linear-gradient(135deg, #050711, #08101f 55%, #03040a);
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .hero, .metrics, .panel {
          max-width: 1180px;
          margin-left: auto;
          margin-right: auto;
        }

        .hero {
          display: flex;
          justify-content: space-between;
          gap: 18px;
          align-items: flex-start;
          margin-bottom: 22px;
        }

        .eyebrow, .panelTitle p, .area {
          margin: 0 0 8px;
          text-transform: uppercase;
          letter-spacing: .18em;
          font-size: 11px;
          color: #7ff7ff;
          font-weight: 900;
        }

        h1 {
          margin: 0;
          max-width: 780px;
          font-size: clamp(38px, 6vw, 72px);
          line-height: .95;
          letter-spacing: -.06em;
        }

        .lead {
          max-width: 720px;
          color: #b8c0d8;
          font-size: 18px;
          line-height: 1.6;
        }

        .refresh, .actions a, .actions button {
          border: 0;
          border-radius: 999px;
          padding: 13px 18px;
          font-weight: 900;
          color: #07111f;
          background: linear-gradient(135deg, #7ff7ff, #ff8edf);
          cursor: pointer;
          text-decoration: none;
          white-space: nowrap;
        }

        .metrics {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 18px;
        }

        .metrics div, .panel, .pageCard {
          border: 1px solid rgba(255,255,255,.12);
          background: rgba(10, 13, 31, .74);
          box-shadow: 0 24px 80px rgba(0,0,0,.28);
          border-radius: 28px;
        }

        .metrics div {
          padding: 20px;
        }

        .metrics span {
          display: block;
          color: #aeb8d4;
          font-size: 13px;
          font-weight: 800;
        }

        .metrics strong {
          display: block;
          margin-top: 8px;
          font-size: 34px;
        }

        .panel {
          padding: 24px;
          margin-bottom: 18px;
        }

        .panelTitle {
          display: flex;
          justify-content: space-between;
          gap: 18px;
          align-items: center;
          margin-bottom: 18px;
        }

        .panelTitle h2 {
          margin: 0;
          font-size: clamp(26px, 4vw, 42px);
          letter-spacing: -.04em;
        }

        .miniList {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
        }

        .miniItem {
          display: block;
          color: inherit;
          text-decoration: none;
          border: 1px solid rgba(255,255,255,.1);
          background: rgba(255,255,255,.06);
          border-radius: 22px;
          padding: 16px;
        }

        .miniItem strong {
          display: block;
          margin-bottom: 5px;
        }

        small {
          color: #aeb8d4;
          word-break: break-word;
        }

        .miniItem span {
          display: inline-flex;
          margin-top: 12px;
          padding: 7px 10px;
          border-radius: 999px;
          background: rgba(127,247,255,.12);
          color: #7ff7ff;
          font-size: 12px;
          font-weight: 900;
        }

        .filters {
          display: grid;
          grid-template-columns: 1fr 240px;
          gap: 12px;
          margin-bottom: 12px;
        }

        input, select {
          width: 100%;
          border: 1px solid rgba(255,255,255,.14);
          background: rgba(255,255,255,.08);
          color: #fff;
          border-radius: 18px;
          padding: 15px 16px;
          outline: none;
        }

        select option {
          color: #111827;
        }

        .resultCount {
          color: #aeb8d4;
          font-weight: 800;
          margin-bottom: 14px;
        }

        .catalogList {
          display: grid;
          gap: 12px;
        }

        .pageCard {
          padding: 18px;
        }

        .cardTop {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: flex-start;
        }

        .pageCard h3 {
          margin: 0 0 5px;
          font-size: 24px;
        }

        .status {
          border: 1px solid rgba(127,247,255,.22);
          color: #7ff7ff;
          border-radius: 999px;
          padding: 8px 10px;
          font-size: 12px;
          font-weight: 900;
          white-space: nowrap;
        }

        .info {
          display: grid;
          gap: 6px;
          margin: 16px 0;
          color: #aeb8d4;
          font-size: 13px;
          word-break: break-word;
        }

        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .actions button {
          background: rgba(255,255,255,.1);
          color: #fff;
          border: 1px solid rgba(255,255,255,.14);
        }

        .empty, .error {
          padding: 18px;
          border-radius: 20px;
          background: rgba(255,255,255,.07);
          color: #dce7ff;
        }

        .error {
          max-width: 1180px;
          margin: 0 auto 18px;
          border: 1px solid rgba(255,100,100,.25);
          color: #fecaca;
        }

        @media (max-width: 900px) {
          .catalogPage { padding: 26px 14px 70px; }
          .hero { flex-direction: column; }
          .metrics, .miniList, .filters { grid-template-columns: 1fr; }
          .panel { padding: 18px; border-radius: 24px; }
          .cardTop { flex-direction: column; }
        }
      `}</style>
    </main>
  );
}
