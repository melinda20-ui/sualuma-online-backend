import { NextRequest, NextResponse } from 'next/server'
import { readScopedDashboard, saveScopedDashboard } from '@/lib/scoped-dashboard-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}

function json(body: any, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: CORS_HEADERS
  })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS
  })
}

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function text(value: any, fallback = '') {
  return String(value ?? fallback).trim()
}

function money(value: any) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function refreshStats(data: any) {
  const proposals = Array.isArray(data.proposals) ? data.proposals : []

  data.stats = data.stats || {}
  data.stats.sentProposals = proposals.length
  data.stats.acceptedProposals = proposals.filter((p: any) => p.status === 'aceita').length
  data.stats.rejectedProposals = proposals.filter((p: any) => p.status === 'recusada').length
  data.stats.pendingProposals = proposals.filter((p: any) => p.status === 'pendente').length

  const activeClients = new Set(
    proposals
      .filter((p: any) => p.status === 'aceita')
      .map((p: any) => text(p.clientName, 'Cliente'))
  )

  data.stats.activeClients = Math.max(data.stats.activeClients || 0, activeClients.size)

  const acceptedValue = proposals
    .filter((p: any) => p.status === 'aceita')
    .reduce((sum: number, p: any) => sum + money(p.amount), 0)

  data.stats.earningsMonth = Math.max(data.stats.earningsMonth || 0, acceptedValue)
}

function addNotification(data: any, title: string, message: string, type = 'system') {
  data.notifications = Array.isArray(data.notifications) ? data.notifications : []
  data.notifications.unshift({
    id: id('notif'),
    title,
    message,
    type,
    createdAt: new Date().toISOString(),
    read: false
  })
}

