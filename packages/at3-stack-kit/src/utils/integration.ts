/**
 * Integration utilities for at3-stack-kit
 * Enables smart detection and suggestions for other AT3 tools
 */

import { existsSync } from 'fs-extra'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'path'
import type { ProjectInfo } from '../detect.js'
import { colors, style } from './cli-styling.js'

export interface AT3Config {
  version: string
  created: string
  template?: string
  features: string[]
  toolsUsed: string[]
  suggestedWorkflows?: string[]
  lastMigration?: string
}

/**
 * Update AT3 configuration after migration
 */
export function updateAT3Config(projectPath: string, addedFeatures: string[]): AT3Config {
  const configPath = join(projectPath, '.at3-config.json')
  let config = createDefaultConfig()

  if (existsSync(configPath)) {
    try {
      config = JSON.parse(readFileSync(configPath, 'utf8'))
    } catch {
      config = createDefaultConfig()
    }
  }

  // Update config
  config.features = [...new Set([...config.features, ...addedFeatures])]
  config.toolsUsed = [...new Set([...config.toolsUsed, 'at3-stack-kit'])]
  config.lastMigration = new Date().toISOString()

  // Write config file (optional for integration)
  try {
    writeFileSync(configPath, JSON.stringify(config, null, 2))
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    process.stderr.write(`[at3-stack-kit] Warning: failed to write ${configPath}: ${message}\n`)
  }

  return config
}

function createDefaultConfig(): AT3Config {
  return {
    created: new Date().toISOString(),
    features: [],
    toolsUsed: ['at3-stack-kit'],
    version: '0.1.0',
  }
}

/**
 * Detect if project was created with create-at3-app
 */
export function detectCreateAt3App(projectPath: string): boolean {
  const configPath = join(projectPath, '.at3-config.json')

  if (!existsSync(configPath)) {
    return false
  }

  try {
    const config = JSON.parse(readFileSync(configPath, 'utf8'))
    return config.toolsUsed?.includes('create-at3-app')
  } catch {
    return false
  }
}

/**
 * Suggest complementary AT3 tools based on project state
 */
export function suggestAT3Tools(projectInfo: ProjectInfo, addedFeatures: string[]): string[] {
  const suggestions: string[] = []

  // Suggest at3-toolkit for development workflow optimization
  if (!(projectInfo.hasEslint && projectInfo.hasPrettier && projectInfo.hasVitest)) {
    suggestions.push(
      `${colors.info('💡 Tip:')} Use ${style.command('npx @entro314labs/at3-toolkit')} for advanced linting, testing, and migration workflows`
    )
  }

  // Suggest create-at3-app for future projects
  if (addedFeatures.length > 0) {
    suggestions.push(
      `${colors.info('💡 Tip:')} For new projects, use ${style.command('create-at3-app')} to start with the AT3 stack from the beginning`
    )
  }

  return suggestions
}

/**
 * Get post-migration workflow suggestions
 */
export function getPostMigrationWorkflow(
  projectInfo: ProjectInfo,
  addedFeatures: string[]
): string[] {
  const workflows: string[] = []
  const hasAIFeature = addedFeatures.some(
    (feature) => feature === 'ai' || feature.startsWith('ai-')
  )

  if (hasAIFeature) {
    workflows.push('Configure your AI provider API keys in .env.local')
    workflows.push('Explore the AI integration examples in your project')
  }

  if (addedFeatures.includes('supabase')) {
    workflows.push('Set up your Supabase project and update connection strings')
    workflows.push('Run database migrations if any were added')
  }

  if (addedFeatures.includes('testing')) {
    workflows.push(
      `Run ${style.command(`${projectInfo.packageManager} test`)} to verify your test setup`
    )
  }

  if (projectInfo.type === 'ait3e') {
    workflows.push('Your project now includes the complete AT3 stack!')
    workflows.push('Consider using at3t for advanced development workflow optimization')
  }

  return workflows
}
