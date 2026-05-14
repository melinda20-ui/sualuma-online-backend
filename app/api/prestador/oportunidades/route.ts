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

const defaultJobs: any[] = []

function ensureOpportunities(data: any) {
  if (!Array.isArray(data.availableJobs)) {
    data.availableJobs = defaultJobs
  }

  if (!Array.isArray(data.jobProposals)) {
    data.jobProposals = []
  }

  if (!Array.isArray(data.proposals)) {
    data.proposals = []
  }

  if (!data.stats) {
    data.stats = {}
  }

  return data
}

export async function GET(request: NextRequest) {
  try {
    const data = ensureOpportunities(await readScopedDashboard(request, 'provider'))

    return json({
      ok: true,
      jobs: data.availableJobs,
      proposals: data.jobProposals,
      updatedAt: data.updatedAt || now(),
    })
  } catch (error: any) {
    return json({
      ok: false,
      error: error?.message || 'Erro ao carregar oportunidades.',
    }, error?.status || 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const action = String(body.action || '')

    const data = ensureOpportunities(await readScopedDashboard(request, 'provider'))

    if (action === 'send_proposal') {
      const jobId = String(body.jobId || '')
      const job = data.availableJobs.find((item: any) => item.id === jobId)

      if (!job) {
        return json({ ok: false, error: 'Serviço não encontrado.' }, 404)
      }

      const proposal = {
        id: `job-proposal-${Date.now()}`,
        jobId,
        clientName: job.company,
        projectTitle: job.title,
        amount: Number(body.amount || 0),
        message: String(body.message || ''),
        deadline: String(body.deadline || ''),
        status: 'pendente',
        createdAt: now(),
      }

      data.jobProposals.unshift(proposal)

      data.proposals.unshift({
        id: proposal.id,
        clientName: proposal.clientName,
        projectTitle: proposal.projectTitle,
        amount: proposal.amount,
        status: 'pendente',
        createdAt: proposal.createdAt,
      })

      data.stats.sentProposals = Number(data.stats.sentProposals || 0) + 1
      data.stats.pendingProposals = Number(data.stats.pendingProposals || 0) + 1

      const saved = await saveScopedDashboard(request, 'provider', data)

      return json({
        ok: true,
        proposal,
        data: saved,
      })
    }

    return json({ ok: false, error: 'Ação inválida.' }, 400)
  } catch (error: any) {
    return json({
      ok: false,
      error: error?.message || 'Erro ao enviar proposta.',
    }, error?.status || 500)
  }
}
