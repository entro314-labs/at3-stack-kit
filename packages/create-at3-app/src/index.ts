/**
 * Create-at3-app
 * Scaffold AT3 applications from stable preset templates.
 */

import { existsSync, promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import {
  cancel,
  confirm,
  intro,
  isCancel,
  note,
  outro,
  select,
  spinner,
  text,
} from '@clack/prompts'
import chalk from 'chalk'
import { Command } from 'commander'
import spawn from 'cross-spawn'
import { detect as detectPackageManager } from 'detect-package-manager'
import validateNpmPackageName from 'validate-npm-package-name'
import { formatFeatures } from './utils/cli-styling.js'
import { createAT3Config, getWorkflowSuggestions, suggestAT3Tools } from './utils/integration.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const JSON_SPACES = 2
const CLI_VERSION = process.env.npm_package_version ?? '1.0.0-alpha.1'

type PackageManager = 'pnpm' | 'npm' | 'yarn'
type DatabaseOption = 'supabase' | 'neon' | 'drizzle' | 'none'
type AuthOption = 'supabase' | 'clerk' | 'none'
type LintingOption = 'biome' | 'oxc'
type AIFeatureMode = 'vercel' | 'custom' | 'both'

interface TemplateDefaults {
  database: DatabaseOption
  auth: AuthOption
  linting: LintingOption
  ai: boolean
  aiMode: AIFeatureMode
}

interface TemplateConfig {
  defaults: TemplateDefaults
  description: string
  name: string
}

const TEMPLATES = {
  '83-flavor': {
    defaults: {
      ai: true,
      aiMode: 'vercel',
      auth: 'clerk',
      database: 'neon',
      linting: 'oxc',
    },
    description: 'AT3 preset with Neon, Clerk, OXC, and the AI chat starter',
    name: '83 Flavor',
  },
  suggested: {
    defaults: {
      ai: true,
      aiMode: 'vercel',
      auth: 'supabase',
      database: 'supabase',
      linting: 'oxc',
    },
    description: 'AT3 preset with Supabase auth/data and the AI chat starter',
    name: 'Suggested',
  },
  t3: {
    defaults: {
      ai: false,
      aiMode: 'vercel',
      auth: 'none',
      database: 'none',
      linting: 'oxc',
    },
    description: 'Minimal Next.js, TypeScript, Tailwind, and OXC starter',
    name: 'T3 Base',
  },
  't3-ai-vercel': {
    defaults: {
      ai: true,
      aiMode: 'vercel',
      auth: 'none',
      database: 'none',
      linting: 'oxc',
    },
    description: 'T3 base with the Vercel AI SDK chat starter',
    name: 'T3 + AI',
  },
  't3-ai-custom': {
    defaults: {
      ai: true,
      aiMode: 'custom',
      auth: 'none',
      database: 'none',
      linting: 'oxc',
    },
    description: 'T3 base with OpenAI, Anthropic, and Google provider selection',
    name: 'T3 + AI Custom',
  },
  't3-ai-both': {
    defaults: {
      ai: true,
      aiMode: 'both',
      auth: 'none',
      database: 'none',
      linting: 'oxc',
    },
    description: 'T3 base with Vercel AI SDK transport and multi-provider model registry',
    name: 'T3 + AI Both',
  },
  't3-edge': {
    defaults: {
      ai: false,
      aiMode: 'vercel',
      auth: 'supabase',
      database: 'supabase',
      linting: 'oxc',
    },
    description: 'T3 base with Supabase auth/data and route protection',
    name: 'T3 + Edge',
  },
} as const satisfies Record<string, TemplateConfig>

type Template = keyof typeof TEMPLATES

interface StackSelection {
  ai: boolean
  auth: AuthOption
  database: DatabaseOption
  linting: LintingOption
  template: Template
  aiMode: AIFeatureMode
}

interface CreateAppParams extends Omit<StackSelection, 'aiMode'> {
  aiMode?: AIFeatureMode
  installDeps: boolean
  packageManager: PackageManager
  projectDir: string
  projectName: string
  skipGit: boolean
}

function isTemplate(value: string): value is Template {
  return value in TEMPLATES
}

function resolveTemplate(value: string): Template | undefined {
  if (isTemplate(value)) {
    return value
  }
}

function isDatabaseOption(value: string): value is DatabaseOption {
  return value === 'supabase' || value === 'neon' || value === 'drizzle' || value === 'none'
}

function isAuthOption(value: string): value is AuthOption {
  return value === 'supabase' || value === 'clerk' || value === 'none'
}

function isLintingOption(value: string): value is LintingOption {
  return value === 'biome' || value === 'oxc'
}

function isAIFeatureMode(value: string): value is AIFeatureMode {
  return value === 'vercel' || value === 'custom' || value === 'both'
}

function getTemplateDefaults(template: Template): TemplateDefaults {
  return TEMPLATES[template].defaults
}

function normalizeSelection(selection: StackSelection): StackSelection {
  const normalized = { ...selection }

  if (normalized.auth === 'supabase' && normalized.database !== 'supabase') {
    normalized.database = 'supabase'
  }

  return normalized
}

function getSelectedFeatures(selection: StackSelection): string[] {
  const features = ['nextjs', 'typescript', 'tailwind']

  features.push(selection.linting)

  if (selection.ai) {
    features.push(`ai-${selection.aiMode}`)
  }

  if (selection.database === 'supabase') {
    features.push('supabase')
  } else if (selection.database === 'neon') {
    features.push('neon')
  } else if (selection.database === 'drizzle') {
    features.push('drizzle')
  }

  if (selection.auth === 'supabase') {
    features.push('supabase-auth')
  } else if (selection.auth === 'clerk') {
    features.push('clerk')
  }

  return features
}

function resolveAppDirectory(projectDir: string): string {
  const srcAppDir = path.join(projectDir, 'src', 'app')
  if (existsSync(srcAppDir)) {
    return srcAppDir
  }

  return path.join(projectDir, 'app')
}

function resolveSourceRoot(projectDir: string): string {
  const srcAppDir = path.join(projectDir, 'src', 'app')
  if (existsSync(srcAppDir)) {
    return path.join(projectDir, 'src')
  }

  return projectDir
}

async function readPackageJson(projectDir: string) {
  const packageJsonPath = path.join(projectDir, 'package.json')
  return JSON.parse(await fs.readFile(packageJsonPath, 'utf8')) as {
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
    name: string
    scripts?: Record<string, string>
    version?: string
  }
}

async function writePackageJson(projectDir: string, packageJson: unknown) {
  const packageJsonPath = path.join(projectDir, 'package.json')
  await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, undefined, JSON_SPACES))
}

