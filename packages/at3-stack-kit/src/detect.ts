/**
 * Project detection utilities for AT3 Stack Kit
 * Aligned with at3-toolkit's sophisticated detection system
 */

import { detect as detectPackageManager } from 'detect-package-manager'
import { existsSync, readdirSync, readFileSync } from 'fs-extra'
import { join } from 'path'

export type ProjectType =
  | 'ait3e'
  | 'nextjs'
  | 't3'
  | 'react'
  | 'vue'
  | 'nuxt'
  | 'vite'
  | 'node'
  | 'webpack'
  | 'unknown'

export type AuthProvider = 'supabase' | 'clerk' | 'better-auth' | 'next-auth' | 'lucia' | 'none'

export interface DependencyInfo {
  name: string
  version: string
  type: 'dependency' | 'devDependency' | 'peerDependency'
  current?: string // Installed version
  latest?: string // Latest available version
}

export interface TestingInfo {
  unit: 'vitest' | 'jest' | 'none'
  e2e: 'playwright' | 'cypress' | 'none'
}

export interface ProjectInfo {
  path: string
  type: ProjectType
  hasNextjs: boolean
  hasReact: boolean
  hasVue: boolean
  hasTypeScript: boolean
  hasTailwind: boolean
  hasTRPC: boolean
  hasSupabase: boolean
  hasAI: boolean
  hasPWA: boolean
  hasI18n: boolean
  hasVitest: boolean
  hasPlaywright: boolean
  hasEslint: boolean
  hasPrettier: boolean
  hasBiome: boolean
  hasEdgeRuntime: boolean
  hasVectorDB: boolean
  // Extended detection
  hasDrizzle: boolean
  hasPrisma: boolean
  authProvider: AuthProvider
  testing: TestingInfo
  packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun'
  dependencies: DependencyInfo[]
  configFiles: string[]
}

/**
 * Detect project type based on dependencies and file structure
 * Enhanced with comprehensive type detection from at3-toolkit
 */
export async function detectProjectType(projectPath: string): Promise<ProjectType> {
  const packageJsonPath = join(projectPath, 'package.json')

  if (!existsSync(packageJsonPath)) {
    return 'unknown'
  }

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }

    // Check for AIT3E stack (AI + T3 + Edge)
    const hasAI =
      deps.ai || deps['@ai-sdk/openai'] || deps['@ai-sdk/anthropic'] || deps['@ai-sdk/google']
    const hasSupabase = deps['@supabase/supabase-js'] || deps['@supabase/ssr']
    const hasNextJS = deps.next
    const hasTailwind = deps.tailwindcss
    const hasTypeScript = deps.typescript || existsSync(join(projectPath, 'tsconfig.json'))

    if (hasAI && hasSupabase && hasNextJS && (hasTailwind || hasTypeScript)) {
      return 'ait3e'
    }

    // Check for T3 stack (Next.js + tRPC + Prisma/Drizzle)
    if (deps.next && deps['@trpc/server']) {
      if (deps.prisma || deps['@prisma/client'] || deps['drizzle-orm']) {
        return 't3'
      }
    }

    // Check for Next.js
    if (deps.next) return 'nextjs'

    // Check for Nuxt
    if (deps.nuxt || deps['@nuxt/core']) return 'nuxt'

    // Check for Vue
    if (deps.vue) return 'vue'

    // Check for React
    if (deps.react) return 'react'

    // Check for Vite
    if (deps.vite) return 'vite'

    // Check for Webpack
    if (deps.webpack) return 'webpack'

    // Default to Node.js
    return 'node'
  } catch (error) {
    return 'unknown'
  }
}

/**
 * Get comprehensive project information
 * Enhanced with sophisticated dependency analysis from at3-toolkit
 */
