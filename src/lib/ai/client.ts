import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import {
  AI_ERRORS,
  AI_PROVIDERS,
  type AIError as AIErrorCode,
  type AIProvider,
  DEFAULT_CONFIG,
} from './config'

// Base types
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
  // biome-ignore lint/suspicious/noExplicitAny: OpenAI function definitions have complex dynamic structure
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

// Rate limiting utility
class RateLimiter {
  private requests: Map<string, number[]> = new Map()
  private tokens: Map<string, number[]> = new Map()

  isAllowed(provider: AIProvider, tokensUsed = 0): boolean {
    const now = Date.now()
    const minute = 60 * 1000

    const key = provider
    const providerLimits = require('./config').RATE_LIMITS[provider]

    // Clean old requests
    const requests = this.requests.get(key) || []
    const validRequests = requests.filter((time) => now - time < minute)
    this.requests.set(key, validRequests)

    // Clean old tokens
    const tokens = this.tokens.get(key) || []
    const validTokens = tokens.filter((time) => now - time < minute)
    this.tokens.set(key, validTokens)

    // Check limits
    if (validRequests.length >= providerLimits.requestsPerMinute) {
      return false
    }

    const currentTokens = validTokens.reduce((sum, _) => sum + tokensUsed, 0)
    if (currentTokens + tokensUsed > providerLimits.tokensPerMinute) {
      return false
    }

    // Record this request
    validRequests.push(now)
    if (tokensUsed > 0) {
      validTokens.push(tokensUsed)
    }

    this.requests.set(key, validRequests)
    this.tokens.set(key, validTokens)

    return true
  }
}

const rateLimiter = new RateLimiter()

// Main AI client class
export class AIClient {
  private apiKeys: Map<AIProvider, string> = new Map()

  constructor() {
    // Initialize API keys from environment variables
    this.setApiKey(AI_PROVIDERS.OPENAI, process.env.OPENAI_API_KEY || '')
    this.setApiKey(AI_PROVIDERS.ANTHROPIC, process.env.ANTHROPIC_API_KEY || '')
    this.setApiKey(AI_PROVIDERS.GOOGLE, process.env.GOOGLE_AI_API_KEY || '')
    this.setApiKey(AI_PROVIDERS.HUGGINGFACE, process.env.HUGGINGFACE_API_KEY || '')
  }

  setApiKey(provider: AIProvider, apiKey: string): void {
    this.apiKeys.set(provider, apiKey)
  }

  private getApiKey(provider: AIProvider): string {
    const apiKey = this.apiKeys.get(provider)
    if (!apiKey) {
      throw new AIError(AI_ERRORS.INVALID_API_KEY, `No API key set for ${provider}`)
    }
    return apiKey
  }

  async completion(options: AICompletionOptions): Promise<AICompletionResponse> {
    const config = {
      ...DEFAULT_CONFIG,
      ...options,
    }

    // Rate limiting check
    // biome-ignore lint/style/noNonNullAssertion: provider has default value from DEFAULT_CONFIG
    if (!rateLimiter.isAllowed(config.provider!, config.maxTokens)) {
      throw new AIError(AI_ERRORS.RATE_LIMIT_EXCEEDED, 'Rate limit exceeded')
    }

    try {
      switch (config.provider) {
        case AI_PROVIDERS.OPENAI:
          return await this.openaiCompletion(config)
        case AI_PROVIDERS.ANTHROPIC:
          return await this.anthropicCompletion(config)
        case AI_PROVIDERS.VERCEL:
          return await this.vercelCompletion(config)
        case AI_PROVIDERS.GOOGLE:
          return await this.googleCompletion(config)
        default:
          throw new AIError(AI_ERRORS.MODEL_NOT_FOUND, `Unsupported provider: ${config.provider}`)
      }
    } catch (error) {
      if (error instanceof AIError) {
        throw error
      }
      throw new AIError(
        AI_ERRORS.UNKNOWN,
        'Unknown error occurred',
        config.provider,
        error as Error
      )
    }
  }

