import { TRPCError, initTRPC } from '@trpc/server'
import type { OpenApiMeta } from 'trpc-to-openapi'

import { createClient } from '@/lib/supabase/server'

interface AuthenticatedUser {
  id: string
  email: string | null
}

export interface TRPCContext {
  request: Request
  user: AuthenticatedUser | null
}

async function resolveAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getUser()

    if (error || !data.user) {
      return null
    }

    return {
      email: data.user.email ?? null,
      id: data.user.id,
    }
  } catch {
    return null
  }
}

export async function createTRPCContext(request: Request): Promise<TRPCContext> {
  const user = await resolveAuthenticatedUser()

  return {
    request,
    user,
  }
}

const t = initTRPC.context<TRPCContext>().meta<OpenApiMeta>().create()

const requireAuthentication = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    })
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  })
})

export const createTRPCRouter = t.router
export const publicProcedure = t.procedure
export const protectedProcedure = t.procedure.use(requireAuthentication)