async function updatePackageJson(projectDir: string, projectName: string) {
  const packageJson = await readPackageJson(projectDir)

  packageJson.name = projectName
  packageJson.version = '0.1.0'
  delete (packageJson as { author?: string }).author

  packageJson.scripts = {
    ...packageJson.scripts,
    typecheck: 'tsc --noEmit',
  }

  await writePackageJson(projectDir, packageJson)
}

async function configureLinting(projectDir: string, linting: LintingOption): Promise<void> {
  const packageJson = await readPackageJson(projectDir)

  packageJson.scripts ??= {}
  packageJson.dependencies ??= {}
  packageJson.devDependencies ??= {}

  delete packageJson.devDependencies.eslint
  delete packageJson.devDependencies['eslint-config-next']

  if (linting === 'biome') {
    packageJson.devDependencies['@biomejs/biome'] = '^2.3.8'

    packageJson.scripts.check = 'biome check . && biome format .'
    packageJson.scripts['check:fix'] = 'biome check --write . && biome format --write .'
    packageJson.scripts.format = 'biome format --write .'
    packageJson.scripts['format:check'] = 'biome format .'
    packageJson.scripts.lint = 'biome check .'
    packageJson.scripts['lint:fix'] = 'biome check --write .'

    const biomeConfig = {
      $schema: 'https://biomejs.dev/schemas/2.3.8/schema.json',
      formatter: {
        enabled: true,
        indentStyle: 'space',
        indentWidth: 2,
      },
      javascript: {
        formatter: {
          quoteStyle: 'single',
          semicolons: 'asNeeded',
        },
      },
      linter: {
        enabled: true,
      },
    }

    await fs.writeFile(
      path.join(projectDir, 'biome.json'),
      JSON.stringify(biomeConfig, undefined, JSON_SPACES)
    )
  } else {
    packageJson.devDependencies.oxfmt = '^0.32.0'
    packageJson.devDependencies.oxlint = '^1.47.0'
    packageJson.devDependencies['oxlint-tsgolint'] = '^0.12.2'

    packageJson.scripts.check = 'oxlint . && oxfmt --check .'
    packageJson.scripts['check:fix'] = 'oxlint --fix . && oxfmt --write .'
    packageJson.scripts.format = 'oxfmt --write .'
    packageJson.scripts['format:check'] = 'oxfmt --check .'
    packageJson.scripts.lint = 'oxlint .'
    packageJson.scripts['lint:fix'] = 'oxlint --fix .'
    packageJson.scripts['lint:type-aware'] = 'oxlint --type-aware --type-check .'
  }

  await writePackageJson(projectDir, packageJson)
}

function getAIDependencies(aiMode: AIFeatureMode): Record<string, string> {
  const dependencies: Record<string, string> = {
    '@ai-sdk/openai': '^3.0.29',
    '@ai-sdk/react': '^3.0.88',
    ai: '^6.0.86',
  }

  if (aiMode === 'custom' || aiMode === 'both') {
    dependencies['@ai-sdk/anthropic'] = '^3.0.44'
    dependencies['@ai-sdk/google'] = '^3.0.29'
  }

  return dependencies
}

