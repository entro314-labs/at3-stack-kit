#!/usr/bin/env node

import * as clack from '@clack/prompts'
import { Command } from 'commander'
import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { ProjectDetector } from './detection/detector.js'
import { MigrationRunner } from './migration/runner.js'
import type { MigrationOptions } from './types/migration.js'
import { banner, box, colors, layout, style, symbols, table } from './utils/cli-styling.js'
import { Logger } from './utils/logger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Read package.json for version
const packagePath = resolve(__dirname, '..', 'package.json')
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'))

const program = new Command()
const logger = new Logger()

type InitTemplate =
  | 't3'
  | 't3-edge'
  | 't3-ai-vercel'
  | 'suggested'
  | '83-flavor'
type InitDatabase = 'supabase' | 'neon' | 'drizzle' | 'none'
type InitAuth = 'supabase' | 'clerk' | 'none'
type InitLint = 'biome' | 'oxc'

interface InitDefaults {
  database: InitDatabase
  auth: InitAuth
  lint: InitLint
  ai: boolean
}

const INIT_TEMPLATE_DEFAULTS: Record<InitTemplate, InitDefaults> = {
  '83-flavor': {
    database: 'neon',
    auth: 'clerk',
    lint: 'oxc',
    ai: true,
  },
  suggested: {
    database: 'supabase',
    auth: 'supabase',
    lint: 'oxc',
    ai: true,
  },
  t3: {
    database: 'none',
    auth: 'none',
    lint: 'oxc',
    ai: false,
  },
  't3-ai-vercel': {
    database: 'none',
    auth: 'none',
    lint: 'oxc',
    ai: true,
  },
  't3-edge': {
    database: 'supabase',
    auth: 'supabase',
    lint: 'oxc',
    ai: false,
  },
}

function resolveInitTemplate(value: string | undefined): InitTemplate {
  if (!value) {
    return '83-flavor'
  }
  if (value === 't3-ai-custom' || value === 't3-ai-both') {
    return 't3-ai-vercel'
  }
  if (value in INIT_TEMPLATE_DEFAULTS) {
    return value as InitTemplate
  }
  return '83-flavor'
}

function normalizeInitDatabase(value: string | undefined): InitDatabase | undefined {
  if (!value) {
    return undefined
  }
  return value === 'supabase' || value === 'neon' || value === 'drizzle' || value === 'none'
    ? value
    : undefined
}

function normalizeInitAuth(value: string | undefined): InitAuth | undefined {
  if (!value) {
    return undefined
  }
  return value === 'supabase' || value === 'clerk' || value === 'none' ? value : undefined
}

function normalizeInitLint(value: string | undefined): InitLint | undefined {
  if (!value) {
    return undefined
  }
  return value === 'biome' || value === 'oxc' ? value : undefined
}

// Configure CLI
program
  .name('at3t')
  .description(
    `${symbols.star} AT3T (AT3 Toolset) - Smart migration tool for AIT3E stack and modern web development`
  )
  .version(packageJson.version)
  .helpOption('-h, --help', 'Display help for command')
  .addHelpText(
    'before',
    banner.simple('AT3T (AT3 Toolset)', 'Smart migration tool for AIT3E stack projects')
  )

