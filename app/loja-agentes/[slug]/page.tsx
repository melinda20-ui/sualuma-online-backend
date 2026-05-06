import Link from "next/link";
import { notFound } from "next/navigation";
import productsData from "@/data/loja-agentes/produtos.json";
import reviewsData from "@/data/loja-agentes/reviews.json";

type Product = {
  id: string;
  slug: string;
  title: string;
  name: string;
  icon: string;
  category: string;
  tags: string[];
  shortDescription: string;
  description: string;
  forWho: string[];
  benefits: string[];
  howToUse: string;
  compatibility: string[];
  price: number | null;
  billing: string;
  badge: string;
  saleMode: string;
  directCheckout: boolean;
  visibility: string;
  adminOnly: boolean;
  rating: number | null;
  reviewCount: number;
  featured: boolean;
  recommended: boolean;
};

type Review = {
  id: string;
  productId: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: string;
  approved: boolean;
};

const products = productsData as Product[];
const reviews = reviewsData as Review[];

function money(value: number | null) {
  if (value == null) return "Sob encomenda";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

export function generateStaticParams() {
  return products.map((product) => ({
    slug: product.slug
  }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = products.find((item) => item.slug === slug);

  if (!product) {
    return {
      title: "Agente não encontrado | Loja Sualuma"
    };
  }

  return {
    title: `${product.title} | Loja Sualuma`,
    description: product.shortDescription
  };
}

export default async function AgentPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = products.find((item) => item.slug === slug);

  if (!product) notFound();

  const productReviews = reviews.filter(
    (review) => review.productId === product.id && review.approved
  );

  const recommendations = products
    .filter(
      (item) =>
        item.id !== product.id &&
        item.visibility === "publico" &&
        (item.category === product.category || item.recommended)
    )
    .slice(0, 3);

  return (
    <main className="agent-page">
      <style>{`
        .agent-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(155,93,229,.22), transparent 32%),
            radial-gradient(circle at top right, rgba(255,45,155,.16), transparent 34%),
            linear-gradient(135deg,#09090f,#10101c 55%,#07070c);
          color: #f4f1ff;
          font-family: Arial, system-ui, sans-serif;
          padding: 28px 18px 80px;
        }
        .wrap { max-width: 1100px; margin: 0 auto; }
        .breadcrumb {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          color: #8f8aa8;
          font-size: 14px;
          margin-bottom: 22px;
        }
        .breadcrumb a { color: #b7b3d6; text-decoration: none; }
        .hero {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 26px;
          align-items: start;
          margin-bottom: 28px;
        }
        .panel {
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 28px;
          background: rgba(255,255,255,.045);
          box-shadow: 0 24px 80px rgba(0,0,0,.36);
          padding: 28px;
        }
        .icon { font-size: 64px; margin-bottom: 14px; display: block; }
        .badge {
          display: inline-flex;
          border: 1px solid rgba(255,255,255,.14);
          background: rgba(255,255,255,.07);
          color: #ffd6f0;
          border-radius: 999px;
          padding: 7px 12px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          margin-bottom: 16px;
        }
        h1 {
          font-size: clamp(32px,5vw,56px);
          line-height: 1;
          margin: 0 0 16px;
          letter-spacing: -.04em;
          background: linear-gradient(135deg,#fff,#c084fc,#ff2d9b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .desc {
          color: #c8c2e8;
          font-size: 18px;
          line-height: 1.65;
          margin: 0 0 18px;
        }
        .tags {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 18px;
        }
        .tag {
          border: 1px solid rgba(255,255,255,.1);
          background: rgba(255,255,255,.05);
          color: #b7b3d6;
          border-radius: 999px;
          padding: 7px 10px;
          font-size: 12px;
        }
        .buy-card {
          position: sticky;
          top: 22px;
        }
        .price {
          font-size: 32px;
          font-weight: 900;
          margin-bottom: 6px;
        }
        .small {
          color: #8f8aa8;
          font-size: 13px;
          margin-bottom: 18px;
        }
        .btn {
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          padding: 14px 16px;
          font-size: 15px;
          font-weight: 900;
          text-decoration: none;
          color: #fff;
          margin-top: 10px;
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
        .ghost {
          border: 1px solid rgba(255,255,255,.12);
          background: rgba(255,255,255,.05);
          color: #d8d4ef;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
          margin-bottom: 22px;
        }
        h2 {
          margin: 0 0 16px;
          font-size: 22px;
        }
        ul {
          margin: 0;
          padding-left: 20px;
          color: #c8c2e8;
          line-height: 1.7;
        }
        .text {
          color: #c8c2e8;
          line-height: 1.7;
          margin: 0;
        }
        .reco {
          display: grid;
          grid-template-columns: repeat(auto-fill,minmax(230px,1fr));
          gap: 14px;
        }
        .mini {
          border: 1px solid rgba(255,255,255,.1);
          background: rgba(255,255,255,.045);
          border-radius: 18px;
          padding: 16px;
          color: #fff;
          text-decoration: none;
        }
        .mini span {
          display: block;
          color: #8f8aa8;
          font-size: 13px;
          margin-top: 6px;
        }
        @media (max-width: 820px) {
          .hero { grid-template-columns: 1fr; }
          .buy-card { position: static; }
          .grid { grid-template-columns: 1fr; }
          .panel { padding: 22px; border-radius: 22px; }
        }
      `}</style>

      <div className="wrap">
        <nav className="breadcrumb">
          <Link href="/loja-agentes">Loja de Agentes</Link>
          <span>›</span>
          <span>{product.category}</span>
          <span>›</span>
          <span>{product.title}</span>
        </nav>

        <section className="hero">
          <div className="panel">
            <span className="icon">{product.icon || "🤖"}</span>
            {product.badge && <span className="badge">{product.badge}</span>}
            <h1>{product.title}</h1>
            <p className="desc">{product.shortDescription}</p>
            <div className="tags">
              {product.tags.map((tag) => (
                <span key={tag} className="tag">#{tag}</span>
              ))}
            </div>
          </div>

          <aside className="panel buy-card">
            <div className="price">{money(product.price)}</div>
            <p className="small">
              {product.adminOnly
                ? "Implantação privada sob encomenda"
                : "Assinatura mensal"}
            </p>

            {product.adminOnly ? (
              <Link
                className="btn order"
                href={`/site-demo-request?tipo=agente-admin&agent=${product.id}`}
              >
                Solicitar implantação
              </Link>
            ) : (
              <Link className="btn buy" href={`/checkout?produto=${product.id}`}>
                Comprar agora
              </Link>
            )}

            <Link className="btn ghost" href="/loja-agentes">
              Voltar para loja
            </Link>
          </aside>
        </section>

        <section className="grid">
          <div className="panel">
            <h2>✨ Benefícios</h2>
            <ul>
              {product.benefits.map((benefit) => (
                <li key={benefit}>{benefit}</li>
              ))}
            </ul>
          </div>

          <div className="panel">
            <h2>👤 Para quem é</h2>
            <ul>
              {product.forWho.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="panel">
            <h2>🚀 Como usar</h2>
            <p className="text">{product.howToUse}</p>
          </div>

          <div className="panel">
            <h2>⚡ Compatibilidade</h2>
            <ul>
              {product.compatibility.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="panel">
          <h2>📄 Sobre este agente</h2>
          <p className="text">{product.description}</p>
        </section>

        <section className="panel" style={{ marginTop: 22 }}>
          <h2>⭐ Avaliações</h2>
          {productReviews.length === 0 ? (
            <p className="text">
              Este agente ainda não tem avaliações aprovadas.
            </p>
          ) : (
            <ul>
              {productReviews.map((review) => (
                <li key={review.id}>
                  <strong>{review.name}</strong> — {review.rating}/5<br />
                  {review.comment}
                </li>
              ))}
            </ul>
          )}
        </section>

        {recommendations.length > 0 && (
          <section className="panel" style={{ marginTop: 22 }}>
            <h2>🔗 Você também pode gostar</h2>
            <div className="reco">
              {recommendations.map((item) => (
                <Link key={item.id} className="mini" href={`/loja-agentes/${item.slug}`}>
                  {item.icon} {item.title}
                  <span>{money(item.price)}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
