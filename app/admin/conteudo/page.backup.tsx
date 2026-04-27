'use client'
import { useEffect, useState } from 'react'

type Post = { id: number; title: string; slug: string; excerpt?: string; content: string; status: string; createdAt: string }

export default function AdminBlog() {
  const [posts, setPosts] = useState<Post[]>([])
  const [tab, setTab] = useState<'published'|'draft'>('published')
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ title: '', slug: '', excerpt: '', content: '', status: 'draft' })
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetch('/api/posts').then(r=>r.json()).then(setPosts) }, [])

  const filtered = posts.filter(p => p.status === (tab === 'published' ? 'published' : 'draft'))

  async function salvar() {
    setLoading(true)
    await fetch('/api/posts', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(form) })
    const updated = await fetch('/api/posts').then(r=>r.json())
    setPosts(updated)
    setCreating(false)
    setForm({ title:'', slug:'', excerpt:'', content:'', status:'draft' })
    setLoading(false)
  }

  async function deletar(id: number) {
    if (!confirm('Deletar post?')) return
    await fetch(`/api/posts/${id}`, { method: 'DELETE' })
    setPosts(posts.filter(p => p.id !== id))
  }

  async function publicar(p: Post) {
    await fetch(`/api/posts/${p.id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ status: p.status === 'published' ? 'draft' : 'published' }) })
    setPosts(posts.map(x => x.id === p.id ? { ...x, status: x.status === 'published' ? 'draft' : 'published' } : x))
  }

  return (
    <div style={{ minHeight:'100vh', background:'#f0f0f1', fontFamily:'Arial,sans-serif' }}>
      {/* Header */}
      <div style={{ background:'#1d2327', padding:'12px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ color:'#fff', fontWeight:'bold', fontSize:18 }}>📚 Admin Blog — Sualuma</span>
        <a href="/admin" style={{ color:'#aaa', fontSize:13 }}>← Painel</a>
      </div>

      <div style={{ maxWidth:900, margin:'32px auto', padding:'0 16px' }}>
        {/* Stats */}
        <div style={{ display:'flex', gap:16, marginBottom:24 }}>
          {[
            { label:'Publicados', val: posts.filter(p=>p.status==='published').length, color:'#00a32a' },
            { label:'Rascunhos', val: posts.filter(p=>p.status==='draft').length, color:'#dba617' },
            { label:'Total', val: posts.length, color:'#2271b1' },
          ].map(s => (
            <div key={s.label} style={{ background:'#fff', borderRadius:8, padding:'16px 24px', flex:1, borderTop:`4px solid ${s.color}` }}>
              <div style={{ fontSize:28, fontWeight:'bold', color:s.color }}>{s.val}</div>
              <div style={{ color:'#666', fontSize:13 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Botão novo post */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div style={{ display:'flex', gap:8 }}>
            {(['published','draft'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ padding:'6px 16px', borderRadius:6, border:'none', cursor:'pointer', background: tab===t ? '#2271b1' : '#fff', color: tab===t ? '#fff' : '#333', fontWeight: tab===t ? 'bold' : 'normal' }}>
                {t === 'published' ? '✅ Publicados' : '📝 Rascunhos'}
              </button>
            ))}
          </div>
          <button onClick={() => setCreating(true)} style={{ background:'#2271b1', color:'#fff', border:'none', borderRadius:6, padding:'8px 18px', cursor:'pointer', fontWeight:'bold' }}>
            + Novo Post
          </button>
        </div>

        {/* Form novo post */}
        {creating && (
          <div style={{ background:'#fff', borderRadius:8, padding:24, marginBottom:24, boxShadow:'0 2px 8px #0001' }}>
            <h3 style={{ margin:'0 0 16px' }}>Novo Post</h3>
            {[
              { label:'Título', key:'title', type:'text' },
              { label:'Slug (ex: meu-post)', key:'slug', type:'text' },
              { label:'Resumo', key:'excerpt', type:'text' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom:12 }}>
                <label style={{ display:'block', fontSize:13, color:'#555', marginBottom:4 }}>{f.label}</label>
                <input value={(form as any)[f.key]} onChange={e => setForm({...form, [f.key]: e.target.value})}
                  style={{ width:'100%', padding:'8px 12px', borderRadius:6, border:'1px solid #ddd', fontSize:14, boxSizing:'border-box' }} />
              </div>
            ))}
            <div style={{ marginBottom:12 }}>
              <label style={{ display:'block', fontSize:13, color:'#555', marginBottom:4 }}>Conteúdo</label>
              <textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})} rows={6}
                style={{ width:'100%', padding:'8px 12px', borderRadius:6, border:'1px solid #ddd', fontSize:14, boxSizing:'border-box' }} />
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}
                style={{ padding:'8px 12px', borderRadius:6, border:'1px solid #ddd' }}>
                <option value="draft">Rascunho</option>
                <option value="published">Publicar agora</option>
              </select>
              <button onClick={salvar} disabled={loading} style={{ background:'#00a32a', color:'#fff', border:'none', borderRadius:6, padding:'8px 18px', cursor:'pointer', fontWeight:'bold' }}>
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
              <button onClick={() => setCreating(false)} style={{ background:'#ddd', border:'none', borderRadius:6, padding:'8px 18px', cursor:'pointer' }}>Cancelar</button>
            </div>
          </div>
        )}

        {/* Lista de posts */}
        <div style={{ background:'#fff', borderRadius:8, overflow:'hidden', boxShadow:'0 2px 8px #0001' }}>
          {filtered.length === 0 ? (
            <div style={{ padding:40, textAlign:'center', color:'#999' }}>Nenhum post aqui ainda.</div>
          ) : filtered.map((p, i) => (
            <div key={p.id} style={{ padding:'16px 24px', borderBottom: i < filtered.length-1 ? '1px solid #f0f0f1' : 'none', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontWeight:'bold', fontSize:15 }}>{p.title}</div>
                <div style={{ color:'#888', fontSize:12, marginTop:2 }}>{p.slug} · {new Date(p.createdAt).toLocaleDateString('pt-BR')}</div>
                {p.excerpt && <div style={{ color:'#666', fontSize:13, marginTop:4 }}>{p.excerpt}</div>}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => publicar(p)} style={{ padding:'5px 12px', borderRadius:5, border:'none', cursor:'pointer', background: p.status==='published' ? '#dba617' : '#00a32a', color:'#fff', fontSize:12 }}>
                  {p.status === 'published' ? 'Despublicar' : 'Publicar'}
                </button>
                <button onClick={() => deletar(p.id)} style={{ padding:'5px 12px', borderRadius:5, border:'none', cursor:'pointer', background:'#d63638', color:'#fff', fontSize:12 }}>
                  Deletar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
