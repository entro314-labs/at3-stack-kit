'use client'

import { useCallback, useRef, useState } from 'react'
import { type AICompletionOptions, type AICompletionResponse, AIError, aiClient } from './client'
import { type AIProvider, DEFAULT_CONFIG } from './config'

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

      // Create abort controller for this request
      abortControllerRef.current = new AbortController()

      try {
        const messages = [
          ...(options.systemMessage
            ? [{ role: 'system' as const, content: options.systemMessage }]
            : []),
          { role: 'user' as const, content: prompt },
        ]

        const completionOptions: AICompletionOptions = {
          provider: options.provider || DEFAULT_CONFIG.provider,
          model: options.model || DEFAULT_CONFIG.model,
          temperature: options.temperature || DEFAULT_CONFIG.temperature,
          maxTokens: options.maxTokens || DEFAULT_CONFIG.maxTokens,
          messages,
          timeout: DEFAULT_CONFIG.timeout,
        }

        const response = await aiClient.completion(completionOptions)

        if (abortControllerRef.current?.signal.aborted) {
          return
        }

        const content = response.choices[0]?.message?.content || ''
        setCompletion(content)
        options.onSuccess?.(response)
      } catch (err) {
        if (abortControllerRef.current?.signal.aborted) {
          return
        }

        const aiError =
          err instanceof AIError ? err : new AIError('unknown', 'An unexpected error occurred')
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
    completion,
    isLoading,
    error,
    generate,
    reset,
    abort,
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
    const systemMessage = options.systemMessage
    if (systemMessage) {
      return [
        {
          id: 'system',
          role: 'system' as const,
          content: systemMessage,
          timestamp: new Date(),
        },
      ]
    }
    return []
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
        id: `user-${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMessage])
      setIsLoading(true)
      setError(null)

      // Create abort controller for this request
      abortControllerRef.current = new AbortController()

      try {
        const completionOptions: AICompletionOptions = {
          provider: options.provider || DEFAULT_CONFIG.provider,
          model: options.model || DEFAULT_CONFIG.model,
          temperature: options.temperature || DEFAULT_CONFIG.temperature,
          maxTokens: options.maxTokens || DEFAULT_CONFIG.maxTokens,
          messages: [...messages, userMessage].map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          timeout: DEFAULT_CONFIG.timeout,
        }

        const response = await aiClient.completion(completionOptions)

        if (abortControllerRef.current?.signal.aborted) {
          return
        }

        const assistantContent = response.choices[0]?.message?.content || ''
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: assistantContent,
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, assistantMessage])
        options.onMessage?.(assistantMessage)
      } catch (err) {
        if (abortControllerRef.current?.signal.aborted) {
          return
        }

        const aiError =
          err instanceof AIError ? err : new AIError('unknown', 'An unexpected error occurred')
        setError(aiError)
        options.onError?.(aiError)

        // Remove the user message if there was an error
        setMessages((prev) => prev.slice(0, -1))
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
    const systemMessage = options.systemMessage
    if (systemMessage) {
      setMessages([
        {
          id: 'system',
          role: 'system',
          content: systemMessage,
          timestamp: new Date(),
        },
      ])
    } else {
      setMessages([])
    }
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
    messages: messages.filter((m) => m.role !== 'system'), // Don't expose system messages
    isLoading,
    error,
    sendMessage,
    clearMessages,
    abort,
  }
}

// Utility hook for AI-powered text processing
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
        const messages = [
          ...(systemMessage ? [{ role: 'system' as const, content: systemMessage }] : []),
          { role: 'user' as const, content: `${instruction}\n\nText: ${text}` },
        ]

        const response = await aiClient.completion({
          provider: options.provider || DEFAULT_CONFIG.provider,
          model: options.model || DEFAULT_CONFIG.model,
          temperature: options.temperature || DEFAULT_CONFIG.temperature,
          maxTokens: DEFAULT_CONFIG.maxTokens,
          messages,
        })

        return response.choices[0]?.message?.content || ''
      } catch (err) {
        const aiError =
          err instanceof AIError ? err : new AIError('unknown', 'An unexpected error occurred')
        setError(aiError)
        throw aiError
      } finally {
        setIsProcessing(false)
      }
    },
    [options]
  )

  return {
    process,
    isProcessing,
    error,
  }
}