export async function analyzeProject(projectPath: string): Promise<ProjectInfo> {
  if (!existsSync(projectPath)) {
    throw new Error(`Project path does not exist: ${projectPath}`)
  }

  const packageJsonPath = join(projectPath, 'package.json')
  if (!existsSync(packageJsonPath)) {
    throw new Error('No package.json found. This does not appear to be a Node.js project.')
  }

  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))

  // Use sophisticated package manager detection with fallback
  let packageManager: ProjectInfo['packageManager'] = 'npm'
  try {
    packageManager = (await detectPackageManager({ cwd: projectPath })) as any
  } catch {
    // Fallback to file-based detection
    if (existsSync(join(projectPath, 'pnpm-lock.yaml'))) packageManager = 'pnpm'
    else if (existsSync(join(projectPath, 'yarn.lock'))) packageManager = 'yarn'
    else if (existsSync(join(projectPath, 'bun.lockb'))) packageManager = 'bun'
  }

  // Analyze dependencies with detailed structure
  const dependencies = await analyzeDependencies(packageJson, projectPath)
  const configFiles = findConfigFiles(projectPath)

  // Feature detection
  const hasTypeScript = hasTypeScriptSupport(projectPath, dependencies)
  const hasNextjs = hasDependency(dependencies, 'next')
  const hasReact = hasDependency(dependencies, 'react')
  const hasVue = hasDependency(dependencies, 'vue')
  const hasTailwind = hasDependency(dependencies, 'tailwindcss')
  const hasTRPC = detectTRPC(dependencies)
  const hasEslint = hasDependency(dependencies, 'eslint')
  const hasPrettier = hasDependency(dependencies, 'prettier')
  const hasBiome = hasDependency(dependencies, '@biomejs/biome')

  // AT3-specific features
  const hasAI = detectAISupport(dependencies)
  const hasSupabase = detectSupabase(dependencies, projectPath)
  const hasEdgeRuntime = detectEdgeRuntime(projectPath)
  const hasVectorDB = hasSupabaseVectorConfig(projectPath)
  const hasPWA = detectPWA(dependencies, projectPath)
  const hasI18n = detectI18n(dependencies, projectPath)

  // Database detection
  const hasDrizzle = detectDrizzle(dependencies, projectPath)
  const hasPrisma = detectPrisma(dependencies, projectPath)

  // Auth detection
  const authProvider = detectAuthProvider(dependencies, projectPath)

  // Testing detection
  const testing = detectTesting(dependencies)
  const hasVitest = testing.unit === 'vitest'
  const hasPlaywright = testing.e2e === 'playwright'

  return {
    path: projectPath,
    type: await detectProjectType(projectPath),
    hasNextjs,
    hasReact,
    hasVue,
    hasTypeScript,
    hasTailwind,
    hasTRPC,
    hasSupabase,
    hasAI,
    hasPWA,
    hasI18n,
    hasVitest,
    hasPlaywright,
    hasEslint,
    hasPrettier,
    hasBiome,
    hasEdgeRuntime,
    hasVectorDB,
    hasDrizzle,
    hasPrisma,
    authProvider,
    testing,
    packageManager,
    dependencies,
    configFiles,
  }
}

/**
 * Analyze dependencies with installed version info
 */
async function analyzeDependencies(
  packageJson: any,
  projectPath: string
): Promise<DependencyInfo[]> {
  const deps: DependencyInfo[] = []

  // Production dependencies
  if (packageJson.dependencies) {
    for (const [name, version] of Object.entries(packageJson.dependencies)) {
      const info: DependencyInfo = {
        name,
        version: version as string,
        type: 'dependency',
      }

      // Try to get installed version
      try {
        const installedPkgPath = join(projectPath, 'node_modules', name, 'package.json')
        if (existsSync(installedPkgPath)) {
          const installedPkg = JSON.parse(readFileSync(installedPkgPath, 'utf-8'))
          info.current = installedPkg.version
        }
      } catch {
        // Ignore
      }

      deps.push(info)
    }
  }

  // Development dependencies
  if (packageJson.devDependencies) {
    for (const [name, version] of Object.entries(packageJson.devDependencies)) {
      const info: DependencyInfo = {
        name,
        version: version as string,
        type: 'devDependency',
      }

      try {
        const installedPkgPath = join(projectPath, 'node_modules', name, 'package.json')
        if (existsSync(installedPkgPath)) {
          const installedPkg = JSON.parse(readFileSync(installedPkgPath, 'utf-8'))
          info.current = installedPkg.version
        }
      } catch {
        // Ignore
      }

      deps.push(info)
    }
  }

  // Peer dependencies
  if (packageJson.peerDependencies) {
    for (const [name, version] of Object.entries(packageJson.peerDependencies)) {
      deps.push({
        name,
        version: version as string,
        type: 'peerDependency',
      })
    }
  }

  return deps
}

/**
 * Find configuration files in the project
 */
