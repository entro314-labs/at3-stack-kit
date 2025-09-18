/**
 * Project detection utilities for AT3 Stack Kit
 * Aligned with at3-toolkit's sophisticated detection system
 */

import { detect as detectPackageManager } from 'detect-package-manager'
import { existsSync, readFileSync } from 'fs-extra'
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

export interface DependencyInfo {
  name: string
  version: string
  type: 'dependency' | 'devDependency' | 'peerDependency'
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

    // Check for T3 stack
    if (deps['@t3-oss/create-t3-app'] || (deps.next && deps['@trpc/server'] && deps.prisma)) {
      return 't3'
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
  const dependencies = analyzeDependencies(packageJson)
  const configFiles = findConfigFiles(projectPath)

  // Feature detection
  const hasTypeScript = hasTypeScriptSupport(projectPath, dependencies)
  const hasNextjs = hasDependency(dependencies, 'next')
  const hasReact = hasDependency(dependencies, 'react')
  const hasVue = hasDependency(dependencies, 'vue')
  const hasTailwind = hasDependency(dependencies, 'tailwindcss')
  const hasTRPC = dependencies.some((dep) => dep.name.includes('@trpc/'))
  const hasEslint = hasDependency(dependencies, 'eslint')
  const hasPrettier = hasDependency(dependencies, 'prettier')
  const hasBiome = hasDependency(dependencies, '@biomejs/biome')

  // AT3-specific features
  const hasAI =
    hasDependency(dependencies, 'ai') ||
    hasDependency(dependencies, '@ai-sdk/openai') ||
    hasDependency(dependencies, '@ai-sdk/anthropic') ||
    hasDependency(dependencies, '@ai-sdk/google')
  const hasSupabase =
    hasDependency(dependencies, '@supabase/supabase-js') ||
    hasDependency(dependencies, '@supabase/ssr')
  const hasEdgeRuntime =
    existsSync(join(projectPath, 'middleware.ts')) ||
    existsSync(join(projectPath, 'src/middleware.ts'))
  const hasVectorDB = hasSupabaseVectorConfig(projectPath)
  const hasPWA = dependencies.some(
    (dep) => dep.name.includes('workbox') || dep.name.includes('pwa')
  )
  const hasI18n = dependencies.some(
    (dep) => dep.name.includes('next-intl') || dep.name.includes('i18n')
  )
  const hasVitest = hasDependency(dependencies, 'vitest')
  const hasPlaywright =
    hasDependency(dependencies, 'playwright') || hasDependency(dependencies, '@playwright/test')

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
    packageManager,
    dependencies,
    configFiles,
  }
}

/**
 * Analyze dependencies with detailed structure
 */
function analyzeDependencies(packageJson: any): DependencyInfo[] {
  const deps: DependencyInfo[] = []

  // Production dependencies
  if (packageJson.dependencies) {
    Object.entries(packageJson.dependencies).forEach(([name, version]) => {
      deps.push({
        name,
        version: version as string,
        type: 'dependency',
      })
    })
  }

  // Development dependencies
  if (packageJson.devDependencies) {
    Object.entries(packageJson.devDependencies).forEach(([name, version]) => {
      deps.push({
        name,
        version: version as string,
        type: 'devDependency',
      })
    })
  }

  // Peer dependencies
  if (packageJson.peerDependencies) {
    Object.entries(packageJson.peerDependencies).forEach(([name, version]) => {
      deps.push({
        name,
        version: version as string,
        type: 'peerDependency',
      })
    })
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

    // Next.js
    'next.config.js',
    'next.config.ts',
    'next.config.mjs',

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

    // Testing
    'vitest.config.ts',
    'vitest.config.js',
    'jest.config.js',
    'jest.config.ts',
    'playwright.config.ts',

    // Build tools
    'vite.config.ts',
    'vite.config.js',
    'webpack.config.js',
    'rollup.config.js',

    // Other
    '.gitignore',
    '.env.example',
    '.env.local',
    'README.md',
  ]

  commonConfigFiles.forEach((file) => {
    if (existsSync(join(projectPath, file))) {
      configFiles.push(file)
    }
  })

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
 * Check for Supabase vector configuration
 */
function hasSupabaseVectorConfig(projectPath: string): boolean {
  // Check for Supabase migration files that might contain vector extensions
  const supabaseMigrationDir = join(projectPath, 'supabase', 'migrations')
  if (existsSync(supabaseMigrationDir)) {
    try {
      const { readdirSync } = require('fs')
      const migrationFiles = readdirSync(supabaseMigrationDir)

      return migrationFiles.some((file: string) => {
        if (file.endsWith('.sql')) {
          const content = readFileSync(join(supabaseMigrationDir, file), 'utf8')
          return content.includes('vector') || content.includes('embedding')
        }
        return false
      })
    } catch (error) {
      return false
    }
  }
  return false
}

/**
 * Check what AT3 features are missing from the project
 */
export function getMissingFeatures(info: ProjectInfo): string[] {
  const missing: string[] = []

  if (!info.hasSupabase) missing.push('supabase')
  if (!info.hasAI) missing.push('ai')
  if (!info.hasPWA) missing.push('pwa')
  if (!info.hasI18n) missing.push('i18n')
  if (!info.hasVitest) missing.push('testing')
  if (!info.hasTailwind) missing.push('tailwind')
  if (!info.hasTypeScript) missing.push('typescript')

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

  if (!info.hasSupabase) {
    recommendations.push({
      priority: 'medium' as const,
      feature: 'supabase',
      reason: 'Supabase provides database, auth, and edge functions',
    })
  }

  if (!info.hasAI) {
    recommendations.push({
      priority: 'medium' as const,
      feature: 'ai',
      reason: 'AI integration is a core feature of AT3 stack',
    })
  }

  if (!(info.hasVitest || info.hasPlaywright)) {
    recommendations.push({
      priority: 'low' as const,
      feature: 'testing',
      reason: 'Comprehensive testing improves code quality',
    })
  }

  return recommendations
}
