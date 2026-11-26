import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import { getSupabasePublicConfig } from '@/lib/supabase/config'

const LOCALE_PREFIX = /^\/(en|es)(?=\/|$)/
const PROTECTED_ROUTES = ['/dashboard', '/profile', '/settings', '/panel', '/perfil', '/configuracion']
const AUTH_ROUTES = ['/auth/sign-in', '/auth/sign-up']

function stripLocalePrefix(pathname: string) {
  const withoutLocale = pathname.replace(LOCALE_PREFIX, '')
  return withoutLocale.length > 0 ? withoutLocale : '/'
}

export async function updateSession(request: NextRequest) {
  const normalizedPathname = stripLocalePrefix(request.nextUrl.pathname)
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => normalizedPathname.startsWith(route))
  const isAuthRoute = AUTH_ROUTES.some((route) => normalizedPathname.startsWith(route))

  const supabaseConfig = getSupabasePublicConfig()

  if (!supabaseConfig) {
    if (isProtectedRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/sign-in'
      url.searchParams.set('redirectTo', `${request.nextUrl.pathname}${request.nextUrl.search}`)
      return NextResponse.redirect(url)
    }

    return NextResponse.next({
      request,
    })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    supabaseConfig.url,
    supabaseConfig.anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          supabaseResponse = NextResponse.next({
            request,
          })
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options)
          }
        },
      },
    }
  )

  let user = null

  try {
    const {
      data: { user: resolvedUser },
    } = await supabase.auth.getUser()
    user = resolvedUser
  } catch {
    user = null
  }

  // Redirect unauthenticated users away from protected routes
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/sign-in'
    url.searchParams.set('redirectTo', `${request.nextUrl.pathname}${request.nextUrl.search}`)
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth routes
  if (isAuthRoute && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
