import fs from 'fs/promises'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const DATA_FILE = path.join(DATA_DIR, 'provider-dashboard.json')

const defaultProviderDashboard = {
  updatedAt: new Date().toISOString(),
  providerProfile: {
    name: '--- ilustrativo: substitua pelo seu nome ---',
    title: '--- ilustrativo: substitua pela sua especialidade ---',
    email: '',
    phone: '',
    city: '',
    bio: 'Configure seu perfil no painel acima para preencher seus dados reais.',
    avatarInitial: '?',
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
    earningsMonth: 0,
    availableBalance: 0,
    activeClients: 0,
    sentProposals: 0,
    acceptedProposals: 0,
    rejectedProposals: 0,
    pendingProposals: 0,
    referralEarnings: 0
  },
  payout: {
    status: 'pending',
    pixKey: '',
    bankName: '',
    holderName: '',
    document: '',
    updatedAt: ''
  },
  proposals: [],
  projects: [],
  portfolio: [],
  community: [],
  referrals: {
    summary: {
      totalClicks: 0,
      totalLeads: 0,
      totalConversions: 0,
      totalEarned: 0
    },
    programs: [],
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
    qrCodeHint: 'QR Code aparecerá quando o WhatsApp for conectado.',
    connectedAt: ''
  },
  aiAgents: [],
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
