import { ensureDir, pathExists, readFile, writeFile } from 'fs-extra'
import { join } from 'path'
import { colors } from '../utils/cli-styling.js'
import { resolveAppRoot, resolveSourceRoot, usesSrcDirectory } from './project-paths.js'

export async function addBetterAuth(projectPath: string): Promise<void> {
  console.log(colors.info('Adding Better Auth...'))

  const sourceRoot = resolveSourceRoot(projectPath)
  const appRoot = resolveAppRoot(projectPath)

  await updatePackageJson(projectPath)
  await addEnvExample(projectPath)
  await createDatabaseFiles(projectPath, sourceRoot)
  await createAuthFiles(sourceRoot)
  await createAuthRoute(appRoot)
  await createAuthPages(appRoot)

  console.log(colors.success('✓ Added Better Auth configuration'))
}

async function updatePackageJson(projectPath: string): Promise<void> {
  const packageJsonPath = join(projectPath, 'package.json')
  if (!(await pathExists(packageJsonPath))) {
    return
  }

  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'))

  packageJson.dependencies = {
    ...packageJson.dependencies,
    '@better-auth/drizzle-adapter': '^1.6.12',
    'better-auth': '^1.6.12',
    dotenv: '^17.3.1',
    'drizzle-orm': '^0.44.5',
    postgres: '^3.4.7',
  }

  packageJson.devDependencies = {
    ...packageJson.devDependencies,
    'drizzle-kit': '^0.31.5',
  }

  packageJson.scripts = {
    ...packageJson.scripts,
    'auth:generate': 'npx auth@latest generate',
    'db:generate': 'drizzle-kit generate',
    'db:migrate': 'drizzle-kit migrate',
    'db:studio': 'drizzle-kit studio',
  }

  await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2))
}

async function addEnvExample(projectPath: string): Promise<void> {
  const envExamplePath = join(projectPath, '.env.example')
  let envContent = ''

  if (await pathExists(envExamplePath)) {
    envContent = await readFile(envExamplePath, 'utf8')
  }

  const additions = [
    ['DATABASE_URL', 'postgresql://postgres:password@localhost:5432/postgres'],
    ['BETTER_AUTH_SECRET', 'replace-with-32-plus-random-characters'],
    ['BETTER_AUTH_URL', 'http://localhost:3000'],
    ['NEXT_PUBLIC_BETTER_AUTH_URL', 'http://localhost:3000'],
    ['BETTER_AUTH_TRUSTED_ORIGINS', 'http://localhost:3000'],
  ]

  const missing = additions.filter(([key]) => !envContent.includes(`${key}=`))

  if (missing.length === 0) {
    return
  }

  envContent += `\n# Better Auth\n${missing.map(([key, value]) => `${key}=${value}`).join('\n')}\n`
  await writeFile(envExamplePath, envContent)
}

async function createDatabaseFiles(projectPath: string, sourceRoot: string): Promise<void> {
  const dbPath = join(sourceRoot, 'db')
  await ensureDir(dbPath)

  const appSchemaPath = usesSrcDirectory(projectPath) ? './src/db/schema.ts' : './db/schema.ts'
  const authSchemaPath = usesSrcDirectory(projectPath)
    ? './src/db/auth-schema.ts'
    : './db/auth-schema.ts'
  const hasAppSchema = await pathExists(join(dbPath, 'schema.ts'))
  const schemaConfig = hasAppSchema ? `['${appSchemaPath}', '${authSchemaPath}']` : `'${authSchemaPath}'`
  const drizzleConfig = `import { defineConfig } from 'drizzle-kit'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing')
}

export default defineConfig({
  schema: ${schemaConfig},
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
})
`

  const dbClient = `import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './auth-schema'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is missing')
}

const client = postgres(connectionString, { prepare: false })

export const db = drizzle(client, { schema })
`

  const authSchema = `import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
`

  await writeFile(join(projectPath, 'drizzle.config.ts'), drizzleConfig)
  if (!(await pathExists(join(dbPath, 'index.ts')))) {
    await writeFile(join(dbPath, 'index.ts'), dbClient)
  }
  await writeFile(join(dbPath, 'auth-schema.ts'), authSchema)
}

async function createAuthFiles(sourceRoot: string): Promise<void> {
  const authPath = join(sourceRoot, 'lib', 'auth')
  await ensureDir(authPath)

  const serverAuth = `import { betterAuth } from 'better-auth'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { db } from '@/db'
import * as schema from '@/db/auth-schema'

const trustedOrigins = process.env.BETTER_AUTH_TRUSTED_ORIGINS
  ?.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

export const auth = betterAuth({
  appName: 'AT3 App',
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
})
`

  const clientAuth = `'use client'

import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
})
`

  await writeFile(join(authPath, 'auth.ts'), serverAuth)
  await writeFile(join(authPath, 'client.ts'), clientAuth)
}

async function createAuthRoute(appRoot: string): Promise<void> {
  const apiPath = join(appRoot, 'api', 'auth', '[...all]')
  await ensureDir(apiPath)

  const route = `import { toNextJsHandler } from 'better-auth/next-js'
import { auth } from '@/lib/auth/auth'

export const { GET, POST } = toNextJsHandler(auth)
`

  await writeFile(join(apiPath, 'route.ts'), route)
}

async function createAuthPages(appRoot: string): Promise<void> {
  await createSignInPage(appRoot)
  await createSignUpPage(appRoot)
}

async function createSignInPage(appRoot: string): Promise<void> {
  const pagePath = join(appRoot, 'auth', 'sign-in')
  await ensureDir(pagePath)

  const page = `'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { type FormEvent, useState } from 'react'
import { authClient } from '@/lib/auth/client'

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? '/dashboard'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const { error: signInError } = await authClient.signIn.email({
      email,
      password,
      callbackURL: redirectTo,
    })

    setIsSubmitting(false)

    if (signInError) {
      setError(signInError.message)
      return
    }

    router.push(redirectTo)
    router.refresh()
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-6 py-16">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Sign in</h1>
        <p className="text-slate-600">Use your email and password credentials.</p>
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

  await writeFile(join(pagePath, 'page.tsx'), page)
}

async function createSignUpPage(appRoot: string): Promise<void> {
  const pagePath = join(appRoot, 'auth', 'sign-up')
  await ensureDir(pagePath)

  const page = `'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type FormEvent, useState } from 'react'
import { authClient } from '@/lib/auth/client'

export default function SignUpPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const { error: signUpError } = await authClient.signUp.email({
      name,
      email,
      password,
      callbackURL: '/dashboard',
    })

    setIsSubmitting(false)

    if (signUpError) {
      setError(signUpError.message)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-6 py-16">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Create account</h1>
        <p className="text-slate-600">Create a database-backed Better Auth account.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Name
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 font-normal"
            required
          />
        </label>

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
            minLength={8}
            required
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

  await writeFile(join(pagePath, 'page.tsx'), page)
}
