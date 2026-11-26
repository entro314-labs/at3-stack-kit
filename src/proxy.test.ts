import { NextRequest, NextResponse } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { updateSession } from '@/lib/auth/middleware'
import createIntlMiddleware from '@/lib/i18n/middleware'
import { proxy } from './proxy'

vi.mock('@/lib/auth/middleware', () => ({
  updateSession: vi.fn(),
}))

vi.mock('@/lib/i18n/middleware', () => ({
  default: vi.fn(),
}))

const mockedUpdateSession = vi.mocked(updateSession)
const mockedIntlMiddleware = vi.mocked(createIntlMiddleware)

describe('proxy', () => {
  beforeEach(() => {
    mockedIntlMiddleware.mockReset()
    mockedUpdateSession.mockReset()
  })

  it('merges auth and intl response metadata without dropping cookies', async () => {
    const request = new NextRequest('http://localhost/dashboard')

    const intlResponse = NextResponse.next()
    intlResponse.headers.set('x-intl', '1')
    intlResponse.cookies.set('NEXT_LOCALE', 'es', { path: '/' })
    mockedIntlMiddleware.mockReturnValue(intlResponse)

    const authResponse = NextResponse.next({ request })
    authResponse.headers.set('x-auth', '1')
    authResponse.cookies.set('sb-access-token', 'test-token', { path: '/' })
    mockedUpdateSession.mockResolvedValue(authResponse)

    const response = (await proxy(request)) as NextResponse

    expect(response.headers.get('x-intl')).toBe('1')
    expect(response.headers.get('x-auth')).toBe('1')
    expect(response.cookies.get('NEXT_LOCALE')?.value).toBe('es')
    expect(response.cookies.get('sb-access-token')?.value).toBe('test-token')
  })

  it('returns the intl redirect immediately', async () => {
    const request = new NextRequest('http://localhost/profile')
    const intlRedirect = NextResponse.redirect('http://localhost/es/profile')
    mockedIntlMiddleware.mockReturnValue(intlRedirect)
    mockedUpdateSession.mockResolvedValue(NextResponse.next({ request }))

    const response = (await proxy(request)) as NextResponse

    expect(response.headers.get('location')).toBe('http://localhost/es/profile')
    expect(mockedUpdateSession).not.toHaveBeenCalled()
  })

  it('returns auth redirect when auth blocks the request', async () => {
    const request = new NextRequest('http://localhost/dashboard')
    mockedIntlMiddleware.mockReturnValue(NextResponse.next())
    mockedUpdateSession.mockResolvedValue(
      NextResponse.redirect('http://localhost/auth/sign-in?redirectTo=%2Fdashboard')
    )

    const response = (await proxy(request)) as NextResponse

    expect(response.headers.get('location')).toBe(
      'http://localhost/auth/sign-in?redirectTo=%2Fdashboard'
    )
  })
})
