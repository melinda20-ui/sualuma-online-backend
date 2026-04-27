'use client'

import { useEffect, useState } from 'react'

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchLeads() {
      try {
        const res = await fetch('/api/leads')
        const data = await res.json()
        setLeads(data)
      } catch (err) {
        console.log('Erro ao buscar leads', err)
      } finally {
        setLoading(false)
      }
    }

    fetchLeads()
  }, [])

  if (loading) {
    return <div style={{ padding: 20 }}>Carregando leads...</div>
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Leads</h1>
      <p>Total: {leads.length}</p>

      {leads.map((lead) => (
        <div
          key={lead.id}
          style={{
            background: '#111',
            padding: 12,
            marginBottom: 10,
            borderRadius: 8,
            color: '#fff'
          }}
        >
          <p><strong>Nome:</strong> {lead.nome}</p>
          <p><strong>Email:</strong> {lead.email}</p>
          <p><strong>Origem:</strong> {lead.origem}</p>
        </div>
      ))}
    </div>
  )
}
