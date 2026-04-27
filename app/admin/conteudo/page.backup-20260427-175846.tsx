'use client'

import { useEffect, useState } from 'react'

type Post = {
  id: number
  title: string
  slug: string
  excerpt?: string
  content: string
  status: string
  createdAt?: string
}

type ChatMsg = {
  role: 'user' | 'assistant'
  text: string
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default function AdminBlog() {
  const [posts, setPosts] = useState<Post[]>([])
  const [tab, setTab] = useState<'posts' | 'novo' | 'chat'>('posts')
  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    status: 'draft'
  })

  const [chat, setChat] = useState<ChatMsg[]>([
    {
      role: 'assistant',
      text: 'Oi, Luma. Me diga o tema do post e eu monto título, estrutura, chamada e conteúdo base.'
    }
  ])

  const [prompt, setPrompt] = useState('')

  useEffect(() => {
    fetch('/api/posts')
      .then(r => r.json())
      .then(data => setPosts(Array.isArray(data) ? data : []))
      .catch(() => setPosts([]))
  }, [])

  async function salvarPost(status = form.status) {
    const postData = {
      ...form,
      status,
      slug: form.slug || slugify(form.title)
    }

    const r = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData)
    })

    const novo = await r.json()
    setPosts([novo, ...posts])
    setForm({ title: '', slug: '', excerpt: '', content: '', status: 'draft' })
    setTab('posts')
  }

  function gerarConteudo() {
    if (!prompt.trim()) return

    const resposta = `Ideia de conteúdo para: ${prompt}

Título sugerido:
${prompt}: como usar isso para atrair mais clientes

Estrutura:
1. Comece mostrando o problema do cliente.
2. Explique por que isso trava as vendas.
3. Mostre uma solução simples.
4. Apresente a Sualuma como ponte entre estratégia, site e automação.
5. Finalize com uma chamada para entrar na lista ou pedir os 3 modelos.

Legenda curta:
Se seu negócio ainda depende só de indicação, você está deixando dinheiro na mesa. Um site estratégico pode virar seu vendedor silencioso todos os dias.

CTA:
Peça seus 3 modelos de site e veja qual combina melhor com seu negócio.`

    setChat([
      ...chat,
      { role: 'user', text: prompt },
      { role: 'assistant', text: resposta }
    ])

    setPrompt('')
  }

  function usarUltimaRespostaNoPost() {
    const ultima = [...chat].reverse().find(m => m.role === 'assistant')
    if (!ultima) return

    setForm({
      title: prompt || 'Novo post Sualuma',
      slug: '',
      excerpt: 'Conteúdo criado pelo chat de conteúdo.',
      content: ultima.text,
      status: 'draft'
    })

    setTab('novo')
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: '#f3f4f8',
      color: '#111',
      fontFamily: 'Arial, sans-serif'
    }}>
      <header style={{
        background: '#10121a',
        color: '#fff',
        padding: '18px 28px',
        fontWeight: 700
      }}>
        📚 Admin Blog — Sualuma
      </header>

      <section style={{ maxWidth: 1100, margin: '0 auto', padding: 30 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          <Card title="Publicados" value={posts.filter(p => p.status === 'published').length} color="#16a34a" />
          <Card title="Rascunhos" value={posts.filter(p => p.status === 'draft').length} color="#ca8a04" />
          <Card title="Total" value={posts.length} color="#2563eb" />
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 25, flexWrap: 'wrap' }}>
          <Tab active={tab === 'posts'} onClick={() => setTab('posts')}>✅ Posts</Tab>
          <Tab active={tab === 'novo'} onClick={() => setTab('novo')}>+ Novo Post</Tab>
          <Tab active={tab === 'chat'} onClick={() => setTab('chat')}>💬 Chat de Conteúdo</Tab>
        </div>

        {tab === 'posts' && (
          <Panel>
            <h2>Posts</h2>

            {posts.length === 0 ? (
              <p>Nenhum post ainda.</p>
            ) : (
              posts.map(post => (
                <div key={post.id} style={item}>
                  <strong>{post.title}</strong><br />
                  <small>/{post.slug} • {post.status}</small>
                </div>
              ))
            )}
          </Panel>
        )}

        {tab === 'novo' && (
          <Panel>
            <h2>Novo post</h2>

            <input
              placeholder="Título"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              style={input}
            />

            <input
              placeholder="Slug automático se deixar vazio"
              value={form.slug}
              onChange={e => setForm({ ...form, slug: e.target.value })}
              style={input}
            />

            <input
              placeholder="Resumo / meta descrição"
              value={form.excerpt}
              onChange={e => setForm({ ...form, excerpt: e.target.value })}
              style={input}
            />

            <textarea
              placeholder="Conteúdo do post"
              value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
              style={{ ...input, height: 260 }}
            />

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => salvarPost('draft')} style={buttonSecondary}>
                Salvar rascunho
              </button>

              <button onClick={() => salvarPost('published')} style={button}>
                Publicar
              </button>
            </div>
          </Panel>
        )}

        {tab === 'chat' && (
          <Panel>
            <h2>Chat de conteúdo</h2>
            <p>Use para criar ideias de posts, títulos, estruturas e CTAs.</p>

            <div style={{
              background: '#0b0b0f',
              color: '#fff',
              borderRadius: 14,
              padding: 18,
              minHeight: 260,
              maxHeight: 420,
              overflowY: 'auto'
            }}>
              {chat.map((m, i) => (
                <div key={i} style={{
                  background: m.role === 'assistant' ? '#1f2937' : '#2563eb',
                  padding: 14,
                  borderRadius: 12,
                  marginBottom: 12,
                  whiteSpace: 'pre-wrap'
                }}>
                  <strong>{m.role === 'assistant' ? 'IA Conteúdo' : 'Você'}:</strong><br />
                  {m.text}
                </div>
              ))}
            </div>

            <textarea
              placeholder="Ex: crie um post sobre por que autônomos precisam de site..."
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              style={{ ...input, height: 100, marginTop: 18 }}
            />

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={gerarConteudo} style={button}>
                Gerar conteúdo
              </button>

              <button onClick={usarUltimaRespostaNoPost} style={buttonSecondary}>
                Usar resposta no post
              </button>
            </div>
          </Panel>
        )}
      </section>
    </main>
  )
}

