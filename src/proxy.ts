import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/auth/middleware'
import createIntlMiddleware from '@/lib/i18n/middleware'

const intlMiddleware = createIntlMiddleware

function isRedirectResponse(response: NextResponse | null | undefined) {
  return Boolean(response?.headers.get('location'))
}

function mergeResponse(source: NextResponse, target: NextResponse) {
  for (const [name, value] of source.headers.entries()) {
    if (name.toLowerCase() === 'set-cookie') {
      continue
    }
    target.headers.set(name, value)
  }

  for (const cookie of source.cookies.getAll()) {
    target.cookies.set(cookie)
  }
}

export async function proxy(request: NextRequest) {
  // Handle internationalization first
  const intlResponse = intlMiddleware(request)

  // If intl middleware wants to redirect, return that response
  if (isRedirectResponse(intlResponse)) {
    return intlResponse
  }

  // Handle authentication
  const authResponse = await updateSession(request)

  // If auth middleware wants to redirect, return that response
  if (isRedirectResponse(authResponse)) {
    return authResponse
  }

  if (intlResponse && authResponse) {
    mergeResponse(intlResponse, authResponse)
    return authResponse
  }

  return authResponse || intlResponse || NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes (except auth callback)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|api(?!/auth)|.*\\..*).*)',
  ],
}
