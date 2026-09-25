import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(_request: NextRequest) {
  // Authorization is enforced in server layouts/actions where signed custom
  // sessions and roles can be verified. Middleware must not trust cookie
  // presence as proof of authentication.
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