function Card({ title, value, color }: any) {
  return (
    <div style={{
      background: '#fff',
      borderTop: `4px solid ${color}`,
      borderRadius: 14,
      padding: 22,
      boxShadow: '0 10px 25px rgba(0,0,0,0.06)'
    }}>
      <h2 style={{ color, margin: 0 }}>{value}</h2>
      <p style={{ margin: 0, marginTop: 8 }}>{title}</p>
    </div>
  )
}

function Tab({ children, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      style={{
        border: 0,
        borderRadius: 10,
        padding: '12px 16px',
        background: active ? '#2563eb' : '#fff',
        color: active ? '#fff' : '#111',
        cursor: 'pointer'
      }}
    >
      {children}
    </button>
  )
}

function Panel({ children }: any) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      padding: 24,
      marginTop: 25,
      boxShadow: '0 10px 25px rgba(0,0,0,0.06)'
    }}>
      {children}
    </div>
  )
}

const input = {
  width: '100%',
  boxSizing: 'border-box' as const,
  padding: 12,
  borderRadius: 10,
  border: '1px solid #ddd',
  marginTop: 8,
  marginBottom: 12
}

const button = {
  border: 0,
  borderRadius: 10,
  padding: '12px 18px',
  background: '#2563eb',
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 700
}

const buttonSecondary = {
  border: 0,
  borderRadius: 10,
  padding: '12px 18px',
  background: '#111827',
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 700
}

const item = {
  background: '#111827',
  color: '#fff',
  borderRadius: 12,
  padding: 16,
  marginTop: 12
}
