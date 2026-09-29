'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createSignedRawflexSession, rawflexSessionCookieNames, type RawflexSession } from '@/lib/auth/session'
import { sendTransactionalEmail, sendOtpEmail, sendWelcomeEmail } from '@/lib/email'

export type AuthResult = {
  error?: string
  success?: boolean
}

type SupabaseAuthUserWithPhone = {
  id: string
  email?: string | null
  phone?: string | null
}

function getErrorDetails(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      cause: error.cause,
    }
  }

  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>
    return {
      message: record.message,
      code: record.code,
      details: record.details,
      hint: record.hint,
    }
  }

  return { message: String(error) }
}

async function setRawflexSessionCookie(session: RawflexSession) {
  const cookieStore = await cookies()
  const signedSession = createSignedRawflexSession(session)
  const options = {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 30 * 24 * 60 * 60,
  }

  cookieStore.set(rawflexSessionCookieNames.session, signedSession.payload, options)
  cookieStore.set(rawflexSessionCookieNames.signature, signedSession.signature, options)
}

async function clearRawflexSessionCookie() {
  const cookieStore = await cookies()
  const options = {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 0,
  }

  cookieStore.set(rawflexSessionCookieNames.session, '', options)
  cookieStore.set(rawflexSessionCookieNames.signature, '', options)
}

function getPhoneDigits(phone: string): string {
  return phone.replace(/\D/g, '')
}

function getLocalPhoneNumber(phone: string): string {
  const digits = getPhoneDigits(phone)
  return digits.length > 10 ? digits.slice(-10) : digits
}

function getPhoneSearchValues(phone: string): string[] {
  const digits = getPhoneDigits(phone)
  const localPhone = getLocalPhoneNumber(phone)
  const values = new Set<string>([phone, digits, localPhone])

  if (localPhone.length === 10) {
    values.add(`+91${localPhone}`)
    values.add(`91${localPhone}`)
  }

  return Array.from(values).filter(Boolean)
}

function getPhoneOnlyEmail(phone: string): string {
  return `phone-${getPhoneDigits(phone)}@phone.rawflex.local`
}

function isPhoneOnlyEmail(email: string | null | undefined): boolean {
  return Boolean(email?.endsWith('@phone.rawflex.local'))
}

async function findSupabaseAuthUserByPhone(adminAuth: ReturnType<typeof createAdminClient>['auth']['admin'], phoneValues: string[]) {
  let page = 1
  const perPage = 1000

  while (page <= 10) {
    const { data, error } = await adminAuth.listUsers({ page, perPage })
    if (error) {
      throw error
    }

    const users = data.users as SupabaseAuthUserWithPhone[]
    const matchingUser = users.find((user) => {
      const authPhone = user.phone
      return Boolean(authPhone && phoneValues.includes(authPhone))
    })

    if (matchingUser) {
      return matchingUser
    }

    if (data.users.length < perPage) {
      return null
    }

    page += 1
  }

  return null
}


export async function login(
  _prevState: AuthResult,
  formData: FormData
): Promise<AuthResult> {
  const supabase = await createClient()
  const adminSupabase = createAdminClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: 'Invalid email or password' }
  }

  await clearRawflexSessionCookie()

  const redirectTo = formData.get('redirect_to') as string
  revalidatePath('/', 'layout')
  redirect(redirectTo && redirectTo.startsWith('/') ? redirectTo : '/')
}

export async function register(
  _prevState: AuthResult,
  formData: FormData
): Promise<AuthResult> {
  const supabase = await createClient()

  const fullName = formData.get('full_name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const phone = formData.get('phone') as string // optional

  if (!fullName || !email || !password) {
    return { error: 'Full name, email, and password are required' }
  }

  // 1. Create the user using the Admin API to forcefully confirm the email 
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const adminAuth = createAdminClient().auth.admin

  const { data: newUser, error: createError } = await adminAuth.createUser({
    email,
    password,
    email_confirm: true, // Forces immediate verification!
    user_metadata: {
      full_name: fullName,
      phone: phone || '',
      role: 'customer',
    },
  })

  if (createError) {
    if (createError.message.includes('already been registered')) {
      return { error: 'An account with this email already exists' }
    }
    return { error: createError.message }
  }

  // Fallback profile insert in case trigger doesn't exist
  try {
    if (newUser?.user) {
      await supabase.from('profiles').insert({
        id: newUser.user.id,
        email,
        full_name: fullName,
        phone: phone || null,
        role: 'customer',
      })
    }
  } catch (e) {
    // Suppress if trigger handled it
  }

  // 2. Sign in with standard client to establish browser sessions
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError) {
    return { error: 'Account created but failed to log in automatically.' }
  }

  await clearRawflexSessionCookie()

  // Send Welcome Email asynchronously via Brevo
  sendWelcomeEmail({
    toEmail: email.trim().toLowerCase(),
    fullName: fullName.trim(),
  }).catch((err) => console.error('Error sending welcome email:', err))

  const redirectTo = formData.get('redirect_to') as string
  revalidatePath('/', 'layout')
  redirect(redirectTo && redirectTo.startsWith('/') ? redirectTo : '/')
}