function getAIRouteContent(aiMode: AIFeatureMode): string {
  if (aiMode === 'vercel') {
    return `import { openai } from '@ai-sdk/openai'
import { type UIMessage, convertToModelMessages, streamText } from 'ai'

export const maxDuration = 30

export async function POST(req: Request) {
  const {
    messages,
  }: {
    messages?: UIMessage[]
  } = await req.json()

  if (!Array.isArray(messages)) {
    return Response.json({ error: 'messages must be an array' }, { status: 400 })
  }

  const result = await streamText({
    messages: await convertToModelMessages(messages),
    model: openai('gpt-4o-mini'),
  })

  return result.toUIMessageStreamResponse()
}
`
  }

  return `import { anthropic } from '@ai-sdk/anthropic'
import { google } from '@ai-sdk/google'
import { openai } from '@ai-sdk/openai'
import { type UIMessage, convertToModelMessages, streamText } from 'ai'

export const maxDuration = 30

const AI_MODELS = {
  'gpt-4o-mini': openai('gpt-4o-mini'),
  'claude-3-5-sonnet': anthropic('claude-3-5-sonnet-20241022'),
  'gemini-1.5-flash': google('gemini-1.5-flash'),
} as const

type AIModelKey = keyof typeof AI_MODELS

const DEFAULT_MODEL: AIModelKey = 'gpt-4o-mini'

function isAIModelKey(value: unknown): value is AIModelKey {
  return typeof value === 'string' && value in AI_MODELS
}

export async function POST(req: Request) {
  const {
    messages,
    model = DEFAULT_MODEL,
  }: {
    messages?: UIMessage[]
    model?: unknown
  } = await req.json()

  if (!Array.isArray(messages)) {
    return Response.json({ error: 'messages must be an array' }, { status: 400 })
  }

  const selectedModel = isAIModelKey(model) ? model : DEFAULT_MODEL

  const result = await streamText({
    messages: await convertToModelMessages(messages),
    model: AI_MODELS[selectedModel],
  })

  return result.toUIMessageStreamResponse()
}
`
}

function getAIPageContent(aiMode: AIFeatureMode): string {
  const modelSelector =
    aiMode === 'vercel'
      ? ''
      : `
const MODELS = [
  { label: 'OpenAI GPT-4o mini', value: 'gpt-4o-mini' },
  { label: 'Anthropic Claude 3.5 Sonnet', value: 'claude-3-5-sonnet' },
  { label: 'Google Gemini 1.5 Flash', value: 'gemini-1.5-flash' },
] as const

type ModelKey = (typeof MODELS)[number]['value']
`

  const stateSetup =
    aiMode === 'vercel'
      ? `  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
  })
  const [input, setInput] = useState('')`
      : `  const [model, setModel] = useState<ModelKey>('gpt-4o-mini')
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: () => ({ model }),
    }),
  })
  const [input, setInput] = useState('')`

  const modelControl =
    aiMode === 'vercel'
      ? ''
      : `
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Model
            <select
              className="rounded-xl border border-slate-300 bg-white p-3 text-sm outline-none transition focus:border-slate-500"
              value={model}
              onChange={(event) => setModel(event.target.value as ModelKey)}
              disabled={status === 'streaming'}
            >
              {MODELS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
`

  return `'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { type FormEvent, useState } from 'react'
${modelSelector}
export default function Home() {
${stateSetup}

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

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 border-t border-slate-200 pt-4">${modelControl}
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
`
}

async function configureAIFeatures(
  projectDir: string,
  aiEnabled: boolean,
  aiMode: AIFeatureMode
): Promise<void> {
  const packageJson = await readPackageJson(projectDir)

  packageJson.dependencies ??= {}
  packageJson.devDependencies ??= {}

  const aiDependencies = getAIDependencies(aiMode)
  const allAIDependencies = getAIDependencies('both')

  const appDir = resolveAppDirectory(projectDir)
  const chatRoutePath = path.join(appDir, 'api', 'chat', 'route.ts')
  const pagePath = path.join(appDir, 'page.tsx')

  if (aiEnabled) {
    for (const [dependency, version] of Object.entries(aiDependencies)) {
      packageJson.dependencies[dependency] =
        packageJson.dependencies[dependency] || packageJson.devDependencies[dependency] || version
    }

    await fs.mkdir(path.dirname(chatRoutePath), { recursive: true })
    await fs.writeFile(chatRoutePath, getAIRouteContent(aiMode))
    await fs.writeFile(pagePath, getAIPageContent(aiMode))
  } else {
    for (const dependency of Object.keys(allAIDependencies)) {
      delete packageJson.dependencies[dependency]
      delete packageJson.devDependencies[dependency]
    }

    await fs.rm(chatRoutePath, { force: true })

    await fs.writeFile(
      pagePath,
      `export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-6 px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">AT3</p>
      <h1 className="text-4xl font-bold tracking-tight">Project Ready</h1>
      <p className="text-lg text-slate-600">
        Your starter app is configured. Add routes, components, and domain logic from here.
      </p>
    </main>
  )
}
`
    )
  }

  await writePackageJson(projectDir, packageJson)
}

