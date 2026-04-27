import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export function hasSupabaseConfig() {
  return Boolean(supabaseUrl && supabaseAnonKey && supabaseServiceRoleKey)
}

export function getSupabasePublicClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase público não configurado.')
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

export function getSupabaseAdminClient() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Supabase admin não configurado.')
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

export function getBearerToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()

  if (token) return token

  const cookieToken = request.cookies.get('sualuma_access_token')?.value || ''
  return cookieToken
}

export async function getUserFromRequest(request: NextRequest) {
  const token = getBearerToken(request)

  if (!token) {
    const err: any = new Error('Usuário não autenticado.')
    err.status = 401
    throw err
  }

  const supabase = getSupabasePublicClient()
  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user) {
    const err: any = new Error('Sessão inválida ou expirada.')
    err.status = 401
    throw err
  }

  return data.user
}

export async function ensureSualumaProfile(user: any, role: 'client' | 'provider') {
  const supabase = getSupabaseAdminClient()

  const { data: existing } = await supabase
    .from('sualuma_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  const currentRoles = Array.isArray(existing?.roles) ? existing.roles : []
  const roles = Array.from(new Set([...currentRoles, role]))

  const profile = {
    user_id: user.id,
    email: user.email || '',
    display_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
    roles,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('sualuma_profiles')
    .upsert(profile, { onConflict: 'user_id' })

  if (error) {
    throw new Error(error.message)
  }

  return profile
}
