import fs from "fs";
import path from "path";
import ComprarButton from "./ComprarButton";

type Product = {
  id: string;
  name: string;
  category: string;
  price_brl: number;
  badge?: string;
  description: string;
  delivery: string;
  access_location: string;
  order_bump?: {
    name: string;
    price_brl: number;
    description: string;
  };
  upsell?: {
    name: string;
    price_brl: number;
    description: string;
  };
  downsell?: {
    name: string;
    price_brl: number;
    description: string;
  };
};

function getStore() {
  const filePath = path.join(process.cwd(), "data", "store-products.json");
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export default function LojaAgentesPage() {
  const store = getStore();
  const products: Product[] = store.products;

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top,#17245f 0,#080a17 45%,#04050b 100%)",
        color: "#eef4ff",
        fontFamily: "Arial, system-ui, sans-serif",
        padding: "34px 18px"
      }}
    >
      <section style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div
          style={{
            border: "1px solid rgba(255,255,255,.14)",
            borderRadius: 28,
            padding: "34px 24px",
            background:
              "linear-gradient(135deg,rgba(88,101,242,.22),rgba(0,212,255,.08))",
            boxShadow: "0 24px 80px rgba(0,0,0,.35)"
          }}
        >
          <p style={{ color: "#8ee8ff", fontWeight: 700, marginBottom: 10 }}>
            Sualuma Marketplace
          </p>

          <h1
            style={{
              fontSize: "clamp(32px,6vw,64px)",
              lineHeight: 1,
              margin: 0
            }}
          >
            Loja de Agentes Sualuma
          </h1>

          <p
            style={{
              maxWidth: 760,
              color: "#c9d6ff",
              fontSize: 18,
              marginTop: 18
            }}
          >
            Compre agentes, pacotes e extras. Depois da compra, tudo aparece
            dentro da Mia em:{" "}
            <strong>chat.sualuma.online → Mia → Meus Agentes</strong>.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
            gap: 18,
            marginTop: 24
          }}
        >
          {products.map((product) => (
            <article
              key={product.id}
              style={{
                border: "1px solid rgba(255,255,255,.14)",
                borderRadius: 24,
                padding: 22,
                background: "rgba(255,255,255,.07)",
                backdropFilter: "blur(16px)",
                boxShadow: "0 18px 48px rgba(0,0,0,.28)"
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  alignItems: "flex-start"
                }}
              >
                <span style={{ color: "#9fb0ff", fontSize: 13 }}>
                  {product.category}
                </span>

                {product.badge && (
                  <span
                    style={{
                      background: "rgba(0,212,255,.16)",
                      border: "1px solid rgba(0,212,255,.35)",
                      color: "#8ee8ff",
                      padding: "6px 10px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 700
                    }}
                  >
                    {product.badge}
                  </span>
                )}
              </div>

              <h2 style={{ fontSize: 23, margin: "16px 0 10px" }}>
                {product.name}
              </h2>

              <p style={{ color: "#cbd6ff", minHeight: 88 }}>
                {product.description}
              </p>

              <div style={{ fontSize: 34, fontWeight: 900, margin: "18px 0" }}>
                R$ {product.price_brl}
              </div>

              <p style={{ color: "#9fe7bd", fontSize: 14, lineHeight: 1.5 }}>
                ✅ {product.delivery}
              </p>

              <p style={{ color: "#f6d98b", fontSize: 14, lineHeight: 1.5 }}>
                📍 {product.access_location}
              </p>

              {product.upsell && (
                <p style={{ color: "#b7c3ff", fontSize: 13, marginTop: 12 }}>
                  Upsell sugerido: {product.upsell.name} — R${" "}
                  {product.upsell.price_brl}
                </p>
              )}

              {product.downsell && (
                <p style={{ color: "#a8b2d8", fontSize: 13, marginTop: 6 }}>
                  Downsell: {product.downsell.name} — R${" "}
                  {product.downsell.price_brl}
                </p>
              )}

              <ComprarButton
                productId={product.id}
                orderBump={product.order_bump}
              />

              <p style={{ color: "#8390c8", fontSize: 12, marginTop: 12 }}>
                Checkout seguro via Stripe. A liberação final será pelo painel
                de agentes da Mia.
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
