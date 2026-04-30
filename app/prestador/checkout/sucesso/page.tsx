export default function CheckoutPrestadorSucessoPage() {
  return (
    <main style={{
      minHeight: "100vh",
      display: "grid",
      placeItems: "center",
      padding: 24,
      color: "#f8fbff",
      background: "linear-gradient(135deg, #060711, #08101f 55%, #03040a)",
      fontFamily: "Inter, system-ui, sans-serif"
    }}>
      <section style={{
        width: "100%",
        maxWidth: 720,
        border: "1px solid rgba(255,255,255,.12)",
        background: "rgba(10,13,31,.78)",
        borderRadius: 32,
        padding: 32,
        boxShadow: "0 24px 80px rgba(0,0,0,.35)"
      }}>
        <p style={{ color: "#7ff7ff", textTransform: "uppercase", letterSpacing: ".18em", fontWeight: 900 }}>
          Pagamento recebido
        </p>
        <h1 style={{ fontSize: 48, lineHeight: 1, letterSpacing: "-.06em", margin: "0 0 16px" }}>
          Compra realizada com sucesso.
        </h1>
        <p style={{ color: "#b8c0d8", fontSize: 18, lineHeight: 1.6 }}>
          Seu pagamento foi concluído. Agora o sistema pode liberar o plano ou os créditos na sua conta de prestador.
        </p>
        <a href="/provider-services" style={{
          display: "inline-flex",
          marginTop: 18,
          padding: "14px 18px",
          borderRadius: 999,
          color: "#041018",
          background: "linear-gradient(135deg, #7ff7ff, #ff8edf)",
          fontWeight: 900,
          textDecoration: "none"
        }}>
          Ir para minha área
        </a>
      </section>
    </main>
  );
}
