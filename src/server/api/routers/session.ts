import { z } from 'zod'

import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'

export const sessionRouter = createTRPCRouter({
  me: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/auth/me',
        protect: true,
        summary: 'Get current authenticated user',
        tags: ['Auth'],
      },
    })
    .output(
      z.object({
        email: z.string().nullable(),
        id: z.string(),
      })
    )
    .query(({ ctx }) => ctx.user),
})
