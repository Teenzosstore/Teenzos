import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { parseSignedRawflexSession, rawflexSessionCookieNames } from '@/lib/auth/session'

// The logged-in customer's id, or null for guests. Customers either have a real
// Supabase session, or (OTP logins) only our own signed session cookie — in
// which case auth.uid() is NULL and RLS-bound reads return nothing, so callers
// read with the service-role client and enforce ownership via this id.
export async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) return user.id

  const cookieStore = await cookies()
  const session = parseSignedRawflexSession(
    cookieStore.get(rawflexSessionCookieNames.session)?.value,
    cookieStore.get(rawflexSessionCookieNames.signature)?.value
  )
  return session?.id || null
}
