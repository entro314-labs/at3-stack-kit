import { streamText } from 'ai'
import { type AIModelKey, AI_MODELS } from '@/lib/ai/vercel-client'

export async function POST(req: Request) {
  try {
    const { prompt, model = 'gpt-4o-mini', systemMessage } = await req.json()

    // Get the model instance
    const modelInstance = AI_MODELS[model as AIModelKey] || AI_MODELS['gpt-4o-mini']

    // Prepare messages
    const messages = [{ content: prompt, role: 'user' as const }]

    // Generate streaming response
    const result = await streamText({
      model: modelInstance,
      ...(systemMessage && { system: systemMessage }),
      messages,
      maxOutputTokens: 4000,
      temperature: 0.7,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('Completion API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
}
