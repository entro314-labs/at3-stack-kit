#!/usr/bin/env node

/**
 * AT3 Stack Kit CLI
 * Upgrade existing projects to AT3 Stack with AI, edge, and modern features
 */

import { cancel, confirm, intro, isCancel, multiselect, note, outro, spinner } from '@clack/prompts'
import chalk from 'chalk'
import { program } from 'commander'
import { detect as detectPackageManager } from 'detect-package-manager'
import { existsSync, readFileSync } from 'fs-extra'
import { join } from 'path'
import { analyzeProject, type ProjectInfo, type ProjectType, detectProjectType } from './detect.js'
import {
  addAI,
  addBetterAuth,
  addClerk,
  addDrizzle,
  addI18n,
  addNeon,
  addPWA,
  addSupabase,
  addTesting,
} from './features/index.js'
import { colors, header, style, symbols } from './utils/cli-styling.js'
import { getPostMigrationWorkflow, suggestAT3Tools, updateAT3Config } from './utils/integration.js'
import spawn from 'cross-spawn'

const features = [
  {
    description: 'Add custom AI integration with multiple providers',
    id: 'ai-custom',
    name: 'AI Integration (Custom)',
    value: 'ai-custom',
  },
  {
    description: 'Add Vercel AI SDK for streaming responses',
    id: 'ai-vercel',
    name: 'AI Integration (Vercel SDK)',
    value: 'ai-vercel',
  },
  {
    description: 'Add Supabase for database, auth, and edge functions',
    id: 'supabase',
    name: 'Supabase',
    value: 'supabase',
  },
  {
    description: 'Add Drizzle ORM with generic PostgreSQL support',
    id: 'drizzle',
    name: 'Drizzle ORM + PostgreSQL',
    value: 'drizzle',
  },
  {
    description: 'Add Neon serverless PostgreSQL client and starter wiring',
    id: 'neon',
    name: 'Neon (Serverless Postgres)',
    value: 'neon',
  },
  {
    description: 'Add Clerk authentication',
    id: 'clerk',
    name: 'Clerk Auth',
    value: 'clerk',
  },
  {
    description: 'Add Better Auth with Drizzle/PostgreSQL persistence',
    id: 'better-auth',
    name: 'Better Auth',
    value: 'better-auth',
  },
  {
    description: 'Add Progressive Web App features',
    id: 'pwa',
    name: 'PWA Support',
    value: 'pwa',
  },
  {
    description: 'Add next-intl for multi-language support',
    id: 'i18n',
    name: 'Internationalization',
    value: 'i18n',
  },
  {
    description: 'Add Vitest and Playwright for comprehensive testing',
    id: 'testing',
    name: 'Testing Suite',
    value: 'testing',
  },
] as const

type FeatureId = (typeof features)[number]['value']

interface MainOptions {
  dryRun?: boolean
  install?: boolean
}

