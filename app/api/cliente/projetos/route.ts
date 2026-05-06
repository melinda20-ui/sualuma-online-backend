import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  clientTenantIdFromUserId,
  makeId,
  readClientDashboard,
  saveClientDashboard,
} from '@/lib/client-dashboard-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function getClienteTenant() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: 'Você precisa estar logado para acessar seus projetos.' },
        { status: 401 }
      ),
    }
  }

  return {
    ok: true as const,
    user,
    tenantId: clientTenantIdFromUserId(user.id),
  }
}

export async function GET() {
  const auth = await getClienteTenant()

  if (!auth.ok) {
    return auth.response
  }

  const data = await readClientDashboard(auth.tenantId)

  return NextResponse.json(data.projects)
}

export async function POST(req: Request) {
  try {
    const auth = await getClienteTenant()

    if (!auth.ok) {
      return auth.response
    }

    const body = (await req.json()) as Record<string, unknown>
    const name = String(body.name ?? '').trim()

    if (!name) {
      return NextResponse.json(
        { error: 'Nome do projeto é obrigatório.' },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()

    const project = {
      id: makeId('proj'),
      name,
      description: String(body.description ?? '').trim(),
      status: String(body.status ?? 'em_andamento'),
      progress: Number(body.progress ?? 0),
      nextStep: String(body.nextStep ?? 'Aguardando próximos passos.'),
      createdAt: now,
      updatedAt: now,
    }

    const data = await readClientDashboard(auth.tenantId)

    data.customer = {
      ...data.customer,
      id: auth.user.id,
      email: auth.user.email || data.customer.email,
      name:
        String(auth.user.user_metadata?.name || auth.user.user_metadata?.full_name || '').trim() ||
        data.customer.name,
    }

    data.projects.unshift(project)

    await saveClientDashboard(data, auth.tenantId)

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar projeto:', error)
    return NextResponse.json(
      { error: 'Erro ao criar projeto.' },
      { status: 500 }
    )
  }
}
