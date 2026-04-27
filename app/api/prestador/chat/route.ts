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

function ensureChats(data: any) {
  if (!data.providerChats) {
    data.providerChats = {
      clientMessages: [
        {
          id: 'client-chat-demo-1',
          from: 'client',
          name: 'Cliente Sualuma',
          message: 'Oi, gostaria de confirmar os próximos passos do projeto.',
          createdAt: now(),
        },
        {
          id: 'client-chat-demo-2',
          from: 'provider',
          name: 'Prestador',
          message: 'Claro! Vou organizar as etapas e te aviso por aqui.',
          createdAt: now(),
        },
      ],
      aiMessages: [
        {
          id: 'ai-chat-demo-1',
          from: 'ai',
          name: 'Sualuma IA',
          message: 'Olá! Eu posso te ajudar a montar propostas, organizar entregas, criar checklists, responder clientes e preparar próximos passos.',
          createdAt: now(),
        },
      ],
    }
  }

  if (!Array.isArray(data.providerChats.clientMessages)) {
    data.providerChats.clientMessages = []
  }

  if (!Array.isArray(data.providerChats.aiMessages)) {
    data.providerChats.aiMessages = []
  }

  return data
}

function aiReply(message: string) {
  const text = message.toLowerCase()

  if (text.includes('proposta')) {
    return 'Perfeito. Para montar uma proposta forte, separe: objetivo do cliente, escopo, prazo, valor, etapas de entrega, revisões inclusas e próximos passos para aprovação.'
  }

  if (text.includes('cliente')) {
    return 'Você pode responder de forma profissional assim: “Perfeito, recebi sua mensagem. Vou revisar os detalhes e te retorno com o próximo passo organizado ainda hoje.”'
  }

  if (text.includes('github') || text.includes('salvar')) {
    return 'Antes de alterar o projeto, salve uma versão. Depois registre o que mudou: página alterada, arquivo mexido, motivo da alteração e ponto de recuperação.'
  }

  if (text.includes('entrega') || text.includes('projeto')) {
    return 'Organize a entrega em 4 blocos: briefing confirmado, execução, revisão do cliente e aprovação final. Isso evita confusão e aumenta a confiança.'
  }

  return 'Entendi. Transformando isso em ação prática: defina o objetivo, liste as tarefas, escolha a prioridade de agora e registre o próximo passo no projeto.'
}

export async function GET(request: NextRequest) {
  try {
    const type = request.nextUrl.searchParams.get('type') === 'ai' ? 'ai' : 'client'

    const data = ensureChats(await readScopedDashboard(request, 'provider'))

    return json({
      ok: true,
      type,
      messages: type === 'ai'
        ? data.providerChats.aiMessages
        : data.providerChats.clientMessages,
      updatedAt: data.updatedAt || now(),
    })
  } catch (error: any) {
    return json({
      ok: false,
      error: error?.message || 'Erro ao carregar chat.',
    }, error?.status || 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const type = body.type === 'ai' ? 'ai' : 'client'
    const message = String(body.message || '').trim()

    if (!message) {
      return json({ ok: false, error: 'Mensagem vazia.' }, 400)
    }

    const data = ensureChats(await readScopedDashboard(request, 'provider'))

    if (type === 'client') {
      data.providerChats.clientMessages.push({
        id: `client-msg-${Date.now()}`,
        from: body.from || 'provider',
        name: body.name || 'Prestador',
        message,
        createdAt: now(),
      })
    } else {
      data.providerChats.aiMessages.push({
        id: `ai-user-${Date.now()}`,
        from: 'provider',
        name: 'Você',
        message,
        createdAt: now(),
      })

      data.providerChats.aiMessages.push({
        id: `ai-reply-${Date.now()}`,
        from: 'ai',
        name: 'Sualuma IA',
        message: aiReply(message),
        createdAt: now(),
      })
    }

    const saved = await saveScopedDashboard(request, 'provider', data)

    return json({
      ok: true,
      type,
      messages: type === 'ai'
        ? saved.providerChats.aiMessages
        : saved.providerChats.clientMessages,
      data: saved,
    })
  } catch (error: any) {
    return json({
      ok: false,
      error: error?.message || 'Erro ao enviar mensagem.',
    }, error?.status || 500)
  }
}
