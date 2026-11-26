import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import ts from 'typescript'
import { afterEach, describe, expect, it } from 'vitest'
import { ensureDir, pathExists, readFile, remove, writeFile } from 'fs-extra'
import { addAI } from './add-ai.js'
import { addBetterAuth } from './add-better-auth.js'
import { addClerk } from './add-clerk.js'
import { addDrizzle } from './add-drizzle.js'
import { addI18n } from './add-i18n.js'
import { addNeon } from './add-neon.js'
import { addPWA } from './add-pwa.js'
import { addSupabase } from './add-supabase.js'
import { addTesting } from './add-testing.js'

const cleanupPaths: string[] = []

afterEach(async () => {
  await Promise.all(cleanupPaths.splice(0).map((dir) => remove(dir)))
})

describe('feature generators', () => {
  it.each([false, true])('writes Next features into the correct source root (src=%s)', async (useSrcDirectory) => {
    const project = await createNextProject(useSrcDirectory)

    await addAI('vercel', project.root)
    await addSupabase(project.root)
    await addClerk(project.root)
    await addPWA(project.root)
    await addI18n(project.root)

    expect(await pathExists(join(project.sourceRoot, 'lib', 'ai', 'vercel-client.ts'))).toBe(true)
    expect(await pathExists(join(project.sourceRoot, 'lib', 'supabase', 'client.ts'))).toBe(true)
    expect(await pathExists(join(project.sourceRoot, 'middleware.ts'))).toBe(true)
    expect(await pathExists(join(project.appRoot, 'dashboard', 'page.tsx'))).toBe(true)
    expect(await pathExists(join(project.appRoot, 'sign-in', '[[...sign-in]]', 'page.tsx'))).toBe(true)
    expect(await pathExists(join(project.appRoot, 'offline', 'page.tsx'))).toBe(true)
    expect(await pathExists(join(project.appRoot, '[locale]', 'layout.tsx'))).toBe(true)

    const layout = await readFile(join(project.appRoot, 'layout.tsx'), 'utf8')
    expect(layout).toContain('ClerkProvider')
    expect(layout).toContain('PWAProvider')
    expect(layout).toContain('rel="manifest"')

    const nextConfig = await readFile(join(project.root, 'next.config.ts'), 'utf8')
    expect(nextConfig).toContain('withPWA')
    expect(nextConfig).toContain(
      useSrcDirectory ? './src/lib/i18n/request.ts' : './lib/i18n/request.ts'
    )

    const manifest = await readFile(join(project.root, 'public', 'manifest.json'), 'utf8')
    expect(manifest).toContain('/icons/icon.svg')
    expect(manifest).not.toContain('/screenshots/')
    expect(await pathExists(join(project.root, 'public', 'icons', 'icon.svg'))).toBe(true)

    const offlinePage = await readFile(join(project.appRoot, 'offline', 'page.tsx'), 'utf8')
    expect(offlinePage.startsWith("'use client'")).toBe(true)
  })

  it.each([false, true])('writes shared code features into the correct source root (src=%s)', async (useSrcDirectory) => {
    const project = await createNextProject(useSrcDirectory)

    await addDrizzle(project.root)
    await addNeon(project.root)
    await addBetterAuth(project.root)
    await addTesting(project.root)

    expect(await pathExists(join(project.sourceRoot, 'db', 'schema.ts'))).toBe(true)
    expect(await pathExists(join(project.sourceRoot, 'db', 'auth-schema.ts'))).toBe(true)
    expect(await pathExists(join(project.sourceRoot, 'lib', 'auth', 'auth.ts'))).toBe(true)
    expect(await pathExists(join(project.appRoot, 'api', 'auth', '[...all]', 'route.ts'))).toBe(true)
    expect(await pathExists(join(project.appRoot, 'auth', 'sign-in', 'page.tsx'))).toBe(true)
    expect(await pathExists(join(project.sourceRoot, 'lib', 'neon', 'client.ts'))).toBe(true)
    expect(await pathExists(join(project.sourceRoot, 'test', 'utils.tsx'))).toBe(true)
    expect(await pathExists(join(project.root, 'tests', 'e2e', 'home.spec.ts'))).toBe(true)
    expect(await pathExists(join(project.root, 'tests', 'e2e', 'auth.spec.ts'))).toBe(false)

    const drizzleConfig = await readFile(join(project.root, 'drizzle.config.ts'), 'utf8')
    expect(drizzleConfig).toContain(
      useSrcDirectory ? './src/db/auth-schema.ts' : './db/auth-schema.ts'
    )

    const authConfig = await readFile(join(project.sourceRoot, 'lib', 'auth', 'auth.ts'), 'utf8')
    expect(authConfig).toContain('drizzleAdapter(db')

    const vitestConfig = await readFile(join(project.root, 'vitest.config.ts'), 'utf8')
    expect(vitestConfig).toContain(
      useSrcDirectory ? './src/test/setup.ts' : './test/setup.ts'
    )
    expect(vitestConfig).toContain(
      useSrcDirectory ? "resolve(__dirname, './src')" : "resolve(__dirname, '.')"
    )
  })

  it('generates syntactically valid helper files', async () => {
    const project = await createNextProject(true)

    await addSupabase(project.root)
    await addPWA(project.root)
    await addTesting(project.root)

    const installPrompt = await readFile(
      join(project.sourceRoot, 'lib', 'pwa', 'install-prompt.tsx'),
      'utf8'
    )
    const supabaseServer = await readFile(join(project.sourceRoot, 'lib', 'supabase', 'server.ts'), 'utf8')
    const supabaseMiddleware = await readFile(
      join(project.sourceRoot, 'lib', 'supabase', 'middleware.ts'),
      'utf8'
    )
    const testUtils = await readFile(join(project.sourceRoot, 'test', 'utils.tsx'), 'utf8')

    expect(getSyntaxErrors(installPrompt, 'install-prompt.tsx')).toEqual([])
    expect(getSyntaxErrors(supabaseServer, 'supabase-server.ts')).toEqual([])
    expect(getSyntaxErrors(supabaseMiddleware, 'supabase-middleware.ts')).toEqual([])
    expect(getSyntaxErrors(testUtils, 'utils.tsx')).toEqual([])
  })
})

async function createNextProject(useSrcDirectory: boolean) {
  const root = await mkdtemp(join(tmpdir(), 'at3-stack-kit-feature-'))
  cleanupPaths.push(root)

  const sourceRoot = useSrcDirectory ? join(root, 'src') : root
  const appRoot = join(sourceRoot, 'app')

  await ensureDir(appRoot)

  await writeFile(
    join(root, 'package.json'),
    JSON.stringify(
      {
        dependencies: {
          next: '16.1.6',
          react: '19.2.4',
          'react-dom': '19.2.4',
        },
        name: 'feature-fixture',
        packageManager: 'pnpm@10.29.3',
      },
      null,
      2
    )
  )

  await writeFile(join(root, 'next.config.ts'), `const nextConfig = {}\n\nexport default nextConfig\n`)
  await writeFile(
    join(appRoot, 'layout.tsx'),
    `import type { ReactNode } from 'react'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body>{children}</body>
    </html>
  )
}
`
  )
  await writeFile(join(appRoot, 'page.tsx'), `export default function Page() { return <main>Home</main> }\n`)

  return { appRoot, root, sourceRoot }
}

function getSyntaxErrors(source: string, fileName: string): string[] {
  const result = ts.transpileModule(source, {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
    fileName,
    reportDiagnostics: true,
  })

  return (result.diagnostics ?? [])
    .filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error)
    .map((diagnostic) => diagnostic.messageText.toString())
}
