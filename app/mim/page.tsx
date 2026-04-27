'use client'

export default function Mim() {
  return (
    <div style={{
      height: '100vh',
      background: '#0b0b0f',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>

      <h1 style={{ fontSize: 32 }}>Seu Painel</h1>

      <div style={{
        display: 'flex',
        gap: 20,
        marginTop: 40
      }}>

        <a href="/admin/conteudo" style={card}>
          📚 Admin Blog
        </a>

        <a href="/admin" style={card}>
          📩 Admin Emails
        </a>

      </div>

    </div>
  )
}

const card = {
  padding: 30,
  borderRadius: 16,
  background: 'linear-gradient(145deg,#111,#1a1a2e)',
  textDecoration: 'none',
  color: '#fff',
  fontSize: 18
}
