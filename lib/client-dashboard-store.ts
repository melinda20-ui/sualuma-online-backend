import { promises as fs } from 'fs'
import path from 'path'

export type Customer = {
  id: string
  name: string
  email: string
  plan: string
  avatar: string
  hasProviderAccess?: boolean
  serviceDashboardUrl?: string
}

export type ClientProject = {
  id: string
  name: string
  description: string
  status: string
  progress: number
  nextStep: string
  createdAt: string
  updatedAt: string
  kanban?: {
    todo?: Array<Record<string, unknown>>
    doing?: Array<Record<string, unknown>>
    done?: Array<Record<string, unknown>>
  }
}

export type ClientDelivery = {
  id: string
  projectId: string
  title: string
  description: string
  status: string
  dueDate: string
  url?: string
  createdAt: string
}

export type ClientMessage = {
  id: string
  projectId?: string
  from: string
  to: string
  text: string
  read: boolean
  createdAt: string
}

export type ClientMeeting = {
  id: string
  projectId?: string
  title: string
  description: string
  scheduledAt: string
  status: string
  link?: string
  createdAt: string
  providerName?: string
  providerEmail?: string
  clientName?: string
  clientEmail?: string
  notes?: string
  confirmedAt?: string
}

export type ClientAgent = {
  id: string
  name: string
  description: string
  status: string
  category: string
}

export type ServiceProvider = {
  id: string
  name: string
  email: string
  role: string
  service: string
  calendarType?: string
}

export type ClientDashboardData = {
  customer: Customer
  projects: ClientProject[]
  deliveries: ClientDelivery[]
  messages: ClientMessage[]
  meetings: ClientMeeting[]
  agents: ClientAgent[]
  serviceProviders: ServiceProvider[]
}

const filePath = path.join(process.cwd(), 'data', 'client-dashboard.json')

const defaultDashboard: ClientDashboardData = {
  customer: {
    id: 'cliente-demo',
    name: 'Cliente Sualuma',
    email: 'cliente@sualuma.online',
    plan: 'Cliente',
    avatar: 'S',
    hasProviderAccess: true,
    serviceDashboardUrl: 'https://meuservico.sualuma.online',
  },
  projects: [],
  deliveries: [],
  messages: [],
  meetings: [],
  agents: [],
  serviceProviders: [],
}

function normalizeDashboard(data: Partial<ClientDashboardData>): ClientDashboardData {
  return {
    customer: {
      ...defaultDashboard.customer,
      ...(data.customer || {}),
    },
    projects: Array.isArray(data.projects) ? data.projects : [],
    deliveries: Array.isArray(data.deliveries) ? data.deliveries : [],
    messages: Array.isArray(data.messages) ? data.messages : [],
    meetings: Array.isArray(data.meetings) ? data.meetings : [],
    agents: Array.isArray(data.agents) ? data.agents : [],
    serviceProviders: Array.isArray(data.serviceProviders) ? data.serviceProviders : [],
  }
}

export async function readClientDashboard(): Promise<ClientDashboardData> {
  try {
    const file = await fs.readFile(filePath, 'utf8')
    const parsed = JSON.parse(file) as Partial<ClientDashboardData>
    return normalizeDashboard(parsed)
  } catch {
    await saveClientDashboard(defaultDashboard)
    return defaultDashboard
  }
}

export async function saveClientDashboard(data: ClientDashboardData) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8')
}

export function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}
