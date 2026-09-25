import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { parseSignedRawflexSession, rawflexSessionCookieNames } from '@/lib/auth/session'

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key || url.includes('placeholder')) {
    throw new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  }

  return { url, key }
}

export async function createClient() {
  const { url, key } = getSupabaseConfig()
  const cookieStore = await cookies()

  const customSession = parseSignedRawflexSession(
    cookieStore.get(rawflexSessionCookieNames.session)?.value,
    cookieStore.get(rawflexSessionCookieNames.signature)?.value
  )

  const client = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore
            .getAll()
            .filter(
              (cookie) =>
                cookie.name !== rawflexSessionCookieNames.session &&
                cookie.name !== rawflexSessionCookieNames.signature
            )
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Components cannot always write refreshed auth cookies.
          }
        },
      },
    }
  )

  const originalAuth = client.auth
  Object.defineProperty(client, 'auth', {
    get() {
      return new Proxy(originalAuth, {
        get(target, prop, receiver) {
          if (prop === 'getUser') {
            return async () => {
              if (customSession) {
                return {
                  data: {
                    user: {
                      id: customSession.id,
                      email: customSession.email,
                      user_metadata: {
                        full_name: customSession.full_name,
                        role: customSession.role,
                      },
                    },
                  },
                  error: null,
                }
              }

              return await target.getUser()
            }
          }

          if (prop === 'getSession') {
            return async () => {
              if (customSession) {
                return {
                  data: {
                    session: {
                      user: {
                        id: customSession.id,
                        email: customSession.email,
                        user_metadata: {
                          full_name: customSession.full_name,
                          role: customSession.role,
                        },
                      },
                    },
                  },
                  error: null,
                }
              }

              return await target.getSession()
            }
          }

          if (prop === 'signOut') {
            return async () => {
              cookieStore.set(rawflexSessionCookieNames.session, '', { path: '/', expires: new Date(0) })
              cookieStore.set(rawflexSessionCookieNames.signature, '', { path: '/', expires: new Date(0) })
              return await target.signOut()
            }
          }

          const value = Reflect.get(target, prop, receiver)
          return typeof value === 'function' ? value.bind(target) : value
        },
      })
    },
    configurable: true,
    enumerable: true,
  })

  return client
}
