import { createClient } from '@supabase/supabase-js'

function getSupabaseAdminConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey || url.includes('placeholder') || serviceRoleKey.includes('placeholder')) {
    throw new Error('Supabase admin client is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
  }

  return { url, serviceRoleKey }
}

/**
 * Creates a Supabase admin client with the service role key.
 * This bypasses RLS and should only be used in server-side contexts
 * such as admin seeding, cron jobs, or backend operations.
 */
export function createAdminClient() {
  const { url, serviceRoleKey } = getSupabaseAdminConfig()

  return createClient(
    url,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