// Main migrate command
program
  .argument('[project-path]', 'Path to the project to migrate', process.cwd())
  .option('-i, --interactive', 'Show migration plan and ask for confirmation')
  .option('-o, --overwrite', 'Overwrite existing config files without merging')
  .option('--no-deps', 'Skip dependency installation')
  .option('-u, --update-versions', 'Update dependency versions to AIT3E versions')
  .option('-r, --replace-linting', 'Replace ESLint/Prettier with Biome')
  .option('-d, --dry-run', 'Show what would be done without making changes')
  .option('-f, --force', 'Skip safety confirmations')
  .option('-v, --verbose', 'Enable verbose logging')
  .option('--config <path>', 'Path to custom migration configuration')
  .option('--backup-dir <dir>', 'Custom backup directory name')
  .action(async (projectPath: string, options: any) => {
    try {
      // Setup logger
      logger.setVerbose(options.verbose)

      // Start Clack intro with styled header
      clack.intro(style.title('AT3T (AT3 Toolset) - August 2025'))

      // Validate project path
      const resolvedPath = resolve(projectPath)

      // Detect project
      const s = clack.spinner()
      s.start('Analyzing project structure...')

      const detector = new ProjectDetector(logger)
      const projectInfo = await detector.detectProject(resolvedPath)

      s.stop(`${style.success(`Detected: ${projectInfo.type} project`)}`)

      // Show project info if not forced
      if (!options.force && !options.dryRun) {
        await showProjectInfoClack(projectInfo)
      }

      // Build migration options
      const migrationOptions: MigrationOptions = {
        backupDir: options.backupDir,
        configPath: options.config,
        dryRun: options.dryRun,
        force: options.force,
        interactive: options.interactive,
        overwrite: options.overwrite,
        projectPath: resolvedPath,
        replaceLinting: options.replaceLinting,
        skipDeps: options.noDeps,
        updateVersions: options.updateVersions,
        verbose: options.verbose,
      }

      // Interactive mode
      if (options.interactive) {
        const responses = await clack.group(
          {
            confirm: () =>
              clack.confirm({
                message: `Migrate ${projectInfo.type} project to AIT3E stack?`,
                initialValue: true,
              }),
            replaceLinting: () =>
              clack.confirm({
                message: 'Replace ESLint/Prettier with Biome?',
                initialValue: migrationOptions.replaceLinting || false,
              }),
            skipDeps: () =>
              clack.confirm({
                message: 'Skip dependency installation?',
                initialValue: migrationOptions.skipDeps || false,
              }),
            updateVersions: () =>
              clack.confirm({
                message: 'Update dependencies to latest AIT3E versions?',
                initialValue: migrationOptions.updateVersions || false,
              }),
          },
          {
            onCancel: () => {
              clack.cancel('Migration cancelled.')
              process.exit(0)
            },
          }
        )

        if (!responses.confirm) {
          clack.cancel('Migration cancelled by user.')
          process.exit(0)
        }

        // Update options from interactive responses
        migrationOptions.updateVersions = responses.updateVersions
        migrationOptions.replaceLinting = responses.replaceLinting
        migrationOptions.skipDeps = responses.skipDeps
      } else if (!options.force && !options.dryRun) {
        // Simple confirmation for non-interactive mode
        const shouldContinue = await clack.confirm({
          initialValue: false,
          message: 'This will modify your project files. Continue?',
        })

        if (clack.isCancel(shouldContinue) || !shouldContinue) {
          clack.cancel('Migration cancelled.')
          process.exit(0)
        }
      }

      // Run migration
      const runner = new MigrationRunner(logger)
      await runner.migrate(migrationOptions)

      // Success message with styled box
      console.log(
        box.success(
          'Your project has been successfully migrated to the AIT3E stack!\n\n' +
            `${symbols.arrow} Next steps:\n` +
            '  1. Review the migration log in your project directory\n' +
            '  2. Test your application to ensure everything works\n' +
            '  3. Install any new dependencies with your package manager\n' +
            '  4. Commit your changes when ready\n\n' +
            `${symbols.info} Backup files are stored in .migration-backup/`,
          'Migration Complete'
        )
      )

      clack.outro(style.success('Migration to AIT3E stack completed!'))
    } catch (error) {
      clack.log.error('Migration failed')
      if (options.verbose && error instanceof Error) {
        clack.log.error(error.stack || error.message)
      }
      process.exit(1)
    }
  })