async function ensureProtectedPages(projectDir: string, auth: AuthOption): Promise<void> {
  if (auth === 'none') {
    return
  }

  const appDir = resolveAppDirectory(projectDir)
  const dashboardDir = path.join(appDir, 'dashboard')
  const profileDir = path.join(appDir, 'profile')
  const settingsDir = path.join(appDir, 'settings')

  await fs.mkdir(dashboardDir, { recursive: true })
  await fs.mkdir(profileDir, { recursive: true })
  await fs.mkdir(settingsDir, { recursive: true })

  if (auth === 'clerk') {
    await fs.writeFile(
      path.join(dashboardDir, 'page.tsx'),
      `import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'

export default function DashboardPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-6 py-16">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Dashboard</p>
          <h1 className="text-4xl font-bold tracking-tight">Signed in with Clerk</h1>
        </div>
        <UserButton afterSignOutUrl="/" />
      </div>

      <p className="text-slate-600">
        This protected route confirms Clerk middleware, provider wiring, and route guards are in place.
      </p>

      <div className="flex gap-3">
        <Link href="/profile" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
          Profile
        </Link>
        <Link href="/settings" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
          Settings
        </Link>
      </div>
    </main>
  )
}
`
    )
  } else {
    await fs.writeFile(
      path.join(dashboardDir, 'page.tsx'),
      `'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/auth/auth-helpers'

export default function DashboardPage() {
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-6 py-16">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Dashboard</p>
        <h1 className="text-4xl font-bold tracking-tight">Signed in with Supabase</h1>
      </div>

      <p className="text-slate-600">
        This protected route confirms Supabase session refresh and route guards are working.
      </p>

      <div className="flex flex-wrap gap-3">
        <Link href="/profile" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
          Profile
        </Link>
        <Link href="/settings" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
          Settings
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white"
        >
          Sign out
        </button>
      </div>
    </main>
  )
}
`
    )
  }

  await fs.writeFile(
    path.join(profileDir, 'page.tsx'),
    `export default function ProfilePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-4 px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Profile</p>
      <h1 className="text-4xl font-bold tracking-tight">Profile</h1>
      <p className="text-slate-600">
        Replace this placeholder with the profile experience your product needs.
      </p>
    </main>
  )
}
`
  )

  await fs.writeFile(
    path.join(settingsDir, 'page.tsx'),
    `export default function SettingsPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-4 px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Settings</p>
      <h1 className="text-4xl font-bold tracking-tight">Settings</h1>
      <p className="text-slate-600">
        Replace this placeholder with your real settings surface.
      </p>
    </main>
  )
}
`
  )
}

async function setupNeon(projectDir: string): Promise<void> {
  const packageJson = await readPackageJson(projectDir)
  packageJson.dependencies ??= {}
  packageJson.dependencies['@neondatabase/serverless'] = '^1.0.2'
  await writePackageJson(projectDir, packageJson)

  const libPath = path.join(resolveSourceRoot(projectDir), 'lib', 'neon')
  await fs.mkdir(libPath, { recursive: true })
  await fs.writeFile(
    path.join(libPath, 'client.ts'),
    `import { neon } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing')
}

export const sql = neon(process.env.DATABASE_URL)
`
  )
}

async function setupDrizzle(projectDir: string): Promise<void> {
  const packageJson = await readPackageJson(projectDir)
  packageJson.dependencies ??= {}
  packageJson.devDependencies ??= {}

  packageJson.dependencies.dotenv = '^17.3.1'
  packageJson.dependencies['drizzle-orm'] = '^0.44.5'
  packageJson.dependencies.postgres = '^3.4.7'

  packageJson.devDependencies['@types/pg'] = '^8.15.5'
  packageJson.devDependencies['drizzle-kit'] = '^0.31.5'
  packageJson.devDependencies.pg = '^8.16.3'

  await writePackageJson(projectDir, packageJson)

  const dbPath = path.join(resolveSourceRoot(projectDir), 'db')
  await fs.mkdir(dbPath, { recursive: true })

  await fs.writeFile(
    path.join(projectDir, 'drizzle.config.ts'),
    `import { defineConfig } from 'drizzle-kit'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

export default defineConfig({
  schema: './db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
`
  )

  await fs.writeFile(
    path.join(dbPath, 'schema.ts'),
    `import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})
`
  )

  await fs.writeFile(
    path.join(dbPath, 'index.ts'),
    `import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!
const client = postgres(connectionString)

export const db = drizzle(client, { schema })
`
  )
}

async function setupSupabase(projectDir: string): Promise<void> {
  const packageJson = await readPackageJson(projectDir)
  packageJson.dependencies ??= {}
  packageJson.devDependencies ??= {}

  packageJson.dependencies['@supabase/ssr'] = '^0.5.2'
  packageJson.dependencies['@supabase/supabase-js'] = '^2.49.1'
  packageJson.devDependencies.supabase = '^2.39.2'

  await writePackageJson(projectDir, packageJson)

  const supabasePath = path.join(resolveSourceRoot(projectDir), 'lib', 'supabase')
  await fs.mkdir(supabasePath, { recursive: true })

  await fs.writeFile(
    path.join(supabasePath, 'client.ts'),
    `import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
`
  )

  await fs.writeFile(
    path.join(supabasePath, 'server.ts'),
    `import { type CookieOptions, createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // Server Components cannot always mutate cookies directly.
          }
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // Server Components cannot always mutate cookies directly.
          }
        },
      },
    }
  )
}
`
  )

  await fs.writeFile(
    path.join(supabasePath, 'middleware.ts'),
    `import { createServerClient } from '@supabase/ssr'
	import { type NextRequest, NextResponse } from 'next/server'
	
	export async function updateSession(request: NextRequest) {
	  let response = NextResponse.next({ request })
	  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
	  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
	
	  if (!supabaseUrl || !supabaseAnonKey) {
	    return { response, user: null }
	  }
	
	  const supabase = createServerClient(
	    supabaseUrl,
	    supabaseAnonKey,
	    {
	      cookies: {
	        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }

          response = NextResponse.next({ request })

          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
        },
      },
	    }
	  )
	
	  const {
	    data: { user },
	  } = await supabase.auth.getUser()
	
	  return { response, user }
	}
	`
  )

  await fs.mkdir(path.join(projectDir, 'supabase'), { recursive: true })
  await fs.writeFile(
    path.join(projectDir, 'supabase', 'config.toml'),
    `project_id = "your-project-id"

[api]
enabled = true
port = 54321
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[auth]
enabled = true
site_url = "http://localhost:3000"
additional_redirect_urls = ["http://localhost:3000"]

[auth.email]
enable_signup = true
enable_confirmations = false
`
  )
}