function findConfigFiles(projectPath: string): string[] {
  const configFiles: string[] = []

  const commonConfigFiles = [
    // TypeScript
    'tsconfig.json',
    'tsconfig.build.json',
    'tsconfig.test.json',

    // Next.js
    'next.config.js',
    'next.config.ts',
    'next.config.mjs',
    'next-env.d.ts',

    // Tailwind
    'tailwind.config.js',
    'tailwind.config.ts',
    'tailwind.config.mjs',
    'postcss.config.js',
    'postcss.config.mjs',

    // Linting
    '.eslintrc.js',
    '.eslintrc.json',
    '.eslintrc.yml',
    '.eslintrc.yaml',
    'eslint.config.js',
    'eslint.config.mjs',
    '.prettierrc',
    '.prettierrc.js',
    '.prettierrc.json',
    'biome.json',
    'biome.jsonc',

    // Testing
    'vitest.config.ts',
    'vitest.config.js',
    'vitest.config.mts',
    'jest.config.js',
    'jest.config.ts',
    'playwright.config.ts',
    'cypress.config.js',
    'cypress.config.ts',

    // Build tools
    'vite.config.ts',
    'vite.config.js',
    'webpack.config.js',
    'rollup.config.js',
    'turbo.json',

    // Database
    'drizzle.config.ts',
    'drizzle.config.js',
    'prisma/schema.prisma',

    // Environment
    '.env',
    '.env.local',
    '.env.example',
    '.env.development',
    '.env.production',

    // Other
    '.gitignore',
    'README.md',
    'package.json',
    'pnpm-workspace.yaml',
    'vercel.json',
    'netlify.toml',
  ]

  commonConfigFiles.forEach((file) => {
    if (existsSync(join(projectPath, file))) {
      configFiles.push(file)
    }
  })

  // Check for Supabase config
  if (existsSync(join(projectPath, 'supabase', 'config.toml'))) {
    configFiles.push('supabase/config.toml')
  }

  return configFiles
}

/**
 * Check if TypeScript is supported
 */
function hasTypeScriptSupport(projectPath: string, dependencies: DependencyInfo[]): boolean {
  return existsSync(join(projectPath, 'tsconfig.json')) || hasDependency(dependencies, 'typescript')
}

/**
 * Check if a dependency exists
 */
function hasDependency(dependencies: DependencyInfo[], name: string): boolean {
  return dependencies.some((dep) => dep.name === name)
}

/**
 * Detect AI SDK support
 */
function detectAISupport(dependencies: DependencyInfo[]): boolean {
  const aiDeps = [
    'ai',
    '@ai-sdk/openai',
    '@ai-sdk/anthropic',
    '@ai-sdk/google',
    '@ai-sdk/azure',
    '@ai-sdk/mistral',
    '@ai-sdk/cohere',
    'openai',
    '@anthropic-ai/sdk',
    '@google/generative-ai',
    'langchain',
    '@langchain/core',
    'llamaindex',
  ]

  return aiDeps.some((dep) => hasDependency(dependencies, dep))
}

/**
 * Detect Supabase usage
 */
function detectSupabase(dependencies: DependencyInfo[], projectPath: string): boolean {
  const hasSupabaseDeps =
    hasDependency(dependencies, '@supabase/supabase-js') ||
    hasDependency(dependencies, '@supabase/ssr') ||
    hasDependency(dependencies, '@supabase/auth-helpers-nextjs')

  const hasSupabaseConfig = existsSync(join(projectPath, 'supabase', 'config.toml'))

  return hasSupabaseDeps || hasSupabaseConfig
}

/**
 * Detect Edge runtime usage
 */
function detectEdgeRuntime(projectPath: string): boolean {
  const middlewarePaths = [
    join(projectPath, 'middleware.ts'),
    join(projectPath, 'middleware.js'),
    join(projectPath, 'src/middleware.ts'),
    join(projectPath, 'src/middleware.js'),
  ]

  if (middlewarePaths.some((p) => existsSync(p))) {
    return true
  }

  // Check for edge runtime in API routes
  const apiPaths = [
    join(projectPath, 'app/api'),
    join(projectPath, 'src/app/api'),
    join(projectPath, 'pages/api'),
  ]

  for (const apiPath of apiPaths) {
    if (existsSync(apiPath)) {
      try {
        const files = getAllFiles(apiPath, ['.ts', '.js'])
        for (const file of files) {
          const content = readFileSync(file, 'utf8')
          if (content.includes("export const runtime = 'edge'")) {
            return true
          }
        }
      } catch {
        // Ignore
      }
    }
  }

  return false
}

/**
 * Check for Supabase vector configuration
 */
