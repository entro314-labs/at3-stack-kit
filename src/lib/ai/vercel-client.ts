import { anthropic } from '@ai-sdk/anthropic'
import { google } from '@ai-sdk/google'
import { openai } from '@ai-sdk/openai'

// Shared model registry used by the route handlers and chat hooks.
export const AI_MODELS = {
  'gpt-4': openai('gpt-4'),
  'gpt-4-turbo': openai('gpt-4-turbo'),
  'gpt-3.5-turbo': openai('gpt-3.5-turbo'),
  'gpt-4o': openai('gpt-4o'),
  'gpt-4o-mini': openai('gpt-4o-mini'),
  'claude-3-opus': anthropic('claude-3-opus-20240229'),
  'claude-3-sonnet': anthropic('claude-3-sonnet-20240229'),
  'claude-3-haiku': anthropic('claude-3-haiku-20240307'),
  'claude-3-5-sonnet': anthropic('claude-3-5-sonnet-20241022'),
  'gemini-pro': google('models/gemini-pro'),
  'gemini-1.5-pro': google('models/gemini-1.5-pro-latest'),
  'gemini-1.5-flash': google('models/gemini-1.5-flash-latest'),
} as const

export type AIModelKey = keyof typeof AI_MODELS

