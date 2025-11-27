
import { readFile, writeFile, pathExists } from 'fs-extra'
import { join } from 'path'
import { colors } from '../utils/cli-styling'

export async function addClerk(projectPath: string): Promise<void> {
  console.log(colors.info('Adding Clerk authentication...'))

  // 1. Install dependencies
  // This will be handled by the main CLI loop if we return dependencies,
  // but for now we assume the caller handles installation or we update package.json directly
  await updatePackageJson(projectPath)

  // 2. Add environment variables
  await addEnvExample(projectPath)

  // 3. Add Middleware
  await addMiddleware(projectPath)

  // 4. Wrap Layout (This is tricky with regex, might need manual instruction or smart AST)
  // For now, we'll log instructions for the layout part as it's high risk to break
  console.log(colors.warning('NOTE: You need to wrap your root layout with <ClerkProvider> manually.'))

  console.log(colors.success('✓ Added Clerk configuration'))
}

async function updatePackageJson(projectPath: string): Promise<void> {
  const packageJsonPath = join(projectPath, 'package.json')
  if (!(await pathExists(packageJsonPath))) return

  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'))

  if (!packageJson.dependencies) packageJson.dependencies = {}
  packageJson.dependencies['@clerk/nextjs'] = '^6.9.0'

  await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2))
}

async function addEnvExample(projectPath: string): Promise<void> {
  const envExamplePath = join(projectPath, '.env.example')
  let envContent = ''

  if (await pathExists(envExamplePath)) {
    envContent = await readFile(envExamplePath, 'utf-8')
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

async function addMiddleware(projectPath: string): Promise<void> {
  const middlewarePath = join(projectPath, 'src', 'middleware.ts')

  const content = `import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: ["/((?!.*\\\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
`
  await writeFile(middlewarePath, content)
}
