/**
 * AI utilities and integrations for AT3 Stack
 */

import { z } from 'zod'

// AI Provider configurations
export const aiProviderSchema = z.enum(['openai', 'anthropic', 'google'])
export type AIProvider = z.infer<typeof aiProviderSchema>

// Common AI model configurations
export const AI_MODELS = {
  openai: {
    'gpt-4-turbo': { name: 'GPT-4 Turbo', maxTokens: 4096 },
    'gpt-4': { name: 'GPT-4', maxTokens: 8192 },
    'gpt-3.5-turbo': { name: 'GPT-3.5 Turbo', maxTokens: 4096 },
  },
  anthropic: {
    'claude-3-opus': { name: 'Claude 3 Opus', maxTokens: 4096 },
    'claude-3-sonnet': { name: 'Claude 3 Sonnet', maxTokens: 4096 },
    'claude-3-haiku': { name: 'Claude 3 Haiku', maxTokens: 4096 },
  },
  google: {
    'gemini-pro': { name: 'Gemini Pro', maxTokens: 2048 },
    'gemini-pro-vision': { name: 'Gemini Pro Vision', maxTokens: 2048 },
  },
} as const

export type AIModelKey = {
  [K in AIProvider]: keyof (typeof AI_MODELS)[K]
}[AIProvider]

// AI configuration schema
export const aiConfigSchema = z.object({
  provider: aiProviderSchema,
  model: z.string(),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(1).max(8192).default(1000),
  apiKey: z.string().optional(),
})

export type AIConfig = z.infer<typeof aiConfigSchema>

/**
 * Get available models for a provider
 */
export function getAvailableModels(provider: AIProvider) {
  return Object.keys(AI_MODELS[provider])
}

/**
 * Get model configuration
 */
export function getModelConfig(provider: AIProvider, model: string) {
  const models = AI_MODELS[provider] as Record<string, unknown>
  return models[model] || null
}

/**
 * Validate AI configuration
 */
export function validateAIConfig(config: unknown): AIConfig {
  return aiConfigSchema.parse(config)
}

/**
 * Get default AI configuration
 */
export function getDefaultAIConfig(provider: AIProvider = 'openai'): AIConfig {
  const defaultModels = {
    openai: 'gpt-3.5-turbo',
    anthropic: 'claude-3-haiku',
    google: 'gemini-pro',
  }

  return {
    provider,
    model: defaultModels[provider],
    temperature: 0.7,
    maxTokens: 1000,
  }
}

// Note: Types from 'ai' package are available when this module is used in target projects
// These types are for reference in code generation, not direct usage
export interface CoreMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ToolInvocation {
  toolCallId: string
  toolName: string
  args: Record<string, unknown>
}

export interface VercelMessage extends CoreMessage {
  id: string
  createdAt?: Date
}
