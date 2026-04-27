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

const columns = [
  { id: 'briefing', title: 'Briefing' },
  { id: 'execucao', title: 'Em execução' },
  { id: 'revisao', title: 'Aguardando revisão' },
  { id: 'concluido', title: 'Concluído' },
]

function normalizeStatus(status: string) {
  const s = String(status || '').toLowerCase()

  if (s.includes('concl')) return 'concluido'
  if (s.includes('revis') || s.includes('aguard')) return 'revisao'
  if (s.includes('andamento') || s.includes('exec')) return 'execucao'
  return 'briefing'
}

function progressFor(status: string) {
  if (status === 'concluido') return 100
  if (status === 'revisao') return 85
  if (status === 'execucao') return 55
  return 20
}

function ensureClientKanban(data: any) {
  if (!Array.isArray(data.projects)) data.projects = []

  if (!data.projects.length) {
    data.projects = [
      {
        id: 'proj-site-principal',
        title: 'Site institucional principal',
        clientName: data.customer?.name || 'Cliente Sualuma',
        status: 'execucao',
        progress: 55,
        description: 'Projeto principal em andamento.',
      },
      {
        id: 'proj-pagina-vendas',
        title: 'Página de vendas',
        clientName: data.customer?.name || 'Cliente Sualuma',
        status: 'revisao',
        progress: 85,
        description: 'Entrega aguardando revisão do cliente.',
      },
    ]
  }

  return data
}

function kanbanItems(data: any) {
  return (data.projects || []).map((project: any) => {
    const status = normalizeStatus(project.status)

    return {
      id: project.id,
      title: project.title || project.name || 'Projeto sem título',
      clientName: project.clientName || data.customer?.name || 'Cliente Sualuma',
      description: project.description || project.summary || 'Projeto conectado ao dashboard do cliente.',
      status,
      progress: Number(project.progress || progressFor(status)),
    }
  })
}

export async function GET(request: NextRequest) {
  try {
    const clientDashboard = ensureClientKanban(await readScopedDashboard(request, 'client'))

    return json({
      ok: true,
      columns,
      items: kanbanItems(clientDashboard),
      updatedAt: clientDashboard.updatedAt || now(),
    })
  } catch (error: any) {
    return json({ ok: false, error: error?.message || 'Erro ao carregar kanban.' }, error?.status || 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const action = String(body.action || '')

    const clientDashboard = ensureClientKanban(await readScopedDashboard(request, 'client'))

    if (action === 'move_project') {
      const projectId = String(body.projectId || '')
      const status = normalizeStatus(String(body.status || 'briefing'))

      const project = clientDashboard.projects.find((item: any) => item.id === projectId)

      if (!project) {
        return json({ ok: false, error: 'Projeto não encontrado.' }, 404)
      }

      project.status = status
      project.progress = progressFor(status)
      project.updatedAt = now()

      if (!Array.isArray(clientDashboard.internalNotifications)) {
        clientDashboard.internalNotifications = []
      }

      clientDashboard.internalNotifications.unshift({
        id: `kanban-update-${Date.now()}`,
        audience: 'client',
        type: 'project_kanban_update',
        title: 'Projeto atualizado',
        message: `O projeto "${project.title}" foi movido para "${status}".`,
        projectId,
        status,
        createdAt: now(),
      })

      const saved = await saveScopedDashboard(request, 'client', clientDashboard)

      return json({
        ok: true,
        columns,
        items: kanbanItems(saved),
        data: saved,
      })
    }

    return json({ ok: false, error: 'Ação inválida.' }, 400)
  } catch (error: any) {
    return json({ ok: false, error: error?.message || 'Erro ao atualizar kanban.' }, error?.status || 500)
  }
}
