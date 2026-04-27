'use client'

import { useEffect, useState } from 'react'

type Lead = {
  id: string
  nome: string
  email: string
  status?: string
  origem?: string
  created_at?: string
}

type FunilStep = {
  delay: string
  subject: string
  html: string
}

type Funil = {
  id: string
  name: string
  status: string
  steps: FunilStep[]
  createdAt: string
}

export default function AdminEmails() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [funis, setFunis] = useState<Funil[]>([])
  const [tab, setTab] = useState<'leads' | 'campanha' | 'automatico' | 'funis'>('leads')
  const [campanha, setCampanha] = useState({ subject: '', html: '' })
  const [enviando, setEnviando] = useState(false)
  const [msg, setMsg] = useState('')

  const [nomeFunil, setNomeFunil] = useState('')
  const [steps, setSteps] = useState<FunilStep[]>([
    {
      delay: '0',
      subject: 'Bem-vindo 🎁',
      html: '<h1>Olá {{name}}</h1><p>Você entrou na lista.</p>'
    }
  ])

  useEffect(() => {
    fetch('/api/leads')
      .then(r => r.json())
      .then(data => setLeads(Array.isArray(data) ? data : []))
      .catch(() => setLeads([]))

    fetch('/api/funis')
      .then(r => r.json())
      .then(data => setFunis(Array.isArray(data) ? data : []))
      .catch(() => setFunis([]))
  }, [])

  async function enviarCampanha() {
    if (!campanha.subject || !campanha.html) {
      setMsg('Preencha o assunto e o conteúdo.')
      return
    }

    setEnviando(true)
    setMsg('')

    try {
      const r = await fetch('/api/send-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: campanha.subject, htmlContent: campanha.html })
      })

      const data = await r.json()
      setMsg(`Campanha enviada. Total: ${data.sent || 0}`)
    } catch {
      setMsg('Erro ao enviar campanha.')
    }

    setEnviando(false)
  }

  function atualizarStep(index: number, field: keyof FunilStep, value: string) {
    const novos = [...steps]
    novos[index] = { ...novos[index], [field]: value }
    setSteps(novos)
  }

  function adicionarStep() {
    setSteps([...steps, { delay: '1', subject: '', html: '' }])
  }

  async function salvarFunil() {
    if (!nomeFunil) {
      setMsg('Dê um nome para o funil.')
      return
    }

    const r = await fetch('/api/funis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: nomeFunil, status: 'rascunho', steps })
    })

    const novo = await r.json()
    setFunis([novo, ...funis])
    setNomeFunil('')
    setMsg('Funil salvo como rascunho.')
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f3f4f8', color: '#111', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ background: '#10121a', color: '#fff', padding: '18px 28px', fontWeight: 700 }}>
        📩 Admin Emails — Sualuma
        <a href="/admin" style={{ float: 'right', color: '#fff' }}>← Painel</a>
      </header>

      <section style={{ maxWidth: 1100, margin: '0 auto', padding: 30 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          <Card title="Total Leads" value={leads.length} color="#2563eb" />
          <Card title="Novos" value={leads.filter(l => (l.status || 'novo') === 'novo').length} color="#16a34a" />
          <Card title="Funis" value={funis.length} color="#7c3aed" />
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 25, flexWrap: 'wrap' }}>
          <Tab active={tab === 'leads'} onClick={() => setTab('leads')}>👥 Leads</Tab>
          <Tab active={tab === 'campanha'} onClick={() => setTab('campanha')}>📣 Nova Campanha</Tab>
          <Tab active={tab === 'automatico'} onClick={() => setTab('automatico')}>⚙️ Email Automático</Tab>
          <Tab active={tab === 'funis'} onClick={() => setTab('funis')}>🔁 Funis de Email</Tab>
        </div>

        {msg && <Panel>{msg}</Panel>}

        {tab === 'leads' && (
          <Panel>
            <h2>Leads capturados</h2>
            {leads.length === 0 ? <p>Nenhum lead encontrado.</p> : leads.map(lead => (
              <div key={lead.id} style={item}>
                <strong>{lead.nome || 'Lead'}</strong><br />
                {lead.email}<br />
                <small>{lead.origem || 'Sem origem'}</small>
              </div>
            ))}
          </Panel>
        )}

        {tab === 'campanha' && (
          <Panel>
            <h2>Nova campanha</h2>

            <input
              placeholder="Assunto da campanha"
              value={campanha.subject}
              onChange={e => setCampanha({ ...campanha, subject: e.target.value })}
              style={input}
            />

            <textarea
              placeholder="<h1>Olá {{name}}</h1><p>Sua mensagem...</p>"
              value={campanha.html}
              onChange={e => setCampanha({ ...campanha, html: e.target.value })}
              style={{ ...input, height: 180 }}
            />

            <button onClick={enviarCampanha} disabled={enviando} style={button}>
              {enviando ? 'Enviando...' : `Enviar para ${leads.length} leads`}
            </button>
          </Panel>
        )}

        {tab === 'automatico' && (
          <Panel>
            <h2>Email automático de boas-vindas</h2>
            <p>Hoje ele está no backend em <code>app/api/leads/route.ts</code>.</p>
            <pre style={pre}>
subject: "Bem-vindo 🎁"
html: "&lt;h1&gt;Olá {'{{name}}'}&lt;/h1&gt;&lt;p&gt;Você entrou na lista 🚀&lt;/p&gt;"
            </pre>
          </Panel>
        )}

        {tab === 'funis' && (
          <Panel>
            <h2>Construtor de funil de e-mails</h2>
            <p>Monte uma sequência. Por enquanto salva como rascunho; depois ligamos o disparo automático real.</p>

            <input
              placeholder="Nome do funil"
              value={nomeFunil}
              onChange={e => setNomeFunil(e.target.value)}
              style={input}
            />

            {steps.map((step, index) => (
              <div key={index} style={{ background: '#f8fafc', border: '1px solid #ddd', borderRadius: 14, padding: 16, marginTop: 16 }}>
                <h3>Email {index + 1}</h3>

                <label>Dias depois do cadastro</label>
                <input value={step.delay} onChange={e => atualizarStep(index, 'delay', e.target.value)} style={input} />

                <label>Assunto</label>
                <input value={step.subject} onChange={e => atualizarStep(index, 'subject', e.target.value)} style={input} />

                <label>HTML do e-mail</label>
                <textarea value={step.html} onChange={e => atualizarStep(index, 'html', e.target.value)} style={{ ...input, height: 120 }} />
              </div>
            ))}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={adicionarStep} style={buttonSecondary}>+ Adicionar email</button>
              <button onClick={salvarFunil} style={button}>Salvar funil</button>
            </div>

            <h3 style={{ marginTop: 30 }}>Funis salvos</h3>
            {funis.length === 0 ? <p>Nenhum funil salvo ainda.</p> : funis.map(f => (
              <div key={f.id} style={item}>
                <strong>{f.name}</strong><br />
                <small>{f.steps?.length || 0} e-mails • {f.status}</small>
              </div>
            ))}
          </Panel>
        )}
      </section>
    </main>
  )
}

