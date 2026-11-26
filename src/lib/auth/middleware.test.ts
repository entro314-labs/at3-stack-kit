import { createServerClient } from '@supabase/ssr'
import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { updateSession } from './middleware'

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}))

const mockedCreateServerClient = vi.mocked(createServerClient)

describe('auth middleware', () => {
  beforeEach(() => {
    mockedCreateServerClient.mockReset()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
  })

  it('redirects anonymous users away from protected routes', async () => {
    mockUser(null)

    const response = await updateSession(new NextRequest('http://localhost/dashboard'))

    expect(response.headers.get('location')).toBe('http://localhost/auth/sign-in?redirectTo=%2Fdashboard')
  })

  it('redirects anonymous users away from localized protected routes', async () => {
    mockUser(null)

    const response = await updateSession(new NextRequest('http://localhost/es/panel'))

    expect(response.headers.get('location')).toBe('http://localhost/auth/sign-in?redirectTo=%2Fes%2Fpanel')
  })

  it('redirects signed-in users away from auth routes', async () => {
    mockUser({ id: 'user-1' })

    const response = await updateSession(new NextRequest('http://localhost/auth/sign-in'))

    expect(response.headers.get('location')).toBe('http://localhost/dashboard')
  })

  it('allows signed-in users to access reset-password route', async () => {
    mockUser({ id: 'user-1' })

    const response = await updateSession(new NextRequest('http://localhost/auth/reset-password'))

    expect(response.headers.get('location')).toBeNull()
  })

  it('allows public routes through when no redirect is needed', async () => {
    mockUser(null)

    const response = await updateSession(new NextRequest('http://localhost/'))

    expect(response.headers.get('location')).toBeNull()
  })

  it('redirects protected routes when Supabase config is invalid', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'not-a-url'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'

    const response = await updateSession(new NextRequest('http://localhost/dashboard'))

    expect(response.headers.get('location')).toBe('http://localhost/auth/sign-in?redirectTo=%2Fdashboard')
    expect(mockedCreateServerClient).not.toHaveBeenCalled()
  })
})

function mockUser(user: { id: string } | null) {
  mockedCreateServerClient.mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user,
        },
      }),
    },
  } as never)
}