  private async openaiCompletion(options: AICompletionOptions): Promise<AICompletionResponse> {
    const apiKey = this.getApiKey(AI_PROVIDERS.OPENAI)

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options.model,
        messages: options.messages,
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        stream: false, // Handle streaming separately if needed
        functions: options.functions,
        function_call: options.functionCall,
        user: options.userId,
      }),
      signal: AbortSignal.timeout(options.timeout || DEFAULT_CONFIG.timeout),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }))
      throw new AIError(
        this.mapOpenAIErrorToAIError(response.status),
        error.error?.message || 'OpenAI API error',
        AI_PROVIDERS.OPENAI
      )
    }

    return await response.json()
  }

  private async anthropicCompletion(options: AICompletionOptions): Promise<AICompletionResponse> {
    const apiKey = this.getApiKey(AI_PROVIDERS.ANTHROPIC)

    // Convert OpenAI format to Anthropic format
    const systemMessage = options.messages.find((m) => m.role === 'system')
    const userMessages = options.messages.filter((m) => m.role !== 'system')

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: options.model,
        system: systemMessage?.content || '',
        messages: userMessages,
        max_tokens: options.maxTokens,
        temperature: options.temperature,
      }),
      signal: AbortSignal.timeout(options.timeout || DEFAULT_CONFIG.timeout),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }))
      throw new AIError(
        this.mapAnthropicErrorToAIError(response.status),
        error.error?.message || 'Anthropic API error',
        AI_PROVIDERS.ANTHROPIC
      )
    }

    const result = await response.json()

    // Convert Anthropic format to OpenAI format
    return {
      id: result.id,
      object: 'chat.completion',
      created: Date.now(),
      model: result.model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: result.content[0]?.text || '',
          },
          finish_reason: result.stop_reason,
        },
      ],
      usage: {
        prompt_tokens: result.usage.input_tokens,
        completion_tokens: result.usage.output_tokens,
        total_tokens: result.usage.input_tokens + result.usage.output_tokens,
      },
    }
  }

  private async vercelCompletion(options: AICompletionOptions): Promise<AICompletionResponse> {
    try {
      const { text, usage, finishReason } = await generateText({
        model: openai(options.model || 'gpt-4-turbo'),
        messages: options.messages.map((m) => ({
          role: m.role as 'system' | 'user' | 'assistant',
          content: m.content,
        })),
        ...(options.maxTokens && { maxOutputTokens: options.maxTokens }),
        ...(options.temperature && { temperature: options.temperature }),
      })

      return {
        id: `vercel-${Date.now()}`,
        object: 'chat.completion',
        created: Date.now(),
        model: options.model || 'gpt-4-turbo',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: text,
            },
            finish_reason: finishReason,
          },
        ],
        usage: {
          prompt_tokens: usage.inputTokens ?? 0,
          completion_tokens: usage.outputTokens ?? 0,
          total_tokens: (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0),
        },
      }
    } catch (error) {
      throw new AIError(
        AI_ERRORS.UNKNOWN,
        error instanceof Error ? error.message : 'Vercel AI SDK error',
        AI_PROVIDERS.VERCEL,
        error instanceof Error ? error : undefined
      )
    }
  }

  private async googleCompletion(options: AICompletionOptions): Promise<AICompletionResponse> {
    const apiKey = this.getApiKey(AI_PROVIDERS.GOOGLE)

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${options.model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: options.messages.map((msg) => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
          })),
          generationConfig: {
            temperature: options.temperature,
            maxOutputTokens: options.maxTokens,
          },
        }),
        signal: AbortSignal.timeout(options.timeout || DEFAULT_CONFIG.timeout),
      }
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }))
      throw new AIError(
        this.mapGoogleErrorToAIError(response.status),
        error.error?.message || 'Google AI API error',
        AI_PROVIDERS.GOOGLE
      )
    }

    const result = await response.json()

    // Convert Google format to OpenAI format
    return {
      id: `google-${Date.now()}`,
      object: 'chat.completion',
      created: Date.now(),
      // biome-ignore lint/style/noNonNullAssertion: model is always provided in options
      model: options.model!,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: result.candidates[0]?.content?.parts[0]?.text || '',
          },
          finish_reason: result.candidates[0]?.finishReason?.toLowerCase() || 'stop',
        },
      ],
      usage: {
        prompt_tokens: 0, // Google doesn't provide token counts
        completion_tokens: 0,
        total_tokens: 0,
      },
    }
  }

  private mapOpenAIErrorToAIError(status: number): AIErrorCode {
    switch (status) {
      case 401:
        return AI_ERRORS.INVALID_API_KEY
      case 429:
        return AI_ERRORS.RATE_LIMIT_EXCEEDED
      case 402:
        return AI_ERRORS.INSUFFICIENT_QUOTA
      case 404:
        return AI_ERRORS.MODEL_NOT_FOUND
      case 400:
        return AI_ERRORS.INVALID_REQUEST
      default:
        return AI_ERRORS.UNKNOWN
    }
  }

  private mapAnthropicErrorToAIError(status: number): AIErrorCode {
    switch (status) {
      case 401:
        return AI_ERRORS.INVALID_API_KEY
      case 429:
        return AI_ERRORS.RATE_LIMIT_EXCEEDED
      case 400:
        return AI_ERRORS.INVALID_REQUEST
      default:
        return AI_ERRORS.UNKNOWN
    }
  }

  private mapGoogleErrorToAIError(status: number): AIErrorCode {
    switch (status) {
      case 401:
        return AI_ERRORS.INVALID_API_KEY
      case 429:
        return AI_ERRORS.RATE_LIMIT_EXCEEDED
      case 400:
        return AI_ERRORS.INVALID_REQUEST
      default:
        return AI_ERRORS.UNKNOWN
    }
  }
}

// Singleton instance
export const aiClient = new AIClient()
