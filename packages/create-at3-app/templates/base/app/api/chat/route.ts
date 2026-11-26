import { openai } from '@ai-sdk/openai'
import { type UIMessage, convertToModelMessages, streamText } from 'ai'

export const maxDuration = 30

export async function POST(req: Request) {
  const {
    messages,
  }: {
    messages?: UIMessage[]
  } = await req.json()

  if (!Array.isArray(messages)) {
    return Response.json({ error: 'messages must be an array' }, { status: 400 })
  }

  const result = await streamText({
    messages: await convertToModelMessages(messages),
    model: openai('gpt-4o-mini'),
  })

  return result.toUIMessageStreamResponse()
}
