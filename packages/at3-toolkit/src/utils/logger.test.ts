import { describe, expect, it, vi } from 'vitest'
import { Logger } from './logger'

describe('Logger', () => {
  it('logs info messages when verbose mode is enabled', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const logger = new Logger(true)

    logger.info('hello-world')

    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it('does not log info messages when verbose mode is disabled', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const logger = new Logger(false)

    logger.info('quiet-message')

    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