export async function GET(request: NextRequest) {
  const data = await readScopedDashboard(request, 'provider')
  refreshStats(data)

  return json({
    ok: true,
    data,
    updatedAt: new Date().toISOString()
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({} as any))
    const action = text(body.action)
    const now = new Date().toISOString()
    const data = await readScopedDashboard(request, 'provider')

    if (!action) {
      return json({ ok: false, error: 'Ação não informada.' }, 400)
    }

    if (action === 'complete_setup') {
      const stepId = text(body.stepId)

      data.setup = (Array.isArray(data.setup) ? data.setup : []).map((step: any) =>
        step.id === stepId ? { ...step, done: true } : step
      )

      addNotification(data, 'Etapa concluída', `A etapa "${stepId}" foi marcada como concluída.`, 'setup')
    }

    if (action === 'update_profile') {
      data.providerProfile = {
        ...(data.providerProfile || {}),
        ...(body.profile || {}),
        updatedAt: now
      }

      addNotification(data, 'Perfil atualizado', 'Seu perfil de prestador foi atualizado.', 'profile')
    }

    if (action === 'update_receiving') {
      data.payout = {
        ...(data.payout || {}),
        ...(body.payout || {}),
        status: 'configured',
        updatedAt: now
      }

      data.setup = (Array.isArray(data.setup) ? data.setup : []).map((step: any) =>
        step.id === 'recebimento' ? { ...step, done: true } : step
      )

      addNotification(data, 'Recebimento configurado', 'Os dados de recebimento foram salvos.', 'payout')
    }

    if (action === 'add_portfolio') {
      const item = {
        id: id('portfolio'),
        title: text(body.title, 'Novo projeto'),
        category: text(body.category, 'Portfólio'),
        url: text(body.url),
        description: text(body.description, 'Projeto adicionado ao portfólio.'),
        createdAt: now
      }

      data.portfolio = [item, ...(Array.isArray(data.portfolio) ? data.portfolio : [])]

      data.setup = (Array.isArray(data.setup) ? data.setup : []).map((step: any) =>
        step.id === 'portfolio' ? { ...step, done: true } : step
      )

      addNotification(data, 'Portfólio atualizado', `Novo item adicionado: ${item.title}.`, 'portfolio')
    }

    if (action === 'add_proposal') {
      const proposal = {
        id: id('proposal'),
        clientName: text(body.clientName, 'Cliente Sualuma'),
        projectTitle: text(body.projectTitle, 'Nova proposta'),
        amount: money(body.amount),
        status: 'pendente',
        createdAt: now
      }

      data.proposals = [proposal, ...(Array.isArray(data.proposals) ? data.proposals : [])]
      addNotification(data, 'Nova proposta criada', `Proposta enviada para ${proposal.clientName}.`, 'proposal')
    }

    if (action === 'update_proposal_status') {
      const proposalId = text(body.proposalId)
      const status = text(body.status, 'pendente')

      data.proposals = (Array.isArray(data.proposals) ? data.proposals : []).map((proposal: any) =>
        proposal.id === proposalId ? { ...proposal, status, updatedAt: now } : proposal
      )

      addNotification(data, 'Status da proposta atualizado', `Proposta marcada como ${status}.`, 'proposal')
    }

    if (action === 'add_community_post') {
      const post = {
        id: id('post'),
        author: text(body.author, data.providerProfile?.name || 'Prestador'),
        title: text(body.title, 'Novo relato'),
        content: text(body.content, 'Mensagem publicada na comunidade.'),
        createdAt: now
      }

      data.community = [post, ...(Array.isArray(data.community) ? data.community : [])]
      addNotification(data, 'Post publicado', `Você publicou na comunidade: ${post.title}.`, 'community')
    }

    if (action === 'connect_whatsapp') {
      data.whatsapp = {
        ...(data.whatsapp || {}),
        status: 'connected',
        phone: text(body.phone, data.whatsapp?.phone || ''),
        connectedAt: now,
        qrCodeHint: 'WhatsApp conectado ao painel de notificações.'
      }

      data.setup = (Array.isArray(data.setup) ? data.setup : []).map((step: any) =>
        step.id === 'whatsapp' ? { ...step, done: true } : step
      )

      addNotification(data, 'WhatsApp conectado', 'As notificações via WhatsApp foram ativadas no painel.', 'whatsapp')
    }

    if (action === 'connect_github') {
      data.github = {
        ...(data.github || {}),
        status: 'connected',
        username: text(body.username, data.github?.username || ''),
        repoUrl: text(body.repoUrl, data.github?.repoUrl || ''),
        updatedAt: now
      }

      data.setup = (Array.isArray(data.setup) ? data.setup : []).map((step: any) =>
        step.id === 'github' ? { ...step, done: true } : step
      )

      addNotification(data, 'GitHub vinculado', 'O GitHub foi vinculado ao painel do prestador.', 'github')
    }

    if (action === 'save_snapshot') {
      const projectId = text(body.projectId, 'proj-site-principal')
      const repoUrl = text(body.repoUrl, data.github?.repoUrl || '')
      const snapshot = {
        id: id('snapshot'),
        title: text(body.title, 'Versão salva no GitHub'),
        repoUrl,
        note: text(body.note, 'Snapshot salvo pelo painel do prestador.'),
        createdAt: now
      }

      data.projects = (Array.isArray(data.projects) ? data.projects : []).map((project: any) => {
        if (project.id !== projectId) return project

        return {
          ...project,
          repoUrl: repoUrl || project.repoUrl,
          snapshots: [snapshot, ...(Array.isArray(project.snapshots) ? project.snapshots : [])]
        }
      })

      data.github = {
        ...(data.github || {}),
        status: data.github?.status || 'connected',
        repoUrl: repoUrl || data.github?.repoUrl || '',
        lastSavedAt: now
      }

      addNotification(data, 'Projeto salvo', 'Uma nova versão do projeto foi salva no histórico.', 'github')
    }

    if (action === 'restore_snapshot') {
      const projectId = text(body.projectId, 'proj-site-principal')
      const project = (Array.isArray(data.projects) ? data.projects : []).find((item: any) => item.id === projectId)
      const latest = Array.isArray(project?.snapshots) ? project.snapshots[0] : null

      data.github = {
        ...(data.github || {}),
        lastRestoreAt: now
      }

      addNotification(data, 'Projeto recuperado', 'O painel marcou a última versão como recuperada.', 'github')

      const saved = await saveScopedDashboard(request, 'provider', data)

      return json({
        ok: true,
        action,
        restoredSnapshot: latest,
        data: saved
      })
    }

    if (action === 'add_referral') {
      const item = {
        id: id('referral'),
        name: text(body.name, 'Indicação'),
        type: text(body.type, 'servico'),
        estimatedReward: money(body.estimatedReward),
        status: text(body.status, 'pendente'),
        createdAt: now
      }

      data.referrals = data.referrals || {}
      data.referrals.items = [item, ...(Array.isArray(data.referrals.items) ? data.referrals.items : [])]
      data.referrals.summary = data.referrals.summary || {}
      data.referrals.summary.totalLeads = (data.referrals.summary.totalLeads || 0) + 1

      addNotification(data, 'Nova indicação registrada', `Indicação adicionada: ${item.name}.`, 'referral')
    }

    if (action === 'create_github_repo') {
      const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN

      if (!token) {
        data.github = {
          ...(data.github || {}),
          status: 'needs_token',
          updatedAt: now
        }

        const saved = await saveScopedDashboard(request, 'provider', data)

        return json({
          ok: false,
          needsToken: true,
          error: 'Para criar repositório real no GitHub, adicione GITHUB_TOKEN no .env.local e reinicie o PM2.',
          data: saved
        }, 400)
      }

      const repoName = text(body.repoName, `sualuma-projeto-${Date.now()}`)
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, '-')
        .slice(0, 80)

      const githubResponse = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: repoName,
          private: body.privateRepo !== false,
          auto_init: true,
          description: text(body.description, 'Projeto criado pelo painel de prestador da Sualuma.')
        })
      })

      const githubData = await githubResponse.json().catch(() => ({} as any))

      if (!githubResponse.ok) {
        return json({
          ok: false,
          error: githubData?.message || 'Erro ao criar repositório no GitHub.'
        }, githubResponse.status)
      }

      data.github = {
        ...(data.github || {}),
        status: 'connected',
        repoUrl: githubData.html_url,
        updatedAt: now
      }

      addNotification(data, 'Repositório criado', `Repositório criado no GitHub: ${githubData.html_url}.`, 'github')
    }

    refreshStats(data)
    const saved = await saveScopedDashboard(request, 'provider', data)

    return json({
      ok: true,
      action,
      data: saved,
      updatedAt: new Date().toISOString()
    })
  } catch (error: any) {
    return json({
      ok: false,
      error: error?.message || 'Erro interno no painel do prestador.'
    }, 500)
  }
}
