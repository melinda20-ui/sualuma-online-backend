'use client'

const card: React.CSSProperties = {
  padding: 30,
  borderRadius: 16,
  background: 'linear-gradient(145deg,#111,#1a1a2e)',
  textDecoration: 'none',
  color: '#fff',
  fontSize: 18
}

export default function AdminHome() {
  return (
    <div style={{
      height: '100vh',
      background: '#0b0b0f',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column'
    }}>
      <h1 style={{ fontSize: 32 }}>Painel Sualuma</h1>
      <div style={{ display: 'flex', gap: 20, marginTop: 40 }}>
        <a href="/admin/conteudo" style={card}>
          📚 Admin Blog
        </a>
        <a href="/admin/emails" style={card}>
          📧 Admin Emails
        </a>
      </div>
    </div>
  )
}
