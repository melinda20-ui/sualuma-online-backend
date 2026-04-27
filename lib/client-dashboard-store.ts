import { promises as fs } from 'fs'
import path from 'path'

export type Customer = {
  id: string
  name: string
  email: string
  plan: string
  avatar: string
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
}

export type ClientAgent = {
  id: string
  name: string
  description: string
  status: string
  category: string
}

export type ClientDashboardData = {
  customer: Customer
  projects: ClientProject[]
  deliveries: ClientDelivery[]
  messages: ClientMessage[]
  meetings: ClientMeeting[]
  agents: ClientAgent[]
}

const filePath = path.join(process.cwd(), 'data', 'client-dashboard.json')

const defaultDashboard: ClientDashboardData = {
  customer: {
    id: 'cliente-demo',
    name: 'Cliente Sualuma',
    email: 'cliente@sualuma.online',
    plan: 'Cliente',
    avatar: 'S',
  },
  projects: [],
  deliveries: [],
  messages: [],
  meetings: [],
  agents: [],
}

function normalizeDashboard(data: Partial<ClientDashboardData>): ClientDashboardData {
  return {
    customer: data.customer || defaultDashboard.customer,
    projects: Array.isArray(data.projects) ? data.projects : [],
    deliveries: Array.isArray(data.deliveries) ? data.deliveries : [],
    messages: Array.isArray(data.messages) ? data.messages : [],
    meetings: Array.isArray(data.meetings) ? data.meetings : [],
    agents: Array.isArray(data.agents) ? data.agents : [],
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
