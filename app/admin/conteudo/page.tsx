'use client'

import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'

type Post = {
  id?: number
  title: string
  slug?: string
  excerpt?: string
  content: string
  status: string
  createdAt?: string
  updatedAt?: string
}

type Tab = 'posts' | 'novo' | 'chat'

type ChatMsg = {
  role: 'user' | 'assistant'
  text: string
}

function extractPosts(data: unknown): Post[] {
  if (Array.isArray(data)) return data as Post[]

  if (data && typeof data === 'object') {
    const obj = data as {
      posts?: unknown
      data?: unknown
      rows?: unknown
      items?: unknown
    }

    if (Array.isArray(obj.posts)) return obj.posts as Post[]
    if (Array.isArray(obj.data)) return obj.data as Post[]
    if (Array.isArray(obj.rows)) return obj.rows as Post[]
    if (Array.isArray(obj.items)) return obj.items as Post[]
  }

  return []
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

function formatDate(value?: string) {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '-'

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function createMockContent(prompt: string) {
  const cleanPrompt = prompt.trim()

  return `# ${cleanPrompt || 'Novo conteúdo para a Sualuma Online'}

## Gancho de abertura

Imagine uma empresa pequena conseguindo vender mais, organizar melhor os atendimentos e transformar processos confusos em uma operação simples, bonita e automatizada.

É exatamente essa a proposta da Sualuma Online: conectar negócios, prestadores de serviço e agentes de inteligência artificial em um ecossistema prático para gerar crescimento.

## Ideia central

${cleanPrompt || 'A Sualuma Online ajuda empresas a economizarem tempo, captarem mais clientes e profissionalizarem sua presença digital.'}

O grande diferencial está em unir tecnologia, estratégia e execução em um só lugar. Em vez de o cliente procurar várias ferramentas separadas, ele encontra um ambiente onde pode contratar serviços, acessar automações, criar conteúdos, organizar demandas e acompanhar resultados.

## Estrutura sugerida para o post

1. Explique o problema que o público enfrenta hoje.
2. Mostre o custo invisível da desorganização.
3. Apresente a Sualuma Online como solução.
4. Dê exemplos práticos de uso.
5. Finalize com uma chamada para ação clara.

## Copy para CTA

Quer transformar sua empresa em uma operação mais profissional, automatizada e pronta para vender mais?

Entre para a Sualuma Online e comece a construir sua estrutura digital com inteligência.`
}

export default function AdminConteudoPage() {
  const [tab, setTab] = useState<Tab>('posts')
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [status, setStatus] = useState('draft')

  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([
    {
      role: 'assistant',
      text: 'Oi, Luma. Me diga o tema do post, artigo ou copy que você quer criar para a Sualuma Online.',
    },
  ])
  const [lastGenerated, setLastGenerated] = useState('')

  const publicados = useMemo(
    () => posts.filter((post) => post.status === 'published').length,
    [posts]
  )

  const rascunhos = useMemo(
    () => posts.filter((post) => post.status !== 'published').length,
    [posts]
  )

  async function loadPosts() {
    try {
      setLoading(true)
      setNotice('')

      const res = await fetch('/api/posts', {
        cache: 'no-store',
      })

      const data = await res.json().catch(() => [])

      if (!res.ok) {
        throw new Error(data?.error || 'Erro ao carregar posts.')
      }

      setPosts(extractPosts(data))
    } catch (error) {
      console.error(error)
      setNotice(error instanceof Error ? error.message : 'Erro ao carregar posts.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPosts()
  }, [])

  function resetForm() {
    setTitle('')
    setSlug('')
    setExcerpt('')
    setContent('')
    setStatus('draft')
  }

  async function savePost() {
    try {
      setSaving(true)
      setNotice('')

      const finalTitle = title.trim()
      const finalContent = content.trim()

      if (!finalTitle) {
        setNotice('Digite o título do post.')
        return
      }

      if (!finalContent) {
        setNotice('Digite o conteúdo do post.')
        return
      }

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: finalTitle,
          slug: slug.trim() || slugify(finalTitle),
          excerpt,
          content: finalContent,
          status,
        }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.error || 'Erro ao salvar post.')
      }

      setPosts((current) => [data, ...current])
      resetForm()
      setNotice('Post salvo com sucesso.')
      setTab('posts')
    } catch (error) {
      console.error(error)
      setNotice(error instanceof Error ? error.message : 'Erro ao salvar post.')
    } finally {
      setSaving(false)
    }
  }

  function generateChatResponse() {
    const prompt = chatInput.trim()

    if (!prompt) {
      setNotice('Digite um pedido no chat de conteúdo.')
      return
    }

    const generated = createMockContent(prompt)

    setChatMessages((current) => [
      ...current,
      {
        role: 'user',
        text: prompt,
      },
      {
        role: 'assistant',
        text: generated,
      },
    ])

    setLastGenerated(generated)
    setChatInput('')
    setNotice('Resposta mockada gerada. Você pode usar isso no formulário de post.')
  }

  function useResponseInPost() {
    if (!lastGenerated) {
      setNotice('Gere uma resposta no chat primeiro.')
      return
    }

    const firstLine = lastGenerated
      .split('\n')
      .find((line) => line.trim().startsWith('#'))

    const generatedTitle = firstLine
      ? firstLine.replace(/^#+\s*/, '').trim()
      : 'Novo post da Sualuma Online'

    setTitle(generatedTitle)
    setSlug(slugify(generatedTitle))
    setExcerpt(
      'Conteúdo criado no Chat de Conteúdo da Sualuma Online para educar, atrair e converter clientes.'
    )
    setContent(lastGenerated)
    setStatus('draft')
    setTab('novo')
    setNotice('Resposta enviada para o formulário de Novo Post.')
  }

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <div>
          <p style={styles.kicker}>Sualuma Online</p>
          <h1 style={styles.title}>Admin Conteúdo</h1>
          <p style={styles.subtitle}>
            Crie posts, organize rascunhos e use um chat mockado para gerar ideias de artigos, copies e conteúdos.
          </p>
        </div>

        <a href="/admin" style={styles.backButton}>
          Voltar ao Admin
        </a>
      </section>

      {notice ? <div style={styles.notice}>{notice}</div> : null}

      <section style={styles.cards}>
        <Card label="Publicados" value={publicados} />
        <Card label="Rascunhos" value={rascunhos} />
        <Card label="Total" value={posts.length} />
      </section>

      <section style={styles.panel}>
        <nav style={styles.tabs}>
          <TabButton active={tab === 'posts'} onClick={() => setTab('posts')}>
            Posts
          </TabButton>
          <TabButton active={tab === 'novo'} onClick={() => setTab('novo')}>
            Novo Post
          </TabButton>
          <TabButton active={tab === 'chat'} onClick={() => setTab('chat')}>
            Chat de Conteúdo
          </TabButton>
        </nav>

        {loading ? <div style={styles.empty}>Carregando posts...</div> : null}

        {!loading && tab === 'posts' ? (
          <section>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>Posts do blog</h2>
                <p style={styles.sectionText}>
                  Lista carregada da API <code>/api/posts</code>.
                </p>
              </div>

              <button style={styles.secondaryButton} onClick={loadPosts}>
                Atualizar
              </button>
            </div>

            {posts.length === 0 ? (
              <div style={styles.empty}>
                Nenhum post encontrado ainda. Crie seu primeiro post na aba Novo Post.
              </div>
            ) : (
              <div style={styles.postList}>
                {posts.map((post) => (
                  <article key={post.id || post.slug || post.title} style={styles.postCard}>
                    <div>
                      <span style={styles.badge}>
                        {post.status === 'published' ? 'Publicado' : 'Rascunho'}
                      </span>
                      <h3 style={styles.postTitle}>{post.title}</h3>
                      <p style={styles.sectionText}>
                        {post.excerpt || 'Sem resumo cadastrado.'}
                      </p>
                    </div>

                    <div style={styles.postMeta}>
                      <span>Slug: {post.slug || '-'}</span>
                      <span>Criado em: {formatDate(post.createdAt)}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : null}

        {!loading && tab === 'novo' ? (
          <section>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>Novo Post</h2>
                <p style={styles.sectionText}>
                  Salva no Prisma usando a API <code>/api/posts</code>.
                </p>
              </div>
            </div>

            <div style={styles.formGrid}>
              <div style={styles.twoCols}>
                <label style={styles.label}>
                  Título
                  <input
                    style={styles.input}
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value)
                      if (!slug) {
                        setSlug(slugify(e.target.value))
                      }
                    }}
                    placeholder="Ex: Como automatizar o atendimento da sua empresa"
                  />
                </label>

                <label style={styles.label}>
                  Status
                  <select
                    style={styles.input}
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="draft">Rascunho</option>
                    <option value="published">Publicado</option>
                  </select>
                </label>
              </div>

              <label style={styles.label}>
                Slug
                <input
                  style={styles.input}
                  value={slug}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                  placeholder="como-automatizar-atendimento"
                />
              </label>

              <label style={styles.label}>
                Resumo / Excerpt
                <textarea
                  style={{ ...styles.textarea, minHeight: 100 }}
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Resumo curto para aparecer nas listagens e SEO."
                />
              </label>

              <label style={styles.label}>
                Conteúdo
                <textarea
                  style={{ ...styles.textarea, minHeight: 360 }}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Escreva o conteúdo completo do post aqui."
                />
              </label>

              <div style={styles.actions}>
                <button style={styles.secondaryButton} onClick={resetForm}>
                  Limpar
                </button>

                <button style={styles.primaryButton} onClick={savePost} disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar post'}
                </button>
              </div>
            </div>
          </section>
        ) : null}

        {!loading && tab === 'chat' ? (
          <section>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>Chat de Conteúdo</h2>
                <p style={styles.sectionText}>
                  Geração mockada/local por enquanto. Depois podemos ligar no seu roteador de IA em <code>/api/ai/router</code>.
                </p>
              </div>

              <button style={styles.primaryButton} onClick={useResponseInPost}>
                Usar resposta no post
              </button>
            </div>

            <div style={styles.chatBox}>
              <div style={styles.messages}>
                {chatMessages.map((message, index) => (
                  <div
                    key={index}
                    style={{
                      ...styles.message,
                      ...(message.role === 'user' ? styles.userMessage : styles.assistantMessage),
                    }}
                  >
                    <strong>
                      {message.role === 'user' ? 'Você' : 'Assistente de Conteúdo'}
                    </strong>
                    <pre style={styles.messageText}>{message.text}</pre>
                  </div>
                ))}
              </div>

              <div style={styles.chatInputRow}>
                <textarea
                  style={styles.chatInput}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ex: Crie um artigo sobre como pequenos negócios podem automatizar o atendimento com IA..."
                />

                <button style={styles.primaryButton} onClick={generateChatResponse}>
                  Gerar
                </button>
              </div>
            </div>
          </section>
        ) : null}
      </section>
    </main>
  )
}

function Card({ label, value }: { label: string; value: number }) {
  return (
    <div style={styles.card}>
      <span style={styles.cardLabel}>{label}</span>
      <strong style={styles.cardValue}>{value}</strong>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.tab,
        ...(active ? styles.tabActive : {}),
      }}
    >
      {children}
    </button>
  )
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: '100vh',
    background:
      'radial-gradient(circle at top left, rgba(124,58,237,0.22), transparent 35%), radial-gradient(circle at top right, rgba(14,165,233,0.16), transparent 30%), #070711',
    color: '#ffffff',
    padding: '34px',
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  hero: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  kicker: {
    margin: 0,
    color: '#a78bfa',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: 800,
  },
  title: {
    margin: '8px 0',
    fontSize: 42,
    lineHeight: 1,
  },
  subtitle: {
    margin: 0,
    maxWidth: 760,
    color: '#cbd5e1',
    fontSize: 16,
    lineHeight: 1.6,
  },
  backButton: {
    color: '#fff',
    textDecoration: 'none',
    border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: 999,
    padding: '12px 18px',
    background: 'rgba(255,255,255,0.06)',
    whiteSpace: 'nowrap',
  },
  notice: {
    border: '1px solid rgba(167,139,250,0.5)',
    background: 'rgba(124,58,237,0.16)',
    padding: 14,
    borderRadius: 18,
    marginBottom: 18,
    color: '#ddd6fe',
  },
  cards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 16,
    marginBottom: 18,
  },
  card: {
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 22,
    padding: 22,
    background: 'rgba(15,23,42,0.72)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.28)',
  },
  cardLabel: {
    display: 'block',
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 10,
  },
  cardValue: {
    display: 'block',
    fontSize: 36,
  },
  panel: {
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 26,
    padding: 18,
    background: 'rgba(2,6,23,0.68)',
    boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
  },
  tabs: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 22,
  },
  tab: {
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.04)',
    color: '#cbd5e1',
    padding: '12px 16px',
    borderRadius: 999,
    cursor: 'pointer',
    fontWeight: 700,
  },
  tabActive: {
    background: 'linear-gradient(135deg, #7c3aed, #0ea5e9)',
    color: '#ffffff',
    borderColor: 'transparent',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 18,
    marginBottom: 18,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 24,
  },
  sectionText: {
    margin: '8px 0 0',
    color: '#94a3b8',
    lineHeight: 1.6,
  },
  empty: {
    border: '1px dashed rgba(255,255,255,0.16)',
    borderRadius: 18,
    padding: 24,
    color: '#94a3b8',
    background: 'rgba(255,255,255,0.03)',
  },
  postList: {
    display: 'grid',
    gap: 14,
  },
  postCard: {
    display: 'grid',
    gap: 14,
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 18,
    background: 'rgba(15,23,42,0.58)',
  },
  postTitle: {
    margin: '12px 0 0',
    fontSize: 22,
  },
  postMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
    color: '#94a3b8',
    fontSize: 13,
  },
  badge: {
    display: 'inline-flex',
    borderRadius: 999,
    padding: '5px 10px',
    background: 'rgba(14,165,233,0.14)',
    color: '#bae6fd',
    fontSize: 12,
    fontWeight: 800,
  },
  formGrid: {
    display: 'grid',
    gap: 16,
  },
  twoCols: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 220px',
    gap: 14,
  },
  label: {
    display: 'grid',
    gap: 8,
    color: '#e2e8f0',
    fontWeight: 700,
    fontSize: 14,
  },
  input: {
    width: '100%',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 14,
    padding: '13px 14px',
    background: 'rgba(15,23,42,0.86)',
    color: '#ffffff',
    outline: 'none',
    fontSize: 15,
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    minHeight: 170,
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 14,
    padding: '13px 14px',
    background: 'rgba(15,23,42,0.86)',
    color: '#ffffff',
    outline: 'none',
    fontSize: 14,
    lineHeight: 1.6,
    boxSizing: 'border-box',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
  actions: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
  },
  primaryButton: {
    border: 'none',
    borderRadius: 14,
    padding: '14px 18px',
    background: 'linear-gradient(135deg, #7c3aed, #0ea5e9)',
    color: '#ffffff',
    fontWeight: 900,
    cursor: 'pointer',
    boxShadow: '0 18px 40px rgba(124,58,237,0.25)',
  },
  secondaryButton: {
    border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: 14,
    padding: '13px 16px',
    background: 'rgba(255,255,255,0.06)',
    color: '#ffffff',
    fontWeight: 800,
    cursor: 'pointer',
  },
  chatBox: {
    display: 'grid',
    gap: 16,
  },
  messages: {
    display: 'grid',
    gap: 12,
    maxHeight: 560,
    overflowY: 'auto',
    padding: 14,
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 20,
    background: 'rgba(15,23,42,0.42)',
  },
  message: {
    borderRadius: 18,
    padding: 14,
    border: '1px solid rgba(255,255,255,0.1)',
  },
  userMessage: {
    background: 'rgba(124,58,237,0.16)',
  },
  assistantMessage: {
    background: 'rgba(14,165,233,0.1)',
  },
  messageText: {
    whiteSpace: 'pre-wrap',
    margin: '10px 0 0',
    color: '#dbeafe',
    fontFamily: 'inherit',
    lineHeight: 1.6,
  },
  chatInputRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 140px',
    gap: 12,
    alignItems: 'stretch',
  },
  chatInput: {
    width: '100%',
    minHeight: 110,
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 14,
    padding: '13px 14px',
    background: 'rgba(15,23,42,0.86)',
    color: '#ffffff',
    outline: 'none',
    fontSize: 14,
    lineHeight: 1.6,
    boxSizing: 'border-box',
  },
}