// Additional commands
program
  .command('detect')
  .argument('[project-path]', 'Path to analyze', process.cwd())
  .description('Analyze project structure and detect AIT3E/AT3 compatibility')
  .option('-v, --verbose', 'Show detailed analysis')
  .action(async (projectPath: string, options: any) => {
    try {
      clack.intro(style.title('Project Analysis & AIT3E Compatibility Check'))

      const detector = new ProjectDetector(new Logger(options.verbose))
      const s = clack.spinner()
      s.start('Analyzing project structure and dependencies...')

      const info = await detector.detectProject(resolve(projectPath))
      s.stop(style.success('Analysis complete'))

      // Display comprehensive project information
      await showProjectInfoClack(info)

      // Configuration files summary
      if (info.configFiles.length > 0) {
        const configTable = table.create(['Configuration File', 'Type'])

        info.configFiles.slice(0, 10).forEach((file) => {
          let type = 'Configuration'
          if (file.includes('next.config')) {
            type = 'Next.js'
          } else if (file.includes('tailwind')) {
            type = 'Tailwind CSS'
          } else if (file.includes('tsconfig')) {
            type = 'TypeScript'
          } else if (file.includes('biome') || file.includes('eslint')) {
            type = 'Linting'
          } else if (file.includes('test') || file.includes('jest') || file.includes('vitest')) {
            type = 'Testing'
          }

          configTable.push([style.path(file), style.muted(type)])
        })

        clack.log.message('')
        clack.log.info(style.header('Configuration Files'))
        clack.log.info(configTable.toString())

        if (info.configFiles.length > 10) {
          clack.log.info(
            style.muted(`... and ${info.configFiles.length - 10} more configuration files`)
          )
        }
      }

      // Final recommendation
      const isAIT3E = info.type === 'ait3e'
      const ait3eScore = [
        info.hasAISupport,
        info.hasSupabase,
        info.hasEdgeRuntime,
        info.hasVectorDB,
      ].filter(Boolean).length

      if (isAIT3E) {
        console.log(
          box.success(
            `${symbols.heart} This project is already using the AIT3E stack!\n\n` +
              'You have all the components for AI-native development:\n' +
              `${symbols.checkboxOn} Modern T3 foundation (Next.js + TypeScript + Tailwind)\n` +
              `${symbols.checkboxOn} AI integration capabilities\n` +
              `${symbols.checkboxOn} Edge-optimized infrastructure\n\n` +
              'Keep building amazing AI-powered applications!',
            'AIT3E Stack Detected'
          )
        )
      } else if (ait3eScore >= 2) {
        console.log(
          box.info(
            `${symbols.star} You're ${ait3eScore}/4 of the way to AIT3E!\n\n` +
              'Run the following command to complete your migration:\n' +
              `${colors.primary('npx at3t --interactive --update-versions')}\n\n` +
              'This will add the missing AIT3E components and optimize your stack.',
            'Migration Recommended'
          )
        )
      } else {
        console.log(
          box.note(
            `${symbols.info} Transform your project into an AI-native powerhouse!\n\n` +
              'The AIT3E stack will add:\n' +
              `${symbols.bullet} AI SDK integration (OpenAI, Anthropic, Google AI)\n` +
              `${symbols.bullet} Supabase backend with vector database\n` +
              `${symbols.bullet} Edge-optimized deployment\n` +
              `${symbols.bullet} Modern tooling and best practices\n\n` +
              `Get started: ${colors.primary('npx at3t --interactive')}`,
            'Ready for AIT3E Migration'
          )
        )
      }

      clack.outro(style.success('Analysis complete'))
    } catch (error) {
      console.log(
        box.error(
          `Failed to analyze project: ${error instanceof Error ? error.message : String(error)}\n\n` +
            'Please check that the path exists and contains a valid Node.js project.',
          'Detection Error'
        )
      )
      process.exit(1)
    }
  })

program
  .command('rollback')
  .argument('[project-path]', 'Path to rollback', process.cwd())
  .description('Rollback the last migration')
  .option('-f, --force', 'Skip confirmation')
  .action(async (projectPath: string, options: any) => {
    try {
      clack.intro('🔄 Rollback Migration')

      if (!options.force) {
        const shouldRollback = await clack.confirm({
          initialValue: false,
          message: 'This will restore files from the last backup. Continue?',
        })

        if (clack.isCancel(shouldRollback) || !shouldRollback) {
          clack.cancel('Rollback cancelled.')
          process.exit(0)
        }
      }

      const s = clack.spinner()
      s.start('Rolling back changes...')

      const runner = new MigrationRunner(new Logger())
      await runner.rollback(resolve(projectPath), options.force)

      s.stop('Rollback completed')
      clack.outro('✅ Successfully rolled back to previous state')
    } catch (error) {
      clack.log.error('Rollback failed')
      if (error instanceof Error) {
        clack.log.error(error.message)
      }
      process.exit(1)
    }
  })

