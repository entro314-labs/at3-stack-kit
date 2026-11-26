import { createTRPCRouter } from '@/server/api/trpc'
import { healthRouter } from '@/server/api/routers/health'
import { sessionRouter } from '@/server/api/routers/session'

export const appRouter = createTRPCRouter({
  health: healthRouter,
  session: sessionRouter,
})

export type AppRouter = typeof appRouter