async function setupSupabaseAuth(projectDir: string): Promise<void> {
  const authPath = path.join(resolveSourceRoot(projectDir), 'lib', 'auth')
  const middlewarePath = path.join(resolveSourceRoot(projectDir), 'middleware.ts')
  const appDir = resolveAppDirectory(projectDir)

  await fs.mkdir(authPath, { recursive: true })
  await fs.mkdir(path.join(appDir, 'auth', 'sign-in'), { recursive: true })
  await fs.mkdir(path.join(appDir, 'auth', 'sign-up'), { recursive: true })

  await fs.writeFile(
    path.join(authPath, 'auth-helpers.ts'),
    `import { createClient } from '@/lib/supabase/client'

export function signInWithEmail(email: string, password: string) {
  const supabase = createClient()
  return supabase.auth.signInWithPassword({ email, password })
}

export function signUpWithEmail(email: string, password: string) {
  const supabase = createClient()
  return supabase.auth.signUp({ email, password })
}

export function signOut() {
  const supabase = createClient()
  return supabase.auth.signOut()
}
`
  )

  await fs.writeFile(
    middlewarePath,
    `import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const protectedRoutes = ['/dashboard', '/profile', '/settings']
const authRoutes = ['/auth/sign-in', '/auth/sign-up']

	export async function middleware(request: NextRequest) {
	  const { response, user } = await updateSession(request)
	
	  const isProtectedRoute = protectedRoutes.some((route) =>
	    request.nextUrl.pathname.startsWith(route)
	  )
	  const isAuthRoute = authRoutes.some((route) => request.nextUrl.pathname.startsWith(route))
	
	  if (isProtectedRoute && !user) {
	    const url = request.nextUrl.clone()
	    url.pathname = '/auth/sign-in'
	    url.searchParams.set('redirectTo', request.nextUrl.pathname)
	    return NextResponse.redirect(url)
	  }
	
	  if (isAuthRoute && user) {
	    const url = request.nextUrl.clone()
	    url.pathname = '/dashboard'
	    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
`
  )

  await fs.writeFile(
    path.join(appDir, 'auth', 'sign-in', 'page.tsx'),
    `'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { signInWithEmail } from '@/lib/auth/auth-helpers'

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const { error: signInError } = await signInWithEmail(email, password)

    if (signInError) {
      setError(signInError.message)
      setIsSubmitting(false)
      return
    }

    router.push(redirectTo)
    router.refresh()
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-6 py-16">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">AT3</p>
        <h1 className="text-4xl font-bold tracking-tight">Sign in</h1>
        <p className="text-slate-600">Use your Supabase email and password credentials.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 font-normal"
            required
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 font-normal"
            required
          />
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="text-sm text-slate-600">
        Need an account?{' '}
        <Link href="/auth/sign-up" className="font-medium text-slate-950 underline underline-offset-4">
          Sign up
        </Link>
      </p>
    </main>
  )
}
`
  )

  await fs.writeFile(
    path.join(appDir, 'auth', 'sign-up', 'page.tsx'),
    `'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { signUpWithEmail } from '@/lib/auth/auth-helpers'

export default function SignUpPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const { error: signUpError } = await signUpWithEmail(email, password)

    if (signUpError) {
      setError(signUpError.message)
      setIsSubmitting(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-6 py-16">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">AT3</p>
        <h1 className="text-4xl font-bold tracking-tight">Create account</h1>
        <p className="text-slate-600">Start with a Supabase-backed email and password account.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 font-normal"
            required
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 font-normal"
            required
            minLength={6}
          />
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="text-sm text-slate-600">
        Already have an account?{' '}
        <Link href="/auth/sign-in" className="font-medium text-slate-950 underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </main>
  )
}
`
  )
}

async function setupClerk(projectDir: string): Promise<void> {
  const packageJson = await readPackageJson(projectDir)
  packageJson.dependencies ??= {}
  packageJson.dependencies['@clerk/nextjs'] = '^6.9.0'
  await writePackageJson(projectDir, packageJson)

  const sourceRoot = resolveSourceRoot(projectDir)
  const appDir = resolveAppDirectory(projectDir)
  const layoutPath = path.join(appDir, 'layout.tsx')
  const middlewarePath = path.join(sourceRoot, 'middleware.ts')

  await fs.mkdir(path.join(appDir, 'sign-in', '[[...sign-in]]'), { recursive: true })
  await fs.mkdir(path.join(appDir, 'sign-up', '[[...sign-up]]'), { recursive: true })

  await fs.writeFile(
    middlewarePath,
    `import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/profile(.*)', '/settings(.*)'])

export default clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)', '/(api|trpc)(.*)'],
}
`
  )

  let layoutContent = await fs.readFile(layoutPath, 'utf8')
  if (!layoutContent.includes(`from '@clerk/nextjs'`)) {
    layoutContent = `import { ClerkProvider } from '@clerk/nextjs'\n${layoutContent}`
  }
  layoutContent = layoutContent.replace(
    '<body>{children}</body>',
    '<body><ClerkProvider>{children}</ClerkProvider></body>'
  )
  await fs.writeFile(layoutPath, layoutContent)

  await fs.writeFile(
    path.join(appDir, 'sign-in', '[[...sign-in]]', 'page.tsx'),
    `import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-6 py-16">
      <SignIn />
    </main>
  )
}
`
  )

  await fs.writeFile(
    path.join(appDir, 'sign-up', '[[...sign-up]]', 'page.tsx'),
    `import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-6 py-16">
      <SignUp />
    </main>
  )
}
`
  )
}

