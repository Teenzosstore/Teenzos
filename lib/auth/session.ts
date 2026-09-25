import crypto from 'crypto'

export type RawflexSession = {
  id: string
  email?: string | null
  full_name?: string | null
  role?: string | null
}

const SESSION_COOKIE = 'rawflex-user-session'
const SESSION_SIGNATURE_COOKIE = 'rawflex-user-session-sig'

export const rawflexSessionCookieNames = {
  session: SESSION_COOKIE,
  signature: SESSION_SIGNATURE_COOKIE,
}

function sessionSecret() {
  const secret = process.env.AUTH_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret && process.env.NODE_ENV !== 'production') {
    return 'rawflex-development-session-secret'
  }
  if (!secret) {
    throw new Error('AUTH_SESSION_SECRET or SUPABASE_SERVICE_ROLE_KEY is required for custom session signing.')
  }
  return secret
}

function normalizePayload(session: RawflexSession) {
  return JSON.stringify({
    id: session.id,
    email: session.email || null,
    full_name: session.full_name || null,
    role: session.role || null,
  })
}

export function signRawflexSessionPayload(payload: string) {
  return crypto
    .createHmac('sha256', sessionSecret())
    .update(payload)
    .digest('hex')
}

export function createSignedRawflexSession(session: RawflexSession) {
  const payload = normalizePayload(session)
  return {
    payload,
    signature: signRawflexSessionPayload(payload),
  }
}

export function parseSignedRawflexSession(payload: string | undefined, signature: string | undefined) {
  if (!payload || !signature) return null

  try {
    const decodedPayload = decodeURIComponent(payload)
    const expected = signRawflexSessionPayload(decodedPayload)
    const expectedBuffer = Buffer.from(expected)
    const actualBuffer = Buffer.from(signature)

    if (expectedBuffer.length !== actualBuffer.length) return null
    if (!crypto.timingSafeEqual(expectedBuffer, actualBuffer)) return null

    const parsed = JSON.parse(decodedPayload) as RawflexSession
    if (!parsed.id) return null
    return parsed
  } catch {
    return null
  }
}
