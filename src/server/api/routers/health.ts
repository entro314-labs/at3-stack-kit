import { z } from 'zod'

import { AI_MODELS } from '@/lib/ai/vercel-client'
import { createTRPCRouter, publicProcedure } from '@/server/api/trpc'

const modelKeys = Object.keys(AI_MODELS)

export const healthRouter = createTRPCRouter({
  aiModels: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/ai/models',
        summary: 'List available AI model keys',
        tags: ['AI'],
      },
    })
    .output(
      z.object({
        models: z.array(z.string()),
        count: z.number().int().nonnegative(),
      })
    )
    .query(() => {
      return {
        models: modelKeys,
        count: modelKeys.length,
      }
    }),

  status: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/health',
        summary: 'Service health check',
        tags: ['System'],
      },
    })
    .output(
      z.object({
        status: z.literal('ok'),
        timestamp: z.string(),
        uptimeSeconds: z.number().int().nonnegative(),
      })
    )
    .query(() => {
      return {
        status: 'ok' as const,
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
      }
    }),
})
