import { existsSync, readFileSync } from 'fs-extra'
import { join } from 'path'

export function resolveSourceRoot(projectPath: string): string {
  return existsSync(join(projectPath, 'src')) ? join(projectPath, 'src') : projectPath
}

export function resolveAppRoot(projectPath: string): string {
  return join(resolveSourceRoot(projectPath), 'app')
}

export function usesSrcDirectory(projectPath: string): boolean {
  return resolveSourceRoot(projectPath) !== projectPath
}

export function resolvePackageJson(projectPath: string): Record<string, unknown> | null {
  const packageJsonPath = join(projectPath, 'package.json')

  if (!existsSync(packageJsonPath)) {
    return null
  }

  try {
    return JSON.parse(readFileSync(packageJsonPath, 'utf8')) as Record<string, unknown>
  } catch {
    return null
  }
}

export function isNextProject(projectPath: string): boolean {
  const packageJson = resolvePackageJson(projectPath)
  const dependencies =
    packageJson &&
    typeof packageJson === 'object' &&
    packageJson !== null &&
    'dependencies' in packageJson &&
    typeof packageJson.dependencies === 'object' &&
    packageJson.dependencies !== null
      ? packageJson.dependencies
      : {}
  const devDependencies =
    packageJson &&
    typeof packageJson === 'object' &&
    packageJson !== null &&
    'devDependencies' in packageJson &&
    typeof packageJson.devDependencies === 'object' &&
    packageJson.devDependencies !== null
      ? packageJson.devDependencies
      : {}

  return (
    'next' in dependencies ||
    'next' in devDependencies ||
    existsSync(join(projectPath, 'next.config.ts')) ||
    existsSync(join(projectPath, 'next.config.js')) ||
    existsSync(join(projectPath, 'next.config.mjs')) ||
    existsSync(resolveAppRoot(projectPath))
  )
}

export function assertNextProject(projectPath: string, featureName: string): void {
  if (!isNextProject(projectPath)) {
    throw new Error(`${featureName} currently supports Next.js projects with an App Router layout.`)
  }
}

