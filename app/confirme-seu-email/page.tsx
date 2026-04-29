import Link from "next/link";

export default function ConfirmeSeuEmailPage({
  searchParams,
}: {
  searchParams?: { email?: string };
}) {
  const email = searchParams?.email || "";

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(124,58,237,.32), transparent 34%), radial-gradient(circle at top right, rgba(56,189,248,.24), transparent 32%), #070711",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "28px",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "900px",
          border: "1px solid rgba(255,255,255,.12)",
          borderRadius: "32px",
          background: "rgba(255,255,255,.07)",
          boxShadow: "0 30px 90px rgba(0,0,0,.45)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "44px",
            display: "grid",
            gap: "28px",
          }}
        >
          <div
            style={{
              width: "76px",
              height: "76px",
              borderRadius: "24px",
              background:
                "linear-gradient(135deg, rgba(124,58,237,1), rgba(56,189,248,1))",
              display: "grid",
              placeItems: "center",
              fontSize: "34px",
              boxShadow: "0 20px 55px rgba(124,58,237,.35)",
            }}
          >
            ✉️
          </div>

          <div>
            <p
              style={{
                margin: "0 0 12px",
                color: "#38bdf8",
                fontWeight: 800,
                letterSpacing: ".14em",
                textTransform: "uppercase",
                fontSize: "12px",
              }}
            >
              Cadastro recebido
            </p>

            <h1
              style={{
                margin: 0,
                fontSize: "clamp(34px, 6vw, 64px)",
                lineHeight: ".95",
                letterSpacing: "-.06em",
              }}
            >
              Confirme seu e-mail para liberar seu acesso.
            </h1>

            <p
              style={{
                margin: "20px 0 0",
                maxWidth: "720px",
                color: "rgba(255,255,255,.74)",
                fontSize: "18px",
                lineHeight: 1.7,
              }}
            >
              Enviamos um e-mail de confirmação
              {email ? (
                <>
                  {" "}
                  para <strong style={{ color: "#fff" }}>{email}</strong>
                </>
              ) : null}
              . Clique no botão dentro do e-mail para ativar sua conta e entrar
              na plataforma.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
              gap: "14px",
            }}
          >
            {[
              "Olhe a caixa de entrada.",
              "Confira spam, promoções e lixo eletrônico.",
              "Depois de confirmar, você será levado para a tela de boas-vindas.",
              "Ao entrar no portal, escolha seu plano para liberar os robôs.",
            ].map((item) => (
              <div
                key={item}
                style={{
                  padding: "18px",
                  borderRadius: "20px",
                  background: "rgba(255,255,255,.08)",
                  border: "1px solid rgba(255,255,255,.1)",
                  color: "rgba(255,255,255,.8)",
                  fontSize: "14px",
                  lineHeight: 1.5,
                }}
              >
                {item}
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <Link
              href="/login"
              style={{
                textDecoration: "none",
                color: "#060711",
                background: "#fff",
                padding: "14px 20px",
                borderRadius: "999px",
                fontWeight: 900,
              }}
            >
              Já confirmei, quero entrar
            </Link>

            <a
              href="https://wa.me/5548961361101?text=Oi%2C%20me%20cadastrei%20na%20Sualuma%20mas%20n%C3%A3o%20recebi%20o%20e-mail%20de%20confirma%C3%A7%C3%A3o."
              target="_blank"
              rel="noreferrer"
              style={{
                textDecoration: "none",
                color: "#fff",
                border: "1px solid rgba(255,255,255,.18)",
                background: "rgba(255,255,255,.08)",
                padding: "14px 20px",
                borderRadius: "999px",
                fontWeight: 800,
              }}
            >
              Falar com suporte no WhatsApp
            </a>
          </div>

          <p
            style={{
              margin: 0,
              color: "rgba(255,255,255,.5)",
              fontSize: "13px",
              lineHeight: 1.6,
            }}
          >
            Dica: não feche esta página agora. Salve este link caso precise
            voltar e falar com o suporte.
          </p>
        </div>
      </section>
    </main>
  );
}
