'use server';

import { createClient } from '@supabase/supabase-js';

// Using Service Role to bypass RLS for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type UserAccessInfo = {
  id: string;
  name: string;
  email: string;
  created_at: string;
  plan_name: string | null;
  subscription_status: string | null;
  active_packages: string[];
};

export async function getUsersWithAccess(): Promise<UserAccessInfo[]> {
  try {
     // 1. Get all profiles
     const { data: profiles, error: profilesError } = await supabaseAdmin
       .from('profiles')
       .select('*');

     if (profilesError) throw profilesError;



     // 2. Get all subscriptions
     const { data: subscriptions, error: subsError } = await supabaseAdmin
       .from('user_subscriptions')
       .select('user_id, status, plan_id');

     if (subsError) console.error('Error fetching subscriptions:', subsError);

     // 3. Get all package access

    const { data: packageAccess, error: pkgError } = await supabaseAdmin
      .from('user_package_access')
      .select('user_id, package_code, status')
      .eq('status', 'active');

    if (pkgError) console.error('Error fetching package access:', pkgError);

     // Map everything together
     return (profiles || []).map(profile => {
       const sub = subscriptions?.find(s => s.user_id === profile.id);
       const packages = packageAccess?.filter(p => p.user_id === profile.id).map(p => p.package_code) || [];

       return {
         id: profile.id,
         name: profile.name || profile.full_name || 'Sem nome',
         email: profile.email || 'Sem email',
         created_at: profile.created_at,
         plan_name: sub?.plan_id || null,
         subscription_status: sub?.status || 'none',
         active_packages: packages
       };
     });



  } catch (error) {
    console.error('Error in getUsersWithAccess:', error);
    throw error;
  }
}

export async function updateUserInfo(userId: string, updates: any) {
  // This is a placeholder for the actual implementation of updating user data
  // In a real scenario, this would update profiles or user_package_access
  try {
    const { error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error in updateUserInfo:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}
