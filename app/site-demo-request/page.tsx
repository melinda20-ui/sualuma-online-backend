'use client'

import { useState } from 'react'

export default function Page() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: any) {
    e.preventDefault()

    if (!email) {
      setError('Digite seu email')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      })

      if (!res.ok) {
        throw new Error('Erro ao salvar')
      }

      // 🚀 REDIRECIONAMENTO COM DADOS
      window.location.href = `https://sospublicidade.sualuma.online/formulario/?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`

    } catch (err) {
      setError('Erro ao enviar. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <main style={styles.page}>
      <form onSubmit={handleSubmit} style={styles.card}>
        
        <h1 style={styles.title}>
          Receba seus 3 modelos 🎁
        </h1>

        <p style={styles.subtitle}>
          Digite seus dados para liberar o acesso
        </p>

        <input
          placeholder="Seu nome"
          value={name}
          onChange={e => setName(e.target.value)}
          style={styles.input}
        />

        <input
          placeholder="Seu email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={styles.input}
        />

        {error && <p style={styles.error}>{error}</p>}

        <button
          type="submit"
          disabled={loading}
          style={{
            ...styles.button,
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Enviando...' : 'Entrar na lista 🚀'}
        </button>

      </form>
    </main>
  )
}

const styles: any = {
  page: {
    minHeight: '100vh',
    background: '#050507',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    color: '#fff',
    fontFamily: 'Inter, sans-serif'
  },

  card: {
    background: '#0c0c0f',
    padding: 30,
    borderRadius: 20,
    width: '100%',
    maxWidth: 420,
    display: 'flex',
    flexDirection: 'column',
    gap: 15
  },

  title: {
    fontSize: 26,
    fontWeight: 800
  },

  subtitle: {
    color: '#aaa',
    marginBottom: 10
  },

  input: {
    padding: '12px',
    borderRadius: 10,
    border: '1px solid #333',
    background: '#111',
    color: '#fff'
  },

  button: {
    background: 'linear-gradient(90deg,#22d3ee,#8b5cf6)',
    border: 'none',
    padding: '14px',
    borderRadius: 12,
    color: '#fff',
    fontWeight: 700,
    cursor: 'pointer'
  },

  error: {
    color: '#f87171',
    fontSize: 14
  }
}

