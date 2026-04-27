import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type FunilStep = {
  delayDays: number
  subject: string
  html: string
}

type Funil = {
  id: string
  name: string
  status: 'rascunho' | 'ativo'
  steps: FunilStep[]
  createdAt: string
  updatedAt: string
}

const filePath = path.join(process.cwd(), 'data', 'funis.json')

async function readFunis(): Promise<Funil[]> {
  try {
    const file = await fs.readFile(filePath, 'utf8')
    const parsed = JSON.parse(file)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function saveFunis(funis: Funil[]) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, JSON.stringify(funis, null, 2), 'utf8')
}

export async function GET() {
  const funis = await readFunis()
  return NextResponse.json(funis)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const name = String(body?.name || '').trim()

    if (!name) {
      return NextResponse.json(
        { error: 'Nome do funil é obrigatório.' },
        { status: 400 }
      )
    }

    const rawSteps = Array.isArray(body?.steps) ? body.steps : []

    const steps: FunilStep[] = rawSteps
      .map((step: any) => ({
        delayDays: Number(step?.delayDays || 0),
        subject: String(step?.subject || '').trim(),
        html: String(step?.html || '').trim(),
      }))
      .filter((step: FunilStep) => step.subject || step.html)

    if (steps.length === 0) {
      steps.push({
        delayDays: 0,
        subject: 'Boas-vindas à Sualuma Online',
        html: '<p>Oi! Seja bem-vindo(a) à Sualuma Online.</p>',
      })
    }

    const now = new Date().toISOString()

    const novoFunil: Funil = {
      id: `${Date.now()}`,
      name,
      status: 'rascunho',
      steps,
      createdAt: now,
      updatedAt: now,
    }

    const funis = await readFunis()
    funis.unshift(novoFunil)

    await saveFunis(funis)

    return NextResponse.json(novoFunil, { status: 201 })
  } catch (error) {
    console.error('Erro ao salvar funil:', error)

    return NextResponse.json(
      { error: 'Erro interno ao salvar funil.' },
      { status: 500 }
    )
  }
}
