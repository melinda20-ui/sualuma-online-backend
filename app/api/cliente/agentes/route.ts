import { NextResponse } from 'next/server'
import { makeId, readClientDashboard, saveClientDashboard } from '@/lib/client-dashboard-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const data = await readClientDashboard()
  return NextResponse.json(data.agents)
}

export async function POST(req: Request) {
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

    const data = await readClientDashboard()
    data.agents.unshift(agent)

    await saveClientDashboard(data)

    return NextResponse.json(agent, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar agente:', error)
    return NextResponse.json(
      { error: 'Erro ao criar agente.' },
      { status: 500 }
    )
  }
}
