'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { type FormEvent, useState } from 'react'

export default function Home() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
  })
  const [input, setInput] = useState('')

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!input.trim() || status === 'streaming') {
      return
    }

    sendMessage({ text: input })
    setInput('')
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-16">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">AT3</p>
        <h1 className="text-4xl font-bold tracking-tight">AI Chat Starter</h1>
        <p className="max-w-2xl text-slate-600">
          Start chatting immediately, then replace this surface with your actual product UI.
        </p>
      </div>

      <section className="flex-1 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <p className="text-sm text-slate-500">
              Send a message to verify your AI route and SDK wiring.
            </p>
          ) : (
            messages.map((message) => (
              <article key={message.id} className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {message.role}
                </p>
                <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-900">
                  {message.parts.map((part, index) =>
                    part.type === 'text' ? <span key={index}>{part.text}</span> : null
                  )}
                </div>
              </article>
            ))
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 border-t border-slate-200 pt-4">
          <textarea
            className="min-h-28 rounded-xl border border-slate-300 p-3 text-sm outline-none transition focus:border-slate-500"
            placeholder="Ask something..."
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={status === 'streaming'}
          />
          <button
            type="submit"
            disabled={status === 'streaming' || !input.trim()}
            className="inline-flex w-fit items-center rounded-full bg-slate-950 px-5 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === 'streaming' ? 'Streaming...' : 'Send message'}
          </button>
        </form>
      </section>
    </main>
  )
}
