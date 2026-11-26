import { ensureDir, pathExists, readFile, writeFile } from 'fs-extra'
import { dirname, join } from 'path'
import { colors } from '../utils/cli-styling.js'
import { assertNextProject, resolveAppRoot, resolveSourceRoot } from './project-paths.js'

export async function addClerk(projectPath: string): Promise<void> {
  assertNextProject(projectPath, 'Clerk authentication')

  console.log(colors.info('Adding Clerk authentication...'))

  const sourceRoot = resolveSourceRoot(projectPath)
  const appRoot = resolveAppRoot(projectPath)

  await updatePackageJson(projectPath)
  await addEnvExample(projectPath)
  await addMiddleware(sourceRoot)
  await updateLayout(appRoot)
  await addAuthPages(appRoot)
  await addProtectedPages(appRoot)

  console.log(colors.success('✓ Added Clerk configuration'))
}

async function updatePackageJson(projectPath: string): Promise<void> {
  const packageJsonPath = join(projectPath, 'package.json')
  if (!(await pathExists(packageJsonPath))) {
    return
  }

  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'))

  if (!packageJson.dependencies) {
    packageJson.dependencies = {}
  }
  packageJson.dependencies['@clerk/nextjs'] = '^6.9.0'

  await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2))
}

async function addEnvExample(projectPath: string): Promise<void> {
  const envExamplePath = join(projectPath, '.env.example')
  let envContent = ''

  if (await pathExists(envExamplePath)) {
    envContent = await readFile(envExamplePath, 'utf8')
  }

  if (!envContent.includes('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY')) {
    envContent += `
# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
`
    await writeFile(envExamplePath, envContent)
  }
}

async function addMiddleware(sourceRoot: string): Promise<void> {
  const middlewarePath = join(sourceRoot, 'middleware.ts')

  const content = `import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/profile(.*)', '/settings(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: ['/((?!_next|.*\\\\..*).*)', '/(api|trpc)(.*)'],
}
`

  await writeFile(middlewarePath, content)
}

async function updateLayout(appRoot: string): Promise<void> {
  await ensureDir(appRoot)

  const layoutPath = join(appRoot, 'layout.tsx')
  const defaultLayout = `import { ClerkProvider } from '@clerk/nextjs'
import type { ReactNode } from 'react'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  )
}
`

  if (!(await pathExists(layoutPath))) {
    await writeFile(layoutPath, defaultLayout)
    return
  }

  let content = await readFile(layoutPath, 'utf8')

  if (!content.includes(`@clerk/nextjs`)) {
    content = `import { ClerkProvider } from '@clerk/nextjs'\n${content}`
  }

  if (!content.includes('<ClerkProvider>')) {
    content = content.replace(/<body([^>]*)>/, '<body$1>\n        <ClerkProvider>')
    content = content.replace('</body>', '        </ClerkProvider>\n      </body>')
  }

  await writeFile(layoutPath, content)
}

async function addAuthPages(appRoot: string): Promise<void> {
  const signInPath = join(appRoot, 'sign-in', '[[...sign-in]]')
  const signUpPath = join(appRoot, 'sign-up', '[[...sign-up]]')

  await ensureDir(signInPath)
  await ensureDir(signUpPath)

  const signInPage = `import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <SignIn />
    </main>
  )
}
`

  const signUpPage = `import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <SignUp />
    </main>
  )
}
`

  await writePageIfMissing(join(signInPath, 'page.tsx'), signInPage)
  await writePageIfMissing(join(signUpPath, 'page.tsx'), signUpPage)
}

async function addProtectedPages(appRoot: string): Promise<void> {
  await writePageIfMissing(
    join(appRoot, 'dashboard', 'page.tsx'),
    `import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'

export default function DashboardPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-6 py-16">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Dashboard</p>
          <h1 className="text-4xl font-bold tracking-tight">Account workspace</h1>
        </div>
        <UserButton afterSignOutUrl="/" />
      </header>
      <p className="max-w-2xl text-base text-slate-600">
        Clerk is configured and the protected route is active. Use this page as the
        starting point for signed-in account features.
      </p>
      <nav className="flex gap-4 text-sm font-medium">
        <Link href="/profile" className="underline underline-offset-4">
          Profile
        </Link>
        <Link href="/settings" className="underline underline-offset-4">
          Settings
        </Link>
      </nav>
    </main>
  )
}
`
  )

  await writePageIfMissing(
    join(appRoot, 'profile', 'page.tsx'),
    `import Link from 'next/link'
import { UserProfile } from '@clerk/nextjs'

export default function ProfilePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-16">
      <Link href="/dashboard" className="text-sm font-medium underline underline-offset-4">
        Back to dashboard
      </Link>
      <UserProfile />
    </main>
  )
}
`
  )

  await writePageIfMissing(
    join(appRoot, 'settings', 'page.tsx'),
    `import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'

export default function SettingsPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-6 py-16">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Settings</p>
          <h1 className="text-4xl font-bold tracking-tight">Account settings</h1>
        </div>
        <UserButton afterSignOutUrl="/" />
      </div>
      <p className="max-w-2xl text-base text-slate-600">
        Add account-specific settings here. This route stays protected through Clerk middleware.
      </p>
      <Link href="/dashboard" className="text-sm font-medium underline underline-offset-4">
        Back to dashboard
      </Link>
    </main>
  )
}
`
  )
}

async function writePageIfMissing(filePath: string, content: string): Promise<void> {
  if (await pathExists(filePath)) {
    return
  }

  await ensureDir(dirname(filePath))
  await writeFile(filePath, content)
}
