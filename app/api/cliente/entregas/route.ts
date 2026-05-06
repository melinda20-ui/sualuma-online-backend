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

  const deliveries = projectId
    ? data.deliveries.filter((delivery) => delivery.projectId === projectId)
    : data.deliveries

  return NextResponse.json(deliveries)
}

export async function POST(req: Request) {
  const auth = await getClienteTenant()
  if (!auth.ok) return auth.response

  try {
    const body = (await req.json()) as Record<string, unknown>
    const title = String(body.title ?? '').trim()

    if (!title) {
      return NextResponse.json(
        { error: 'Título da entrega é obrigatório.' },
        { status: 400 }
      )
    }

    const delivery = {
      id: makeId('entrega'),
      projectId: String(body.projectId ?? '').trim(),
      title,
      description: String(body.description ?? '').trim(),
      status: String(body.status ?? 'pendente_revisao'),
      dueDate: String(body.dueDate ?? ''),
      url: String(body.url ?? ''),
      createdAt: new Date().toISOString(),
    }

    const data = await readClientDashboard(auth.tenantId)
  syncClientCustomer(data, auth.user)
    data.deliveries.unshift(delivery)

    await saveClientDashboard(data, auth.tenantId)

    return NextResponse.json(delivery, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar entrega:', error)
    return NextResponse.json(
      { error: 'Erro ao criar entrega.' },
      { status: 500 }
    )
  }
}
