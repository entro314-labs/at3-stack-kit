'use client'

import { Loader2, Send, Square } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useAIChat } from '@/lib/ai/vercel-hooks'
import { cn } from '@/lib/utils'

interface AIPlaygroundProps {
  className?: string
}

export function AIPlayground({ className }: AIPlaygroundProps) {
  const [input, setInput] = useState('')
  const { error, messages, sendMessage, status, stop } = useAIChat({
    model: 'gpt-4o-mini',
  })

  const isStreaming = status === 'streaming' || status === 'submitted'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const prompt = input.trim()
    if (!prompt) {
      return
    }

    setInput('')
    await sendMessage({ text: prompt })
  }

  return (
    <Card className={cn('border-border/60 bg-card/80 backdrop-blur', className)}>
      <CardHeader>
        <CardTitle>AI Playground</CardTitle>
        <CardDescription>
          This panel uses the app&apos;s `/api/chat` route and the existing Vercel AI SDK wiring.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/40 flex min-h-80 flex-col gap-3 rounded-xl border p-4">
          {messages.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Ask for a summary, a rewrite, or a quick draft to verify the chat route end to end.
            </p>
          ) : (
            messages.map((message) => {
              const text = message.parts
                .filter((part) => part.type === 'text')
                .map((part) => part.text)
                .join('\n')

              return (
                <article
                  key={message.id}
                  className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground self-end'
                      : 'bg-background text-foreground self-start border'
                  )}
                >
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] opacity-70">
                    {message.role}
                  </p>
                  <p className="whitespace-pre-wrap">{text || 'No text content returned.'}</p>
                </article>
              )
            })
          )}
          {isStreaming ? (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating response
            </div>
          ) : null}
        </div>

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error.message}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask the assistant something..."
            rows={4}
          />
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={stop} disabled={!isStreaming}>
              <Square className="mr-2 h-4 w-4" />
              Stop
            </Button>
            <Button type="submit" disabled={isStreaming || input.trim().length === 0}>
              <Send className="mr-2 h-4 w-4" />
              Send
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
