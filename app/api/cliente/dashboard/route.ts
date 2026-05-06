import { NextResponse } from 'next/server'
import { getClienteTenant, syncClientCustomer } from '@/lib/client-tenant-auth'
import { readClientDashboard } from '@/lib/client-dashboard-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await getClienteTenant()
  if (!auth.ok) return auth.response

  const data = await readClientDashboard(auth.tenantId)
  syncClientCustomer(data, auth.user)
  return NextResponse.json(data)
}
