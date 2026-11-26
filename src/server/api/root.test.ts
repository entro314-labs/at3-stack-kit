import { describe, expect, it } from 'vitest'

import { appRouter } from '@/server/api/root'
import type { TRPCContext } from '@/server/api/trpc'

function createContext(user: TRPCContext['user'] = null): TRPCContext {
  return {
    request: new Request('http://localhost:3000/api/trpc'),
    user,
  }
}

describe('appRouter', () => {
  it('returns healthy system status', async () => {
    const caller = appRouter.createCaller(createContext())

    const result = await caller.health.status()

    expect(result.status).toBe('ok')
    expect(result.timestamp).toBeTypeOf('string')
    expect(result.uptimeSeconds).toBeGreaterThanOrEqual(0)
  })

  it('returns available AI model keys', async () => {
    const caller = appRouter.createCaller(createContext())

    const result = await caller.health.aiModels()

    expect(result.count).toBeGreaterThan(0)
    expect(result.models).toContain('gpt-4o-mini')
  })

  it('returns authenticated user profile', async () => {
    const caller = appRouter.createCaller(
      createContext({
        email: 'user@example.com',
        id: 'usr_123',
      })
    )

    const result = await caller.session.me()

    expect(result).toEqual({
      email: 'user@example.com',
      id: 'usr_123',
    })
  })

  it('rejects session profile when unauthenticated', async () => {
    const caller = appRouter.createCaller(createContext())

    await expect(caller.session.me()).rejects.toThrow('Authentication required')
  })
})
