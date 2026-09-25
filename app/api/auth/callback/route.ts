import { type NextRequest, NextResponse } from 'next/server'

import { createSignedRawflexSession, rawflexSessionCookieNames } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

function getSafeNextPath(next: string | null) {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return '/'
  }

  return next
}

function getProfileName(userMetadata: Record<string, unknown>, email: string | undefined) {
  const fullName = userMetadata.full_name
  const name = userMetadata.name

  if (typeof fullName === 'string' && fullName.trim()) {
    return fullName.trim()
  }

  if (typeof name === 'string' && name.trim()) {
    return name.trim()
  }

  return email?.split('@')[0] || 'Customer'
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const nextPath = getSafeNextPath(searchParams.get('next'))

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=Google login was cancelled or expired.`)
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.session?.user) {
    return NextResponse.redirect(`${origin}/login?error=Google login failed. Please try again.`)
  }

  const user = data.session.user
  const email = user.email?.toLowerCase()

  if (!email) {
    return NextResponse.redirect(`${origin}/login?error=Google account did not provide an email address.`)
  }

  const adminSupabase = createAdminClient()
  const fullName = getProfileName(user.user_metadata, email)
  const { data: existingProfile, error: profileLoadError } = await adminSupabase
    .from('profiles')
    .select('id, full_name, email, role, is_active')
    .eq('id', user.id)
    .maybeSingle()

  if (profileLoadError) {
    console.error('Google login profile load failed:', profileLoadError)
    return NextResponse.redirect(`${origin}/login?error=Unable to load your profile. Please try again.`)
  }

  const profile = existingProfile
    ? existingProfile
    : await (async () => {
        const { data: newProfile, error: profileCreateError } = await adminSupabase
          .from('profiles')
          .insert({
            id: user.id,
            email,
            full_name: fullName,
            role: 'customer',
            is_active: true,
          })
          .select('id, full_name, email, role, is_active')
          .single()

        if (profileCreateError) {
          console.error('Google login profile create failed:', profileCreateError)
          return null
        }

        return newProfile
      })()

  if (!profile) {
    return NextResponse.redirect(`${origin}/login?error=Unable to create your profile. Please try again.`)
  }

  const response = NextResponse.redirect(`${origin}${nextPath}`)
  const signedSession = createSignedRawflexSession({
    id: user.id,
    email,
    full_name: profile.full_name || fullName,
    role: profile.role || 'customer',
  })
  const cookieOptions = {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 30 * 24 * 60 * 60,
  }

  response.cookies.set(rawflexSessionCookieNames.session, signedSession.payload, cookieOptions)
  response.cookies.set(rawflexSessionCookieNames.signature, signedSession.signature, cookieOptions)

  return response
}
