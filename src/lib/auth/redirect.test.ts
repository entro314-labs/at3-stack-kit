import { describe, expect, it } from 'vitest'
import { sanitizeRedirectParam, sanitizeRedirectPath } from './redirect'

describe('redirect sanitization helpers', () => {
  it('keeps valid internal paths', () => {
    expect(sanitizeRedirectPath('/dashboard?tab=profile', '/')).toBe('/dashboard?tab=profile')
  })

  it('falls back for absolute external URLs', () => {
    expect(sanitizeRedirectPath('https://example.com/malicious', '/dashboard')).toBe('/dashboard')
  })

  it('falls back for protocol-relative URLs', () => {
    expect(sanitizeRedirectPath('//example.com/malicious', '/dashboard')).toBe('/dashboard')
  })

  it('reads the first string from array params', () => {
    expect(sanitizeRedirectParam(['/settings', '/profile'], '/dashboard')).toBe('/settings')
  })
})
