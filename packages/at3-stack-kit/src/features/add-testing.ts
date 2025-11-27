/**
 * Add testing suite to existing project
 */

import { ensureDir, pathExists, readJson, writeFile, writeJson } from 'fs-extra'
import { join } from 'path'

/**
 * Add testing suite to existing project
 */
export async function addTesting(projectPath: string): Promise<void> {
  const packageJsonPath = join(projectPath, 'package.json')

  try {
    const pkg = await readJson(packageJsonPath)
    const devCommand = getDevCommand(pkg.packageManager as string | undefined)

    // Add scripts
    pkg.scripts = {
      ...pkg.scripts,
      test: 'vitest',
      'test:ui': 'vitest --ui',
      'test:run': 'vitest run',
      'test:coverage': 'vitest run --coverage',
      'test:e2e': 'playwright test',
      'test:e2e:ui': 'playwright test --ui',
      'test:e2e:report': 'playwright show-report',
    }

    // Add devDependencies
    pkg.devDependencies = {
      ...pkg.devDependencies,
      vitest: '^4.0.14',
      '@vitest/ui': '^4.0.14',
      '@vitest/coverage-v8': '^4.0.14',
      '@testing-library/react': '^16.3.0',
      '@testing-library/dom': '^10.4.1',
      '@testing-library/user-event': '^14.6.1',
      '@testing-library/jest-dom': '^6.9.1',
      jsdom: '^27.2.0',
      '@playwright/test': '^1.57.0',
      '@vitejs/plugin-react': '^5.1.1',
      '@faker-js/faker': '^10.1.0',
    }

    await writeJson(packageJsonPath, pkg, { spaces: 2 })

    // Create test directories
    const testDir = join(projectPath, 'src', 'test')
    const e2eDir = join(projectPath, 'tests', 'e2e')
    const unitDir = join(projectPath, 'tests', 'unit')

    await ensureDir(testDir)
    await ensureDir(e2eDir)
    await ensureDir(unitDir)
    await ensureDir(join(projectPath, 'src', 'app'))

    // Create test setup file
    await createTestSetup(testDir)

    // Create test utilities
    await createTestUtils(testDir)

    // Create vitest.config.ts
    await createVitestConfig(projectPath)

    // Create playwright.config.ts
    await createPlaywrightConfig(projectPath, devCommand)

    // Create sample tests
    await createSampleUnitTest(unitDir)
    await createSampleComponentTest(projectPath)
    await createSampleE2ETest(e2eDir)

    // Create mock utilities
    await createMockUtils(testDir)

    console.log('✓ Added testing configuration (Vitest + Playwright)')
  } catch (error) {
    console.error('Failed to add testing suite:', error)
    throw error
  }
}

async function createTestSetup(testDir: string): Promise<void> {
  const setupFile = `import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, vi } from 'vitest'

// Cleanup after each test case
afterEach(() => {
  cleanup()
})

// Mock window.matchMedia
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))
})

// Suppress console errors in tests (optional)
// vi.spyOn(console, 'error').mockImplementation(() => {})
`
  await writeFile(join(testDir, 'setup.ts'), setupFile)
}

async function createTestUtils(testDir: string): Promise<void> {
  const testUtils = `import type { RenderOptions } from '@testing-library/react'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement, ReactNode } from 'react'

// Add providers here as your app grows
interface WrapperProps {
  children: ReactNode
}

function AllProviders({ children }: WrapperProps) {
  return (
    <>
      {/* Add providers like ThemeProvider, QueryClientProvider, etc. */}
      {children}
    </>
  )
}

/**
 * Custom render function that includes providers
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: AllProviders, ...options }),
  }
}

// Re-export everything from testing-library
export * from '@testing-library/react'

// Override render with custom render
export { customRender as render }

/**
 * Helper to wait for async state updates
 */
export async function waitForStateUpdate(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

/**
 * Helper to create a mock function with specific return value
 */
export function createMockFn<T>(returnValue?: T) {
  const { vi } = await import('vitest')
  return vi.fn().mockReturnValue(returnValue)
}

/**
 * Helper to mock a module
 */
export async function mockModule(modulePath: string, mocks: Record<string, unknown>) {
  const { vi } = await import('vitest')
  vi.mock(modulePath, () => mocks)
}
`
  await writeFile(join(testDir, 'utils.tsx'), testUtils)
}

async function createVitestConfig(projectPath: string): Promise<void> {
  const vitestConfig = `import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: [
      'src/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'tests/unit/**/*.{test,spec}.{js,ts,jsx,tsx}',
    ],
    exclude: [
      'node_modules',
      'dist',
      '.next',
      '.git',
      'tests/e2e/**/*',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/types/**',
      ],
    },
    // Enable parallel test execution
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
      },
    },
    // Timeout for async operations
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
`
  await writeFile(join(projectPath, 'vitest.config.ts'), vitestConfig)
}