async function main(options: MainOptions = {}) {
  console.clear()

  const dryRun = options.dryRun === true
  const installAllowed = options.install !== false

  intro(style.title('AT3 Stack Kit'))

  // Detect current project
  const s = spinner()
  s.start('Analyzing your project...')

  const projectType = await detectProjectType(process.cwd())
  const packageManager = await detectPackageManager().catch(() => 'npm')
  const analyzedProject = await analyzeProject(process.cwd()).catch(() => null)

  s.stop(
    `${symbols.success} Detected: ${style.value(getProjectTypeLabel(projectType))} project using ${style.accent(packageManager)}`
  )

  if (projectType === 'unknown') {
    cancel(
      "This doesn't appear to be a supported project type. AT3 Kit supports Next.js, T3, and React projects."
    )
    process.exit(1)
  }

  // Show current project info
  note(getProjectInfo(projectType), 'Current Project')

  // Select features to add
  const selectedFeatures = await multiselect({
    message: 'Which features would you like to add?',
    options: features.map((feature) => ({
      hint: feature.description,
      label: feature.name,
      value: feature.value,
    })),
    required: true,
  })

  if (isCancel(selectedFeatures) || selectedFeatures.length === 0) {
    cancel('No features selected.')
    process.exit(0)
  }

  let shouldInstall = false
  if (dryRun) {
    note(
      `Dry run is enabled. Planned changes will be shown, but no files or dependencies will be modified.`,
      'Dry Run'
    )
  } else if (installAllowed) {
    const installConfirmation = await confirm({
      initialValue: true,
      message: `Install dependencies with ${packageManager}?`,
    })

    if (isCancel(installConfirmation)) {
      cancel('Operation cancelled.')
      process.exit(0)
    }

    shouldInstall = installConfirmation
  }

  // Apply features
  const addSpinner = spinner()

  try {
    for (const featureId of selectedFeatures as FeatureId[]) {
      addSpinner.start(`Adding ${getFeatureName(featureId)}...`)

      if (dryRun) {
        addSpinner.stop(`↷ Would add ${getFeatureName(featureId)}`)
        continue
      }

      switch (featureId) {
        case 'ai-custom': {
          await addAI('custom', process.cwd())
          break
        }
        case 'ai-vercel': {
          await addAI('vercel', process.cwd())
          break
        }
        case 'supabase': {
          await addSupabase(process.cwd())
          break
        }
        case 'drizzle': {
          await addDrizzle(process.cwd())
          break
        }
        case 'neon': {
          await addNeon(process.cwd())
          break
        }
        case 'clerk': {
          await addClerk(process.cwd())
          break
        }
        case 'better-auth': {
          await addBetterAuth(process.cwd())
          break
        }
        case 'pwa': {
          await addPWA(process.cwd())
          break
        }
        case 'i18n': {
          await addI18n(process.cwd())
          break
        }
        case 'testing': {
          await addTesting(process.cwd())
          break
        }
      }

      addSpinner.stop(`✓ Added ${getFeatureName(featureId)}`)
    }

    if (shouldInstall) {
      addSpinner.start(`Installing dependencies with ${packageManager}...`)

      await new Promise<void>((resolve, reject) => {
        const child = spawn(packageManager, ['install'], {
          cwd: process.cwd(),
          stdio: 'ignore',
        })

        child.on('close', (code) => {
          if (code === 0) {
            resolve()
          } else {
            reject(new Error(`Installation failed with code ${code}`))
          }
        })
      })

      addSpinner.stop('✓ Dependencies installed')
    }

    if (dryRun) {
      const plannedSteps = [
        ...(selectedFeatures as FeatureId[]).map((feature) => `Add ${getFeatureName(feature)}`),
        installAllowed
          ? `Install dependencies with ${packageManager}`
          : 'Skip dependency installation',
      ]

      outro(style.success('✅ Dry run complete'))
      note(
        `${plannedSteps.map((step, index) => `  ${colors.muted(`${index + 1}.`)} ${step}`).join('\n')}`,
        'Planned Changes'
      )
      return
    }

    // Update AT3 configuration and get suggestions
    const projectInfo = analyzedProject || buildFallbackProjectInfo(projectType, packageManager)

    const addedFeatures = selectedFeatures as string[]

    updateAT3Config(process.cwd(), addedFeatures)
    const toolSuggestions = suggestAT3Tools(projectInfo, addedFeatures)
    const workflows = getPostMigrationWorkflow(projectInfo, addedFeatures)

    outro(style.success('🎉 Your project has been upgraded to AT3 Stack!'))

    const nextSteps = [
      'Review the added files and configurations',
      'Update your .env.local with required API keys',
      `Run ${style.command(packageManager + ' dev')} to test your upgraded project`,
      ...workflows,
    ]

    note(
      `
${header.section('Next steps:')}
${nextSteps.map((step, i) => `  ${colors.muted(`${i + 1}.`)} ${step}`).join('\n')}

${colors.primary('Documentation:')}
  ${colors.muted('•')} AT3 Stack Guide: https://at3-stack.dev/docs
  ${colors.muted('•')} Feature Guides: https://at3-stack.dev/docs/features

${
  toolSuggestions.length > 0
    ? `${colors.primary('AT3 Ecosystem:')}
  ${toolSuggestions.map((s) => `${colors.muted('•')} ${s}`).join('\n  ')}

`
    : ''
}${colors.primary('Need help?')}
  ${colors.muted('•')} GitHub Issues: https://github.com/entro314-labs/at3-stack-kit/issues
  ${colors.muted('•')} Discord: https://discord.gg/at3-stack
      `,
      'Welcome to AT3!'
    )
  } catch (error) {
    addSpinner.stop('Error occurred')
    console.error(chalk.red('Error upgrading project:'), error)
    process.exit(1)
  }
}

function getProjectTypeLabel(type: ProjectType): string {
  switch (type) {
    case 'nextjs': {
      return 'Next.js'
    }
    case 't3': {
      return 'T3 Stack'
    }
    case 'react': {
      return 'React'
    }
    case 'unknown': {
      return 'Unknown'
    }
    default: {
      return 'Unknown'
    }
  }
}

