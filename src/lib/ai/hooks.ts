'use client'

import { useCallback, useRef, useState } from 'react'
import { type AIError as AIErrorCode, type AIProvider, AI_ERRORS, DEFAULT_CONFIG } from './config'
import { AIError, type AICompletionOptions, type AICompletionResponse } from './types'

export interface UseAICompletionOptions {
  provider?: AIProvider
  model?: string
  temperature?: number
  maxTokens?: number
  systemMessage?: string
  onSuccess?: (response: AICompletionResponse) => void
  onError?: (error: AIError) => void
}

export interface UseAICompletionReturn {
  completion: string
  isLoading: boolean
  error: AIError | null
  generate: (prompt: string) => Promise<void>
  reset: () => void
  abort: () => void
}

async function requestCompletion(
  options: AICompletionOptions,
  signal?: AbortSignal
): Promise<AICompletionResponse> {
  const requestInit: RequestInit = {
    body: JSON.stringify(options),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  }

  if (signal) {
    requestInit.signal = signal
  }

  const response = await fetch('/api/ai/completion', requestInit)

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { code?: string; error?: string; provider?: AIProvider }
      | null

    const errorCode = Object.values(AI_ERRORS).includes(body?.code as AIErrorCode)
      ? (body?.code as AIErrorCode)
      : AI_ERRORS.UNKNOWN

    throw new AIError(errorCode, body?.error ?? 'AI completion failed.', body?.provider)
  }

  return (await response.json()) as AICompletionResponse
}

function toAIError(error: unknown): AIError {
  return error instanceof AIError
    ? error
    : new AIError(AI_ERRORS.UNKNOWN, 'An unexpected error occurred.')
}

export function useAICompletion(options: UseAICompletionOptions = {}): UseAICompletionReturn {
  const [completion, setCompletion] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<AIError | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const generate = useCallback(
    async (prompt: string) => {
      if (isLoading) {
        return
      }

      setIsLoading(true)
      setError(null)
      setCompletion('')

      abortControllerRef.current = new AbortController()

      try {
        const response = await requestCompletion(
          {
            maxTokens: options.maxTokens ?? DEFAULT_CONFIG.maxTokens,
            messages: [
              ...(options.systemMessage
                ? [{ content: options.systemMessage, role: 'system' as const }]
                : []),
              { content: prompt, role: 'user' as const },
            ],
            model: options.model ?? DEFAULT_CONFIG.model,
            provider: options.provider ?? DEFAULT_CONFIG.provider,
            temperature: options.temperature ?? DEFAULT_CONFIG.temperature,
            timeout: DEFAULT_CONFIG.timeout,
          },
          abortControllerRef.current.signal
        )

        setCompletion(response.choices[0]?.message?.content ?? '')
        options.onSuccess?.(response)
      } catch (error) {
        if (abortControllerRef.current?.signal.aborted) {
          return
        }

        const aiError = toAIError(error)
        setError(aiError)
        options.onError?.(aiError)
      } finally {
        if (!abortControllerRef.current?.signal.aborted) {
          setIsLoading(false)
        }
        abortControllerRef.current = null
      }
    },
    [isLoading, options]
  )

  const reset = useCallback(() => {
    setCompletion('')
    setError(null)
    setIsLoading(false)
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
  }, [])

  const abort = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    setIsLoading(false)
  }, [])

  return {
    abort,
    completion,
    error,
    generate,
    isLoading,
    reset,
  }
}

export interface UseChatOptions {
  provider?: AIProvider
  model?: string
  temperature?: number
  maxTokens?: number
  systemMessage?: string
  onMessage?: (message: { role: 'user' | 'assistant' | 'system'; content: string }) => void
  onError?: (error: AIError) => void
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

export interface UseChatReturn {
  messages: ChatMessage[]
  isLoading: boolean
  error: AIError | null
  sendMessage: (content: string) => Promise<void>
  clearMessages: () => void
  abort: () => void
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (!options.systemMessage) {
      return []
    }

    return [
      {
        content: options.systemMessage,
        id: 'system',
        role: 'system',
        timestamp: new Date(),
      },
    ]
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<AIError | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(
    async (content: string) => {
      if (isLoading) {
        return
      }

      const userMessage: ChatMessage = {
        content,
        id: `user-${Date.now()}`,
        role: 'user',
        timestamp: new Date(),
      }
      const nextMessages = [...messages, userMessage]

      setMessages(nextMessages)
      setIsLoading(true)
      setError(null)
      abortControllerRef.current = new AbortController()

      try {
        const response = await requestCompletion(
          {
            maxTokens: options.maxTokens ?? DEFAULT_CONFIG.maxTokens,
            messages: nextMessages.map((message) => ({
              content: message.content,
              role: message.role,
            })),
            model: options.model ?? DEFAULT_CONFIG.model,
            provider: options.provider ?? DEFAULT_CONFIG.provider,
            temperature: options.temperature ?? DEFAULT_CONFIG.temperature,
            timeout: DEFAULT_CONFIG.timeout,
          },
          abortControllerRef.current.signal
        )

        const assistantMessage: ChatMessage = {
          content: response.choices[0]?.message?.content ?? '',
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          timestamp: new Date(),
        }

        setMessages((previous) => [...previous, assistantMessage])
        options.onMessage?.(assistantMessage)
      } catch (error) {
        if (abortControllerRef.current?.signal.aborted) {
          return
        }

        const aiError = toAIError(error)
        setError(aiError)
        options.onError?.(aiError)
        setMessages((previous) => previous.slice(0, -1))
      } finally {
        if (!abortControllerRef.current?.signal.aborted) {
          setIsLoading(false)
        }
        abortControllerRef.current = null
      }
    },
    [isLoading, messages, options]
  )

  const clearMessages = useCallback(() => {
    setMessages(
      options.systemMessage
        ? [
            {
              content: options.systemMessage,
              id: 'system',
              role: 'system',
              timestamp: new Date(),
            },
          ]
        : []
    )
    setError(null)
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    setIsLoading(false)
  }, [options.systemMessage])

  const abort = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    setIsLoading(false)
  }, [])

  return {
    abort,
    clearMessages,
    error,
    isLoading,
    messages: messages.filter((message) => message.role !== 'system'),
    sendMessage,
  }
}

export interface UseAIProcessorOptions {
  provider?: AIProvider
  model?: string
  temperature?: number
}

export function useAIProcessor(options: UseAIProcessorOptions = {}) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<AIError | null>(null)

  const process = useCallback(
    async (text: string, instruction: string, systemMessage?: string): Promise<string> => {
      setIsProcessing(true)
      setError(null)

      try {
        const response = await requestCompletion({
          maxTokens: DEFAULT_CONFIG.maxTokens,
          messages: [
            ...(systemMessage ? [{ content: systemMessage, role: 'system' as const }] : []),
            { content: `${instruction}\n\nText: ${text}`, role: 'user' as const },
          ],
          model: options.model ?? DEFAULT_CONFIG.model,
          provider: options.provider ?? DEFAULT_CONFIG.provider,
          temperature: options.temperature ?? DEFAULT_CONFIG.temperature,
        })

        return response.choices[0]?.message?.content ?? ''
      } catch (error) {
        const aiError = toAIError(error)
        setError(aiError)
        throw aiError
      } finally {
        setIsProcessing(false)
      }
    },
    [options]
  )

  return {
    error,
    isProcessing,
    process,
  }
}
