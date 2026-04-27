import { NextResponse } from 'next/server'
import { makeId, readClientDashboard, saveClientDashboard } from '@/lib/client-dashboard-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const data = await readClientDashboard()
  return NextResponse.json(data.projects)
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>
    const name = String(body.name ?? '').trim()

    if (!name) {
      return NextResponse.json(
        { error: 'Nome do projeto é obrigatório.' },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()

    const project = {
      id: makeId('proj'),
      name,
      description: String(body.description ?? '').trim(),
      status: String(body.status ?? 'em_andamento'),
      progress: Number(body.progress ?? 0),
      nextStep: String(body.nextStep ?? 'Aguardando próximos passos.'),
      createdAt: now,
      updatedAt: now,
    }

    const data = await readClientDashboard()
    data.projects.unshift(project)

    await saveClientDashboard(data)

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar projeto:', error)
    return NextResponse.json(
      { error: 'Erro ao criar projeto.' },
      { status: 500 }
    )
  }
}
