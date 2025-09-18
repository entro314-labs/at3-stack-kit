/**
 * Add AI integration to existing project
 */

import { join } from 'node:path'
import { ensureDir, pathExists, readFile, writeFile } from 'fs-extra'

export async function addAI(type: 'custom' | 'vercel', projectPath: string): Promise<void> {
  const srcPath = join(projectPath, 'src')
  await ensureDir(srcPath)

  // Create lib/ai directory
  const aiPath = join(srcPath, 'lib', 'ai')
  await ensureDir(aiPath)

  if (type === 'custom') {
    await addCustomAI(aiPath)
  }

  if (type === 'vercel') {
    await addVercelAI(aiPath)
  }

  // Create API routes
  const apiPath = join(srcPath, 'app', 'api')
  await ensureDir(apiPath)

  await addAPIRoutes(apiPath, type)

  // Update package.json
  await updatePackageJson(projectPath, type)
}

async function addCustomAI(aiPath: string): Promise<void> {
  // AI client configuration
  const clientConfig = `/**
 * Custom AI client configuration
 */

export interface AIProvider {
  name: string;
  baseURL: string;
  apiKey: string;
}

export const AI_PROVIDERS = {
  openai: {
    name: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY!,
  },
  anthropic: {
    name: 'Anthropic',
    baseURL: 'https://api.anthropic.com',
    apiKey: process.env.ANTHROPIC_API_KEY!,
  },
  google: {
    name: 'Google AI',
    baseURL: 'https://generativelanguage.googleapis.com',
    apiKey: process.env.GOOGLE_AI_API_KEY!,
  },
} as const;

export type AIProviderKey = keyof typeof AI_PROVIDERS;
`

  await writeFile(join(aiPath, 'config.ts'), clientConfig)

  // AI client
  const client = `/**
 * Custom AI client implementation
 */

import { AI_PROVIDERS, type AIProviderKey } from './config.js';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionOptions {
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export class AIClient {
  constructor(
    private provider: AIProviderKey,
    private options: CompletionOptions = {}
  ) {}

  async completion(
    messages: ChatMessage[],
    options: Partial<CompletionOptions> = {}
  ): Promise<string> {
    const config = AI_PROVIDERS[this.provider];
    const finalOptions = { ...this.options, ...options };

    // Implementation would depend on the provider
    // This is a basic structure
    const response = await fetch(\`\${config.baseURL}/chat/completions\`, {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${config.apiKey}\`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: finalOptions.model || 'gpt-3.5-turbo',
        messages,
        temperature: finalOptions.temperature || 0.7,
        max_tokens: finalOptions.maxTokens || 1000,
      }),
    });

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }
}
`

  await writeFile(join(aiPath, 'client.ts'), client)
}

async function addVercelAI(aiPath: string): Promise<void> {
  // Vercel AI client
  const vercelClient = `/**
 * Vercel AI SDK integration
 */

import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';  
import { openai } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';

export const AI_MODELS = {
  'gpt-4-turbo': openai('gpt-4-turbo'),
  'gpt-3.5-turbo': openai('gpt-3.5-turbo'),
  'claude-3-haiku': anthropic('claude-3-haiku-20240307'),
  'claude-3-sonnet': anthropic('claude-3-sonnet-20240229'),
  'gemini-pro': google('models/gemini-pro'),
} as const;

export type AIModelKey = keyof typeof AI_MODELS;

export async function generateCompletion(
  model: AIModelKey,
  prompt: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
  }
) {
  const { text } = await generateText({
    model: AI_MODELS[model],
    prompt,
    temperature: options?.temperature || 0.7,
    maxTokens: options?.maxTokens || 1000,
  });

  return text;
}

export async function streamCompletion(
  model: AIModelKey,
  prompt: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
  }
) {
  const { textStream } = await streamText({
    model: AI_MODELS[model],
    prompt,
    temperature: options?.temperature || 0.7,
    maxTokens: options?.maxTokens || 1000,
  });

  return textStream;
}
`

  await writeFile(join(aiPath, 'vercel-client.ts'), vercelClient)

  // Vercel AI hooks
  const hooks = `/**
 * React hooks for Vercel AI SDK
 */

'use client';

import { useChat, useCompletion } from 'ai/react';
import { type AIModelKey } from './vercel-client.js';

export function useAIChat(model: AIModelKey = 'gpt-3.5-turbo') {
  return useChat({
    api: '/api/chat',
    body: {
      model,
    },
  });
}

export function useAICompletion(model: AIModelKey = 'gpt-3.5-turbo') {
  return useCompletion({
    api: '/api/completion',
    body: {
      model,
    },
  });
}
`

  await writeFile(join(aiPath, 'vercel-hooks.ts'), hooks)
}

async function addAPIRoutes(apiPath: string, type: 'custom' | 'vercel'): Promise<void> {
  if (type === 'vercel') {
    // Chat API route
    const chatRoute = `import { AI_MODELS, type AIModelKey } from '@/lib/ai/vercel-client';
import { streamText } from 'ai';

export async function POST(req: Request) {
  const { messages, model = 'gpt-3.5-turbo' } = await req.json();

  const result = await streamText({
    model: AI_MODELS[model as AIModelKey],
    messages,
  });

  return result.toDataStreamResponse();
}
`

    await ensureDir(join(apiPath, 'chat'))
    await writeFile(join(apiPath, 'chat', 'route.ts'), chatRoute)

    // Completion API route
    const completionRoute = `import { AI_MODELS, type AIModelKey } from '@/lib/ai/vercel-client';
import { generateText } from 'ai';

export async function POST(req: Request) {
  const { prompt, model = 'gpt-3.5-turbo' } = await req.json();

  const { text } = await generateText({
    model: AI_MODELS[model as AIModelKey],
    prompt,
  });

  return Response.json({ text });
}
`

    await ensureDir(join(apiPath, 'completion'))
    await writeFile(join(apiPath, 'completion', 'route.ts'), completionRoute)
  }
}

async function updatePackageJson(projectPath: string, type: 'custom' | 'vercel'): Promise<void> {
  const packageJsonPath = join(projectPath, 'package.json')

  if (!(await pathExists(packageJsonPath))) return

  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'))

  if (!packageJson.dependencies) packageJson.dependencies = {}

  if (type === 'vercel') {
    packageJson.dependencies.ai = '^5.0.8'
    packageJson.dependencies['@ai-sdk/openai'] = '^2.0.7'
    packageJson.dependencies['@ai-sdk/anthropic'] = '^2.0.1'
    packageJson.dependencies['@ai-sdk/google'] = '^2.0.3'
  }

  await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2))
}
