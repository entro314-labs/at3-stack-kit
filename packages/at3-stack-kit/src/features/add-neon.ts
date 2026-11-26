/**
 * Add Neon serverless PostgreSQL integration to existing projects
 */

import { ensureDir, pathExists, readFile, writeFile } from 'fs-extra'
import { join } from 'path'
import { resolveSourceRoot } from './project-paths.js'

const JSON_SPACES = 2

export const addNeon = async (projectPath: string): Promise<void> => {
  const sourceRoot = resolveSourceRoot(projectPath)
  await ensureDir(sourceRoot)

  const neonPath = join(sourceRoot, 'lib', 'neon')
  await ensureDir(neonPath)

  await addNeonClient(neonPath)
  await updatePackageJson(projectPath)
  await addEnvExample(projectPath)

  console.log('✓ Added Neon serverless PostgreSQL support')
}

const addNeonClient = async (neonPath: string): Promise<void> => {
  const client = `import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing');
}

export const sql = neon(process.env.DATABASE_URL);
`

  await writeFile(join(neonPath, 'client.ts'), client)
}

const updatePackageJson = async (projectPath: string): Promise<void> => {
  const packageJsonPath = join(projectPath, 'package.json')

  if (!(await pathExists(packageJsonPath))) {
    return
  }

  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'))

  if (!packageJson.dependencies) {
    packageJson.dependencies = {}
  }

  packageJson.dependencies['@neondatabase/serverless'] = '^1.0.2'

  await writeFile(packageJsonPath, JSON.stringify(packageJson, undefined, JSON_SPACES))
}

const addEnvExample = async (projectPath: string): Promise<void> => {
  const envExamplePath = join(projectPath, '.env.example')

  let envContent = ''
  if (await pathExists(envExamplePath)) {
    envContent = await readFile(envExamplePath, 'utf8')
  }

  if (!envContent.includes('DATABASE_URL=')) {
    envContent += `
# Neon Database
DATABASE_URL=postgresql://user:password@ep-example.us-east-2.aws.neon.tech/neondb?sslmode=require
`
    await writeFile(envExamplePath, envContent)
  }
}
