import { readClientDashboard, saveClientDashboard } from '@/lib/client-dashboard-store'

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

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function makeGoogleCalendarLink(meeting: any, meetingLink: string) {
  const start = new Date(meeting.scheduledAt)
  const end = new Date(start.getTime() + 60 * 60 * 1000)

  const format = (date: Date) =>
    date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')

  const title = encodeURIComponent(meeting.title || 'Reunião Sualuma Online')

  const details = encodeURIComponent(
`Reunião confirmada pela Sualuma Online.

Cliente: ${meeting.clientName || ''}
Prestador: ${meeting.providerName || ''}

Link da reunião:
${meetingLink}

Observações:
${meeting.notes || ''}

Mensagem do prestador:
${meeting.providerMessage || ''}`
  )

  const location = encodeURIComponent(meetingLink)

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${format(start)}/${format(end)}&details=${details}&location=${location}`
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

function htmlPage(content: string) {
  return new Response(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Confirmar reunião</title>
      <style>
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          min-height: 100vh;
          display: grid;
          place-items: center;
          background:
            radial-gradient(circle at top left, rgba(124,58,237,.3), transparent 34%),
            radial-gradient(circle at top right, rgba(14,165,233,.24), transparent 32%),
            linear-gradient(180deg, #11104a, #020617);
          color: white;
          font-family: Arial, sans-serif;
          padding: 20px;
        }

        main {
          width: min(700px, 100%);
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

        input,
        textarea {
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
          min-height: 110px;
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

        button,
        a.btn {
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

        .link {
          color: #93c5fd;
          word-break: break-all;
        }
      </style>
    </head>
    <body>
      <main>
        ${content}
      </main>
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
        <a class="btn ghost" href="https://dashboardcliente.sualuma.online">Voltar</a>
      `)
    }

    const data = await readClientDashboard() as any
    const meeting = data.meetings.find((item: any) => item.id === meetingId)

    if (!meeting) {
      return htmlPage(`
        <h1>Reunião não encontrada</h1>
        <p>Não encontramos essa solicitação de reunião.</p>
        <a class="btn ghost" href="https://dashboardcliente.sualuma.online">Voltar</a>
      `)
    }

    const dataFormatada = formatDateBR(meeting.scheduledAt)

    if (meeting.status === 'confirmada' && meeting.link) {
      return htmlPage(`
        <div class="success">
          <h1>Reunião já confirmada ✅</h1>
          <p>Esta reunião já foi confirmada.</p>

          <div class="card">
            <p><strong>Cliente:</strong> ${escapeHtml(meeting.clientName)}</p>
            <p><strong>Data:</strong> ${escapeHtml(dataFormatada)}</p>
            <p><strong>Link:</strong></p>
            <p>
              <a class="link" href="${escapeHtml(meeting.link)}" target="_blank" rel="noopener noreferrer">
                ${escapeHtml(meeting.link)}
              </a>
            </p>
          </div>

          <div class="actions" style="justify-content:center;">
            <a class="btn" href="${escapeHtml(meeting.link)}" target="_blank" rel="noopener noreferrer">Abrir reunião</a>
            <a class="btn ghost" href="https://dashboardcliente.sualuma.online">Voltar</a>
          </div>
        </div>
      `)
    }

    return htmlPage(`
      <h1>Confirmar reunião</h1>
      <p>Antes de confirmar, cole abaixo o link da reunião online. Pode ser Google Meet, Zoom, Teams, Whereby ou qualquer outro link.</p>

      <div class="card">
        <p><strong>Cliente:</strong> ${escapeHtml(meeting.clientName || 'Cliente')}</p>
        <p><strong>Prestador:</strong> ${escapeHtml(meeting.providerName || 'Prestador')}</p>
        <p><strong>Data solicitada:</strong> ${escapeHtml(dataFormatada)}</p>
        <p><strong>Observações:</strong> ${escapeHtml(meeting.notes || 'Sem observações.')}</p>
      </div>

      <form method="POST" action="/api/cliente/reunioes/confirmar">
        <input type="hidden" name="meetingId" value="${escapeHtml(meetingId)}" />

        <label>
          Link da reunião online
          <input
            type="url"
            name="meetingLink"
            placeholder="https://meet.google.com/abc-defg-hij"
            required
          />
        </label>

        <label>
          Mensagem opcional para o cliente
          <textarea
            name="providerMessage"
            placeholder="Exemplo: Te espero no horário combinado. Se precisar remarcar, me avise antes."
          ></textarea>
        </label>

        <div class="actions">
          <button type="submit">Confirmar reunião e enviar link</button>
          <a class="btn ghost" href="https://dashboardcliente.sualuma.online">Cancelar</a>
        </div>
      </form>
    `)
  } catch (error) {
    console.error('Erro ao abrir confirmação de reunião:', error)

    return htmlPage(`
      <h1>Erro ao abrir confirmação</h1>
      <p>Não conseguimos abrir essa confirmação agora.</p>
      <a class="btn ghost" href="https://dashboardcliente.sualuma.online">Voltar</a>
    `)
  }
}

