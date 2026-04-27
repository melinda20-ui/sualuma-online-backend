import { NextResponse } from 'next/server'
import { makeId, readClientDashboard, saveClientDashboard } from '@/lib/client-dashboard-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function formatDateBR(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function sendSingleEmail(payload: {
  email: string
  name: string
  subject: string
  htmlContent: string
}) {
  try {
    const response = await fetch('http://127.0.0.1:3000/api/send-single', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const text = await response.text().catch(() => '')

    return {
      ok: response.ok,
      status: response.status,
      response: text,
    }
  } catch (error) {
    console.error('Erro ao tentar enviar e-mail:', error)

    return {
      ok: false,
      status: 0,
      response: 'Falha ao chamar /api/send-single',
    }
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>
    const data = await readClientDashboard() as any

    const customer = data.customer || {}

    const providerId = String(body.providerId || '').trim()
    const selectedProvider = Array.isArray(data.serviceProviders)
      ? data.serviceProviders.find((provider: any) => provider.id === providerId)
      : null

    const providerName = String(
      body.providerName || selectedProvider?.name || 'Prestador de serviço'
    ).trim()

    const providerEmail = String(
      body.providerEmail || selectedProvider?.email || ''
    ).trim()

    const clientName = String(
      body.clientName || customer.name || 'Cliente Sualuma'
    ).trim()

    const clientEmail = String(
      body.clientEmail || customer.email || ''
    ).trim()

    const scheduledAt = String(body.scheduledAt || '').trim()
    const notes = String(body.notes || '').trim()

    if (!scheduledAt) {
      return NextResponse.json(
        { error: 'Data da reunião é obrigatória.' },
        { status: 400 }
      )
    }

    if (!clientEmail) {
      return NextResponse.json(
        { error: 'E-mail do cliente não encontrado.' },
        { status: 400 }
      )
    }

    if (!providerEmail) {
      return NextResponse.json(
        { error: 'E-mail do prestador não encontrado.' },
        { status: 400 }
      )
    }

    const meetingId = makeId('reuniao')
    const createdAt = new Date().toISOString()

    const meeting = {
      id: meetingId,
      projectId: String(body.projectId || '').trim(),
      providerId,
      title: `Solicitação de reunião com ${providerName}`,
      description: notes || 'Cliente solicitou reunião pelo dashboard.',
      scheduledAt,
      status: 'aguardando_confirmacao_prestador',
      link: '',
      providerName,
      providerEmail,
      clientName,
      clientEmail,
      notes,
      createdAt,
    }

    data.meetings.unshift(meeting)

    await saveClientDashboard(data)

    const publicBaseUrl = 'https://dashboardcliente.sualuma.online'
    const confirmUrl = `${publicBaseUrl}/api/cliente/reunioes/confirmar?meetingId=${encodeURIComponent(meetingId)}`
    const denyUrl = `${publicBaseUrl}/api/cliente/reunioes/negar?meetingId=${encodeURIComponent(meetingId)}`
    const dataFormatada = formatDateBR(scheduledAt)

    const providerEmailResult = await sendSingleEmail({
      email: providerEmail,
      name: providerName,
      subject: `Nova solicitação de reunião - ${clientName}`,
      htmlContent: `
        <h2>Nova solicitação de reunião</h2>
        <p>Olá, {{name}}.</p>
        <p>O cliente <strong>${clientName}</strong> solicitou uma reunião.</p>
        <p><strong>Data solicitada:</strong> ${dataFormatada}</p>
        <p><strong>Observações:</strong> ${notes || 'Sem observações.'}</p>
        <p>Para confirmar, clique no botão abaixo, cole o link da reunião online e finalize a confirmação:</p>
        <p>
          <a href="${confirmUrl}" style="display:inline-block;background:#2563eb;color:white;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:bold;">
            Informar link e confirmar reunião
          </a>
        </p>
        <p>
          <a href="${denyUrl}" style="display:inline-block;background:#dc2626;color:white;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:bold;">
            Negar e sugerir nova data
          </a>
        </p>
      `,
    })

    const clientEmailResult = await sendSingleEmail({
      email: clientEmail,
      name: clientName,
      subject: 'Recebemos sua solicitação de reunião',
      htmlContent: `
        <h2>Sua solicitação foi enviada</h2>
        <p>Olá, {{name}}.</p>
        <p>Recebemos sua solicitação de reunião com <strong>${providerName}</strong>.</p>
        <p><strong>Data solicitada:</strong> ${dataFormatada}</p>
        <p>Agora estamos aguardando a confirmação do prestador de serviço.</p>
        <p>Assim que ele confirmar, você receberá outro e-mail com os detalhes da reunião.</p>
      `,
    })

    return NextResponse.json({
      ok: true,
      meeting,
      emails: {
        provider: providerEmailResult,
        client: clientEmailResult,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Erro ao solicitar reunião:', error)

    return NextResponse.json(
      { error: 'Erro ao solicitar reunião.' },
      { status: 500 }
    )
  }
}