async function createPlaywrightConfig(projectPath: string, devCommand: string): Promise<void> {
  const playwrightConfig = `import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for E2E testing
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    ...(process.env.CI ? [['github'] as const] : []),
  ],

  // Shared settings for all projects
  use: {
    baseURL: 'http://localhost:3000',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'on-first-retry',
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile viewports
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: '${devCommand}',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})
`
  await writeFile(join(projectPath, 'playwright.config.ts'), playwrightConfig)
}

async function createSampleUnitTest(unitDir: string): Promise<void> {
  const sampleUnitTest = `import { describe, expect, it } from 'vitest'

/**
 * Sample utility function tests
 */
describe('Utility Functions', () => {
  describe('String utilities', () => {
    it('should capitalize first letter', () => {
      const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

      expect(capitalize('hello')).toBe('Hello')
      expect(capitalize('world')).toBe('World')
      expect(capitalize('')).toBe('')
    })

    it('should truncate long strings', () => {
      const truncate = (str: string, maxLength: number) =>
        str.length > maxLength ? str.slice(0, maxLength) + '...' : str

      expect(truncate('Hello World', 5)).toBe('Hello...')
      expect(truncate('Hi', 5)).toBe('Hi')
    })
  })

  describe('Number utilities', () => {
    it('should clamp number within range', () => {
      const clamp = (num: number, min: number, max: number) =>
        Math.min(Math.max(num, min), max)

      expect(clamp(5, 0, 10)).toBe(5)
      expect(clamp(-5, 0, 10)).toBe(0)
      expect(clamp(15, 0, 10)).toBe(10)
    })
  })

  describe('Array utilities', () => {
    it('should remove duplicates', () => {
      const unique = <T>(arr: T[]) => [...new Set(arr)]

      expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3])
      expect(unique(['a', 'b', 'a'])).toEqual(['a', 'b'])
    })

    it('should chunk array', () => {
      const chunk = <T>(arr: T[], size: number): T[][] => {
        const chunks: T[][] = []
        for (let i = 0; i < arr.length; i += size) {
          chunks.push(arr.slice(i, i + size))
        }
        return chunks
      }

      expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
      expect(chunk([1, 2, 3], 3)).toEqual([[1, 2, 3]])
    })
  })
})
`
  await writeFile(join(unitDir, 'utils.test.ts'), sampleUnitTest)
}

async function createSampleComponentTest(projectPath: string): Promise<void> {
  const componentTest = `import { render, screen } from '@/test/utils'
import { describe, expect, it, vi } from 'vitest'

/**
 * Sample React component tests
 */
describe('Component Tests', () => {
  describe('Button Component', () => {
    // Example button component for testing
    function Button({
      children,
      onClick,
      disabled = false
    }: {
      children: React.ReactNode
      onClick?: () => void
      disabled?: boolean
    }) {
      return (
        <button onClick={onClick} disabled={disabled} type="button">
          {children}
        </button>
      )
    }

    it('renders button with text', () => {
      render(<Button>Click me</Button>)

      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
    })

    it('calls onClick when clicked', async () => {
      const handleClick = vi.fn()
      const { user } = render(<Button onClick={handleClick}>Click me</Button>)

      await user.click(screen.getByRole('button'))

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('does not call onClick when disabled', async () => {
      const handleClick = vi.fn()
      const { user } = render(<Button onClick={handleClick} disabled>Click me</Button>)

      await user.click(screen.getByRole('button'))

      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('Form Component', () => {
    function LoginForm({ onSubmit }: { onSubmit: (data: { email: string; password: string }) => void }) {
      return (
        <form onSubmit={(e) => {
          e.preventDefault()
          const formData = new FormData(e.currentTarget)
          onSubmit({
            email: formData.get('email') as string,
            password: formData.get('password') as string,
          })
        }}>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required />

          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" required />

          <button type="submit">Login</button>
        </form>
      )
    }

    it('submits form with entered values', async () => {
      const handleSubmit = vi.fn()
      const { user } = render(<LoginForm onSubmit={handleSubmit} />)

      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /login/i }))

      expect(handleSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })
  })
})
`
  await writeFile(join(projectPath, 'tests', 'unit', 'components.test.tsx'), componentTest)
}

