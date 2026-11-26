import { describe, expect, it } from 'vitest'
import { cn } from './utils'

describe('cn (browser)', () => {
  it('returns deterministic class output in browser mode', () => {
    expect(cn('flex', 'items-center')).toBe('flex items-center')
  })
})
