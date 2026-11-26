import { fetchRequestHandler } from '@trpc/server/adapters/fetch'

import { appRouter } from '@/server/api/root'
import { createTRPCContext } from '@/server/api/trpc'

const handler = (request: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req: request,
    router: appRouter,
    createContext: () => createTRPCContext(request),
    onError({ error, path }) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(`[tRPC] ${path ?? '<unknown>'}:`, error)
      }
    },
  })

export { handler as GET, handler as POST }
