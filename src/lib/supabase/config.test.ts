import { describe, expect, it } from 'vitest'
import { getSupabasePublicConfig } from './config'

describe('getSupabasePublicConfig', () => {
  it('returns config when URL and anon key are valid', () => {
    const config = getSupabasePublicConfig({
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
    })

    expect(config).toEqual({
      anonKey: 'anon-key',
      url: 'https://example.supabase.co',
    })
  })

  it('returns null when URL is invalid', () => {
    const config = getSupabasePublicConfig({
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
      NEXT_PUBLIC_SUPABASE_URL: 'not-a-url',
    })

    expect(config).toBeNull()
  })

  it('returns null when key is missing', () => {
    const config = getSupabasePublicConfig({
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
    })

    expect(config).toBeNull()
  })
})
