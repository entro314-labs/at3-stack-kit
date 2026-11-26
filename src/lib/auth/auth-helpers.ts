import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { sanitizeRedirectPath } from './redirect'

function createAuthCallbackUrl(next: string) {
  const callbackUrl = new URL('/auth/callback', window.location.origin)
  callbackUrl.searchParams.set('next', sanitizeRedirectPath(next, '/dashboard'))
  return callbackUrl.toString()
}

// Client-side auth helpers (safe for use in client components)
export function signOut() {
  const supabase = createBrowserClient()
  return supabase.auth.signOut()
}

export function signInWithEmail(email: string, password: string) {
  const supabase = createBrowserClient()
  return supabase.auth.signInWithPassword({ email, password })
}

export function signUpWithEmail(
  email: string,
  password: string,
  redirectTo: string = '/dashboard'
) {
  const supabase = createBrowserClient()
  return supabase.auth.signUp({
    email,
    options: {
      emailRedirectTo: createAuthCallbackUrl(redirectTo),
    },
    password,
  })
}

export function signInWithProvider(
  provider: 'github' | 'google',
  redirectTo: string = '/dashboard'
) {
  const supabase = createBrowserClient()
  return supabase.auth.signInWithOAuth({
    options: {
      redirectTo: createAuthCallbackUrl(redirectTo),
    },
    provider,
  })
}

export function resetPassword(email: string) {
  const supabase = createBrowserClient()
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  })
}
