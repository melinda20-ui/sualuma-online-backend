'use client'
import { useEffect, useState } from 'react'

type Lead = { id: string; nome: string; email: string; status: string; created_at: string }

export default function AdminEmails() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [tab, setTab] = useState<'leads'|'campanha'|'automatico'>('leads')
  const [campanha, setCampanha] = useState({ subject: '', html: '' })
  const [enviando, setEnviando] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => { fetch('/api/leads').then(r=>r.json()).then(setLeads) }, [])

  async function enviarCampanha() {
    setEnviando(true)
    setMsg('')
    const r = await fetch('/api/send-campaign', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ subject: campanha.subject, htmlContent: campanha.html }) })
    setMsg(r.ok ? '✅ Campanha enviada!' : '❌ Erro ao enviar')
    setEnviando(false)
  }

  return (
    <div style={{ minHeight:'100vh', background:'#f0f0f1', fontFamily:'Arial,sans-serif' }}>
      <div style={{ background:'#1d2327', padding:'12px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ color:'#fff', fontWeight:'bold', fontSize:18 }}>📧 Admin Emails — Sualuma</span>
        <a href="/admin" style={{ color:'#aaa', fontSize:13 }}>← Painel</a>
      </div>

      <div style={{ maxWidth:900, margin:'32px auto', padding:'0 16px' }}>
        {/* Stats */}
        <div style={{ display:'flex', gap:16, marginBottom:24 }}>
          {[
            { label:'Total Leads', val: leads.length, color:'#2271b1' },
            { label:'Novos', val: leads.filter(l=>l.status==='novo').length, color:'#00a32a' },
          ].map(s => (
            <div key={s.label} style={{ background:'#fff', borderRadius:8, padding:'16px 24px', flex:1, borderTop:`4px solid ${s.color}` }}>
              <div style={{ fontSize:28, fontWeight:'bold', color:s.color }}>{s.val}</div>
              <div style={{ color:'#666', fontSize:13 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:8, marginBottom:16 }}>
          {([['leads','👥 Leads'],['campanha','📣 Nova Campanha'],['automatico','⚙️ Email Automático']] as const).map(([k,l]) => (
            <button key={k} onClick={() => setTab(k)} style={{ padding:'6px 16px', borderRadius:6, border:'none', cursor:'pointer', background: tab===k ? '#2271b1' : '#fff', color: tab===k ? '#fff' : '#333', fontWeight: tab===k ? 'bold' : 'normal' }}>
              {l}
            </button>
          ))}
        </div>

        {/* Leads */}
        {tab === 'leads' && (
          <div style={{ background:'#fff', borderRadius:8, overflow:'hidden', boxShadow:'0 2px 8px #0001' }}>
            {leads.length === 0 ? (
              <div style={{ padding:40, textAlign:'center', color:'#999' }}>Nenhum lead ainda.</div>
            ) : leads.map((l, i) => (
              <div key={l.id} style={{ padding:'14px 24px', borderBottom: i < leads.length-1 ? '1px solid #f0f0f1' : 'none', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontWeight:'bold' }}>{l.nome}</div>
                  <div style={{ color:'#666', fontSize:13 }}>{l.email}</div>
                </div>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <span style={{ background: l.status==='novo' ? '#e8f5e9' : '#f5f5f5', color: l.status==='novo' ? '#2e7d32' : '#666', padding:'3px 10px', borderRadius:20, fontSize:12 }}>{l.status}</span>
                  <span style={{ color:'#aaa', fontSize:12 }}>{new Date(l.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Campanha */}
        {tab === 'campanha' && (
          <div style={{ background:'#fff', borderRadius:8, padding:24, boxShadow:'0 2px 8px #0001' }}>
            <h3 style={{ margin:'0 0 16px' }}>Enviar Campanha para todos os leads</h3>
            <div style={{ marginBottom:12 }}>
              <label style={{ display:'block', fontSize:13, color:'#555', marginBottom:4 }}>Assunto</label>
              <input value={campanha.subject} onChange={e => setCampanha({...campanha, subject: e.target.value})}
                style={{ width:'100%', padding:'8px 12px', borderRadius:6, border:'1px solid #ddd', fontSize:14, boxSizing:'border-box' }} />
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block', fontSize:13, color:'#555', marginBottom:4 }}>Conteúdo HTML</label>
              <textarea value={campanha.html} onChange={e => setCampanha({...campanha, html: e.target.value})} rows={8}
                placeholder="<h1>Olá!</h1><p>Sua mensagem aqui...</p>"
                style={{ width:'100%', padding:'8px 12px', borderRadius:6, border:'1px solid #ddd', fontSize:13, fontFamily:'monospace', boxSizing:'border-box' }} />
            </div>
            {msg && <div style={{ marginBottom:12, fontWeight:'bold', color: msg.includes('✅') ? 'green' : 'red' }}>{msg}</div>}
            <button onClick={enviarCampanha} disabled={enviando} style={{ background:'#2271b1', color:'#fff', border:'none', borderRadius:6, padding:'10px 24px', cursor:'pointer', fontWeight:'bold', fontSize:15 }}>
              {enviando ? 'Enviando...' : '🚀 Enviar Campanha'}
            </button>
          </div>
        )}

        {/* Email automático */}
        {tab === 'automatico' && (
          <div style={{ background:'#fff', borderRadius:8, padding:24, boxShadow:'0 2px 8px #0001' }}>
            <h3 style={{ margin:'0 0 8px' }}>⚙️ Email Automático de Boas-vindas</h3>
            <p style={{ color:'#666', fontSize:14, marginBottom:16 }}>Este email é enviado automaticamente quando um novo lead entra. Edite o arquivo <code>app/api/leads/route.ts</code> para personalizar.</p>
            <div style={{ background:'#f6f7f7', borderRadius:6, padding:16, fontFamily:'monospace', fontSize:13, color:'#333' }}>
              subject: <b>"Bem-vindo 🎁"</b><br/>
              html: <b>&lt;h1&gt;Olá &#123;nome&#125;&lt;/h1&gt;&lt;p&gt;Você entrou na lista 🚀&lt;/p&gt;</b>
            </div>
            <p style={{ color:'#888', fontSize:13, marginTop:12 }}>Em breve: editor visual do email automático direto aqui.</p>
          </div>
        )}
      </div>
    </div>
  )
}