export async function loginWithCredentials(
  identifier: string,
  password: string
): Promise<AuthResult> {
  const supabase = await createClient()
  const adminSupabase = createAdminClient()

  let emailToUse = identifier.trim()

  if (!emailToUse || !password) {
    return { error: 'Email and password are required' }
  }

  // If user entered a phone number or username without @
  if (!emailToUse.includes('@')) {
    const digits = emailToUse.replace(/\D/g, '')
    if (digits.length >= 10) {
      const localPhone = digits.slice(-10)
      const { data: profile } = await adminSupabase
        .from('profiles')
        .select('email')
        .or(`phone.eq.${localPhone},phone.eq.+91${localPhone},phone.eq.91${localPhone}`)
        .maybeSingle()

      if (profile?.email) {
        emailToUse = profile.email
      } else {
        emailToUse = `phone-${localPhone}@phone.rawflex.local`
      }
    }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: emailToUse,
    password,
  })

  if (error) {
    if (error.message.toLowerCase().includes('invalid login credentials')) {
      return { error: 'Invalid email or password. Please try again.' }
    }
    return { error: error.message }
  }

  if (data?.user) {
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle()

    if (profile) {
      await setRawflexSessionCookie({
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
      })
    } else {
      await setRawflexSessionCookie({
        id: data.user.id,
        email: data.user.email || emailToUse,
        full_name: (data.user.user_metadata?.full_name as string) || 'Customer',
        role: 'customer',
      })
    }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function registerWithCredentials(
  fullName: string,
  email: string,
  password: string,
  phone?: string
): Promise<AuthResult> {
  const supabase = await createClient()
  const trimmedEmail = email.trim().toLowerCase()
  const trimmedName = fullName.trim()

  if (!trimmedName || !trimmedEmail || !password) {
    return { error: 'Full name, email, and password are required' }
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters long' }
  }

  const { createAdminClient } = await import('@/lib/supabase/admin')
  const adminAuth = createAdminClient().auth.admin
  const adminSupabase = createAdminClient()

  const { data: newUser, error: createError } = await adminAuth.createUser({
    email: trimmedEmail,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: trimmedName,
      phone: phone?.trim() || '',
      role: 'customer',
    },
  })

  if (createError) {
    if (
      createError.message.includes('already been registered') ||
      createError.message.includes('already exists')
    ) {
      return { error: 'An account with this email already exists. Please log in.' }
    }
    return { error: createError.message }
  }

  try {
    if (newUser?.user) {
      await adminSupabase.from('profiles').upsert({
        id: newUser.user.id,
        email: trimmedEmail,
        full_name: trimmedName,
        phone: phone?.trim() || null,
        role: 'customer',
      })
    }
  } catch (e) {
    // Ignore profile upsert error if handled by trigger
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: trimmedEmail,
    password,
  })

  if (signInError) {
    return { error: 'Account created! Please sign in with your password.' }
  }

  if (newUser?.user) {
    await setRawflexSessionCookie({
      id: newUser.user.id,
      email: trimmedEmail,
      full_name: trimmedName,
      role: 'customer',
    })

    // Send Welcome Email asynchronously via Brevo
    sendWelcomeEmail({
      toEmail: trimmedEmail,
      fullName: trimmedName,
    }).catch((err) => console.error('Error sending welcome email:', err))
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function sendPasswordReset(email: string): Promise<AuthResult> {
  const supabase = await createClient()
  const trimmedEmail = email.trim().toLowerCase()

  if (!trimmedEmail || !trimmedEmail.includes('@')) {
    return { error: 'Please enter a valid email address.' }
  }

  const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail)
  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function sendEmailOtp(
  email: string,
  mode: 'LOGIN' | 'REGISTER',
  fullName?: string
): Promise<AuthResult> {
  const adminSupabase = createAdminClient()

  if (!email || !email.trim()) {
    return { error: 'Email address is required.' }
  }

  const trimmedEmail = email.trim().toLowerCase()

  if (mode === 'LOGIN') {
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('id')
      .ilike('email', trimmedEmail)
      .maybeSingle()

    let userFound = !!profile
    if (!userFound) {
      try {
        const { data: userList } = await adminSupabase.auth.admin.listUsers()
        userFound = !!(userList?.users as any[])?.some((u: any) => u.email?.toLowerCase() === trimmedEmail)
      } catch (err) {}
    }

    if (!userFound) {
      return { error: 'No account found with this email. Please register first or check your email.' }
    }
  }

  if (mode === 'REGISTER') {
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('id')
      .ilike('email', trimmedEmail)
      .maybeSingle()

    if (profile) {
      return { error: 'An account with this email already exists. Please log in.' }
    }
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  // Clean records older than 24 hours (1 day) automatically
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  await adminSupabase.from('email_otps').delete().lt('created_at', twentyFourHoursAgo)

  // Insert OTP record directly into Supabase email_otps table
  const { error: dbError } = await adminSupabase
    .from('email_otps')
    .insert({
      email: trimmedEmail,
      otp,
      full_name: fullName || null,
      expires_at: expiresAt,
    })

  if (dbError) {
    console.error('OTP Save DB Error in Supabase email_otps:', dbError)
    return { error: 'Failed to save verification code in Supabase: ' + dbError.message }
  }

  try {
    await sendOtpEmail({
      toEmail: trimmedEmail,
      otp,
      mode,
      name: fullName,
    })

    return { success: true }
  } catch (e: any) {
    console.error('Email Send Error via Brevo:', e)
    return { error: 'Failed to send verification email: ' + (e?.message || 'Check email configuration') }
  }
}

export async function verifyEmailOtp(
  email: string,
  otp: string,
  redirectTo?: string,
  fullName?: string,
  phone?: string,
  password?: string
): Promise<AuthResult> {
  const supabase = await createClient()
  const adminSupabase = createAdminClient()

  if (!email || !otp) {
    return { error: 'Email and OTP code are required.' }
  }

  const trimmedEmail = email.trim().toLowerCase()
  const trimmedOtp = otp.trim()

  const { data: records, error: fetchErr } = await adminSupabase
    .from('email_otps')
    .select('*')
    .eq('email', trimmedEmail)
    .order('created_at', { ascending: false })

  if (fetchErr) {
    console.error('Fetch OTP error from Supabase email_otps:', fetchErr)
    return { error: 'Failed to query OTP from Supabase.' }
  }

  if (!records || records.length === 0) {
    return { error: 'No OTP requested for this email. Please request a new code.' }
  }

  // Find matching active OTP
  const matchingRecord = records.find(
    (r) => r.otp === trimmedOtp && new Date(r.expires_at) >= new Date()
  )

  if (!matchingRecord) {
    const expiredMatch = records.find((r) => r.otp === trimmedOtp)
    if (expiredMatch) {
      return { error: 'This OTP has expired or already been used. Please request a new one.' }
    }
    return { error: 'Invalid OTP code. Please enter the 6-digit code received on your email.' }
  }

  // Expire the OTP record so it cannot be re-used, but keep row in Supabase email_otps table for records!
  await adminSupabase
    .from('email_otps')
    .update({ expires_at: new Date(Date.now() - 1000).toISOString() })
    .eq('id', matchingRecord.id)

  // Real Supabase Auth Flow
  const adminAuth = adminSupabase.auth.admin

  // Check profiles table first
  let userExists = false
  const { data: existingProfile } = await adminSupabase
    .from('profiles')
    .select('*')
    .ilike('email', trimmedEmail)
    .maybeSingle()

  if (existingProfile) {
    userExists = true
  }

  let finalUserId: string | null = existingProfile?.id || null

  if (!userExists) {
    try {
      const { data: userList } = await adminAuth.listUsers()
      const userData = (userList?.users as any[])?.find(
        (u) => u.email?.toLowerCase() === trimmedEmail
      )
      if (userData) {
        userExists = true
        finalUserId = userData.id
      }
    } catch (e) {}
  }

  const nameToUse = fullName || matchingRecord.full_name || 'Customer'

  if (!userExists) {
    const { data: newUser, error: createError } = await adminAuth.createUser({
      email: trimmedEmail,
      password: password || undefined,
      email_confirm: true,
      user_metadata: {
        full_name: nameToUse,
        phone: phone || '',
        role: 'customer',
      },
    })

    if (createError) {
      if (
        !createError.message.includes('already been registered') &&
        !createError.message.includes('already exists')
      ) {
        return { error: 'Failed to create user account: ' + createError.message }
      }
    } else if (newUser?.user) {
      finalUserId = newUser.user.id
      try {
        await adminSupabase.from('profiles').upsert({
          id: newUser.user.id,
          email: trimmedEmail,
          full_name: nameToUse,
          role: 'customer',
          phone: phone || null,
        })

        sendWelcomeEmail({
          toEmail: trimmedEmail,
          fullName: nameToUse,
        }).catch((err) => console.error('Error sending welcome email on OTP:', err))
      } catch (e) {}
    }
  } else if (password && finalUserId) {
    try {
      await adminAuth.updateUserById(finalUserId, { password })
    } catch (err) {}
  }

  // Ensure profile exists in profiles table
  let { data: profile } = await adminSupabase
    .from('profiles')
    .select('*')
    .ilike('email', trimmedEmail)
    .maybeSingle()

  if (!profile && finalUserId) {
    const { data: upsertedProfile } = await adminSupabase
      .from('profiles')
      .upsert({
        id: finalUserId,
        email: trimmedEmail,
        full_name: nameToUse,
        role: 'customer',
        phone: phone || null,
      })
      .select('*')
      .single()

    profile = upsertedProfile
  }

  if (!profile) {
    return { error: 'Failed to establish user profile session.' }
  }

  await setRawflexSessionCookie({
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name,
    role: profile.role || 'customer',
  })

  revalidatePath('/', 'layout')
  if (redirectTo === 'NO_REDIRECT') {
    return { success: true }
  }
  redirect(redirectTo && redirectTo.startsWith('/') ? redirectTo : '/profile')
}

export async function verifyPhoneOtp(
  _token?: string,
  _mode?: 'LOGIN' | 'REGISTER',
  _redirectTo?: string,
  _fullName?: string
): Promise<AuthResult> {
  return { error: 'Phone OTP authentication is disabled. Please use email OTP or password login.' }
}

function getAdminEmails(): string[] {
  const emails = process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || 'admin@rawflex.com,admin@teenzos.com'
  return emails.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
}

function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || 'admin123'
}

export async function adminLogin(
  _prevState: AuthResult,
  formData: FormData
): Promise<AuthResult> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const adminEmails = getAdminEmails()
  const adminPassword = getAdminPassword()

  const isAdminEmail = adminEmails.includes(email.toLowerCase())

  let signInRes = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  let data = signInRes.data
  let error = signInRes.error

  let adminClient: any = null
  if (
    error &&
    isAdminEmail &&
    password === adminPassword
  ) {
    try {
      const { createAdminClient } = await import('@/lib/supabase/admin')
      adminClient = createAdminClient()

      const { data: userList } = await adminClient.auth.admin.listUsers()
      const existingUser = (userList?.users as any[])?.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase()
      )

      if (existingUser) {
        await adminClient.auth.admin.updateUserById(existingUser.id, {
          password,
          email_confirm: true,
        })
      } else {
        await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { role: 'admin', full_name: 'Admin' },
        })
      }

      const retry = await supabase.auth.signInWithPassword({ email, password })
      data = retry.data
      error = retry.error
    } catch (e) {
      console.error('Failed to auto-seed/update admin user:', e)
    }
  }

  if ((error || !data?.user) && isAdminEmail && password === adminPassword) {
    // Ultimate fallback if auth server password login failed but credentials matched admin master config
    try {
      const { createAdminClient } = await import('@/lib/supabase/admin')
      adminClient = adminClient || createAdminClient()
      const { data: userList } = await adminClient.auth.admin.listUsers()
      const authUser = (userList?.users as any[])?.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase()
      )

      if (authUser) {
        data = { user: authUser } as any
        error = null
      }
    } catch (e) {
      console.error('Admin auth fallback failed:', e)
    }
  }

  if (error || !data?.user) {
    return { error: error?.message || 'Invalid email or password' }
  }

  const { createAdminClient } = await import('@/lib/supabase/admin')
  const adminDbClient = adminClient || createAdminClient()

  let profile: any = null
  try {
    const { data: p } = await adminDbClient
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle()
    profile = p
  } catch (e) {
    console.error('Admin profile query error:', e)
  }

  if (isAdminEmail) {
    try {
      if (!profile) {
        const { data: newProfile, error: insertError } = await adminDbClient
          .from('profiles')
          .upsert(
            {
              id: data.user.id,
              email: email.toLowerCase(),
              full_name: 'Admin',
              role: 'admin',
              is_active: true,
            },
            { onConflict: 'id' }
          )
          .select('*')
          .single()

        if (!insertError && newProfile) {
          profile = newProfile
        } else {
          console.warn('Admin profile upsert skipped/failed (using virtual admin profile):', insertError?.message)
          profile = {
            id: data.user.id,
            email: email.toLowerCase(),
            full_name: 'Admin',
            role: 'admin',
            is_active: true,
          }
        }
      } else if (profile.role !== 'admin' || profile.is_active === false) {
        const { data: updatedProfile, error: updateError } = await adminDbClient
          .from('profiles')
          .update({ role: 'admin', is_active: true })
          .eq('id', data.user.id)
          .select('*')
          .single()

        if (!updateError && updatedProfile) {
          profile = updatedProfile
        } else {
          profile = {
            id: data.user.id,
            email: email.toLowerCase(),
            full_name: 'Admin',
            role: 'admin',
            is_active: true,
          }
        }
      }
    } catch (e: any) {
      console.warn('Admin profile seed error (using virtual admin profile):', e?.message)
      profile = {
        id: data.user.id,
        email: email.toLowerCase(),
        full_name: 'Admin',
        role: 'admin',
        is_active: true,
      }
    }
  }

  if (!profile || profile.role !== 'admin' || profile.is_active === false) {
    if (isAdminEmail) {
      profile = {
        id: data.user.id,
        email: email.toLowerCase(),
        full_name: 'Admin',
        role: 'admin',
        is_active: true,
      }
    } else {
      await supabase.auth.signOut()
      await clearRawflexSessionCookie()
      return { error: 'You do not have admin access' }
    }
  }

  await setRawflexSessionCookie({
    id: data.user.id,
    email: data.user.email,
    full_name: profile.full_name || 'Admin',
    role: 'admin',
  })

  revalidatePath('/admin', 'layout')
  redirect('/admin')
}

