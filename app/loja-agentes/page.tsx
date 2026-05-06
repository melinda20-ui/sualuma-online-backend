import Link from "next/link";
import productsData from "@/data/loja-agentes/produtos.json";

type Product = {
  id: string;
  slug: string;
  title: string;
  icon: string;
  category: string;
  tags: string[];
  shortDescription: string;
  price: number | null;
  badge: string;
  directCheckout: boolean;
  visibility: string;
  adminOnly: boolean;
  featured: boolean;
  recommended: boolean;
};

const products = productsData as Product[];

function money(value: number | null) {
  if (value == null) return "Sob encomenda";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

export default function LojaAgentesPage() {
  const publicProducts = products.filter((p) => p.visibility === "publico");

  return (
    <main className="loja-page">
      <style>{`
        .loja-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(155,93,229,.22), transparent 32%),
            radial-gradient(circle at top right, rgba(255,45,155,.16), transparent 34%),
            linear-gradient(135deg,#09090f,#10101c 55%,#07070c);
          color: #f4f1ff;
          font-family: Arial, system-ui, sans-serif;
          padding: 34px 18px 80px;
        }
        .wrap { max-width: 1180px; margin: 0 auto; }
        .hero {
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 30px;
          padding: 42px 26px;
          background: linear-gradient(135deg,rgba(155,93,229,.18),rgba(255,45,155,.08));
          box-shadow: 0 24px 80px rgba(0,0,0,.42);
          margin-bottom: 28px;
        }
        .eyebrow {
          display: inline-flex;
          border: 1px solid rgba(155,93,229,.45);
          background: rgba(155,93,229,.14);
          color: #c7a6ff;
          border-radius: 999px;
          padding: 7px 14px;
          font-weight: 800;
          font-size: 12px;
          letter-spacing: .08em;
          text-transform: uppercase;
          margin-bottom: 18px;
        }
        h1 {
          font-size: clamp(34px,6vw,64px);
          line-height: 1;
          margin: 0 0 18px;
          letter-spacing: -.04em;
          background: linear-gradient(135deg,#fff,#c084fc,#ff2d9b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .sub {
          max-width: 760px;
          color: #b7b3d6;
          font-size: 18px;
          line-height: 1.65;
          margin: 0 0 24px;
        }
        .trust {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .trust span {
          border: 1px solid rgba(255,255,255,.1);
          background: rgba(255,255,255,.05);
          border-radius: 999px;
          padding: 9px 13px;
          color: #d8d4ef;
          font-size: 13px;
        }
        .section-head {
          display: flex;
          justify-content: space-between;
          align-items: end;
          gap: 18px;
          margin: 36px 0 18px;
        }
        h2 { margin: 0; font-size: 26px; }
        .count { color: #8f8aa8; font-size: 14px; }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill,minmax(270px,1fr));
          gap: 18px;
        }
        .card {
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 22px;
          padding: 22px;
          background: rgba(255,255,255,.045);
          box-shadow: 0 18px 50px rgba(0,0,0,.28);
          display: flex;
          flex-direction: column;
          min-height: 310px;
          position: relative;
          overflow: hidden;
        }
        .card:before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg,rgba(155,93,229,.08),transparent 55%);
          pointer-events: none;
        }
        .card > * { position: relative; z-index: 1; }
        .top {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: flex-start;
          margin-bottom: 16px;
        }
        .icon { font-size: 42px; filter: drop-shadow(0 0 14px rgba(155,93,229,.45)); }
        .badge {
          border: 1px solid rgba(255,255,255,.14);
          background: rgba(255,255,255,.07);
          color: #ffd6f0;
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
        }
        .cat {
          color: #8f8aa8;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: .08em;
          font-weight: 800;
          margin-bottom: 8px;
        }
        .title {
          color: #fff;
          font-size: 19px;
          line-height: 1.22;
          margin: 0 0 10px;
        }
        .desc {
          color: #b7b3d6;
          font-size: 14px;
          line-height: 1.55;
          margin: 0 0 18px;
          flex: 1;
        }
        .footer {
          border-top: 1px solid rgba(255,255,255,.08);
          padding-top: 16px;
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
        }
        .price strong {
          display: block;
          font-size: 18px;
          color: #fff;
        }
        .price small { color: #8f8aa8; font-size: 12px; }
        .actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 11px;
          padding: 10px 13px;
          font-size: 13px;
          font-weight: 800;
          text-decoration: none;
          color: #fff;
        }
        .details {
          border: 1px solid rgba(255,255,255,.12);
          background: rgba(255,255,255,.06);
        }
        .buy {
          background: linear-gradient(135deg,#9b5de5,#ff2d9b);
          box-shadow: 0 10px 26px rgba(155,93,229,.35);
        }
        .order {
          border: 1px solid rgba(255,214,0,.35);
          color: #ffd600;
          background: rgba(255,214,0,.09);
        }
        @media (max-width: 640px) {
          .loja-page { padding: 22px 14px 60px; }
          .hero { padding: 30px 20px; border-radius: 24px; }
          .footer { align-items: flex-start; flex-direction: column; }
          .actions { width: 100%; }
          .btn { flex: 1; }
        }
      `}</style>

      <div className="wrap">
        <section className="hero">
          <span className="eyebrow">Loja de Agentes Sualuma</span>
          <h1>Agentes de IA para o seu negócio crescer</h1>
          <p className="sub">
            Escolha agentes para diagnosticar, vender, organizar e automatizar seu negócio.
            Os agentes ficam disponíveis no Painel de Agentes dentro da Mia.
          </p>
          <div className="trust">
            <span>🤖 Acesso pela Mia</span>
            <span>🔒 Compra segura</span>
            <span>⚡ Implantação guiada</span>
            <span>📱 Funciona no celular</span>
          </div>
        </section>

        <div className="section-head">
          <div>
            <h2>Agentes disponíveis</h2>
            <p className="count">{publicProducts.length} agentes encontrados</p>
          </div>
        </div>

        <section className="grid">
          {publicProducts.map((product) => (
            <article key={product.id} className="card">
              <div className="top">
                <span className="icon">{product.icon || "🤖"}</span>
                {product.badge && <span className="badge">{product.badge}</span>}
              </div>

              <div className="cat">{product.category}</div>
              <h3 className="title">{product.title}</h3>
              <p className="desc">{product.shortDescription}</p>

              <div className="footer">
                <div className="price">
                  <strong>{money(product.price)}</strong>
                  <small>{product.adminOnly ? "implantação privada" : "por mês"}</small>
                </div>

                <div className="actions">
                  <Link className="btn details" href={`/loja-agentes/${product.slug}`}>
                    Detalhes
                  </Link>

                  {product.adminOnly ? (
                    <Link
                      className="btn order"
                      href={`/site-demo-request?tipo=agente-admin&agent=${product.id}`}
                    >
                      Solicitar
                    </Link>
                  ) : (
                    <Link className="btn buy" href={`/checkout?produto=${product.id}`}>
                      Comprar
                    </Link>
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
