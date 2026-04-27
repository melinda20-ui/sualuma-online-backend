'use client'

import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'

type Lead = {
  id?: string | number
  nome?: string
  name?: string
  email?: string
  status?: string
  origem?: string
  source?: string
  created_at?: string
  createdAt?: string
}

type FunilStep = {
  delayDays: number
  subject: string
  html: string
}

type Funil = {
  id: string
  name: string
  status: string
  steps: FunilStep[]
  createdAt?: string
  updatedAt?: string
}

type Tab = 'leads' | 'campanha' | 'automatico' | 'funis'

function extractArray(data: unknown): Lead[] {
  if (Array.isArray(data)) return data as Lead[]

  if (data && typeof data === 'object') {
    const obj = data as {
      leads?: unknown
      data?: unknown
      rows?: unknown
      items?: unknown
    }

    if (Array.isArray(obj.leads)) return obj.leads as Lead[]
    if (Array.isArray(obj.data)) return obj.data as Lead[]
    if (Array.isArray(obj.rows)) return obj.rows as Lead[]
    if (Array.isArray(obj.items)) return obj.items as Lead[]
  }

  return []
}

function extractFunis(data: unknown): Funil[] {
  if (Array.isArray(data)) return data as Funil[]

  if (data && typeof data === 'object') {
    const obj = data as {
      funis?: unknown
      data?: unknown
      rows?: unknown
      items?: unknown
    }

    if (Array.isArray(obj.funis)) return obj.funis as Funil[]
    if (Array.isArray(obj.data)) return obj.data as Funil[]
    if (Array.isArray(obj.rows)) return obj.rows as Funil[]
    if (Array.isArray(obj.items)) return obj.items as Funil[]
  }

  return []
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

export default function AdminEmailsPage() {
  const [tab, setTab] = useState<Tab>('leads')
  const [leads, setLeads] = useState<Lead[]>([])
  const [funis, setFunis] = useState<Funil[]>([])
  const [loading, setLoading] = useState(true)
  const [savingFunil, setSavingFunil] = useState(false)
  const [sendingCampaign, setSendingCampaign] = useState(false)
  const [notice, setNotice] = useState('')

  const [campaignSubject, setCampaignSubject] = useState('')
  const [campaignHtml, setCampaignHtml] = useState('<h1>Olá!</h1><p>Escreva aqui sua campanha.</p>')

  const [autoSubject, setAutoSubject] = useState('Recebemos seu cadastro na Sualuma Online')
  const [autoHtml, setAutoHtml] = useState(
    '<p>Oi! Recebemos seu cadastro e em breve vamos falar com você.</p>'
  )

  const [funilName, setFunilName] = useState('')
  const [steps, setSteps] = useState<FunilStep[]>([
    {
      delayDays: 0,
      subject: 'Boas-vindas à Sualuma Online',
      html: '<p>Oi! Seja bem-vindo(a). Aqui começa sua jornada com a Sualuma Online.</p>',
    },
  ])

  const totalLeads = leads.length

  const novosLeads = useMemo(() => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000

    return leads.filter((lead) => {
      const status = String(lead.status || '').toLowerCase()
      const created = lead.created_at || lead.createdAt

      if (status.includes('novo')) return true

      if (created) {
        const date = new Date(created)
        if (!Number.isNaN(date.getTime()) && date.getTime() >= sevenDaysAgo) {
          return true
        }
      }

      return false
    }).length
  }, [leads])

  async function loadData() {
    try {
      setLoading(true)
      setNotice('')

      const [leadsRes, funisRes] = await Promise.all([
        fetch('/api/leads', { cache: 'no-store' }),
        fetch('/api/funis', { cache: 'no-store' }),
      ])

      const leadsData = await leadsRes.json().catch(() => [])
      const funisData = await funisRes.json().catch(() => [])

      setLeads(extractArray(leadsData))
      setFunis(extractFunis(funisData))
    } catch (error) {
      console.error(error)
      setNotice('Não consegui carregar leads/funis agora.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  function updateStep(index: number, field: keyof FunilStep, value: string) {
    setSteps((current) =>
      current.map((step, stepIndex) => {
        if (stepIndex !== index) return step

        if (field === 'delayDays') {
          return {
            ...step,
            delayDays: Number(value || 0),
          }
        }

        return {
          ...step,
          [field]: value,
        }
      })
    )
  }

  function addStep() {
    setSteps((current) => [
      ...current,
      {
        delayDays: current.length,
        subject: '',
        html: '<p>Escreva aqui o conteúdo deste email.</p>',
      },
    ])
  }

  function removeStep(index: number) {
    setSteps((current) => {
      if (current.length === 1) return current
      return current.filter((_, stepIndex) => stepIndex !== index)
    })
  }

  async function saveFunil() {
    try {
      setSavingFunil(true)
      setNotice('')

      const res = await fetch('/api/funis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: funilName,
          steps,
        }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.error || 'Erro ao salvar funil.')
      }

      setFunis((current) => [data, ...current])
      setFunilName('')
      setSteps([
        {
          delayDays: 0,
          subject: 'Boas-vindas à Sualuma Online',
          html: '<p>Oi! Seja bem-vindo(a). Aqui começa sua jornada com a Sualuma Online.</p>',
        },
      ])
      setNotice('Funil salvo como rascunho.')
    } catch (error) {
      console.error(error)
      setNotice(error instanceof Error ? error.message : 'Erro ao salvar funil.')
    } finally {
      setSavingFunil(false)
    }
  }

  async function sendCampaign() {
    try {
      setSendingCampaign(true)
      setNotice('')

      if (!campaignSubject.trim()) {
        setNotice('Digite o assunto da campanha.')
        return
      }

      if (!campaignHtml.trim()) {
        setNotice('Digite o conteúdo da campanha.')
        return
      }

      const res = await fetch('/api/send-campaign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: campaignSubject,
          html: campaignHtml,
          content: campaignHtml,
        }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.error || 'Erro ao enviar campanha.')
      }

      setNotice('Campanha enviada ou processada pela API.')
    } catch (error) {
      console.error(error)
      setNotice(error instanceof Error ? error.message : 'Erro ao enviar campanha.')
    } finally {
      setSendingCampaign(false)
    }
  }

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <div>
          <p style={styles.kicker}>Sualuma Online</p>
          <h1 style={styles.title}>Admin Emails</h1>
          <p style={styles.subtitle}>
            Gerencie leads, campanhas, email automático e funis de nutrição em um só painel.
          </p>
        </div>

        <a href="/admin" style={styles.backButton}>
          Voltar ao Admin
        </a>
      </section>

      {notice ? <div style={styles.notice}>{notice}</div> : null}

      <section style={styles.cards}>
        <Card label="Total Leads" value={totalLeads} />
        <Card label="Novos" value={novosLeads} />
        <Card label="Funis" value={funis.length} />
      </section>

      <section style={styles.panel}>
        <nav style={styles.tabs}>
          <TabButton active={tab === 'leads'} onClick={() => setTab('leads')}>
            Leads
          </TabButton>
          <TabButton active={tab === 'campanha'} onClick={() => setTab('campanha')}>
            Nova Campanha
          </TabButton>
          <TabButton active={tab === 'automatico'} onClick={() => setTab('automatico')}>
            Email Automático
          </TabButton>
          <TabButton active={tab === 'funis'} onClick={() => setTab('funis')}>
            Funis de Email
          </TabButton>
        </nav>

        {loading ? (
          <div style={styles.empty}>Carregando dados...</div>
        ) : null}

        {!loading && tab === 'leads' ? (
          <section>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>Leads capturados</h2>
                <p style={styles.sectionText}>
                  Lista carregada da API <code>/api/leads</code>.
                </p>
              </div>

              <button style={styles.secondaryButton} onClick={loadData}>
                Atualizar
              </button>
            </div>

            {leads.length === 0 ? (
              <div style={styles.empty}>Nenhum lead encontrado ainda.</div>
            ) : (
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Nome</th>
                      <th style={styles.th}>Email</th>
                      <th style={styles.th}>Origem</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead, index) => (
                      <tr key={`${lead.id || lead.email || index}`}>
                        <td style={styles.td}>{lead.nome || lead.name || '-'}</td>
                        <td style={styles.td}>{lead.email || '-'}</td>
                        <td style={styles.td}>{lead.origem || lead.source || '-'}</td>
                        <td style={styles.td}>
                          <span style={styles.badge}>{lead.status || 'novo'}</span>
                        </td>
                        <td style={styles.td}>
                          {formatDate(lead.created_at || lead.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : null}

        {!loading && tab === 'campanha' ? (
          <section>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>Nova campanha</h2>
                <p style={styles.sectionText}>
                  Envia para sua API atual <code>/api/send-campaign</code>.
                </p>
              </div>
            </div>

            <div style={styles.formGrid}>
              <label style={styles.label}>
                Assunto da campanha
                <input
                  style={styles.input}
                  value={campaignSubject}
                  onChange={(e) => setCampaignSubject(e.target.value)}
                  placeholder="Ex: Seu presente da Sualuma chegou"
                />
              </label>

              <label style={styles.label}>
                HTML / Conteúdo
                <textarea
                  style={{ ...styles.textarea, minHeight: 260 }}
                  value={campaignHtml}
                  onChange={(e) => setCampaignHtml(e.target.value)}
                  placeholder="<h1>Olá!</h1><p>Sua mensagem aqui...</p>"
                />
              </label>

              <button
                style={styles.primaryButton}
                onClick={sendCampaign}
                disabled={sendingCampaign}
              >
                {sendingCampaign ? 'Enviando...' : 'Enviar campanha'}
              </button>
            </div>
          </section>
        ) : null}

        {!loading && tab === 'automatico' ? (
          <section>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>Email automático</h2>
                <p style={styles.sectionText}>
                  Esta área é para visualizar e preparar o email automático que hoje está ligado ao cadastro de leads.
                </p>
              </div>
            </div>

            <div style={styles.formGrid}>
              <label style={styles.label}>
                Assunto padrão
                <input
                  style={styles.input}
                  value={autoSubject}
                  onChange={(e) => setAutoSubject(e.target.value)}
                />
              </label>

              <label style={styles.label}>
                HTML padrão
                <textarea
                  style={{ ...styles.textarea, minHeight: 240 }}
                  value={autoHtml}
                  onChange={(e) => setAutoHtml(e.target.value)}
                />
              </label>

              <div style={styles.infoBox}>
                Por enquanto essa tela não altera o disparo automático antigo. Ela deixa o conteúdo organizado para a próxima etapa, quando a gente separar a configuração em uma API própria.
              </div>
            </div>
          </section>
        ) : null}

        {!loading && tab === 'funis' ? (
          <section>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>Construtor de funil de e-mails</h2>
                <p style={styles.sectionText}>
                  Crie sequências com delay em dias. Nesta primeira versão, o funil é salvo como rascunho em <code>/data/funis.json</code>.
                </p>
              </div>
            </div>

            <div style={styles.builder}>
              <div style={styles.builderMain}>
                <label style={styles.label}>
                  Nome do funil
                  <input
                    style={styles.input}
                    value={funilName}
                    onChange={(e) => setFunilName(e.target.value)}
                    placeholder="Ex: Funil de boas-vindas"
                  />
                </label>

                <div style={styles.stepsList}>
                  {steps.map((step, index) => (
                    <div key={index} style={styles.stepCard}>
                      <div style={styles.stepTop}>
                        <strong>Email {index + 1}</strong>

                        <button
                          style={styles.dangerButton}
                          onClick={() => removeStep(index)}
                          disabled={steps.length === 1}
                        >
                          Remover
                        </button>
                      </div>

                      <div style={styles.twoCols}>
                        <label style={styles.label}>
                          Delay em dias após cadastro
                          <input
                            style={styles.input}
                            type="number"
                            min="0"
                            value={step.delayDays}
                            onChange={(e) => updateStep(index, 'delayDays', e.target.value)}
                          />
                        </label>

                        <label style={styles.label}>
                          Assunto
                          <input
                            style={styles.input}
                            value={step.subject}
                            onChange={(e) => updateStep(index, 'subject', e.target.value)}
                            placeholder="Assunto do email"
                          />
                        </label>
                      </div>

                      <label style={styles.label}>
                        HTML / Conteúdo
                        <textarea
                          style={styles.textarea}
                          value={step.html}
                          onChange={(e) => updateStep(index, 'html', e.target.value)}
                          placeholder="<p>Conteúdo do email...</p>"
                        />
                      </label>
                    </div>
                  ))}
                </div>

                <div style={styles.actions}>
                  <button style={styles.secondaryButton} onClick={addStep}>
                    Adicionar email
                  </button>

                  <button
                    style={styles.primaryButton}
                    onClick={saveFunil}
                    disabled={savingFunil}
                  >
                    {savingFunil ? 'Salvando...' : 'Salvar funil'}
                  </button>
                </div>
              </div>

              <aside style={styles.savedBox}>
                <h3 style={styles.savedTitle}>Funis salvos</h3>

                {funis.length === 0 ? (
                  <p style={styles.sectionText}>Nenhum funil salvo ainda.</p>
                ) : (
                  <div style={styles.savedList}>
                    {funis.map((funil) => (
                      <div key={funil.id} style={styles.savedItem}>
                        <strong>{funil.name}</strong>
                        <span style={styles.smallText}>
                          {funil.steps?.length || 0} email(s) · {funil.status || 'rascunho'}
                        </span>
                        <span style={styles.smallText}>
                          Criado em {formatDate(funil.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </aside>
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
    maxWidth: 720,
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
  tableWrap: {
    overflowX: 'auto',
    borderRadius: 18,
    border: '1px solid rgba(255,255,255,0.1)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: 760,
  },
  th: {
    textAlign: 'left',
    padding: 14,
    color: '#a78bfa',
    fontSize: 13,
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  td: {
    padding: 14,
    color: '#e2e8f0',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
  },
  badge: {
    display: 'inline-flex',
    borderRadius: 999,
    padding: '5px 10px',
    background: 'rgba(14,165,233,0.14)',
    color: '#bae6fd',
    fontSize: 12,
  },
  formGrid: {
    display: 'grid',
    gap: 16,
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
  dangerButton: {
    border: '1px solid rgba(248,113,113,0.28)',
    borderRadius: 12,
    padding: '9px 12px',
    background: 'rgba(127,29,29,0.22)',
    color: '#fecaca',
    cursor: 'pointer',
    fontWeight: 800,
  },
  infoBox: {
    border: '1px solid rgba(14,165,233,0.25)',
    background: 'rgba(14,165,233,0.08)',
    color: '#bae6fd',
    padding: 16,
    borderRadius: 16,
    lineHeight: 1.6,
  },
  builder: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 340px',
    gap: 18,
    alignItems: 'start',
  },
  builderMain: {
    display: 'grid',
    gap: 16,
  },
  stepsList: {
    display: 'grid',
    gap: 16,
  },
  stepCard: {
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 16,
    background: 'rgba(15,23,42,0.58)',
  },
  stepTop: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
    marginBottom: 14,
  },
  twoCols: {
    display: 'grid',
    gridTemplateColumns: '180px minmax(0, 1fr)',
    gap: 14,
    marginBottom: 14,
  },
  actions: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
  },
  savedBox: {
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 16,
    background: 'rgba(15,23,42,0.58)',
    position: 'sticky',
    top: 20,
  },
  savedTitle: {
    margin: '0 0 12px',
    fontSize: 18,
  },
  savedList: {
    display: 'grid',
    gap: 10,
  },
  savedItem: {
    display: 'grid',
    gap: 4,
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 12,
    background: 'rgba(255,255,255,0.04)',
  },
  smallText: {
    color: '#94a3b8',
    fontSize: 12,
  },
}
