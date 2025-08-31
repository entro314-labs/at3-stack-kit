import { convertToModelMessages, streamText, type UIMessage } from 'ai'
import { AI_MODELS, type AIModelKey } from '@/lib/ai/vercel-client'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const {
      messages,
      model = 'gpt-4o-mini',
      systemMessage,
    }: {
      messages: UIMessage[]
      model?: AIModelKey
      systemMessage?: string
    } = await req.json()

    // Get the model instance
    const modelInstance = AI_MODELS[model as AIModelKey] || AI_MODELS['gpt-4o-mini']

    // Generate streaming response
    const result = await streamText({
      model: modelInstance,
      ...(systemMessage && { system: systemMessage }),
      messages: convertToModelMessages(messages),
      maxOutputTokens: 4000,
      temperature: 0.7,
      // Add safety settings for production
      frequencyPenalty: 0,
      presencePenalty: 0,
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
