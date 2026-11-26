import { mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp } from './index'

const tempDirs: string[] = []
const ZERO = 0

afterEach(async () => {
  await Promise.all(tempDirs.splice(ZERO).map((dir) => rm(dir, { force: true, recursive: true })))
})

async function createTempProjectDir(prefix: string) {
  const directory = await mkdtemp(join(tmpdir(), prefix))
  tempDirs.push(directory)
  return directory
}

describe('create-at3-app scaffold', () => {
  it('creates a minimal non-AI starter without install side effects', async () => {
    const projectDir = await createTempProjectDir('at3-create-minimal-')

    await createApp({
      ai: false,
      auth: 'none',
      database: 'none',
      installDeps: false,
      linting: 'oxc',
      packageManager: 'pnpm',
      projectDir,
      projectName: 'minimal-app',
      skipGit: true,
      template: 't3',
    })

    const packageJson = JSON.parse(await readFile(join(projectDir, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>
      scripts: Record<string, string>
    }

    const homePage = await readFile(join(projectDir, 'app', 'page.tsx'), 'utf8')
    const envExample = await readFile(join(projectDir, '.env.example'), 'utf8')

    expect(packageJson.name).toBe('minimal-app')
    expect(packageJson.scripts.typecheck).toBe('tsc --noEmit')
    expect(packageJson.dependencies?.['@ai-sdk/react']).toBeUndefined()
    expect(packageJson.dependencies?.['@ai-sdk/anthropic']).toBeUndefined()
    expect(packageJson.dependencies?.['@ai-sdk/google']).toBeUndefined()
    expect(homePage).toContain('Project Ready')
    expect(envExample).not.toContain('NEXTAUTH_')
    expect(envExample).not.toContain('OPENAI_API_KEY')
    expect(envExample).not.toContain('NEXT_PUBLIC_SUPABASE_URL')
    await expect(stat(join(projectDir, 'node_modules'))).rejects.toThrow()
  })

  it('creates the 83-flavor preset with Clerk, Neon, and AI wiring', async () => {
    const projectDir = await createTempProjectDir('at3-create-83-')

    await createApp({
      ai: true,
      auth: 'clerk',
      database: 'neon',
      installDeps: false,
      linting: 'oxc',
      packageManager: 'pnpm',
      projectDir,
      projectName: 'flavor-app',
      skipGit: true,
      template: '83-flavor',
    })

    const packageJson = JSON.parse(await readFile(join(projectDir, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>
    }

    const envExample = await readFile(join(projectDir, '.env.example'), 'utf8')
    const layout = await readFile(join(projectDir, 'app', 'layout.tsx'), 'utf8')
    const middleware = await readFile(join(projectDir, 'middleware.ts'), 'utf8')
    const dashboardPage = await readFile(join(projectDir, 'app', 'dashboard', 'page.tsx'), 'utf8')
    const chatRoute = await readFile(join(projectDir, 'app', 'api', 'chat', 'route.ts'), 'utf8')

    expect(packageJson.dependencies?.['@clerk/nextjs']).toBeDefined()
    expect(packageJson.dependencies?.['@neondatabase/serverless']).toBeDefined()
    expect(packageJson.dependencies?.['@ai-sdk/openai']).toBeDefined()
    expect(envExample).toContain('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY')
    expect(envExample).toContain('DATABASE_URL=')
    expect(layout).toContain('ClerkProvider')
    expect(middleware).toContain('clerkMiddleware')
    expect(dashboardPage).toContain('Signed in with Clerk')
    expect(chatRoute).toContain('toUIMessageStreamResponse')
    expect(chatRoute).not.toContain("from '@ai-sdk/anthropic'")
  })

  it('creates the custom AI template with provider selection and matching env keys', async () => {
    const projectDir = await createTempProjectDir('at3-create-ai-custom-')

    await createApp({
      ai: true,
      auth: 'none',
      database: 'none',
      installDeps: false,
      linting: 'oxc',
      packageManager: 'pnpm',
      projectDir,
      projectName: 'ai-custom-app',
      skipGit: true,
      template: 't3-ai-custom',
    })

    const packageJson = JSON.parse(await readFile(join(projectDir, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>
    }

    const envExample = await readFile(join(projectDir, '.env.example'), 'utf8')
    const homePage = await readFile(join(projectDir, 'app', 'page.tsx'), 'utf8')
    const chatRoute = await readFile(join(projectDir, 'app', 'api', 'chat', 'route.ts'), 'utf8')

    expect(packageJson.dependencies?.['@ai-sdk/openai']).toBeDefined()
    expect(packageJson.dependencies?.['@ai-sdk/anthropic']).toBeDefined()
    expect(packageJson.dependencies?.['@ai-sdk/google']).toBeDefined()
    expect(envExample).toContain('OPENAI_API_KEY')
    expect(envExample).toContain('ANTHROPIC_API_KEY')
    expect(envExample).toContain('GOOGLE_GENERATIVE_AI_API_KEY')
    expect(homePage).toContain('DefaultChatTransport')
    expect(homePage).toContain('body: () => ({ model })')
    expect(homePage).toContain('<select')
    expect(chatRoute).toContain("from '@ai-sdk/anthropic'")
    expect(chatRoute).toContain("from '@ai-sdk/google'")
    expect(chatRoute).toContain('AI_MODELS[selectedModel]')
  })

  it('creates the Supabase auth preset with auth pages and session middleware', async () => {
    const projectDir = await createTempProjectDir('at3-create-edge-')

    await createApp({
      ai: false,
      auth: 'supabase',
      database: 'supabase',
      installDeps: false,
      linting: 'biome',
      packageManager: 'pnpm',
      projectDir,
      projectName: 'edge-app',
      skipGit: true,
      template: 't3-edge',
    })

    const envExample = await readFile(join(projectDir, '.env.example'), 'utf8')
    const middleware = await readFile(join(projectDir, 'middleware.ts'), 'utf8')
    const supabaseMiddleware = await readFile(
      join(projectDir, 'lib', 'supabase', 'middleware.ts'),
      'utf8'
    )
    const signInPage = await readFile(
      join(projectDir, 'app', 'auth', 'sign-in', 'page.tsx'),
      'utf8'
    )
    const supabaseClient = await readFile(join(projectDir, 'lib', 'supabase', 'client.ts'), 'utf8')
    const packageJson = JSON.parse(await readFile(join(projectDir, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }

    expect(packageJson.dependencies?.['@supabase/ssr']).toBeDefined()
    expect(packageJson.dependencies?.['@supabase/supabase-js']).toBeDefined()
    expect(packageJson.devDependencies?.['@biomejs/biome']).toBeDefined()
    expect(envExample).toContain('NEXT_PUBLIC_SUPABASE_URL')
    expect(middleware).toContain("redirectTo', request.nextUrl.pathname")
    expect(middleware).toContain('const { response, user } = await updateSession(request)')
    expect(middleware).not.toContain('sb-access-token')
    expect(supabaseMiddleware).toContain('await supabase.auth.getUser()')
    expect(supabaseMiddleware).toContain('return { response, user }')
    expect(signInPage).toContain('signInWithEmail')
    expect(supabaseClient).toContain('createBrowserClient')
  })
})
