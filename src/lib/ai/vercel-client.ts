import { anthropic } from '@ai-sdk/anthropic'
import { google } from '@ai-sdk/google'
import { openai } from '@ai-sdk/openai'
import { generateObject, generateText, streamText } from 'ai'

// AI Provider configuration
export const AI_MODELS = {
  // OpenAI Models
  'gpt-4': openai('gpt-4'),
  'gpt-4-turbo': openai('gpt-4-turbo'),
  'gpt-3.5-turbo': openai('gpt-3.5-turbo'),
  'gpt-4o': openai('gpt-4o'),
  'gpt-4o-mini': openai('gpt-4o-mini'),

  // Anthropic Models
  'claude-3-opus': anthropic('claude-3-opus-20240229'),
  'claude-3-sonnet': anthropic('claude-3-sonnet-20240229'),
  'claude-3-haiku': anthropic('claude-3-haiku-20240307'),
  'claude-3-5-sonnet': anthropic('claude-3-5-sonnet-20241022'),

  // Google Models
  'gemini-pro': google('models/gemini-pro'),
  'gemini-1.5-pro': google('models/gemini-1.5-pro-latest'),
  'gemini-1.5-flash': google('models/gemini-1.5-flash-latest'),
} as const

export type AIModelKey = keyof typeof AI_MODELS

// Server Actions for AI operations
export async function generateAIText(
  prompt: string,
  modelKey: AIModelKey = 'gpt-4o-mini',
  systemPrompt?: string
) {
  'use server'

  try {
    const model = AI_MODELS[modelKey]

    const { text } = await generateText({
      model,
      messages: [
        ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
        { role: 'user' as const, content: prompt },
      ],
      maxOutputTokens: 4000,
      temperature: 0.7,
    })

    return { success: true, text }
  } catch (error) {
    console.error('AI generation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function streamAIText(
  prompt: string,
  modelKey: AIModelKey = 'gpt-4o-mini',
  systemPrompt?: string
) {
  'use server'

  try {
    const model = AI_MODELS[modelKey]

    const result = await streamText({
      model,
      messages: [
        ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
        { role: 'user' as const, content: prompt },
      ],
      maxOutputTokens: 4000,
      temperature: 0.7,
    })

    return {
      success: true,
      textStream: result.textStream,
      text: await result.text,
    }
  } catch (error) {
    console.error('AI streaming error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function generateAIObject<_T>(
  prompt: string,
  schema: any,
  modelKey: AIModelKey = 'gpt-4o-mini',
  systemPrompt?: string
) {
  'use server'

  try {
    const model = AI_MODELS[modelKey]

    const { object } = await generateObject({
      model,
      schema,
      messages: [
        ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
        { role: 'user' as const, content: prompt },
      ],
      maxOutputTokens: 4000,
      temperature: 0.7,
    })

    return { success: true, object }
  } catch (error) {
    console.error('AI object generation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Chat history type for persistent conversations
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  id: string
  timestamp: Date
}

export async function continueAIConversation(
  messages: ChatMessage[],
  modelKey: AIModelKey = 'gpt-4o-mini'
) {
  'use server'

  try {
    const model = AI_MODELS[modelKey]

    const result = await streamText({
      model,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      maxOutputTokens: 4000,
      temperature: 0.7,
    })

    return {
      success: true,
      textStream: result.textStream,
      text: await result.text,
    }
  } catch (error) {
    console.error('AI conversation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Export available actions for client-side usage
export const aiActions = {
  generateAIText,
  streamAIText,
  generateAIObject,
  continueAIConversation,
}
