export default function LojaAgentesSucessoPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top,#17245f 0,#080a17 45%,#04050b 100%)",
        color: "#eef4ff",
        fontFamily: "Arial, system-ui, sans-serif",
        padding: "42px 18px",
        display: "grid",
        placeItems: "center"
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 760,
          border: "1px solid rgba(255,255,255,.14)",
          borderRadius: 28,
          padding: "34px 24px",
          background: "rgba(255,255,255,.08)",
          boxShadow: "0 24px 80px rgba(0,0,0,.35)"
        }}
      >
        <p style={{ color: "#9fe7bd", fontWeight: 800 }}>
          Compra recebida ✅
        </p>

        <h1 style={{ fontSize: "clamp(30px,6vw,54px)", margin: "8px 0" }}>
          Seu agente vai aparecer na Mia
        </h1>

        <p style={{ color: "#cbd6ff", fontSize: 18, lineHeight: 1.6 }}>
          Após a confirmação do pagamento, acesse:
        </p>

        <div
          style={{
            margin: "20px 0",
            padding: 18,
            borderRadius: 20,
            background: "rgba(0,212,255,.10)",
            border: "1px solid rgba(0,212,255,.28)"
          }}
        >
          <strong>chat.sualuma.online → Mia → Meus Agentes</strong>
        </div>

        <p style={{ color: "#cbd6ff", lineHeight: 1.6 }}>
          Você também receberá um e-mail com o resumo da compra, instruções de
          acesso e próximos passos para usar o agente comprado.
        </p>

        <a
          href="https://chat.sualuma.online"
          style={{
            display: "inline-block",
            marginTop: 22,
            borderRadius: 16,
            padding: "14px 18px",
            background: "linear-gradient(135deg,#00d4ff,#7c5cff)",
            color: "white",
            textDecoration: "none",
            fontWeight: 900
          }}
        >
          Abrir Mia
        </a>
      </section>
    </main>
  );
}
