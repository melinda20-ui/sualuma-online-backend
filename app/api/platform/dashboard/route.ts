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

function getType(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type')
  return type === 'provider' ? 'provider' : 'client'
}

export async function GET(request: NextRequest) {
  try {
    const type = getType(request)
    const data = await readScopedDashboard(request, type)

    return json({ ok: true, type, data })
  } catch (error: any) {
    return json({ ok: false, error: error?.message || 'Erro ao carregar dashboard.' }, error?.status || 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const type = getType(request)
    const body = await request.json().catch(() => ({}))
    const data = await saveScopedDashboard(request, type, body.data || {})

    return json({ ok: true, type, data })
  } catch (error: any) {
    return json({ ok: false, error: error?.message || 'Erro ao salvar dashboard.' }, error?.status || 500)
  }
}