function Card({ title, value, color }: any) {
  return (
    <div style={{ background: '#fff', borderTop: `4px solid ${color}`, borderRadius: 14, padding: 22, boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
      <h2 style={{ color, margin: 0 }}>{value}</h2>
      <p style={{ margin: 0, marginTop: 8 }}>{title}</p>
    </div>
  )
}

function Tab({ children, active, onClick }: any) {
  return (
    <button onClick={onClick} style={{ border: 0, borderRadius: 10, padding: '12px 16px', background: active ? '#2563eb' : '#fff', color: active ? '#fff' : '#111', cursor: 'pointer' }}>
      {children}
    </button>
  )
}

function Panel({ children }: any) {
  return <div style={{ background: '#fff', borderRadius: 16, padding: 24, marginTop: 25, boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>{children}</div>
}

const input: any = { width: '100%', boxSizing: 'border-box', padding: 12, borderRadius: 10, border: '1px solid #ddd', marginTop: 8, marginBottom: 12 }
const button: any = { border: 0, borderRadius: 10, padding: '12px 18px', background: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 700 }
const buttonSecondary: any = { border: 0, borderRadius: 10, padding: '12px 18px', background: '#111827', color: '#fff', cursor: 'pointer', fontWeight: 700 }
const item: any = { background: '#111827', color: '#fff', borderRadius: 12, padding: 16, marginTop: 12 }
const pre: any = { background: '#f3f4f6', padding: 16, borderRadius: 12, overflowX: 'auto' }
