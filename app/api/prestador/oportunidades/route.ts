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

const defaultJobs = [
  {
    id: 'job-site-restaurante',
    title: 'Criar site institucional para restaurante',
    company: 'Restaurante parceiro',
    category: 'Sites',
    budget: 'R$ 1.500 - R$ 2.500',
    deadline: '15 dias',
    location: 'Brasil',
    description: 'Empresa precisa de um site moderno com cardápio, botão de WhatsApp, localização, fotos e página de contato.',
    skills: ['WordPress', 'Design', 'SEO básico', 'WhatsApp'],
    status: 'aberto',
    createdAt: now(),
  },
  {
    id: 'job-pagina-vendas',
    title: 'Página de vendas para serviço digital',
    company: 'Autônomo digital',
    category: 'Página de vendas',
    budget: 'R$ 800 - R$ 1.500',
    deadline: '7 dias',
    location: 'Remoto',
    description: 'Precisa de uma landing page com headline forte, CTA, formulário e integração com WhatsApp.',
    skills: ['Copywriting', 'Landing page', 'Formulário', 'HTML/CSS'],
    status: 'aberto',
    createdAt: now(),
  },
  {
    id: 'job-automacao-leads',
    title: 'Automação simples para captura de leads',
    company: 'Empresa local',
    category: 'Automação',
    budget: 'R$ 500 - R$ 1.200',
    deadline: '10 dias',
    location: 'Remoto',
    description: 'Criar fluxo para capturar leads do formulário, salvar em planilha/banco e enviar aviso por e-mail ou WhatsApp.',
    skills: ['n8n', 'Supabase', 'E-mail', 'Webhook'],
    status: 'aberto',
    createdAt: now(),
  },
  {
    id: 'job-social-media',
    title: 'Organização de calendário de conteúdo',
    company: 'Salão de beleza',
    category: 'Social Media',
    budget: 'R$ 790/mês',
    deadline: 'Mensal',
    location: 'Brasil',
    description: 'Cliente precisa de linha editorial, ideias de posts, roteiros curtos e organização semanal de conteúdo.',
    skills: ['Conteúdo', 'Instagram', 'Roteiros', 'Estratégia'],
    status: 'aberto',
    createdAt: now(),
  },
  {
    id: 'job-loja-online',
    title: 'Ajustes em loja online e páginas legais',
    company: 'Loja virtual',
    category: 'E-commerce',
    budget: 'R$ 600 - R$ 1.400',
    deadline: '12 dias',
    location: 'Remoto',
    description: 'Revisar navegação, banners, FAQ, política de envio, política de troca e páginas de suporte.',
    skills: ['Shopify', 'UX', 'FAQ', 'E-commerce'],
    status: 'aberto',
    createdAt: now(),
  }
]

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
