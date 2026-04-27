import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest, ensureSualumaProfile } from '@/lib/supabase-platform'
import { readScopedDashboard } from '@/lib/scoped-dashboard-store'

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

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)

    return json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata || {},
      },
    })
  } catch (error: any) {
    return json({ ok: false, error: error?.message || 'Não autorizado.' }, error?.status || 401)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const role = body.role === 'provider' ? 'provider' : 'client'

    const user = await getUserFromRequest(request)
    const profile = await ensureSualumaProfile(user, role)
    const dashboard = await readScopedDashboard(request, role)

    return json({
      ok: true,
      role,
      profile,
      user: {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata || {},
      },
      dashboard,
    })
  } catch (error: any) {
    return json({ ok: false, error: error?.message || 'Erro ao carregar usuário.' }, error?.status || 500)
  }
}
