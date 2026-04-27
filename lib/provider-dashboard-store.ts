import fs from 'fs/promises'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const DATA_FILE = path.join(DATA_DIR, 'provider-dashboard.json')

const defaultProviderDashboard = {
  updatedAt: new Date().toISOString(),
  providerProfile: {
    name: 'Prestador Sualuma',
    title: 'Especialista em sites, automações e entregas digitais',
    email: 'prestador@sualuma.online',
    phone: '',
    city: 'Brasil',
    bio: 'Configure seu perfil para começar a receber propostas, entregar projetos e usar os agentes da Sualuma.',
    avatarInitial: 'P',
    onboardingComplete: false
  },
  setup: [
    { id: 'perfil', title: 'Configurar perfil', description: 'Dados, especialidade, bio e contato.', done: false },
    { id: 'recebimento', title: 'Dados de recebimento', description: 'Chave Pix, banco ou conta para saque.', done: false },
    { id: 'portfolio', title: 'Adicionar portfólio', description: 'Mostre trabalhos para aumentar conversão.', done: false },
    { id: 'whatsapp', title: 'Conectar WhatsApp', description: 'Receba avisos de proposta, pagamento e mensagens.', done: false },
    { id: 'github', title: 'Vincular GitHub', description: 'Salve versões dos projetos e recupere quando precisar.', done: false }
  ],
  stats: {
    earningsMonth: 7400,
    availableBalance: 2100,
    activeClients: 6,
    sentProposals: 14,
    acceptedProposals: 5,
    rejectedProposals: 3,
    pendingProposals: 6,
    referralEarnings: 900
  },
  payout: {
    status: 'pending',
    pixKey: '',
    bankName: '',
    holderName: '',
    document: '',
    updatedAt: ''
  },
  proposals: [
    {
      id: 'prop-demo-1',
      clientName: 'Cliente Sualuma',
      projectTitle: 'Site institucional principal',
      amount: 2500,
      status: 'aceita',
      createdAt: new Date().toISOString()
    },
    {
      id: 'prop-demo-2',
      clientName: 'Loja Parceira',
      projectTitle: 'Página de vendas com automação',
      amount: 1500,
      status: 'pendente',
      createdAt: new Date().toISOString()
    }
  ],
  projects: [
    {
      id: 'proj-site-principal',
      title: 'Site institucional principal',
      clientName: 'Cliente Sualuma',
      status: 'em_andamento',
      progress: 72,
      repoUrl: '',
      snapshots: []
    },
    {
      id: 'proj-pagina-vendas',
      title: 'Página de vendas',
      clientName: 'Cliente Sualuma',
      status: 'aguardando_revisao',
      progress: 88,
      repoUrl: '',
      snapshots: []
    }
  ],
  portfolio: [
    {
      id: 'port-demo-1',
      title: 'Site institucional futurista',
      category: 'Sites',
      url: 'https://sualuma.online',
      description: 'Modelo de apresentação profissional para empresas digitais.',
      createdAt: new Date().toISOString()
    }
  ],
  community: [
    {
      id: 'post-demo-1',
      author: 'Equipe Sualuma',
      title: 'Bem-vindo à comunidade dos prestadores',
      content: 'Use esse espaço para trocar ideias, pedir ajuda, compartilhar dificuldades e evoluir junto com outros prestadores.',
      createdAt: new Date().toISOString()
    }
  ],
  referrals: {
    summary: {
      totalClicks: 38,
      totalLeads: 11,
      totalConversions: 3,
      totalEarned: 900
    },
    programs: [
      {
        id: 'site-direto',
        title: 'Indique serviços SOS Publicidade Online',
        reward: 'R$300 por cada página/site contratado diretamente'
      },
      {
        id: 'assinatura-sualuma',
        title: 'Indique planos da Sualuma Online',
        reward: '10% por cada pessoa que assinar um plano'
      },
      {
        id: 'prestador-indicado',
        title: 'Indique novos prestadores',
        reward: '5% nas duas primeiras propostas aceitas do prestador indicado'
      }
    ],
    items: []
  },
  github: {
    status: 'pending',
    username: '',
    repoUrl: '',
    lastSavedAt: '',
    lastRestoreAt: ''
  },
  whatsapp: {
    status: 'pending',
    phone: '',
    qrCodeHint: 'QR Code será ativado quando conectarmos o worker do WhatsApp.',
    connectedAt: ''
  },
  aiAgents: [
    { id: 'agent-propostas', name: 'Agente de Propostas', description: 'Ajuda a montar propostas mais rápidas e profissionais.', status: 'pronto' },
    { id: 'agent-entregas', name: 'Agente de Entregas', description: 'Organiza etapas, arquivos, revisões e próximos passos.', status: 'pronto' },
    { id: 'agent-github', name: 'Agente GitHub', description: 'Ajuda a salvar versões e recuperar projetos.', status: 'em_configuracao' }
  ],
  notifications: []
}

async function ensureFile() {
  await fs.mkdir(DATA_DIR, { recursive: true })

  try {
    await fs.access(DATA_FILE)
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify(defaultProviderDashboard, null, 2), 'utf-8')
  }
}

function mergeDefaults(data: any) {
  return {
    ...defaultProviderDashboard,
    ...data,
    providerProfile: {
      ...defaultProviderDashboard.providerProfile,
      ...(data?.providerProfile || {})
    },
    stats: {
      ...defaultProviderDashboard.stats,
      ...(data?.stats || {})
    },
    payout: {
      ...defaultProviderDashboard.payout,
      ...(data?.payout || {})
    },
    referrals: {
      ...defaultProviderDashboard.referrals,
      ...(data?.referrals || {}),
      summary: {
        ...defaultProviderDashboard.referrals.summary,
        ...(data?.referrals?.summary || {})
      },
      programs: Array.isArray(data?.referrals?.programs) ? data.referrals.programs : defaultProviderDashboard.referrals.programs,
      items: Array.isArray(data?.referrals?.items) ? data.referrals.items : []
    },
    setup: Array.isArray(data?.setup) ? data.setup : defaultProviderDashboard.setup,
    proposals: Array.isArray(data?.proposals) ? data.proposals : defaultProviderDashboard.proposals,
    projects: Array.isArray(data?.projects) ? data.projects : defaultProviderDashboard.projects,
    portfolio: Array.isArray(data?.portfolio) ? data.portfolio : defaultProviderDashboard.portfolio,
    community: Array.isArray(data?.community) ? data.community : defaultProviderDashboard.community,
    aiAgents: Array.isArray(data?.aiAgents) ? data.aiAgents : defaultProviderDashboard.aiAgents,
    notifications: Array.isArray(data?.notifications) ? data.notifications : []
  }
}

export async function readProviderDashboard() {
  await ensureFile()

  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8')
    const parsed = JSON.parse(raw)
    return mergeDefaults(parsed)
  } catch {
    return mergeDefaults(defaultProviderDashboard)
  }
}

export async function saveProviderDashboard(data: any) {
  await fs.mkdir(DATA_DIR, { recursive: true })
  const finalData = mergeDefaults({
    ...data,
    updatedAt: new Date().toISOString()
  })

  await fs.writeFile(DATA_FILE, JSON.stringify(finalData, null, 2), 'utf-8')
  return finalData
}
