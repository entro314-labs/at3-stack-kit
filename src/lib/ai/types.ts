import type { AIError as AIErrorCode, AIProvider } from './config'

export interface AIMessage {
  role: 'system' | 'user' | 'assistant' | 'function'
  content: string
  name?: string
  function_call?: {
    name: string
    arguments: string
  }
}

export interface AICompletionOptions {
  provider?: AIProvider
  model?: string
  messages: AIMessage[]
  temperature?: number
  maxTokens?: number
  stream?: boolean
  // Biome-ignore lint/suspicious/noExplicitAny: OpenAI function definitions have complex dynamic structure
  functions?: any[]
  functionCall?: 'auto' | 'none' | { name: string }
  timeout?: number
  userId?: string
}

export interface AICompletionResponse {
  id: string
  object: string
  created: number
  model: string
  choices: {
    index: number
    message: {
      role: string
      content: string
      function_call?: {
        name: string
        arguments: string
      }
    }
    finish_reason: string
  }[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export class AIError extends Error {
  constructor(
    public code: AIErrorCode,
    message: string,
    public provider?: AIProvider,
    public cause?: Error
  ) {
    super(message)
    this.name = 'AIError'
  }
}
