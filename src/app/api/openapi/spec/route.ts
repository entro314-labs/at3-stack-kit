import { generateOpenApiDocument } from 'trpc-to-openapi'

import { appRouter } from '@/server/api/root'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? requestUrl.origin

  const document = generateOpenApiDocument(appRouter, {
    baseUrl,
    description: 'tRPC-powered API with OpenAPI-compatible REST endpoints.',
    docsUrl: `${baseUrl}/api/openapi/spec`,
    tags: ['System', 'AI', 'Auth'],
    title: 'AT3 Stack Kit API',
    version: '1.0.0',
  })

  return Response.json(document)
}
