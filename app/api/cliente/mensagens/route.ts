import { NextResponse } from 'next/server'
import { makeId, readClientDashboard, saveClientDashboard } from '@/lib/client-dashboard-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const data = await readClientDashboard()
  const url = new URL(req.url)
  const projectId = url.searchParams.get('projectId')

  const messages = projectId
    ? data.messages.filter((message) => message.projectId === projectId)
    : data.messages

  return NextResponse.json(messages)
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>
    const text = String(body.text ?? '').trim()

    if (!text) {
      return NextResponse.json(
        { error: 'Mensagem é obrigatória.' },
        { status: 400 }
      )
    }

    const message = {
      id: makeId('msg'),
      projectId: String(body.projectId ?? '').trim(),
      from: String(body.from ?? 'Cliente Sualuma'),
      to: String(body.to ?? 'Sualuma Online'),
      text,
      read: body.read === true,
      createdAt: new Date().toISOString(),
    }

    const data = await readClientDashboard()
    data.messages.unshift(message)

    await saveClientDashboard(data)

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar mensagem:', error)
    return NextResponse.json(
      { error: 'Erro ao criar mensagem.' },
      { status: 500 }
    )
  }
}
