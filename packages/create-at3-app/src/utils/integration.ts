/**
 * Integration utilities for create-at3-app
 * Enables smart detection and suggestions for other AT3 tools
 */

import { colors, style } from './cli-styling.js'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const AT3_CONFIG_FILENAME = '.at3-config.json'
const JSON_SPACES = 2

const DEFAULT_WORKFLOWS = [
  'Explore at3-kit to add more AT3 features',
  'Use at3t for development workflow optimization',
] as const

const TEMPLATE_WORKFLOWS: Record<string, readonly string[]> = {
  '83-flavor': [
    'Your project includes the full AT3 stack - ready for production!',
    'Use at3t migrate for advanced project maintenance',
  ],
  suggested: [
    'Complete AT3 stack configured - explore all features',
    'Use at3-kit to fine-tune specific features as needed',
  ],
  t3: [
    'Consider adding AI features with at3-kit for enhanced functionality',
    'Use at3t for advanced TypeScript and testing configurations',
  ],
}

export interface AT3Config {
  version: string
  created: string
  template: string
  features: string[]
  toolsUsed: string[]
  suggestedWorkflows?: string[]
}

/**
 * Create AT3 configuration file for project tracking
 */
export const createAT3Config = (
  projectPath: string,
  config: Omit<AT3Config, 'version' | 'created'>
): AT3Config => {
  const fullConfig: AT3Config = {
    ...config,
    created: new Date().toISOString(),
    toolsUsed: [...new Set(['create-at3-app', ...(config.toolsUsed || [])])],
    version: '0.1.0',
  }

  // Write config file (optional for integration)
  try {
    const configPath = join(projectPath, AT3_CONFIG_FILENAME)
    writeFileSync(configPath, JSON.stringify(fullConfig, undefined, JSON_SPACES))
  } catch {
    // Silently fail - integration is optional
  }

  return fullConfig
}

/**
 * Detect if other AT3 tools might be useful for this project
 */
export const suggestAT3Tools = (template: string, features: string[]): string[] => {
  const suggestions: string[] = []

  // Suggest at3-stack-kit for existing projects
  if (template !== '83-flavor' && template !== 'suggested') {
    suggestions.push(
      `${colors.info('💡 Tip:')} Use ${style.command('at3-kit')} to upgrade existing projects to AT3 Stack`
    )
  }

  // Suggest at3-toolkit for development workflow
  if (!features.includes('testing')) {
    suggestions.push(
      `${colors.info('💡 Tip:')} Use ${style.command('@entro314-labs/at3t')} for advanced linting, testing, and development tools`
    )
  }

  return suggestions
}

/**
 * Check if project was created with AT3 tools
 */
export const detectAT3Project = (projectPath: string): AT3Config | undefined => {
  const configPath = join(projectPath, AT3_CONFIG_FILENAME)

  if (!existsSync(configPath)) {
    return undefined
  }

  try {
    const config = JSON.parse(readFileSync(configPath, 'utf8'))
    return config
  } catch {
    return undefined
  }
}

/**
 * Get workflow suggestions based on project state
 */
export const getWorkflowSuggestions = (template: string): string[] => [
  ...(TEMPLATE_WORKFLOWS[template] ?? DEFAULT_WORKFLOWS),
]
