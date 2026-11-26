import { createOpenApiFetchHandler } from 'trpc-to-openapi'

import { appRouter } from '@/server/api/root'
import { createTRPCContext } from '@/server/api/trpc'

const handler = (request: Request) =>
  createOpenApiFetchHandler({
    endpoint: '/api/openapi',
    req: request,
    router: appRouter,
    createContext: () => createTRPCContext(request),
    onError({ error, path }) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(`[OpenAPI] ${path ?? '<unknown>'}:`, error)
      }
    },
  })

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
  handler as OPTIONS,
  handler as HEAD,
}