program
  .command('init')
  .argument('[project-name]', 'Name of the new project')
  .description('Initialize a new project with AIT3E stack configuration')
  .option(
    '--template <type>',
    'Project template (t3, t3-edge, t3-ai-custom, t3-ai-vercel, t3-ai-both, suggested, 83-flavor)',
    '83-flavor'
  )
  .option('--database <type>', 'Database (supabase, neon, drizzle, none)')
  .option('--auth <type>', 'Authentication (supabase, clerk, none)')
  .option('--lint <tool>', 'Linting/formatting tool (biome, oxc)')
  .option('--ai', 'Include AI capabilities')
  .action(async (projectName: string, options: any) => {
    try {
      clack.intro('🚀 Initialize AIT3E Project')

      const initialTemplate = resolveInitTemplate(options.template)
      const initialDefaults = INIT_TEMPLATE_DEFAULTS[initialTemplate]

      const name = await clack.text({
        initialValue: projectName || 'my-ait3e-app',
        message: 'Project name?',
        validate: (value) => {
          if (!value) return 'Project name is required'
          if (!/^[a-z0-9-]+$/.test(value)) return 'Use lowercase letters, numbers, and hyphens only'
          return undefined
        },
      })
      if (clack.isCancel(name)) {
        clack.cancel('Project initialization cancelled.')
        process.exit(0)
      }

      const templateSelection = await clack.select({
        initialValue: initialTemplate,
        message: 'Choose a template:',
        options: [
          {
            value: '83-flavor',
            label: '83 Flavor',
            hint: 'Default: Neon + Clerk + OXC',
          },
          { value: 't3', label: 'T3 Base', hint: 'Classic T3 stack' },
          { value: 't3-edge', label: 'T3 + Edge', hint: 'Supabase + Edge' },
          {
            value: 't3-ai-custom',
            label: 'T3 + AI (Custom)',
            hint: 'Custom AI providers',
          },
          {
            value: 't3-ai-vercel',
            label: 'T3 + AI (Vercel SDK)',
            hint: 'Recommended for Vercel AI SDK workflows',
          },
          {
            value: 't3-ai-both',
            label: 'T3 + AI (Both)',
            hint: 'Custom providers + Vercel AI SDK',
          },
          {
            value: 'suggested',
            label: 'AT3 Suggested',
            hint: 'Full stack with broad defaults',
          },
        ],
      })
      if (clack.isCancel(templateSelection)) {
        clack.cancel('Project initialization cancelled.')
        process.exit(0)
      }

      const template = templateSelection as InitTemplate
      const defaults = INIT_TEMPLATE_DEFAULTS[template]

      const database = await clack.select({
        initialValue: normalizeInitDatabase(options.database) ?? defaults.database,
        message: 'Choose a database:',
        options: [
          { value: 'supabase', label: 'Supabase (Managed)', hint: 'Postgres + Auth + Realtime' },
          {
            value: 'neon',
            label: 'Neon (Serverless Postgres)',
            hint: 'Edge-friendly serverless Postgres',
          },
          { value: 'drizzle', label: 'Drizzle ORM (Unmanaged)', hint: 'Generic Postgres' },
          { value: 'none', label: 'None' },
        ],
      })
      if (clack.isCancel(database)) {
        clack.cancel('Project initialization cancelled.')
        process.exit(0)
      }

      const auth = await clack.select({
        message: 'Choose authentication:',
        initialValue: normalizeInitAuth(options.auth) ?? defaults.auth,
        options: [
          { value: 'supabase', label: 'Supabase Auth', hint: 'Requires Supabase DB' },
          { value: 'clerk', label: 'Clerk', hint: 'Hosted Auth' },
          { value: 'none', label: 'None' },
        ],
      })
      if (clack.isCancel(auth)) {
        clack.cancel('Project initialization cancelled.')
        process.exit(0)
      }

      const linting = await clack.select({
        initialValue: normalizeInitLint(options.lint) ?? defaults.lint,
        message: 'Choose linting + formatting:',
        options: [
          { value: 'biome', label: 'Biome', hint: 'Unified linting + formatting' },
          { value: 'oxc', label: 'OXC (oxlint/oxfmt)', hint: 'Fast Rust-based toolchain' },
        ],
      })
      if (clack.isCancel(linting)) {
        clack.cancel('Project initialization cancelled.')
        process.exit(0)
      }

      const ai = await clack.confirm({
        initialValue: options.ai ?? defaults.ai,
        message: 'Include AI capabilities?',
      })
      if (clack.isCancel(ai)) {
        clack.cancel('Project initialization cancelled.')
        process.exit(0)
      }

      let selectedDatabase = database as InitDatabase
      const selectedAuth = auth as InitAuth

      if (selectedAuth === 'supabase' && selectedDatabase !== 'supabase') {
        selectedDatabase = 'supabase'
        clack.log.warn('Supabase Auth requires Supabase DB. Database adjusted to Supabase.')
      }

      const s = clack.spinner()
      s.start(`Creating ${template} project: ${name}...`)

      // Use the scoped scaffold package so the wrapper stays aligned with the published generator.
      const { spawn } = await import('child_process')

      await new Promise<void>((resolve, reject) => {
        const args = [
          '@entro314labs/create-at3-app@latest',
          name as string,
          '--template',
          template,
          '--pm',
          'pnpm', // Default to pnpm for now
          '--database',
          selectedDatabase,
          '--auth',
          selectedAuth,
          '--lint',
          linting as InitLint,
        ]

        if (ai) {
          args.push('--ai')
        }

        const child = spawn('npx', args, {
          shell: true,
          stdio: 'inherit',
        })

        child.on('close', (code) => {
          if (code === 0) {
            resolve()
          } else {
            reject(new Error(`Project creation failed with code ${code}`))
          }
        })
      })

      s.stop(`Project ${name} created successfully`)

      clack.note(
        `Next steps:\n\n  cd ${name}\n  pnpm install\n  pnpm dev\n\n  Visit http://localhost:3000 to see your app!`,
        'Get started'
      )

      clack.outro('🎉 Your AIT3E project is ready to go!')
    } catch (error) {
      clack.log.error('Project initialization failed')
      if (error instanceof Error) {
        clack.log.error(error.message)
      }
      process.exit(1)
    }
  })