async function writeEnvExample(projectDir: string, selection: StackSelection): Promise<void> {
  const sections: string[] = []

  if (selection.database === 'supabase' || selection.auth === 'supabase') {
    sections.push(`# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key`)
  }

  if (selection.database === 'neon') {
    sections.push(`# Neon
DATABASE_URL=postgresql://user:password@ep-example.us-east-2.aws.neon.tech/neondb?sslmode=require`)
  }

  if (selection.database === 'drizzle') {
    sections.push(`# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/postgres`)
  }

  if (selection.auth === 'clerk') {
    sections.push(`# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...`)
  }

  if (selection.ai && selection.aiMode === 'vercel') {
    sections.push(`# AI
OPENAI_API_KEY=your_openai_api_key`)
  } else if (selection.ai) {
    sections.push(`# AI
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key`)
  }

  await fs.writeFile(path.join(projectDir, '.env.example'), `${sections.join('\n\n')}\n`)
}

async function copyBaseTemplate(projectDir: string) {
  const baseDir = path.resolve(__dirname, '../templates/base')
  await fs.access(baseDir)

  await fs.cp(baseDir, projectDir, {
    filter: (src) => {
      const basename = path.basename(src)
      const skipList = ['.git', '.next', '.turbo', 'build', 'dist', 'node_modules']
      return !skipList.includes(basename)
    },
    recursive: true,
  })
}

async function prepareProjectDirectory(projectDir: string) {
  await fs.rm(projectDir, { force: true, recursive: true })
  await fs.mkdir(projectDir, { recursive: true })
}

function installDependencies(projectDir: string, packageManager: PackageManager): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(packageManager, ['install'], {
      cwd: projectDir,
      stdio: 'inherit',
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Package installation failed with code ${code}`))
      }
    })
  })
}

function initGit(projectDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('git', ['init'], {
      cwd: projectDir,
      stdio: 'ignore',
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Git init failed with code ${code}`))
      }
    })
  })
}

export async function createApp(params: CreateAppParams) {
  const { installDeps, packageManager, projectDir, projectName, skipGit } = params
  const defaults = getTemplateDefaults(params.template)
  const { ai, aiMode, auth, database, linting, template } = normalizeSelection({
    ...params,
    aiMode: params.aiMode ?? defaults.aiMode,
  })

  const selection: StackSelection = {
    ai,
    aiMode,
    auth,
    database,
    linting,
    template,
  }

  const s = spinner()

  try {
    s.start('Preparing project directory...')
    await prepareProjectDirectory(projectDir)
    s.stop('Project directory ready')

    s.start('Copying base template...')
    await copyBaseTemplate(projectDir)
    s.stop('Base template copied')

    s.start('Configuring package.json...')
    await updatePackageJson(projectDir, projectName)
    s.stop('package.json configured')

    s.start(`Configuring ${linting}...`)
    await configureLinting(projectDir, linting)
    s.stop(`${linting} configured`)

    s.start(ai ? `Configuring ${aiMode} AI starter...` : 'Removing AI starter...')
    await configureAIFeatures(projectDir, ai, aiMode)
    s.stop(ai ? 'AI starter configured' : 'AI starter removed')

    if (database === 'supabase') {
      s.start('Configuring Supabase...')
      await setupSupabase(projectDir)
      s.stop('Supabase configured')
    } else if (database === 'neon') {
      s.start('Configuring Neon...')
      await setupNeon(projectDir)
      s.stop('Neon configured')
    } else if (database === 'drizzle') {
      s.start('Configuring Drizzle...')
      await setupDrizzle(projectDir)
      s.stop('Drizzle configured')
    }

    if (auth === 'supabase') {
      s.start('Configuring Supabase auth...')
      await setupSupabaseAuth(projectDir)
      s.stop('Supabase auth configured')
    } else if (auth === 'clerk') {
      s.start('Configuring Clerk...')
      await setupClerk(projectDir)
      s.stop('Clerk configured')
    }

    s.start('Creating starter routes...')
    await ensureProtectedPages(projectDir, auth)
    s.stop('Starter routes created')

    s.start('Writing environment template...')
    await writeEnvExample(projectDir, selection)
    s.stop('.env.example written')

    if (installDeps) {
      s.start(`Installing dependencies with ${packageManager}...`)
      await installDependencies(projectDir, packageManager)
      s.stop('Dependencies installed')
    }

    if (!skipGit) {
      s.start('Initializing Git repository...')
      await initGit(projectDir)
      s.stop('Git repository initialized')
    }
  } catch (error) {
    s.stop('Error occurred')
    throw error
  }
}

async function selectTemplateMode(defaultTemplate: Template) {
  const selectedTemplate = await select({
    initialValue: defaultTemplate,
    message: 'Which template would you like to use?',
    options: Object.entries(TEMPLATES).map(([key, template]) => ({
      hint: template.description,
      label: template.name,
      value: key,
    })),
  })

  if (isCancel(selectedTemplate)) {
    cancel('Operation cancelled.')
    process.exit(0)
  }

  return selectedTemplate as Template
}

