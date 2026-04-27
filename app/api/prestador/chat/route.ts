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

function slug(value: string) {
  return String(value || 'cliente-sualuma')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'cliente-sualuma'
}

function ensureChats(data: any) {
  if (!data.providerChats) data.providerChats = {}

  if (!data.providerChats.clientThreads) {
    data.providerChats.clientThreads = {}

    const oldMessages = Array.isArray(data.providerChats.clientMessages)
      ? data.providerChats.clientMessages
      : []

    data.providerChats.clientThreads['cliente-sualuma'] = oldMessages.length ? oldMessages : [
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
    ]
  }

  if (!Array.isArray(data.providerChats.aiMessages)) {
    data.providerChats.aiMessages = [
      {
        id: 'ai-chat-demo-1',
        from: 'ai',
        name: 'Sualuma IA',
        message: 'Olá! Posso ajudar a montar propostas, organizar entregas, responder clientes, criar checklists e planejar execução.',
        createdAt: now(),
      },
    ]
  }

  return data
}

function getClients(data: any) {
  const names = new Set<string>()

  ;(data.projects || []).forEach((p: any) => {
    if (p.clientName) names.add(p.clientName)
  })

  ;(data.proposals || []).forEach((p: any) => {
    if (p.clientName) names.add(p.clientName)
  })

  if (!names.size) names.add('Cliente Sualuma')

  return Array.from(names).map((name) => ({
    key: slug(name),
    name,
  }))
}

function aiReply(message: string) {
  const text = message.toLowerCase()

  if (text.includes('proposta')) {
    return 'Vamos montar uma proposta forte: comece com uma saudação, cite o problema do cliente, explique o escopo, informe prazo, valor, revisões inclusas e próximos passos para aprovação.'
  }

  if (text.includes('cliente')) {
    return 'Sugestão de resposta: “Perfeito, recebi sua mensagem. Vou revisar os detalhes e te retorno com o próximo passo organizado ainda hoje.”'
  }

  if (text.includes('kanban') || text.includes('etapa')) {
    return 'Sugestão de kanban: Briefing recebido → Em execução → Aguardando revisão → Ajustes finais → Concluído.'
  }

  if (text.includes('reunião') || text.includes('reuniao')) {
    return 'Para reunião, envie objetivo, data, horário, link e pauta. Depois registre o resumo no projeto para o cliente acompanhar.'
  }

  if (text.includes('github') || text.includes('salvar')) {
    return 'Antes de alterar o projeto, salve uma versão. Depois registre: o que mudou, onde mudou e qual é o ponto de recuperação.'
  }

  return 'Transformando isso em ação prática: defina o objetivo, liste tarefas, escolha a prioridade de agora e registre o próximo passo no projeto.'
}

export async function GET(request: NextRequest) {
  try {
    const type = request.nextUrl.searchParams.get('type') === 'ai' ? 'ai' : 'client'
    const clientKey = request.nextUrl.searchParams.get('clientKey') || 'cliente-sualuma'

    const data = ensureChats(await readScopedDashboard(request, 'provider'))
    const clients = getClients(data)

    if (type === 'ai') {
      return json({
        ok: true,
        type,
        clients,
        messages: data.providerChats.aiMessages,
        updatedAt: data.updatedAt || now(),
      })
    }

    const safeClientKey = clientKey || clients[0]?.key || 'cliente-sualuma'

    if (!data.providerChats.clientThreads[safeClientKey]) {
      data.providerChats.clientThreads[safeClientKey] = []
    }

    return json({
      ok: true,
      type,
      clients,
      clientKey: safeClientKey,
      messages: data.providerChats.clientThreads[safeClientKey],
      updatedAt: data.updatedAt || now(),
    })
  } catch (error: any) {
    return json({ ok: false, error: error?.message || 'Erro ao carregar chat.' }, error?.status || 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const type = body.type === 'ai' ? 'ai' : 'client'
    const message = String(body.message || '').trim()
    const clientKey = String(body.clientKey || 'cliente-sualuma')
    const clientName = String(body.clientName || 'Cliente Sualuma')

    if (!message) {
      return json({ ok: false, error: 'Mensagem vazia.' }, 400)
    }

    const data = ensureChats(await readScopedDashboard(request, 'provider'))

    if (type === 'client') {
      if (!data.providerChats.clientThreads[clientKey]) {
        data.providerChats.clientThreads[clientKey] = []
      }

      data.providerChats.clientThreads[clientKey].push({
        id: `client-msg-${Date.now()}`,
        from: body.from || 'provider',
        name: body.name || 'Prestador',
        clientName,
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
      data: saved,
      messages: type === 'ai'
        ? saved.providerChats.aiMessages
        : saved.providerChats.clientThreads[clientKey],
    })
  } catch (error: any) {
    return json({ ok: false, error: error?.message || 'Erro ao enviar mensagem.' }, error?.status || 500)
  }
}
