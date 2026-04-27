import { NextResponse } from 'next/server'
import { readClientDashboard } from '@/lib/client-dashboard-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const data = await readClientDashboard()
  return NextResponse.json(data)
}
