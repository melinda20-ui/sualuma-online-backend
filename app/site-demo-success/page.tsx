'use client'

export default function Page() {
  return (
    <main style={styles.page}>
      <div style={styles.container}>
        
        {/* 🎁 ANIMAÇÃO / DESTAQUE */}
        <div style={styles.giftBox}>
          🎁
        </div>

        {/* TÍTULO */}
        <h1 style={styles.title}>
          Seu presente está pronto!
        </h1>

        {/* SUBTEXTO */}
        <p style={styles.subtitle}>
          Liberamos seus 3 modelos exclusivos de site.
        </p>

        {/* BOTÃO PRINCIPAL */}
        <a
          href="https://sualuma.online/blog"
          style={styles.button}
        >
          Ver meus modelos agora 🚀
        </a>

        {/* INFO EXTRA */}
        <p style={styles.small}>
          ⚡ Enviado também no seu e-mail
        </p>

      </div>
    </main>
  )
}

const styles: Record<string, any> = {
  page: {
    minHeight: '100vh',
    background: '#050507',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontFamily: 'Inter, sans-serif'
  },

  container: {
    textAlign: 'center',
    padding: 30,
    maxWidth: 500
  },

  giftBox: {
    fontSize: 60,
    marginBottom: 20,
    animation: 'pulse 1.5s infinite'
  },

  title: {
    fontSize: 32,
    fontWeight: 800,
    marginBottom: 10
  },

  subtitle: {
    color: '#aaa',
    marginBottom: 25
  },

  button: {
    display: 'inline-block',
    padding: '16px 28px',
    borderRadius: 12,
    background: 'linear-gradient(90deg,#22d3ee,#8b5cf6)',
    color: '#fff',
    fontWeight: 700,
    textDecoration: 'none',
    fontSize: 16
  },

  small: {
    marginTop: 20,
    fontSize: 13,
    color: '#666'
  }
}