async function createSampleE2ETest(e2eDir: string): Promise<void> {
  const sampleE2ETest = `import { expect, test } from '@playwright/test'

test.describe('Home Page', () => {
  test('has title', async ({ page }) => {
    await page.goto('/')

    // Expect a title to contain a substring
    await expect(page).toHaveTitle(/AT3|Next|App/)
  })

  test('has main heading', async ({ page }) => {
    await page.goto('/')

    // Check for a main heading
    const heading = page.getByRole('heading', { level: 1 })
    await expect(heading).toBeVisible()
  })

  test('navigation works', async ({ page }) => {
    await page.goto('/')

    // Check page loads without errors
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Accessibility', () => {
  test('page has no accessibility violations', async ({ page }) => {
    await page.goto('/')

    // Check that images have alt text
    const images = page.locator('img')
    const count = await images.count()

    for (let i = 0; i < count; i++) {
      const img = images.nth(i)
      const alt = await img.getAttribute('alt')
      expect(alt).not.toBeNull()
    }
  })

  test('interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto('/')

    // Tab through interactive elements
    await page.keyboard.press('Tab')

    // Check that something is focused
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(focusedElement).toBeTruthy()
  })
})

test.describe('Performance', () => {
  test('page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/')
    const loadTime = Date.now() - startTime

    // Page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000)
  })
})
`
  await writeFile(join(e2eDir, 'home.spec.ts'), sampleE2ETest)

  // Create auth e2e test
  const authE2ETest = `import { expect, test } from '@playwright/test'

test.describe('Authentication', () => {
  test.describe('Login Flow', () => {
    test('shows login form', async ({ page }) => {
      await page.goto('/login')

      // Check for login form elements
      await expect(page.getByLabel(/email/i)).toBeVisible()
      await expect(page.getByLabel(/password/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /sign in|login/i })).toBeVisible()
    })

    test('shows validation errors for empty form', async ({ page }) => {
      await page.goto('/login')

      // Try to submit empty form
      await page.getByRole('button', { name: /sign in|login/i }).click()

      // Check for validation messages
      // Adjust based on your validation implementation
    })

    test('shows error for invalid credentials', async ({ page }) => {
      await page.goto('/login')

      await page.getByLabel(/email/i).fill('invalid@example.com')
      await page.getByLabel(/password/i).fill('wrongpassword')
      await page.getByRole('button', { name: /sign in|login/i }).click()

      // Check for error message
      // await expect(page.getByText(/invalid credentials/i)).toBeVisible()
    })
  })

  test.describe('Protected Routes', () => {
    test('redirects unauthenticated users', async ({ page }) => {
      await page.goto('/dashboard')

      // Should redirect to login
      await expect(page).toHaveURL(/login/)
    })
  })
})
`
  await writeFile(join(e2eDir, 'auth.spec.ts'), authE2ETest)
}

async function createMockUtils(testDir: string): Promise<void> {
  const mockUtils = `import { vi } from 'vitest'

/**
 * Mock utilities for common scenarios
 */

/**
 * Mock fetch for API calls
 */
export function mockFetch(response: unknown, options?: { ok?: boolean; status?: number }) {
  return vi.fn().mockResolvedValue({
    ok: options?.ok ?? true,
    status: options?.status ?? 200,
    json: () => Promise.resolve(response),
    text: () => Promise.resolve(JSON.stringify(response)),
  })
}

/**
 * Mock Next.js router
 */
export function mockNextRouter(overrides?: Partial<{
  pathname: string
  query: Record<string, string>
  push: ReturnType<typeof vi.fn>
  replace: ReturnType<typeof vi.fn>
  back: ReturnType<typeof vi.fn>
}>) {
  return {
    pathname: '/',
    query: {},
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
    ...overrides,
  }
}

/**
 * Mock user session
 */
export function mockSession(user?: Partial<{
  id: string
  email: string
  name: string
}>) {
  return {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      ...user,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }
}

/**
 * Mock Supabase client
 */
export function mockSupabaseClient() {
  const mockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  }

  return {
    from: vi.fn().mockReturnValue(mockQueryBuilder),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signIn: vi.fn().mockResolvedValue({ data: null, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: null, error: null }),
        download: vi.fn().mockResolvedValue({ data: null, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: '' } }),
      }),
    },
  }
}

/**
 * Create a deferred promise for testing async flows
 */
export function createDeferredPromise<T>() {
  let resolve: (value: T) => void
  let reject: (reason?: unknown) => void

  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })

  return {
    promise,
    resolve: resolve!,
    reject: reject!,
  }
}

/**
 * Wait for a specific amount of time
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Mock localStorage
 */
export function mockLocalStorage() {
  const store: Record<string, string> = {}

  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((key) => delete store[key])
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  }
}
`
  await writeFile(join(testDir, 'mocks.ts'), mockUtils)
}

function getDevCommand(packageManager?: string): string {
  if (!packageManager) return 'pnpm dev'
  if (packageManager.startsWith('npm')) return 'npm run dev'
  if (packageManager.startsWith('yarn')) return 'yarn dev'
  if (packageManager.startsWith('bun')) return 'bun run dev'
  return 'pnpm dev'
}