function hasSupabaseVectorConfig(projectPath: string): boolean {
  const supabaseMigrationDir = join(projectPath, 'supabase', 'migrations')
  if (!existsSync(supabaseMigrationDir)) return false

  try {
    const migrationFiles = readdirSync(supabaseMigrationDir)

    return migrationFiles.some((file: string) => {
      if (file.endsWith('.sql')) {
        const content = readFileSync(join(supabaseMigrationDir, file), 'utf8')
        return content.includes('vector') || content.includes('embedding') || content.includes('pgvector')
      }
      return false
    })
  } catch {
    return false
  }
}

/**
 * Detect Drizzle ORM
 */
function detectDrizzle(dependencies: DependencyInfo[], projectPath: string): boolean {
  const hasDrizzleDeps =
    hasDependency(dependencies, 'drizzle-orm') || hasDependency(dependencies, 'drizzle-kit')

  const hasDrizzleConfig =
    existsSync(join(projectPath, 'drizzle.config.ts')) ||
    existsSync(join(projectPath, 'drizzle.config.js'))

  return hasDrizzleDeps || hasDrizzleConfig
}

/**
 * Detect Prisma ORM
 */
function detectPrisma(dependencies: DependencyInfo[], projectPath: string): boolean {
  const hasPrismaDeps =
    hasDependency(dependencies, 'prisma') || hasDependency(dependencies, '@prisma/client')

  const hasPrismaSchema = existsSync(join(projectPath, 'prisma', 'schema.prisma'))

  return hasPrismaDeps || hasPrismaSchema
}

/**
 * Detect auth provider
 */
function detectAuthProvider(dependencies: DependencyInfo[], projectPath: string): AuthProvider {
  // Supabase Auth
  if (
    hasDependency(dependencies, '@supabase/auth-helpers-nextjs') ||
    hasDependency(dependencies, '@supabase/ssr')
  ) {
    const hasAuthConfig =
      existsSync(join(projectPath, 'src/lib/supabase')) ||
      existsSync(join(projectPath, 'lib/supabase'))
    if (hasAuthConfig) return 'supabase'
  }

  // Clerk
  if (
    hasDependency(dependencies, '@clerk/nextjs') ||
    hasDependency(dependencies, '@clerk/clerk-react')
  ) {
    return 'clerk'
  }

  // Better Auth
  if (hasDependency(dependencies, 'better-auth')) {
    return 'better-auth'
  }

  // NextAuth / Auth.js
  if (hasDependency(dependencies, 'next-auth') || hasDependency(dependencies, '@auth/core')) {
    return 'next-auth'
  }

  // Lucia
  if (hasDependency(dependencies, 'lucia')) {
    return 'lucia'
  }

  return 'none'
}

/**
 * Detect tRPC
 */
function detectTRPC(dependencies: DependencyInfo[]): boolean {
  return (
    hasDependency(dependencies, '@trpc/server') ||
    hasDependency(dependencies, '@trpc/client') ||
    hasDependency(dependencies, '@trpc/react-query')
  )
}

/**
 * Detect PWA support
 */
function detectPWA(dependencies: DependencyInfo[], projectPath: string): boolean {
  const hasPWADeps =
    hasDependency(dependencies, '@ducanh2912/next-pwa') ||
    hasDependency(dependencies, 'next-pwa') ||
    hasDependency(dependencies, 'workbox-webpack-plugin')

  const hasManifest = existsSync(join(projectPath, 'public', 'manifest.json'))
  const hasServiceWorker =
    existsSync(join(projectPath, 'public', 'sw.js')) ||
    existsSync(join(projectPath, 'public', 'service-worker.js'))

  return hasPWADeps || (hasManifest && hasServiceWorker)
}

/**
 * Detect i18n support
 */
function detectI18n(dependencies: DependencyInfo[], projectPath: string): boolean {
  const hasI18nDeps =
    hasDependency(dependencies, 'next-intl') ||
    hasDependency(dependencies, 'next-i18next') ||
    hasDependency(dependencies, 'react-i18next') ||
    hasDependency(dependencies, 'i18next')

  const hasMessagesDir =
    existsSync(join(projectPath, 'messages')) ||
    existsSync(join(projectPath, 'locales')) ||
    existsSync(join(projectPath, 'public/locales'))

  return hasI18nDeps || hasMessagesDir
}

/**
 * Detect testing setup
 */
function detectTesting(dependencies: DependencyInfo[]): TestingInfo {
  // Unit testing
  let unit: TestingInfo['unit'] = 'none'
  if (hasDependency(dependencies, 'vitest')) {
    unit = 'vitest'
  } else if (hasDependency(dependencies, 'jest')) {
    unit = 'jest'
  }

  // E2E testing
  let e2e: TestingInfo['e2e'] = 'none'
  if (hasDependency(dependencies, '@playwright/test') || hasDependency(dependencies, 'playwright')) {
    e2e = 'playwright'
  } else if (hasDependency(dependencies, 'cypress')) {
    e2e = 'cypress'
  }

  return { unit, e2e }
}