function buildFallbackProjectInfo(projectType: ProjectType, packageManager: string): ProjectInfo {
  const normalizedPackageManager: ProjectInfo['packageManager'] =
    packageManager === 'pnpm' || packageManager === 'yarn' || packageManager === 'bun'
      ? packageManager
      : 'npm'

  return {
    authProvider: 'none',
    configFiles: [],
    dependencies: [],
    hasAI: false,
    hasBiome: false,
    hasDrizzle: false,
    hasEdgeRuntime: false,
    hasEslint: false,
    hasI18n: false,
    hasNextjs: projectType === 'nextjs' || projectType === 't3' || projectType === 'ait3e',
    hasPWA: false,
    hasPlaywright: false,
    hasPrettier: false,
    hasPrisma: false,
    hasReact: projectType === 'react',
    hasSupabase: false,
    hasTailwind: false,
    hasTRPC: false,
    hasTypeScript: false,
    hasVectorDB: false,
    hasVitest: false,
    hasVue: false,
    packageManager: normalizedPackageManager,
    path: process.cwd(),
    testing: { e2e: 'none', unit: 'none' },
    type: projectType,
  }
}

function getProjectInfo(type: ProjectType): string {
  const packageJsonPath = join(process.cwd(), 'package.json')

  if (!existsSync(packageJsonPath)) {
    return 'No package.json found'
  }

  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
  const deps = Object.keys({ ...packageJson.dependencies, ...packageJson.devDependencies })

  let info = `Project: ${packageJson.name || 'unnamed'}\n`
  info += `Type: ${getProjectTypeLabel(type)}\n`

  // Show key dependencies
  const keyDeps = ['next', 'react', 'typescript', 'tailwindcss']
  const foundDeps = keyDeps.filter((dep) => deps.some((d) => d.includes(dep)))

  if (foundDeps.length > 0) {
    info += `Dependencies: ${foundDeps.join(', ')}`
  }

  return info
}

function getFeatureName(id: FeatureId): string {
  return features.find((f) => f.value === id)?.name || id
}

// CLI setup
program
  .name('at3-kit')
  .description('Upgrade existing projects to AT3 Stack')
  .version('0.1.0')
  .option('-d, --dry-run', 'Show what would be changed without making changes')
  .option('--no-install', 'Skip installing dependencies')
  .action(async (options: { dryRun?: boolean; install?: boolean }) => {
    await main(options)
  })

// Subcommands
program
  .command('add <feature>')
  .description('Add a specific feature to your project')
  .option('--no-install', 'Skip installing dependencies')
  .action(async (feature: string, options: { install?: boolean }) => {
    const validFeatures = features.map((f) => f.value)

    if (!validFeatures.includes(feature as FeatureId)) {
      console.error(chalk.red(`Unknown feature: ${feature}`))
      console.log(chalk.dim(`Valid features: ${validFeatures.join(', ')}`))
      process.exit(1)
    }

    // Add single feature without prompts
    console.log(chalk.blue(`Adding ${getFeatureName(feature as FeatureId)}...`))

    try {
      switch (feature) {
        case 'ai-custom': {
          await addAI('custom', process.cwd())
          break
        }
        case 'ai-vercel': {
          await addAI('vercel', process.cwd())
          break
        }
        case 'supabase': {
          await addSupabase(process.cwd())
          break
        }
        case 'drizzle': {
          await addDrizzle(process.cwd())
          break
        }
        case 'neon': {
          await addNeon(process.cwd())
          break
        }
        case 'clerk': {
          await addClerk(process.cwd())
          break
        }
        case 'better-auth': {
          await addBetterAuth(process.cwd())
          break
        }
        case 'pwa': {
          await addPWA(process.cwd())
          break
        }
        case 'i18n': {
          await addI18n(process.cwd())
          break
        }
        case 'testing': {
          await addTesting(process.cwd())
          break
        }
      }

      if (options.install !== false) {
        console.log(chalk.blue('Installing dependencies...'))
        const packageManager = await detectPackageManager().catch(() => 'npm')

        await new Promise<void>((resolve, reject) => {
          const child = spawn(packageManager, ['install'], {
            cwd: process.cwd(),
            stdio: 'inherit',
          })

          child.on('close', (code) => {
            if (code === 0) {
              resolve()
            } else {
              reject(new Error(`Installation failed with code ${code}`))
            }
          })
        })
      }

      console.log(chalk.green(`✓ Successfully added ${getFeatureName(feature as FeatureId)}`))
    } catch (error) {
      console.error(chalk.red('Failed to add feature:'), error)
      process.exit(1)
    }
  })

program
  .command('detect')
  .description('Detect current project type and show available upgrades')
  .action(async () => {
    const projectType = await detectProjectType(process.cwd())
    const packageManager = await detectPackageManager().catch(() => 'npm')

    console.log(chalk.green('Project Analysis:'))
    console.log(`  Type: ${getProjectTypeLabel(projectType)}`)
    console.log(`  Package Manager: ${packageManager}`)
    console.log('\n' + getProjectInfo(projectType))
  })

// Parse command line arguments (run as CLI)
program.parse()

export { program }
