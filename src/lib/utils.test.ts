import { describe, expect, it } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('merges class names and resolves tailwind conflicts', () => {
    const result = cn('px-2', 'text-sm', 'px-4')

    expect(result).toContain('px-4')
    expect(result).toContain('text-sm')
    expect(result).not.toContain('px-2')
  })
})
