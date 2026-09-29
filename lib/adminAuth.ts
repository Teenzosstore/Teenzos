import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export type AdminAuthResult =
  | { ok: true; userId: string; adminClient: ReturnType<typeof createAdminClient> }
  | { ok: false; error: string }

function getAdminEmails(): string[] {
  const emails = process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || 'admin@rawflex.com,admin@teenzos.com'
  return emails.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
}

export async function requireAdmin(): Promise<AdminAuthResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    let activeUser = user

    if (!activeUser) {
      try {
        const { cookies } = await import('next/headers')
        const { parseSignedRawflexSession, rawflexSessionCookieNames } = await import('@/lib/auth/session')
        const cookieStore = await cookies()
        const rawSession = parseSignedRawflexSession(
          cookieStore.get(rawflexSessionCookieNames.session)?.value,
          cookieStore.get(rawflexSessionCookieNames.signature)?.value
        )
        if (
          rawSession &&
          (rawSession.role === 'admin' ||
            (rawSession.email && getAdminEmails().includes(rawSession.email.toLowerCase())))
        ) {
          activeUser = {
            id: rawSession.id,
            email: rawSession.email || 'admin@teenzos.com',
          } as any
        }
      } catch (cookieErr) {
        console.warn('requireAdmin cookie parse note:', cookieErr)
      }
    }

    if (!activeUser) {
      console.log('requireAdmin: No authenticated user')
      return { ok: false, error: 'Unauthorized' }
    }

    const adminEmails = getAdminEmails()
    const isConfiguredAdminEmail = Boolean(
      activeUser.email && adminEmails.includes(activeUser.email.toLowerCase())
    )

    console.log('requireAdmin: Checking profile for user:', activeUser.id, activeUser.email)

    const adminClient = createAdminClient()
    let profile: any = null
    let error: any = null

    try {
      const res = await adminClient
        .from('profiles')
        .select('role, is_active')
        .eq('id', activeUser.id)
        .maybeSingle()
      profile = res.data
      error = res.error
    } catch (e) {
      error = e
    }

    if (error && isConfiguredAdminEmail) {
      console.warn('requireAdmin: Database error on profile query, proceeding as configured admin:', error)
      return { ok: true, userId: activeUser.id, adminClient }
    }

    if (error) {
      console.error('requireAdmin: Database error:', error)
      return { ok: false, error: 'Unauthorized' }
    }

    if (!profile) {
      console.log('requireAdmin: No profile found for user:', activeUser.id)
      if (isConfiguredAdminEmail) {
        try {
          await adminClient.from('profiles').upsert(
            {
              id: activeUser.id,
              email: activeUser.email!.toLowerCase(),
              full_name: 'Admin',
              role: 'admin',
              is_active: true,
            },
            { onConflict: 'id' }
          )
        } catch (e) {
          // Ignore DB error if profiles table doesn't exist
        }

        return { ok: true, userId: activeUser.id, adminClient }
      }
      return { ok: false, error: 'Unauthorized' }
    }

    if (profile.role !== 'admin' || profile.is_active === false) {
      console.log('requireAdmin: User is not admin or inactive:', profile)
      if (isConfiguredAdminEmail) {
        try {
          await adminClient
            .from('profiles')
            .update({ role: 'admin', is_active: true })
            .eq('id', activeUser.id)
        } catch (e) {
          // Ignore DB error
        }
        return { ok: true, userId: activeUser.id, adminClient }
      }
      return { ok: false, error: 'Unauthorized' }
    }

    return {
      ok: true,
      userId: activeUser.id,
      adminClient,
    }
  } catch (e: any) {
    console.error('requireAdmin error:', e)
    return { ok: false, error: 'Unauthorized' }
  }
}
