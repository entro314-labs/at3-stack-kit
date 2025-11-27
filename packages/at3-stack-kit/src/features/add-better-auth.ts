
import { readFile, writeFile, pathExists, ensureDir } from 'fs-extra'
import { join } from 'path'
import { colors } from '../utils/cli-styling'

export async function addBetterAuth(projectPath: string): Promise<void> {
  console.log(colors.info('Adding Better Auth...'))

  // 1. Update package.json
  await updatePackageJson(projectPath)

  // 2. Add env vars
  await addEnvExample(projectPath)

  // 3. Create auth client/server files
  await createAuthFiles(projectPath)

  console.log(colors.success('✓ Added Better Auth configuration'))
}

async function updatePackageJson(projectPath: string): Promise<void> {
  const packageJsonPath = join(projectPath, 'package.json')
  if (!(await pathExists(packageJsonPath))) return

  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'))

  if (!packageJson.dependencies) packageJson.dependencies = {}
  packageJson.dependencies['better-auth'] = '^1.1.0' // Check version

  await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2))
}

async function addEnvExample(projectPath: string): Promise<void> {
  const envExamplePath = join(projectPath, '.env.example')
  let envContent = ''

  if (await pathExists(envExamplePath)) {
    envContent = await readFile(envExamplePath, 'utf-8')
  }

  if (!envContent.includes('BETTER_AUTH_SECRET')) {
    envContent += `
# Better Auth
BETTER_AUTH_SECRET=your_secret_here
BETTER_AUTH_URL=http://localhost:3000
`
    await writeFile(envExamplePath, envContent)
  }
}

async function createAuthFiles(projectPath: string): Promise<void> {
  const libPath = join(projectPath, 'src', 'lib', 'auth')
  await ensureDir(libPath)

  // client.ts
  await writeFile(join(libPath, 'client.ts'), `import { createAuthClient } from "better-auth/react"
export const authClient = createAuthClient({
    baseURL: process.env.BETTER_AUTH_URL
})
`)

  // server.ts (Basic stub, assumes Drizzle or similar will be connected manually for now)
  await writeFile(join(libPath, 'auth.ts'), `import { betterAuth } from "better-auth";
// import { db } from "@/db";
// import { drizzleAdapter } from "better-auth/adapters/drizzle";

export const auth = betterAuth({
    // adapter: drizzleAdapter(db, {
    //     provider: "pg",
    // }),
    emailAndPassword: {
        enabled: true
    },
    // socialProviders: {
    //    github: {
    //        clientId: process.env.GITHUB_CLIENT_ID,
    //        clientSecret: process.env.GITHUB_CLIENT_SECRET,
    //    }
    // },
})
`)

  // API Route
  const apiPath = join(projectPath, 'src', 'app', 'api', 'auth', '[...all]')
  await ensureDir(apiPath)

  await writeFile(join(apiPath, 'route.ts'), `import { auth } from "@/lib/auth/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
`)
}
