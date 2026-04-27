import { NextRequest, NextResponse } from 'next/server'
import { readScopedDashboard, saveScopedDashboard } from '@/lib/scoped-dashboard-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function json(body: any, status = 200) {
  return NextResponse.json(body, { status, headers: CORS_HEADERS })
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

function now() {
  return new Date().toISOString()
}

function ensureMeetings(data: any) {
  if (!Array.isArray(data.meetings)) data.meetings = []
  return data
}

export async function GET(request: NextRequest) {
  try {
    const clientDashboard = ensureMeetings(await readScopedDashboard(request, 'client'))

    return json({
      ok: true,
      meetings: clientDashboard.meetings,
      updatedAt: clientDashboard.updatedAt || now(),
    })
  } catch (error: any) {
    return json({ ok: false, error: error?.message || 'Erro ao carregar reuniões.' }, error?.status || 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const action = String(body.action || 'schedule_meeting')

    const clientDashboard = ensureMeetings(await readScopedDashboard(request, 'client'))

    if (action === 'schedule_meeting') {
      const meeting = {
        id: `reuniao-prestador-${Date.now()}`,
        title: String(body.title || 'Reunião do projeto'),
        clientName: String(body.clientName || clientDashboard.customer?.name || 'Cliente Sualuma'),
        providerName: String(body.providerName || 'Prestador'),
        date: String(body.date || ''),
        time: String(body.time || ''),
        link: String(body.link || ''),
        observations: String(body.observations || ''),
        status: String(body.status || 'confirmada'),
        createdAt: now(),
        updatedAt: now(),
      }

      clientDashboard.meetings.unshift(meeting)

      if (!Array.isArray(clientDashboard.internalNotifications)) {
        clientDashboard.internalNotifications = []
      }

      clientDashboard.internalNotifications.unshift({
        id: `meeting-provider-${Date.now()}`,
        audience: 'client',
        type: 'provider_meeting_created',
        title: 'Nova reunião agendada',
        message: `O prestador agendou uma reunião para ${meeting.date} às ${meeting.time}.`,
        meetingId: meeting.id,
        status: meeting.status,
        actionUrl: meeting.link,
        actionLabel: meeting.link ? 'Abrir reunião' : 'Ver reunião',
        createdAt: now(),
      })

      const saved = await saveScopedDashboard(request, 'client', clientDashboard)

      return json({
        ok: true,
        meeting,
        meetings: saved.meetings,
        data: saved,
      })
    }

    return json({ ok: false, error: 'Ação inválida.' }, 400)
  } catch (error: any) {
    return json({ ok: false, error: error?.message || 'Erro ao salvar reunião.' }, error?.status || 500)
  }
}
