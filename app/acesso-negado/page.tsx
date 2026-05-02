import Link from "next/link";

export default function AcessoNegadoPage() {
  return (
    <main style={{
      minHeight: "100vh",
      display: "grid",
      placeItems: "center",
      padding: 24,
      background: "radial-gradient(circle at top left, rgba(124,58,237,.22), transparent 34%), #070814",
      color: "#fff",
      fontFamily: "Inter, system-ui, sans-serif"
    }}>
      <section style={{
        width: "min(680px, 100%)",
        border: "1px solid rgba(255,255,255,.12)",
        borderRadius: 28,
        padding: 28,
        background: "rgba(13,16,36,.82)",
        boxShadow: "0 24px 80px rgba(0,0,0,.28)"
      }}>
        <p style={{
          color: "#38bdf8",
          textTransform: "uppercase",
          letterSpacing: ".18em",
          fontSize: 12,
          fontWeight: 900,
          margin: 0
        }}>
          Acesso restrito
        </p>

        <h1 style={{
          fontSize: "clamp(34px, 6vw, 58px)",
          lineHeight: .95,
          letterSpacing: "-.06em",
          margin: "12px 0"
        }}>
          Você não tem permissão para acessar esta área.
        </h1>

        <p style={{ color: "#a7b0c4", lineHeight: 1.6 }}>
          Essa página é exclusiva para administradores da Sualuma.
          Se você acredita que deveria ter acesso, entre com uma conta administradora.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
          <Link href="/login" style={{
            color: "#fff",
            textDecoration: "none",
            padding: "12px 16px",
            borderRadius: 999,
            background: "linear-gradient(90deg, #7c3aed, #38bdf8)",
            fontWeight: 900
          }}>
            Entrar com conta admin
          </Link>

          <Link href="/" style={{
            color: "#cbd5e1",
            textDecoration: "none",
            padding: "12px 16px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,.14)",
            fontWeight: 800
          }}>
            Voltar ao início
          </Link>
        </div>
      </section>
    </main>
  );
}
