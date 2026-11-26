import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { Logger } from '../utils/logger.js'
import { MigrationRunner } from './runner.js'

const cleanupPaths: string[] = []

afterEach(async () => {
  await Promise.all(cleanupPaths.splice(0).map((dir) => rm(dir, { force: true, recursive: true })))
})

async function createRootAppProject() {
  const projectPath = await mkdtemp(join(tmpdir(), 'at3-toolkit-migration-'))
  cleanupPaths.push(projectPath)

  await mkdir(join(projectPath, 'app'), { recursive: true })
  await writeFile(
    join(projectPath, 'package.json'),
    JSON.stringify(
      {
        dependencies: {
          next: '16.1.6',
          react: '19.2.4',
          'react-dom': '19.2.4',
          tailwindcss: '4.1.18',
        },
        devDependencies: {
          typescript: '5.9.3',
        },
        packageManager: 'pnpm@10.29.3',
      },
      null,
      2
    )
  )
  await writeFile(join(projectPath, 'app', 'globals.css'), 'body { margin: 0; }\n')
  await writeFile(join(projectPath, 'next.config.ts'), 'const nextConfig = {}\n\nexport default nextConfig\n')
  await writeFile(join(projectPath, 'tsconfig.json'), JSON.stringify({ compilerOptions: {} }, null, 2))

  return projectPath
}

describe('MigrationRunner', () => {
  it('migrates root app globals.css and rolls back migration-created files', async () => {
    const projectPath = await createRootAppProject()
    const runner = new MigrationRunner(new Logger(false))

    const result = await runner.migrate({
      projectPath,
      skipDeps: true,
    })

    expect(result.success).toBe(true)

    const globals = await readFile(join(projectPath, 'app', 'globals.css'), 'utf8')
    expect(globals).toContain('@import "tailwindcss";')

    await expect(stat(join(projectPath, 'src', 'app', 'globals.css'))).rejects.toThrow()
    await expect(stat(join(projectPath, 'postcss.config.mjs'))).resolves.toBeDefined()

    await runner.rollback(projectPath)

    await expect(stat(join(projectPath, 'postcss.config.mjs'))).rejects.toThrow()
    await expect(stat(join(projectPath, 'src', 'app', 'globals.css'))).rejects.toThrow()
    await expect(readFile(join(projectPath, 'app', 'globals.css'), 'utf8')).resolves.toBe(
      'body { margin: 0; }\n'
    )
  })
})