export async function POST(req: Request) {
  try {
    const form = await req.formData()

    const meetingId = String(form.get('meetingId') || '').trim()
    const meetingLink = String(form.get('meetingLink') || '').trim()
    const providerMessage = String(form.get('providerMessage') || '').trim()

    if (!meetingId) {
      return htmlPage(`
        <h1>Reunião não encontrada</h1>
        <p>O ID da reunião não foi informado.</p>
      `)
    }

    if (!meetingLink) {
      return htmlPage(`
        <h1>Link obrigatório</h1>
        <p>Você precisa informar o link da reunião antes de confirmar.</p>
      `)
    }

    const data = await readClientDashboard() as any
    const meeting = data.meetings.find((item: any) => item.id === meetingId)

    if (!meeting) {
      return htmlPage(`
        <h1>Reunião não encontrada</h1>
        <p>Não encontramos essa solicitação de reunião.</p>
      `)
    }

    meeting.status = 'confirmada'
    meeting.confirmedAt = new Date().toISOString()
    meeting.link = meetingLink
    meeting.meetLink = meetingLink
    meeting.providerMessage = providerMessage

    const googleCalendarLink = makeGoogleCalendarLink(meeting, meetingLink)

    meeting.calendarLink = googleCalendarLink

    await saveClientDashboard(data)

    const dataFormatada = formatDateBR(meeting.scheduledAt)

    if (meeting.clientEmail) {
      await sendSingleEmail({
        email: meeting.clientEmail,
        name: meeting.clientName || 'cliente',
        subject: 'Parabéns, sua reunião foi confirmada',
        htmlContent: `
          <h2>Sua reunião foi confirmada 🎉</h2>
          <p>Olá, {{name}}.</p>
          <p>Sua reunião com <strong>${meeting.providerName || 'o prestador de serviço'}</strong> foi confirmada.</p>

          <p><strong>Data:</strong> ${dataFormatada}</p>

          <p><strong>Link da reunião:</strong></p>
          <p>
            <a href="${meetingLink}" style="display:inline-block;background:#2563eb;color:white;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:bold;">
              Entrar na reunião
            </a>
          </p>

          <p>
            <a href="${googleCalendarLink}" style="display:inline-block;background:#7c3aed;color:white;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:bold;">
              Adicionar ao Google Agenda
            </a>
          </p>

          ${
            providerMessage
              ? `<p><strong>Mensagem do prestador:</strong> ${providerMessage}</p>`
              : ''
          }

          <p>Lembrete: entre alguns minutos antes do horário combinado.</p>
        `,
      })
    }

    return htmlPage(`
      <div class="success">
        <h1>Reunião confirmada ✅</h1>
        <p>A reunião foi confirmada e o cliente recebeu um e-mail com o link.</p>

        <div class="card">
          <p><strong>Data:</strong> ${escapeHtml(dataFormatada)}</p>
          <p><strong>Link da reunião:</strong></p>
          <p>
            <a class="link" href="${escapeHtml(meetingLink)}" target="_blank" rel="noopener noreferrer">
              ${escapeHtml(meetingLink)}
            </a>
          </p>
        </div>

        <div class="actions" style="justify-content:center;">
          <a class="btn" href="${escapeHtml(meetingLink)}" target="_blank" rel="noopener noreferrer">Abrir link da reunião</a>
          <a class="btn ghost" href="https://dashboardcliente.sualuma.online">Voltar</a>
        </div>
      </div>
    `)
  } catch (error) {
    console.error('Erro ao confirmar reunião:', error)

    return htmlPage(`
      <h1>Erro ao confirmar reunião</h1>
      <p>Não conseguimos confirmar a reunião agora.</p>
      <a class="btn ghost" href="https://dashboardcliente.sualuma.online">Voltar</a>
    `)
  }
}
