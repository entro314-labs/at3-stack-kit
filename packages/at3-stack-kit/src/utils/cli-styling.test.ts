import { describe, expect, it } from 'vitest'
import { progress, style } from './cli-styling'

describe('cli-styling', () => {
  it('renders progress with expected percentage label', () => {
    const value = progress.percentage(50)

    expect(value).toContain('50%')
  })

  it('renders command helper text', () => {
    const value = style.command('pnpm test')

    expect(value).toContain('pnpm test')
  })
})
