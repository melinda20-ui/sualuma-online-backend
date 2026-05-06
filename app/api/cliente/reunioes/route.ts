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

  const meetings = projectId
    ? data.meetings.filter((meeting) => meeting.projectId === projectId)
    : data.meetings

  return NextResponse.json(meetings)
}

export async function POST(req: Request) {
  const auth = await getClienteTenant()
  if (!auth.ok) return auth.response

  try {
    const body = (await req.json()) as Record<string, unknown>
    const title = String(body.title ?? '').trim()

    if (!title) {
      return NextResponse.json(
        { error: 'Título da reunião é obrigatório.' },
        { status: 400 }
      )
    }

    const meeting = {
      id: makeId('reuniao'),
      projectId: String(body.projectId ?? '').trim(),
      title,
      description: String(body.description ?? '').trim(),
      scheduledAt: String(
        body.scheduledAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      ),
      status: String(body.status ?? 'agendada'),
      link: String(body.link ?? ''),
      createdAt: new Date().toISOString(),
    }

    const data = await readClientDashboard(auth.tenantId)
  syncClientCustomer(data, auth.user)
    data.meetings.unshift(meeting)

    await saveClientDashboard(data, auth.tenantId)

    return NextResponse.json(meeting, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar reunião:', error)
    return NextResponse.json(
      { error: 'Erro ao criar reunião.' },
      { status: 500 }
    )
  }
}
