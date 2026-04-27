import { NextResponse } from 'next/server'
import { readClientDashboard, saveClientDashboard } from '@/lib/client-dashboard-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type NotificationAudience = 'client' | 'provider' | 'all'

type NotificationItem = {
  id: string
  audience: NotificationAudience
  type: string
  title: string
  message: string
  status?: string
  meetingId?: string
  projectId?: string
  actionUrl?: string
  actionLabel?: string
  createdAt: string
}

function makeId(prefix = 'notif') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function formatDateBR(value: unknown) {
  const date = new Date(String(value || ''))

  if (Number.isNaN(date.getTime())) {
    return String(value || '')
  }

  return date.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getDateValue(value: unknown) {
  const date = new Date(String(value || ''))
  return Number.isNaN(date.getTime()) ? 0 : date.getTime()
}

function buildMeetingNotifications(data: any): NotificationItem[] {
  const meetings = Array.isArray(data.meetings) ? data.meetings : []
  const notifications: NotificationItem[] = []

  for (const meeting of meetings) {
    const id = String(meeting.id || '')
    const status = String(meeting.status || '')
    const createdAt = String(meeting.updatedAt || meeting.createdAt || meeting.scheduledAt || new Date().toISOString())
    const dateText = formatDateBR(meeting.scheduledAt)
    const providerName = meeting.providerName || 'Prestador'
    const clientName = meeting.clientName || 'Cliente'

    if (!id) continue

    if (status === 'aguardando_confirmacao_prestador') {
      notifications.push({
        id: `provider-pending-${id}`,
        audience: 'provider',
        type: 'meeting_pending_provider',
        title: 'Nova reunião aguardando confirmação',
        message: `${clientName} solicitou uma reunião para ${dateText}. Mesmo se o e-mail falhar, esta solicitação fica salva aqui.`,
        status,
        meetingId: id,
        actionUrl: `/api/cliente/reunioes/confirmar?meetingId=${encodeURIComponent(id)}`,
        actionLabel: 'Informar link e confirmar',
        createdAt,
      })

      notifications.push({
        id: `client-waiting-${id}`,
        audience: 'client',
        type: 'meeting_waiting_client',
        title: 'Reunião aguardando confirmação',
        message: `Sua reunião com ${providerName} para ${dateText} está aguardando confirmação do prestador.`,
        status,
        meetingId: id,
        createdAt,
      })
    }

    if (status === 'nova_data_proposta') {
      notifications.push({
        id: `client-new-date-${id}`,
        audience: 'client',
        type: 'meeting_new_date_client',
        title: 'O prestador sugeriu uma nova data',
        message: `${providerName} sugeriu uma nova data: ${formatDateBR(meeting.proposedAt)}. Motivo: ${meeting.providerRefusalReason || 'sem motivo informado.'}`,
        status,
        meetingId: id,
        actionUrl: `/api/cliente/reunioes/responder-proposta?meetingId=${encodeURIComponent(id)}&action=aceitar`,
        actionLabel: 'Aceitar nova data',
        createdAt,
      })
    }

    if (status === 'data_aceita_cliente') {
      notifications.push({
        id: `provider-client-accepted-${id}`,
        audience: 'provider',
        type: 'meeting_date_accepted_provider',
        title: 'Cliente aceitou a nova data',
        message: `${clientName} aceitou a nova data da reunião: ${formatDateBR(meeting.scheduledAt)}. Agora informe o link e confirme.`,
        status,
        meetingId: id,
        actionUrl: `/api/cliente/reunioes/confirmar?meetingId=${encodeURIComponent(id)}`,
        actionLabel: 'Informar link e confirmar',
        createdAt,
      })
    }

    if (status === 'cliente_recusou_nova_data') {
      notifications.push({
        id: `provider-client-rejected-${id}`,
        audience: 'provider',
        type: 'meeting_date_rejected_provider',
        title: 'Cliente recusou a nova data',
        message: `${clientName} recusou a nova data sugerida. O ajuste deve continuar pelo chat interno.`,
        status,
        meetingId: id,
        createdAt,
      })
    }

    if (status === 'confirmada' || status === 'agendada') {
      notifications.push({
        id: `client-confirmed-${id}`,
        audience: 'client',
        type: 'meeting_confirmed_client',
        title: 'Reunião confirmada',
        message: `Sua reunião com ${providerName} foi confirmada para ${dateText}.${meeting.meetLink || meeting.link ? ' O link está salvo no painel.' : ''}`,
        status,
        meetingId: id,
        actionUrl: meeting.meetLink || meeting.link || '',
        actionLabel: meeting.meetLink || meeting.link ? 'Abrir link da reunião' : '',
        createdAt,
      })
    }
  }

  return notifications
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const audience = String(url.searchParams.get('audience') || 'client') as NotificationAudience

    const data = await readClientDashboard() as any

    const manualNotifications = Array.isArray(data.internalNotifications)
      ? data.internalNotifications
      : []

    const meetingNotifications = buildMeetingNotifications(data)

    const allNotifications = [...manualNotifications, ...meetingNotifications]
      .filter((item: NotificationItem) => {
        return item.audience === audience || item.audience === 'all'
      })
      .sort((a: NotificationItem, b: NotificationItem) => {
        return getDateValue(b.createdAt) - getDateValue(a.createdAt)
      })
      .slice(0, 50)

    return NextResponse.json({
      ok: true,
      audience,
      total: allNotifications.length,
      notifications: allNotifications,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Erro ao listar notificações internas:', error)

    return NextResponse.json(
      { ok: false, error: 'Erro ao listar notificações internas.' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const data = await readClientDashboard() as any

    data.internalNotifications = Array.isArray(data.internalNotifications)
      ? data.internalNotifications
      : []

    const notification: NotificationItem = {
      id: makeId(),
      audience: body.audience || 'all',
      type: body.type || 'manual',
      title: body.title || 'Nova notificação',
      message: body.message || '',
      status: body.status || 'nova',
      meetingId: body.meetingId || '',
      projectId: body.projectId || '',
      actionUrl: body.actionUrl || '',
      actionLabel: body.actionLabel || '',
      createdAt: new Date().toISOString(),
    }

    data.internalNotifications.unshift(notification)

    await saveClientDashboard(data)

    return NextResponse.json({
      ok: true,
      notification,
    })
  } catch (error) {
    console.error('Erro ao criar notificação interna:', error)

    return NextResponse.json(
      { ok: false, error: 'Erro ao criar notificação interna.' },
      { status: 500 }
    )
  }
}