async function showProjectInfoClack(projectInfo: any) {
  // Project basic info
  const projectData = [
    { key: 'Path:', value: style.path(projectInfo.path) },
    { key: 'Type:', value: style.key(projectInfo.type) },
    { key: 'Package Manager:', value: style.value(projectInfo.packageManager) },
  ]

  clack.log.message(style.header('Project Analysis'))
  clack.log.info('')
  clack.log.info(layout.columns(projectData, 18))

  // Dependencies table
  if (projectInfo.dependencies.length > 0) {
    const depsTable = table.dependencies()

    projectInfo.dependencies.slice(0, 5).forEach((dep: any) => {
      const status =
        dep.latest && dep.version !== dep.latest
          ? style.warning('outdated')
          : style.success('current')

      depsTable.push([
        style.key(dep.name),
        style.version(dep.version),
        style.version(dep.latest || dep.version),
        status,
      ])
    })

    clack.log.message('')
    clack.log.info(depsTable.toString())

    if (projectInfo.dependencies.length > 5) {
      clack.log.info(
        style.muted(`... and ${projectInfo.dependencies.length - 5} more dependencies`)
      )
    }
  }

  // AIT3E features table
  const featuresTable = table.features()
  const features = [
    {
      desc: 'OpenAI, Anthropic, Google AI',
      key: 'AI Integration',
      status: projectInfo.hasAISupport,
    },
    { desc: 'Database, Auth, Real-time', key: 'Supabase Backend', status: projectInfo.hasSupabase },
    { desc: 'Serverless deployment', key: 'Edge Runtime', status: projectInfo.hasEdgeRuntime },
    { desc: 'Embeddings and search', key: 'Vector Database', status: projectInfo.hasVectorDB },
  ]

  features.forEach(({ key, status, desc }) => {
    const statusText = status ? style.success('Detected') : style.muted('Missing')

    featuresTable.push([status ? style.ai(key) : style.muted(key), statusText, style.muted(desc)])
  })

  clack.log.message('')
  clack.log.info(style.header('AIT3E Stack Compatibility'))
  clack.log.info(featuresTable.toString())

  // Summary message
  const hasAnyAIT3EFeatures =
    projectInfo.hasAISupport ||
    projectInfo.hasSupabase ||
    projectInfo.hasEdgeRuntime ||
    projectInfo.hasVectorDB

  if (hasAnyAIT3EFeatures) {
    clack.log.message('')
    clack.log.info(
      style.ai('Some AIT3E features detected! This migration will complete your stack.')
    )
  } else {
    clack.log.message('')
    clack.log.info(
      style.info('No AIT3E features detected - this migration will transform your project!')
    )
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  clack.log.error('Uncaught exception:')
  clack.log.error(error.message)
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  clack.log.error('Unhandled rejection:')
  clack.log.error(String(reason))
  process.exit(1)
})

// Parse CLI arguments
program.parse()
