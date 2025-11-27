/**
 * Add Drizzle ORM + PostgreSQL integration to existing project
 */

import { ensureDir, pathExists, readFile, writeFile } from 'fs-extra'
import { join } from 'path'

export async function addDrizzle(projectPath: string): Promise<void> {
  const srcPath = join(projectPath, 'src')
  await ensureDir(srcPath)

  // Create db directory
  const dbPath = join(srcPath, 'db')
  await ensureDir(dbPath)

  // Add Drizzle config
  await addDrizzleConfig(projectPath)

  // Add schema
  await addSchema(dbPath)

  // Add client
  await addClient(dbPath)

  // Update package.json
  await updatePackageJson(projectPath)

  // Add environment variables template
  await addEnvExample(projectPath)

  console.log('✓ Added Drizzle ORM + PostgreSQL support')
}

async function addDrizzleConfig(projectPath: string): Promise<void> {
  const config = `import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing');
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
`

  await writeFile(join(projectPath, 'drizzle.config.ts'), config)
}

async function addSchema(dbPath: string): Promise<void> {
  const schema = `import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
`

  await writeFile(join(dbPath, 'schema.ts'), schema)
}

async function addClient(dbPath: string): Promise<void> {
  const client = `import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
`

  await writeFile(join(dbPath, 'index.ts'), client)
}

async function updatePackageJson(projectPath: string): Promise<void> {
  const packageJsonPath = join(projectPath, 'package.json')

  if (!(await pathExists(packageJsonPath))) return

  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'))

  if (!packageJson.dependencies) packageJson.dependencies = {}
  if (!packageJson.devDependencies) packageJson.devDependencies = {}
  if (!packageJson.scripts) packageJson.scripts = {}

  // Add dependencies
  packageJson.dependencies['drizzle-orm'] = '^0.36.0'
  packageJson.dependencies['postgres'] = '^3.4.4'
  packageJson.dependencies['dotenv'] = '^16.4.5'

  // Add dev dependencies
  packageJson.devDependencies['drizzle-kit'] = '^0.28.0'
  packageJson.devDependencies['pg'] = '^8.13.0'
  packageJson.devDependencies['@types/pg'] = '^8.11.10'

  // Add scripts
  packageJson.scripts['db:generate'] = 'drizzle-kit generate'
  packageJson.scripts['db:migrate'] = 'drizzle-kit migrate'
  packageJson.scripts['db:push'] = 'drizzle-kit push'
  packageJson.scripts['db:studio'] = 'drizzle-kit studio'

  await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2))
}

async function addEnvExample(projectPath: string): Promise<void> {
  const envExamplePath = join(projectPath, '.env.example')

  let envContent = ''

  // Read existing .env.example if it exists
  if (await pathExists(envExamplePath)) {
    envContent = await readFile(envExamplePath, 'utf-8')
  }

  // Add Database variables if not present
  if (!envContent.includes('DATABASE_URL')) {
    const dbVars = `
# Database (PostgreSQL)
DATABASE_URL="postgresql://postgres:password@localhost:5432/postgres"
`

    envContent = envContent + dbVars
    await writeFile(envExamplePath, envContent)
  }
}
