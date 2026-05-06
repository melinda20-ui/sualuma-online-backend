import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { clientTenantIdFromUserId } from '@/lib/client-dashboard-store'

type SualumaUser = {
  id: string
  email?: string | null
  user_metadata?: Record<string, unknown> | null
}

export async function getClienteTenant() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: 'Você precisa estar logado para acessar sua casa na Sualuma.' },
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

export const getClientTenant = getClienteTenant

export function syncClientCustomer<T extends { customer?: Record<string, any> }>(
  data: T,
  user: SualumaUser
): T {
  const meta = user.user_metadata || {}

  const currentCustomer = data.customer || {}

  const name = String(
    meta.name ||
      meta.full_name ||
      meta.fullName ||
      currentCustomer.name ||
      'Cliente Sualuma'
  ).trim()

  const email = String(user.email || currentCustomer.email || '').trim()

  data.customer = {
    ...currentCustomer,
    id: user.id,
    name: name || currentCustomer.name || 'Cliente Sualuma',
    email: email || currentCustomer.email || 'cliente@sualuma.online',
    avatar: String((name || email || 'S').charAt(0) || 'S').toUpperCase(),
  }

  return data
}
