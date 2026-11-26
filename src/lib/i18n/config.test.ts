import { describe, expect, it } from 'vitest'
import {
  addLocaleToPathname,
  getCanonicalPathname,
  getLocalizedPathname,
  removeLocaleFromPathname,
} from './config'

describe('i18n pathname helpers', () => {
  it('removes locale prefixes for both default and non-default locales', () => {
    expect(removeLocaleFromPathname('/en/dashboard')).toBe('/dashboard')
    expect(removeLocaleFromPathname('/es/panel')).toBe('/panel')
  })

  it('maps localized paths back to canonical paths', () => {
    expect(getCanonicalPathname('/es/panel')).toBe('/dashboard')
    expect(getCanonicalPathname('/es/perfil')).toBe('/profile')
  })

  it('maps canonical paths to locale-specific slugs', () => {
    expect(getLocalizedPathname('/dashboard', 'es')).toBe('/panel')
    expect(getLocalizedPathname('/profile', 'en')).toBe('/profile')
  })

  it('adds locale prefixes according to as-needed behavior', () => {
    expect(addLocaleToPathname('/panel', 'es')).toBe('/es/panel')
    expect(addLocaleToPathname('/dashboard', 'en')).toBe('/dashboard')
  })
})