async function promptProjectName() {
  const projectName = await text({
    message: 'What is your project named?',
    placeholder: 'my-at3-app',
    validate(value) {
      if (!value) {
        return 'Project name is required'
      }

      const validation = validateNpmPackageName(value)
      if (!validation.validForNewPackages) {
        return 'Invalid project name. Use lowercase letters, numbers, and hyphens only.'
      }
      return
    },
  })

  if (isCancel(projectName)) {
    cancel('Operation cancelled.')
    process.exit(0)
  }

  return projectName
}

async function promptInteractiveSelection(): Promise<StackSelection> {
  const mode = await select({
    message: 'How would you like to start?',
    options: [
      {
        hint: 'Choose your stack pieces one by one',
        label: 'Interactive',
        value: 'interactive',
      },
      {
        hint: 'Start from a stable preset',
        label: 'Template preset',
        value: 'template',
      },
    ],
  })

  if (isCancel(mode)) {
    cancel('Operation cancelled.')
    process.exit(0)
  }

  let template: Template = 't3'
  let defaults = getTemplateDefaults(template)

  if (mode === 'template') {
    template = await selectTemplateMode('83-flavor')
    defaults = getTemplateDefaults(template)
  }

  const aiSelection = await confirm({
    initialValue: defaults.ai,
    message: 'Include the AI chat starter?',
  })

  if (isCancel(aiSelection)) {
    cancel('Operation cancelled.')
    process.exit(0)
  }

  let aiModeSelection = defaults.aiMode
  if (aiSelection) {
    const selectedAIMode = await select({
      initialValue: defaults.aiMode,
      message: 'Which AI scaffold should be generated?',
      options: [
        {
          hint: 'OpenAI chat route with the Vercel AI SDK',
          label: 'Vercel AI SDK',
          value: 'vercel',
        },
        {
          hint: 'OpenAI, Anthropic, and Google provider selection',
          label: 'Custom providers',
          value: 'custom',
        },
        {
          hint: 'Vercel AI SDK transport with a multi-provider model registry',
          label: 'Both',
          value: 'both',
        },
      ],
    })

    if (isCancel(selectedAIMode)) {
      cancel('Operation cancelled.')
      process.exit(0)
    }

    aiModeSelection = selectedAIMode as AIFeatureMode
  }

  const dbSelection = await select({
    initialValue: defaults.database,
    message: 'Which database setup would you like to use?',
    options: [
      { hint: 'Supabase data and auth-ready helpers', label: 'Supabase', value: 'supabase' },
      { hint: 'Serverless Postgres client', label: 'Neon', value: 'neon' },
      { hint: 'Generic Postgres with Drizzle', label: 'Drizzle', value: 'drizzle' },
      { hint: 'No database files', label: 'None', value: 'none' },
    ],
  })

  if (isCancel(dbSelection)) {
    cancel('Operation cancelled.')
    process.exit(0)
  }

  const authSelection = await select({
    initialValue: defaults.auth,
    message: 'Which authentication setup would you like to use?',
    options: [
      { hint: 'Supabase session and sign-in pages', label: 'Supabase Auth', value: 'supabase' },
      { hint: 'Clerk hosted auth with protected routes', label: 'Clerk', value: 'clerk' },
      { hint: 'No authentication scaffolding', label: 'None', value: 'none' },
    ],
  })

  if (isCancel(authSelection)) {
    cancel('Operation cancelled.')
    process.exit(0)
  }

  const lintingSelection = await select({
    initialValue: defaults.linting,
    message: 'Which linting and formatting tool would you like to use?',
    options: [
      { hint: 'Unified formatter and linter', label: 'Biome', value: 'biome' },
      { hint: 'Rust-based linting and formatting', label: 'OXC', value: 'oxc' },
    ],
  })

  if (isCancel(lintingSelection)) {
    cancel('Operation cancelled.')
    process.exit(0)
  }

  const normalized = normalizeSelection({
    ai: aiSelection,
    aiMode: aiModeSelection,
    auth: authSelection as AuthOption,
    database: dbSelection as DatabaseOption,
    linting: lintingSelection as LintingOption,
    template,
  })

  if (normalized.auth === 'supabase' && normalized.database !== dbSelection) {
    note(
      'Supabase auth requires Supabase database wiring. The database selection was adjusted automatically.',
      'Configuration'
    )
  }

  return normalized
}

async function detectPreferredPackageManager(): Promise<PackageManager> {
  try {
    return (await detectPackageManager({ cwd: process.cwd() })) as PackageManager
  } catch {
    if (existsSync(path.join(process.cwd(), 'pnpm-lock.yaml'))) {
      return 'pnpm'
    }
    if (existsSync(path.join(process.cwd(), 'yarn.lock'))) {
      return 'yarn'
    }
    if (existsSync(path.join(process.cwd(), 'package-lock.json'))) {
      return 'npm'
    }
    return 'pnpm'
  }
}

async function confirmDependencyInstall() {
  const installDeps = await confirm({
    initialValue: true,
    message: 'Install dependencies now?',
  })

  if (isCancel(installDeps)) {
    cancel('Operation cancelled.')
    process.exit(0)
  }

  return installDeps
}

async function confirmGitInit() {
  const initGitRepo = await confirm({
    initialValue: true,
    message: 'Initialize Git repository?',
  })

  if (isCancel(initGitRepo)) {
    cancel('Operation cancelled.')
    process.exit(0)
  }

  return initGitRepo
}

