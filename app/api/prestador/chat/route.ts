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
  return String(value || '---ilustrativo---')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || '---ilustrativo---'
}

function ensureChats(data: any) {
  if (!data.providerChats) data.providerChats = {}

  if (!data.providerChats.clientThreads) {
    data.providerChats.clientThreads = {}
  }

  if (!Array.isArray(data.providerChats.aiMessages)) {
    data.providerChats.aiMessages = []
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

  return Array.from(names).map((name) => ({
    key: slug(name),
    name,
  }))
}

function aiReply(_message: string) {
  return '--- ilustrativo: esta resposta será substituída pela IA real quando configurada. ---'
}

export async function GET(request: NextRequest) {
  try {
    const type = request.nextUrl.searchParams.get('type') === 'ai' ? 'ai' : 'client'
    const clientKey = request.nextUrl.searchParams.get('clientKey') || ''

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

    const safeClientKey = clientKey || clients[0]?.key || ''

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
    const clientKey = String(body.clientKey || '')
    const clientName = String(body.clientName || '')

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
