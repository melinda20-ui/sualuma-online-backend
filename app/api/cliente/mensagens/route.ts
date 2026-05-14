import { NextResponse } from 'next/server'
import { getClienteTenant, syncClientCustomer } from '@/lib/client-tenant-auth'
import { makeId, readClientDashboard, saveClientDashboard } from '@/lib/client-dashboard-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const auth = await getClienteTenant()
  if (!auth.ok) return auth.response

  const data = await readClientDashboard(auth.tenantId)
  syncClientCustomer(data, auth.user)
  const url = new URL(req.url)
  const projectId = url.searchParams.get('projectId')

  const messages = projectId
    ? data.messages.filter((message) => message.projectId === projectId)
    : data.messages

  return NextResponse.json(messages)
}

export async function POST(req: Request) {
  const auth = await getClienteTenant()
  if (!auth.ok) return auth.response

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
      from: String(body.from ?? ''),
      to: String(body.to ?? ''),
      text,
      read: body.read === true,
      createdAt: new Date().toISOString(),
    }

    const data = await readClientDashboard(auth.tenantId)
  syncClientCustomer(data, auth.user)
    data.messages.unshift(message)

    await saveClientDashboard(data, auth.tenantId)

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar mensagem:', error)
    return NextResponse.json(
      { error: 'Erro ao criar mensagem.' },
      { status: 500 }
    )
  }
}