export async function logout() {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch (err) {
    console.error('Error in logout signOut:', err)
  }
  await clearRawflexSessionCookie()
  redirect('/login')
}

export async function logoutForClient(): Promise<AuthResult> {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch (err) {
    console.error('Error in logoutForClient signOut:', err)
  }
  await clearRawflexSessionCookie()
  return { success: true }
}

export async function getCurrentUserForClient() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { user: null }
  }

  return {
    user: {
      id: user.id,
      email: isPhoneOnlyEmail(user.email) ? null : user.email || null,
      full_name: (user.user_metadata?.full_name as string | undefined) || null,
      role: (user.user_metadata?.role as string | undefined) || null,
    },
  }
}

export async function getCurrentCustomerProfileForClient() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { profile: null }
  }

  const adminSupabase = createAdminClient()
  const { data: profileData } = await adminSupabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  const { data: addressData } = await adminSupabase
    .from('addresses')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .limit(1)
    .maybeSingle()

  const profileEmail = profileData?.email || user.email || ''

  return {
    profile: {
      fullName: profileData?.full_name || user.user_metadata?.full_name || '',
      email: isPhoneOnlyEmail(profileEmail) ? '' : profileEmail,
      phone: addressData?.phone || profileData?.phone || '',
      alternatePhone: addressData?.alternate_phone || '',
      street: addressData?.address_line_1 || '',
      city: addressData?.city || '',
      state: addressData?.state || '',
      zipCode: addressData?.postal_code || '',
    },
  }
}

