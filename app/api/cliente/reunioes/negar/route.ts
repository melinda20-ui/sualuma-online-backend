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

function parseBrazilDateTime(value: string) {
  if (!value) return ''

  if (value.endsWith('Z')) return value

  return new Date(`${value}:00-03:00`).toISOString()
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
      <title>Negar reunião</title>
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
          width: min(740px, 100%);
          padding: 32px;
          border-radius: 28px;
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid rgba(255,255,255,0.14);
          box-shadow: 0 30px 90px rgba(0,0,0,.45);
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

        label {
          display: grid;
          gap: 8px;
          margin-top: 16px;
          color: #e2e8f0;
          font-weight: 800;
        }

        input, textarea {
          width: 100%;
          border: 1px solid rgba(255,255,255,.14);
          border-radius: 16px;
          padding: 14px 15px;
          background: rgba(15,23,42,.86);
          color: #fff;
          outline: none;
          font-size: 16px;
        }

        textarea {
          min-height: 120px;
          resize: vertical;
        }

        .card {
          margin: 20px 0;
          padding: 18px;
          border-radius: 20px;
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.1);
        }

        .actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 22px;
        }

        button, a.btn {
          display: inline-flex;
          justify-content: center;
          align-items: center;
          border: 0;
          min-height: 46px;
          padding: 0 18px;
          border-radius: 999px;
          color: white;
          background: linear-gradient(135deg, #7c3aed, #0ea5e9);
          text-decoration: none;
          font-weight: bold;
          cursor: pointer;
          font-size: 16px;
        }

        a.ghost {
          background: rgba(255,255,255,.08);
          border: 1px solid rgba(255,255,255,.14);
        }

        .success {
          text-align: center;
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

    if (!meetingId) {
      return htmlPage(`
        <h1>Reunião não encontrada</h1>
        <p>O ID da reunião não foi informado.</p>
        <a class="btn ghost" href="${PUBLIC_BASE_URL}">Voltar</a>
      `)
    }

    const data = await readClientDashboard() as any
    const meeting = data.meetings.find((item: any) => item.id === meetingId)

    if (!meeting) {
      return htmlPage(`
        <h1>Reunião não encontrada</h1>
        <p>Não encontramos essa solicitação.</p>
        <a class="btn ghost" href="${PUBLIC_BASE_URL}">Voltar</a>
      `)
    }

    return htmlPage(`
      <h1>Negar e sugerir nova data</h1>
      <p>Informe uma nova data e explique rapidamente o motivo. O cliente receberá um e-mail para aceitar ou negar essa nova sugestão.</p>

      <div class="card">
        <p><strong>Cliente:</strong> ${escapeHtml(meeting.clientName || 'Cliente')}</p>
        <p><strong>Prestador:</strong> ${escapeHtml(meeting.providerName || 'Prestador')}</p>
        <p><strong>Data original:</strong> ${escapeHtml(formatDateBR(meeting.scheduledAt))}</p>
        <p><strong>Observações do cliente:</strong> ${escapeHtml(meeting.notes || 'Sem observações.')}</p>
      </div>

      <form method="POST" action="/api/cliente/reunioes/negar">
        <input type="hidden" name="meetingId" value="${escapeHtml(meetingId)}" />

        <label>
          Nova data sugerida
          <input type="datetime-local" name="proposedAt" required />
        </label>

        <label>
          Motivo / mensagem para o cliente
          <textarea name="reason" placeholder="Exemplo: Não consigo neste horário porque já tenho outra reunião. Posso atender nesta nova data." required></textarea>
        </label>

        <div class="actions">
          <button type="submit">Enviar nova data ao cliente</button>
          <a class="btn ghost" href="${PUBLIC_BASE_URL}">Cancelar</a>
        </div>
      </form>
    `)
  } catch (error) {
    console.error('Erro ao abrir negação de reunião:', error)

    return htmlPage(`
      <h1>Erro</h1>
      <p>Não conseguimos abrir essa página agora.</p>
      <a class="btn ghost" href="${PUBLIC_BASE_URL}">Voltar</a>
    `)
  }
}

export async function POST(req: Request) {
  try {
    const form = await req.formData()

    const meetingId = String(form.get('meetingId') || '').trim()
    const proposedAtInput = String(form.get('proposedAt') || '').trim()
    const reason = String(form.get('reason') || '').trim()

    if (!meetingId || !proposedAtInput || !reason) {
      return htmlPage(`
        <h1>Campos obrigatórios</h1>
        <p>Informe a nova data e o motivo.</p>
      `)
    }

    const data = await readClientDashboard() as any
    const meeting = data.meetings.find((item: any) => item.id === meetingId)

    if (!meeting) {
      return htmlPage(`
        <h1>Reunião não encontrada</h1>
        <p>Não encontramos essa solicitação.</p>
      `)
    }

    const proposedAt = parseBrazilDateTime(proposedAtInput)

    meeting.status = 'nova_data_proposta'
    meeting.proposedAt = proposedAt
    meeting.providerRefusalReason = reason
    meeting.updatedAt = new Date().toISOString()

    await saveClientDashboard(data)

    const acceptUrl = `${PUBLIC_BASE_URL}/api/cliente/reunioes/responder-proposta?meetingId=${encodeURIComponent(meetingId)}&action=aceitar`
    const denyUrl = `${PUBLIC_BASE_URL}/api/cliente/reunioes/responder-proposta?meetingId=${encodeURIComponent(meetingId)}&action=negar`

    if (meeting.clientEmail) {
      await sendSingleEmail({
        email: meeting.clientEmail,
        name: meeting.clientName || 'cliente',
        subject: 'O prestador sugeriu uma nova data para sua reunião',
        htmlContent: `
          <h2>Nova data sugerida para sua reunião</h2>
          <p>Olá, {{name}}.</p>
          <p>O prestador <strong>${meeting.providerName || 'Prestador'}</strong> não conseguiu confirmar a data original e sugeriu uma nova data.</p>

          <p><strong>Data original:</strong> ${formatDateBR(meeting.scheduledAt)}</p>
          <p><strong>Nova data sugerida:</strong> ${formatDateBR(proposedAt)}</p>
          <p><strong>Motivo:</strong> ${reason}</p>

          <p>Você pode aceitar a nova data ou negar e combinar pelo chat interno.</p>

          <p>
            <a href="${acceptUrl}" style="display:inline-block;background:#16a34a;color:white;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:bold;">
              Aceitar nova data
            </a>
          </p>

          <p>
            <a href="${denyUrl}" style="display:inline-block;background:#dc2626;color:white;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:bold;">
              Negar e conversar no chat
            </a>
          </p>
        `,
      })
    }

    return htmlPage(`
      <div class="success">
        <h1>Nova data enviada ✅</h1>
        <p>O cliente recebeu um e-mail para aceitar ou negar a nova data.</p>

        <div class="card">
          <p><strong>Nova data sugerida:</strong> ${escapeHtml(formatDateBR(proposedAt))}</p>
          <p><strong>Motivo:</strong> ${escapeHtml(reason)}</p>
        </div>

        <a class="btn" href="${PUBLIC_BASE_URL}">Voltar</a>
      </div>
    `)
  } catch (error) {
    console.error('Erro ao negar reunião:', error)

    return htmlPage(`
      <h1>Erro ao enviar nova data</h1>
      <p>Não conseguimos enviar a nova data agora.</p>
      <a class="btn ghost" href="${PUBLIC_BASE_URL}">Voltar</a>
    `)
  }
}
