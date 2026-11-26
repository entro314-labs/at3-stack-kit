import { afterEach, describe, expect, it } from 'vitest'
import {
  createAT3Config,
  detectAT3Project,
  getWorkflowSuggestions,
  suggestAT3Tools,
} from './integration'
import { mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const ZERO = 0
const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(ZERO).map((dir) => rm(dir, { force: true, recursive: true })))
})

describe('integration utilities', () => {
  it('creates and detects AT3 config files', async () => {
    const projectDir = await mkdtemp(join(tmpdir(), 'at3-create-test-'))
    tempDirs.push(projectDir)

    const created = createAT3Config(projectDir, {
      features: ['nextjs', 'typescript'],
      template: 't3',
      toolsUsed: [],
    })

    const detected = detectAT3Project(projectDir)

    expect(created.toolsUsed).toContain('create-at3-app')
    expect(detected?.template).toBe('t3')
    expect(detected?.features).toContain('nextjs')
  })

  it('returns workflow and tool suggestions', () => {
    const workflows = getWorkflowSuggestions('t3')
    const tools = suggestAT3Tools('t3', ['nextjs'])

    expect(workflows.length).toBeGreaterThan(ZERO)
    expect(tools.length).toBeGreaterThan(ZERO)
  })
})
