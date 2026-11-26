'use client'

import { useChat, useCompletion } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import type { AIModelKey } from './vercel-client'

// Enhanced useChat hook with model selection
export function useAIChat(options?: {
  model?: AIModelKey
  systemMessage?: string
  onError?: (error: Error) => void
}) {
  return useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: () => ({
        model: options?.model || 'gpt-4o-mini',
        systemMessage: options?.systemMessage,
      }),
    }),
    ...(options?.onError && { onError: options.onError }),
  })
}

// Enhanced useCompletion hook with model selection
export function useAICompletion(options?: {
  model?: AIModelKey
  systemMessage?: string
  onFinish?: (prompt: string, completion: string) => void
  onError?: (error: Error) => void
}) {
  const {
    completion,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    stop,
    setInput,
    setCompletion,
  } = useCompletion({
    api: '/api/completion',
    body: {
      model: options?.model || 'gpt-4o-mini',
      systemMessage: options?.systemMessage,
    },
    ...(options?.onFinish && { onFinish: options.onFinish }),
    ...(options?.onError && { onError: options.onError }),
  })

  return {
    completion,
    error,
    handleInputChange,
    handleSubmit,
    input,
    isLoading,
    setCompletion,
    setInput,
    stop,
  }
}