async function ensureProjectDirectoryAvailable(projectDir: string, projectName: string) {
  if (!existsSync(projectDir)) {
    return
  }

  const overwrite = await confirm({
    initialValue: false,
    message: `Directory ${projectName} already exists. Replace it?`,
  })

  if (isCancel(overwrite) || !overwrite) {
    cancel('Operation cancelled.')
    process.exit(0)
  }
}

async function runInteractiveCli() {
  console.clear()
  intro(chalk.bgCyan.black(' create-at3-app '))

  const projectName = await promptProjectName()
  const selection = await promptInteractiveSelection()

  const packageManager = await select({
    initialValue: await detectPreferredPackageManager(),
    message: 'Which package manager would you like to use?',
    options: [
      { hint: 'Recommended for this workspace', label: 'pnpm', value: 'pnpm' },
      { hint: 'Default Node.js package manager', label: 'npm', value: 'npm' },
      { hint: 'Popular alternative', label: 'yarn', value: 'yarn' },
    ],
  })

  if (isCancel(packageManager)) {
    cancel('Operation cancelled.')
    process.exit(0)
  }

  const installDeps = await confirmDependencyInstall()
  const initGitRepo = await confirmGitInit()
  const projectDir = path.resolve(process.cwd(), projectName)

  await ensureProjectDirectoryAvailable(projectDir, projectName)

  await createApp({
    ...selection,
    installDeps,
    packageManager: packageManager as PackageManager,
    projectDir,
    projectName,
    skipGit: !initGitRepo,
  })

  const features = getSelectedFeatures(selection)
  createAT3Config(projectDir, {
    features,
    template: selection.template,
    toolsUsed: ['create-at3-app'],
  })

  const toolSuggestions = suggestAT3Tools(selection.template, features)
  const _workflows = getWorkflowSuggestions(selection.template)

  outro(chalk.green('Project created'))

  note(
    `${chalk.cyan('Next steps:')}

  ${chalk.dim('1.')} cd ${projectName}
  ${chalk.dim('2.')} Copy .env.example to .env.local and fill in the real values
  ${chalk.dim('3.')} ${(packageManager as PackageManager) || 'pnpm'} dev

${chalk.cyan('Enabled features:')}
  ${formatFeatures(features)}

${
  toolSuggestions.length > 0
    ? `${chalk.cyan('Related AT3 tools:')}
  ${toolSuggestions.map((suggestion) => `${chalk.dim('•')} ${suggestion}`).join('\n  ')}`
    : ''
}
`,
    'Ready'
  )
}

function createProgram() {
  const program = new Command()

  program
    .name('create-at3-app')
    .description('Create AT3 apps from stable preset templates')
    .version(CLI_VERSION)
    .argument('[project-name]', 'Name of the project')
    .option('-t, --template <template>', 'Template to use', '83-flavor')
    .option('--pm <package-manager>', 'Package manager to use', 'pnpm')
    .option('--database <database>', 'Database to use (supabase, neon, drizzle, none)')
    .option('--auth <auth>', 'Auth to use (supabase, clerk, none)')
    .option('--lint <linting>', 'Linting/formatting tool (biome, oxc)')
    .option('--ai', 'Include the AI chat starter')
    .option('--ai-mode <mode>', 'AI scaffold mode (vercel, custom, both)')
    .option('--without-ai', 'Skip the AI chat starter even when the template includes it')
    .option('--no-install', 'Skip installing dependencies')
    .option('--no-git', 'Skip Git initialization')
    .action(async (projectName, options) => {
      if (!projectName) {
        await runInteractiveCli()
        return
      }

      const resolvedTemplate = resolveTemplate(options.template)
      if (!resolvedTemplate) {
        throw new Error(
          `Unknown template "${options.template}". Available templates: ${Object.keys(TEMPLATES).join(', ')}`
        )
      }

      const defaults = getTemplateDefaults(resolvedTemplate)
      const selection = normalizeSelection({
        ai: options.withoutAi ? false : (options.ai ?? defaults.ai),
        aiMode: isAIFeatureMode(options.aiMode) ? options.aiMode : defaults.aiMode,
        auth: isAuthOption(options.auth) ? options.auth : defaults.auth,
        database: isDatabaseOption(options.database) ? options.database : defaults.database,
        linting: isLintingOption(options.lint) ? options.lint : defaults.linting,
        template: resolvedTemplate,
      })

      const packageManager =
        options.pm === 'pnpm' || options.pm === 'npm' || options.pm === 'yarn' ? options.pm : 'pnpm'

      const projectDir = path.resolve(process.cwd(), projectName)
      if (existsSync(projectDir)) {
        throw new Error(
          `Directory "${projectName}" already exists. Remove it first or use the interactive flow to confirm replacement.`
        )
      }

      await createApp({
        ...selection,
        installDeps: options.install !== false,
        packageManager,
        projectDir,
        projectName,
        skipGit: options.git === false,
      })

      const features = getSelectedFeatures(selection)
      createAT3Config(projectDir, {
        features,
        template: selection.template,
        toolsUsed: ['create-at3-app'],
      })

      console.log(chalk.green(`✅ Created ${projectName} successfully`))
    })

  return program
}

export const program = createProgram()

function isDirectExecution() {
  const [, entrypoint] = process.argv
  if (!entrypoint) {
    return false
  }

  return pathToFileURL(entrypoint).href === import.meta.url
}

if (isDirectExecution()) {
  program.parseAsync().catch((error) => {
    console.error(chalk.red('Error creating app:'), error)
    process.exit(1)
  })
}
