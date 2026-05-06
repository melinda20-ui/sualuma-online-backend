import { NextResponse } from 'next/server'
import { getClienteTenant, syncClientCustomer } from '@/lib/client-tenant-auth'
import { makeId, readClientDashboard, saveClientDashboard } from '@/lib/client-dashboard-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await getClienteTenant()
  if (!auth.ok) return auth.response

  const data = await readClientDashboard(auth.tenantId)
  syncClientCustomer(data, auth.user)
  return NextResponse.json(data.agents)
}

export async function POST(req: Request) {
  const auth = await getClienteTenant()
  if (!auth.ok) return auth.response

  try {
    const body = (await req.json()) as Record<string, unknown>
    const name = String(body.name ?? '').trim()

    if (!name) {
      return NextResponse.json(
        { error: 'Nome do agente é obrigatório.' },
        { status: 400 }
      )
    }

    const agent = {
      id: makeId('agent'),
      name,
      description: String(body.description ?? '').trim(),
      status: String(body.status ?? 'disponivel'),
      category: String(body.category ?? 'geral'),
    }

    const data = await readClientDashboard(auth.tenantId)
  syncClientCustomer(data, auth.user)
    data.agents.unshift(agent)

    await saveClientDashboard(data, auth.tenantId)

    return NextResponse.json(agent, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar agente:', error)
    return NextResponse.json(
      { error: 'Erro ao criar agente.' },
      { status: 500 }
    )
  }
}