/**
 * Get all files in directory recursively
 */
function getAllFiles(dirPath: string, extensions: string[]): string[] {
  const files: string[] = []

  try {
    const entries = readdirSync(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name)
      if (entry.isDirectory()) {
        files.push(...getAllFiles(fullPath, extensions))
      } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
        files.push(fullPath)
      }
    }
  } catch {
    // Ignore errors
  }

  return files
}

/**
 * Check what AT3 features are missing from the project
 */
export function getMissingFeatures(info: ProjectInfo): string[] {
  const missing: string[] = []

  if (!info.hasSupabase && !info.hasDrizzle && !info.hasPrisma) missing.push('database')
  if (!info.hasAI) missing.push('ai')
  if (!info.hasPWA) missing.push('pwa')
  if (!info.hasI18n) missing.push('i18n')
  if (info.testing.unit === 'none') missing.push('testing')
  if (!info.hasTailwind) missing.push('tailwind')
  if (!info.hasTypeScript) missing.push('typescript')
  if (info.authProvider === 'none') missing.push('auth')

  return missing
}

/**
 * Check if project is compatible with AT3 stack
 */
export function isCompatible(info: ProjectInfo): boolean {
  // Must have Next.js or React
  if (!(info.hasNextjs || info.hasReact)) return false

  // Must have a supported package manager
  if (!['npm', 'pnpm', 'yarn', 'bun'].includes(info.packageManager)) return false

  return true
}

/**
 * Get upgrade recommendations based on current project state
 */
export function getRecommendations(info: ProjectInfo): {
  priority: 'high' | 'medium' | 'low'
  feature: string
  reason: string
}[] {
  const recommendations = []

  if (!info.hasTypeScript) {
    recommendations.push({
      priority: 'high' as const,
      feature: 'typescript',
      reason: 'TypeScript provides better development experience and type safety',
    })
  }

  if (!info.hasTailwind) {
    recommendations.push({
      priority: 'high' as const,
      feature: 'tailwind',
      reason: 'Tailwind CSS is essential for AT3 stack styling',
    })
  }

  if (!info.hasSupabase && !info.hasDrizzle && !info.hasPrisma) {
    recommendations.push({
      priority: 'high' as const,
      feature: 'database',
      reason: 'A database solution is needed for most applications',
    })
  }

  if (info.authProvider === 'none') {
    recommendations.push({
      priority: 'medium' as const,
      feature: 'auth',
      reason: 'Authentication is essential for user management',
    })
  }

  if (!info.hasAI) {
    recommendations.push({
      priority: 'medium' as const,
      feature: 'ai',
      reason: 'AI integration is a core feature of AT3 stack',
    })
  }

  if (info.testing.unit === 'none') {
    recommendations.push({
      priority: 'low' as const,
      feature: 'testing',
      reason: 'Comprehensive testing improves code quality',
    })
  }

  if (!info.hasBiome && (info.hasEslint || info.hasPrettier)) {
    recommendations.push({
      priority: 'low' as const,
      feature: 'biome',
      reason: 'Biome provides faster linting and formatting than ESLint/Prettier',
    })
  }

  return recommendations
}

/**
 * Get a summary score for AT3 stack compatibility
 */
export function getAT3Score(info: ProjectInfo): {
  score: number
  maxScore: number
  percentage: number
  level: 'none' | 'basic' | 'intermediate' | 'advanced' | 'full'
} {
  let score = 0
  const maxScore = 10

  if (info.hasNextjs) score += 1
  if (info.hasTypeScript) score += 1
  if (info.hasTailwind) score += 1
  if (info.hasSupabase || info.hasDrizzle || info.hasPrisma) score += 1
  if (info.authProvider !== 'none') score += 1
  if (info.hasAI) score += 2
  if (info.hasEdgeRuntime) score += 1
  if (info.testing.unit !== 'none') score += 1
  if (info.hasBiome) score += 1

  const percentage = Math.round((score / maxScore) * 100)

  let level: 'none' | 'basic' | 'intermediate' | 'advanced' | 'full'
  if (percentage === 0) level = 'none'
  else if (percentage < 30) level = 'basic'
  else if (percentage < 60) level = 'intermediate'
  else if (percentage < 90) level = 'advanced'
  else level = 'full'

  return { score, maxScore, percentage, level }
}
