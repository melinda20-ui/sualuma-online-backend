import { readClientDashboard, saveClientDashboard } from '@/lib/client-dashboard-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PUBLIC_BASE_URL = 'https://dashboardcliente.sualuma.online'

function makeId(prefix = 'item') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const text = await response.text().catch(() => '')

    return {
      ok: response.ok,
      status: response.status,
      response: text,
    }
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error)

    return {
      ok: false,
      status: 0,
      response: 'Falha ao chamar /api/send-single',
    }
  }
}

function htmlPage(content: string) {
  return new Response(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Responder proposta</title>
      <style>
        * { box-sizing: border-box; }

        body {
          margin: 0;
          min-height: 100vh;
          display: grid;
          place-items: center;
          background:
            radial-gradient(circle at top left, rgba(124,58,237,.32), transparent 34%),
            radial-gradient(circle at top right, rgba(14,165,233,.24), transparent 32%),
            linear-gradient(180deg, #11104a, #020617);
          color: white;
          font-family: Arial, sans-serif;
          padding: 20px;
        }

        main {
          width: min(680px, 100%);
          padding: 32px;
          border-radius: 28px;
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid rgba(255,255,255,0.14);
          box-shadow: 0 30px 90px rgba(0,0,0,.45);
          text-align: center;
        }

        h1 {
          margin: 0 0 10px;
          font-size: clamp(30px, 7vw, 46px);
          line-height: 1.05;
        }

        p {
          color: #dbeafe;
          line-height: 1.55;
        }

        .card {
          margin: 20px 0;
          padding: 18px;
          border-radius: 20px;
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.1);
          text-align: left;
        }

        a.btn {
          display: inline-flex;
          justify-content: center;
          align-items: center;
          min-height: 46px;
          padding: 0 18px;
          border-radius: 999px;
          color: white;
          background: linear-gradient(135deg, #7c3aed, #0ea5e9);
          text-decoration: none;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <main>${content}</main>
    </body>
    </html>
  `, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const meetingId = url.searchParams.get('meetingId')
    const action = url.searchParams.get('action')

    if (!meetingId || !action) {
      return htmlPage(`
        <h1>Resposta inválida</h1>
        <p>Faltam informações para responder essa proposta.</p>
        <a class="btn" href="${PUBLIC_BASE_URL}">Voltar</a>
      `)
    }

    const data = await readClientDashboard() as any
    const meeting = data.meetings.find((item: any) => item.id === meetingId)

    if (!meeting) {
      return htmlPage(`
        <h1>Reunião não encontrada</h1>
        <p>Não encontramos essa reunião.</p>
        <a class="btn" href="${PUBLIC_BASE_URL}">Voltar</a>
      `)
    }

    if (action === 'aceitar') {
      if (!meeting.proposedAt) {
        return htmlPage(`
          <h1>Nova data não encontrada</h1>
          <p>Essa reunião não tem uma nova data proposta.</p>
          <a class="btn" href="${PUBLIC_BASE_URL}">Voltar</a>
        `)
      }

      meeting.scheduledAt = meeting.proposedAt
      meeting.status = 'data_aceita_cliente'
      meeting.clientAcceptedAt = new Date().toISOString()
      meeting.updatedAt = new Date().toISOString()

      await saveClientDashboard(data)

      const confirmUrl = `${PUBLIC_BASE_URL}/api/cliente/reunioes/confirmar?meetingId=${encodeURIComponent(meetingId)}`

      if (meeting.providerEmail) {
        await sendSingleEmail({
          email: meeting.providerEmail,
          name: meeting.providerName || 'prestador',
          subject: 'Cliente aceitou a nova data da reunião',
          htmlContent: `
            <h2>Cliente aceitou a nova data ✅</h2>
            <p>Olá, {{name}}.</p>
            <p>O cliente <strong>${meeting.clientName || 'Cliente'}</strong> aceitou a nova data sugerida.</p>
            <p><strong>Data aceita:</strong> ${formatDateBR(meeting.scheduledAt)}</p>
            <p>Agora você precisa colocar o link da reunião e confirmar.</p>
            <p>
              <a href="${confirmUrl}" style="display:inline-block;background:#2563eb;color:white;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:bold;">
                Informar link e confirmar reunião
              </a>
            </p>
          `,
        })
      }

      return htmlPage(`
        <h1>Nova data aceita ✅</h1>
        <p>O prestador recebeu um e-mail para informar o link da reunião e confirmar.</p>

        <div class="card">
          <p><strong>Data aceita:</strong> ${escapeHtml(formatDateBR(meeting.scheduledAt))}</p>
        </div>

        <a class="btn" href="${PUBLIC_BASE_URL}">Voltar ao painel</a>
      `)
    }

    if (action === 'negar') {
      meeting.status = 'cliente_recusou_nova_data'
      meeting.clientRejectedAt = new Date().toISOString()
      meeting.updatedAt = new Date().toISOString()

      const draft = 'Não consigo esta data porque… '

      data.messages = Array.isArray(data.messages) ? data.messages : []

      data.messages.unshift({
        id: makeId('msg'),
        projectId: meeting.projectId || '',
        from: meeting.clientName || 'Cliente',
        to: meeting.providerName || 'Prestador',
        text: draft,
        read: false,
        type: 'draft_hint',
        createdAt: new Date().toISOString(),
      })

      await saveClientDashboard(data)

      const chatUrl = `${PUBLIC_BASE_URL}/?draft=${encodeURIComponent(draft)}&meetingId=${encodeURIComponent(meetingId)}#mensagens`

      return Response.redirect(chatUrl, 302)
    }

    return htmlPage(`
      <h1>Ação inválida</h1>
      <p>Escolha aceitar ou negar a proposta.</p>
      <a class="btn" href="${PUBLIC_BASE_URL}">Voltar</a>
    `)
  } catch (error) {
    console.error('Erro ao responder proposta:', error)

    return htmlPage(`
      <h1>Erro</h1>
      <p>Não conseguimos responder essa proposta agora.</p>
      <a class="btn" href="${PUBLIC_BASE_URL}">Voltar</a>
    `)
  }
}
