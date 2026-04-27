import { NextRequest } from 'next/server'
import { readClientDashboard, saveClientDashboard } from '@/lib/client-dashboard-store'
import { readProviderDashboard, saveProviderDashboard } from '@/lib/provider-dashboard-store'
import {
  hasSupabaseConfig,
  getSupabaseAdminClient,
  getUserFromRequest,
  ensureSualumaProfile,
} from '@/lib/supabase-platform'

type DashboardType = 'client' | 'provider'

async function fallbackRead(type: DashboardType) {
  if (type === 'provider') return readProviderDashboard()
  return readClientDashboard()
}

async function fallbackSave(type: DashboardType, data: any) {
  if (type === 'provider') return saveProviderDashboard(data)
  return saveClientDashboard(data)
}

export async function readScopedDashboard(request: NextRequest, type: DashboardType) {
  const fallback = await fallbackRead(type)

  if (!hasSupabaseConfig()) {
    return fallback
  }

  try {
    const user = await getUserFromRequest(request)
    await ensureSualumaProfile(user, type)

    const supabase = getSupabaseAdminClient()

    const { data, error } = await supabase
      .from('sualuma_dashboards')
      .select('data')
      .eq('user_id', user.id)
      .eq('dashboard_type', type)
      .maybeSingle()

    if (error) throw new Error(error.message)

    if (!data?.data) {
      const { error: insertError } = await supabase
        .from('sualuma_dashboards')
        .upsert({
          user_id: user.id,
          dashboard_type: type,
          data: fallback,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,dashboard_type',
        })

      if (insertError) throw new Error(insertError.message)

      return fallback
    }

    return data.data
  } catch (error) {
    if (process.env.SUPABASE_AUTH_REQUIRED === 'true') {
      throw error
    }

    console.warn('[Sualuma] Usando JSON local como fallback.', error)
    return fallback
  }
}

export async function saveScopedDashboard(request: NextRequest, type: DashboardType, data: any) {
  const finalData = {
    ...data,
    updatedAt: new Date().toISOString(),
  }

  if (!hasSupabaseConfig()) {
    return fallbackSave(type, finalData)
  }

  try {
    const user = await getUserFromRequest(request)
    await ensureSualumaProfile(user, type)

    const supabase = getSupabaseAdminClient()

    const { error } = await supabase
      .from('sualuma_dashboards')
      .upsert({
        user_id: user.id,
        dashboard_type: type,
        data: finalData,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,dashboard_type',
      })

    if (error) throw new Error(error.message)

    return finalData
  } catch (error) {
    if (process.env.SUPABASE_AUTH_REQUIRED === 'true') {
      throw error
    }

    console.warn('[Sualuma] Salvando no JSON local como fallback.', error)
    return fallbackSave(type, finalData)
  }
}
