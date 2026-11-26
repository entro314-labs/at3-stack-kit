import { AI_ERRORS } from '@/lib/ai/config'
import { aiClient } from '@/lib/ai/client'
import { AIError, type AICompletionOptions } from '@/lib/ai/types'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AICompletionOptions

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return Response.json(
        {
          code: AI_ERRORS.INVALID_REQUEST,
          error: 'At least one message is required.',
        },
        { status: 400 }
      )
    }

    const response = await aiClient.completion(body)
    return Response.json(response)
  } catch (error) {
    if (error instanceof AIError) {
      const status = error.code === AI_ERRORS.INVALID_API_KEY ? 401 : 400

      return Response.json(
        {
          code: error.code,
          error: error.message,
          provider: error.provider,
        },
        { status }
      )
    }

    return Response.json(
      {
        code: AI_ERRORS.UNKNOWN,
        error: 'AI completion failed.',
      },
      { status: 500 }
    )
  }
}
