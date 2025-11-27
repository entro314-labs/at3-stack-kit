/**
 * Add internationalization support to existing project
 */

import { ensureDir, pathExists, readFile, writeFile } from 'fs-extra'
import { join } from 'path'

/**
 * Add internationalization support to existing project with next-intl v4
 */
export async function addI18n(projectPath: string): Promise<void> {
  const srcPath = join(projectPath, 'src')
  await ensureDir(srcPath)

  // Create messages directory with sample translations
  const messagesPath = join(projectPath, 'messages')
  await ensureDir(messagesPath)
  await addDefaultMessages(messagesPath)

  // Create i18n configuration
  const i18nPath = join(srcPath, 'lib', 'i18n')
  await ensureDir(i18nPath)

  await addI18nConfig(i18nPath)
  await addI18nRequest(i18nPath)
  await addI18nNavigation(i18nPath)
  await addI18nMiddleware(srcPath)
  await addLocaleProvider(i18nPath)
  await addLanguageSwitcher(srcPath)
  await addLocaleLayout(srcPath)

  // Update package.json
  await updatePackageJson(projectPath)

  // Update next.config.ts
  await updateNextConfig(projectPath)

  console.log('✓ Added i18n support (next-intl v4)')
}

async function addDefaultMessages(messagesPath: string): Promise<void> {
  const enMessages = {
    Common: {
      loading: 'Loading...',
      error: 'An error occurred',
      retry: 'Try again',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      search: 'Search',
      noResults: 'No results found',
    },
    Navigation: {
      home: 'Home',
      about: 'About',
      contact: 'Contact',
      dashboard: 'Dashboard',
      settings: 'Settings',
      profile: 'Profile',
    },
    Auth: {
      signIn: 'Sign In',
      signOut: 'Sign Out',
      signUp: 'Sign Up',
      email: 'Email',
      password: 'Password',
      forgotPassword: 'Forgot password?',
      rememberMe: 'Remember me',
      noAccount: "Don't have an account?",
      hasAccount: 'Already have an account?',
    },
    Index: {
      title: 'Welcome to AT3 Stack',
      description: 'Build AI-native applications with edge deployment',
      getStarted: 'Get Started',
      learnMore: 'Learn More',
    },
    Errors: {
      notFound: 'Page not found',
      notFoundDescription: 'The page you are looking for does not exist.',
      serverError: 'Server error',
      serverErrorDescription: 'Something went wrong on our end.',
      goHome: 'Go to home',
    },
    LanguageSwitcher: {
      label: 'Language',
      en: 'English',
      es: 'Español',
      fr: 'Français',
      de: 'Deutsch',
      ja: '日本語',
      zh: '中文',
    },
  }

  const esMessages = {
    Common: {
      loading: 'Cargando...',
      error: 'Ocurrió un error',
      retry: 'Intentar de nuevo',
      cancel: 'Cancelar',
      save: 'Guardar',
      delete: 'Eliminar',
      edit: 'Editar',
      back: 'Atrás',
      next: 'Siguiente',
      previous: 'Anterior',
      search: 'Buscar',
      noResults: 'No se encontraron resultados',
    },
    Navigation: {
      home: 'Inicio',
      about: 'Acerca de',
      contact: 'Contacto',
      dashboard: 'Panel',
      settings: 'Configuración',
      profile: 'Perfil',
    },
    Auth: {
      signIn: 'Iniciar sesión',
      signOut: 'Cerrar sesión',
      signUp: 'Registrarse',
      email: 'Correo electrónico',
      password: 'Contraseña',
      forgotPassword: '¿Olvidaste tu contraseña?',
      rememberMe: 'Recordarme',
      noAccount: '¿No tienes una cuenta?',
      hasAccount: '¿Ya tienes una cuenta?',
    },
    Index: {
      title: 'Bienvenido a AT3 Stack',
      description: 'Construye aplicaciones nativas de IA con despliegue en el borde',
      getStarted: 'Comenzar',
      learnMore: 'Saber más',
    },
    Errors: {
      notFound: 'Página no encontrada',
      notFoundDescription: 'La página que buscas no existe.',
      serverError: 'Error del servidor',
      serverErrorDescription: 'Algo salió mal de nuestro lado.',
      goHome: 'Ir al inicio',
    },
    LanguageSwitcher: {
      label: 'Idioma',
      en: 'English',
      es: 'Español',
      fr: 'Français',
      de: 'Deutsch',
      ja: '日本語',
      zh: '中文',
    },
  }

  await writeFile(join(messagesPath, 'en.json'), JSON.stringify(enMessages, null, 2))
  await writeFile(join(messagesPath, 'es.json'), JSON.stringify(esMessages, null, 2))
}

async function addI18nConfig(i18nPath: string): Promise<void> {
  const config = `import { getRequestConfig } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { routing } from './navigation'

export default getRequestConfig(async ({ requestLocale }) => {
  // Typically corresponds to the \`[locale]\` segment
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale

  return {
    locale,
    messages: (await import(\`../../../messages/\${locale}.json\`)).default,
  }
})
`
  await writeFile(join(i18nPath, 'config.ts'), config)
}

async function addI18nRequest(i18nPath: string): Promise<void> {
  const request = `import { getRequestConfig } from 'next-intl/server'
import { routing } from './navigation'

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the \`[locale]\` segment
  let locale = await requestLocale

  // Ensure that the incoming \`locale\` is valid
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale
  }

  return {
    locale,
    messages: (await import(\`../../../messages/\${locale}.json\`)).default,
    timeZone: 'UTC',
    now: new Date(),
  }
})
`
  await writeFile(join(i18nPath, 'request.ts'), request)
}

async function addI18nNavigation(i18nPath: string): Promise<void> {
  const navigation = `import { createNavigation } from 'next-intl/navigation'
import { defineRouting } from 'next-intl/routing'

export const locales = ['en', 'es'] as const
export const defaultLocale = 'en' as const

export type Locale = (typeof locales)[number]

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
})

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
`
  await writeFile(join(i18nPath, 'navigation.ts'), navigation)
}

async function addI18nMiddleware(srcPath: string): Promise<void> {
  const middleware = `import createMiddleware from 'next-intl/middleware'
import { routing } from './lib/i18n/navigation'

export default createMiddleware(routing)

export const config = {
  // Match all pathnames except for
  // - ... if they start with \`/api\`, \`/_next\` or \`/_vercel\`
  // - ... the ones containing a dot (e.g. \`favicon.ico\`)
  matcher: ['/((?!api|_next|_vercel|.*\\\\..*).*)'],
}
`
  await writeFile(join(srcPath, 'middleware.ts'), middleware)
}

async function addLocaleProvider(i18nPath: string): Promise<void> {
  const provider = `'use client'

import { NextIntlClientProvider } from 'next-intl'
import type { ReactNode } from 'react'

interface LocaleProviderProps {
  children: ReactNode
  locale: string
  messages: Record<string, unknown>
  timeZone?: string
  now?: Date
}

export function LocaleProvider({
  children,
  locale,
  messages,
  timeZone = 'UTC',
  now,
}: LocaleProviderProps) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone={timeZone}
      now={now}
    >
      {children}
    </NextIntlClientProvider>
  )
}
`
  await writeFile(join(i18nPath, 'provider.tsx'), provider)

  // Add index export
  const index = `export { locales, defaultLocale, routing, type Locale } from './navigation'
export { Link, redirect, usePathname, useRouter, getPathname } from './navigation'
export { LocaleProvider } from './provider'
`
  await writeFile(join(i18nPath, 'index.ts'), index)
}

async function addLanguageSwitcher(srcPath: string): Promise<void> {
  const componentPath = join(srcPath, 'components', 'layout')
  await ensureDir(componentPath)

  const switcher = `'use client'

import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from '@/lib/i18n/navigation'
import { locales, type Locale } from '@/lib/i18n/navigation'

interface LanguageSwitcherProps {
  className?: string
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const t = useTranslations('LanguageSwitcher')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const handleChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale as Locale })
  }

  return (
    <div className={className}>
      <label htmlFor="language-select" className="sr-only">
        {t('label')}
      </label>
      <select
        id="language-select"
        value={locale}
        onChange={(e) => handleChange(e.target.value)}
        className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        {locales.map((loc) => (
          <option key={loc} value={loc}>
            {t(loc)}
          </option>
        ))}
      </select>
    </div>
  )
}

/**
 * Alternative: Language switcher with buttons
 */
export function LanguageSwitcherButtons({ className }: LanguageSwitcherProps) {
  const t = useTranslations('LanguageSwitcher')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div className={\`flex gap-2 \${className}\`}>
      {locales.map((loc) => (
        <button
          key={loc}
          onClick={() => router.replace(pathname, { locale: loc })}
          disabled={locale === loc}
          className={\`px-3 py-1 text-sm rounded-md transition-colors \${
            locale === loc
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }\`}
        >
          {t(loc)}
        </button>
      ))}
    </div>
  )
}
`
  await writeFile(join(componentPath, 'language-switcher.tsx'), switcher)
}

async function addLocaleLayout(srcPath: string): Promise<void> {
  const localePath = join(srcPath, 'app', '[locale]')
  await ensureDir(localePath)

  const layout = `import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import { routing } from '@/lib/i18n/navigation'

interface LocaleLayoutProps {
  children: ReactNode
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params

  // Ensure that the incoming \`locale\` is valid
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  // Enable static rendering
  setRequestLocale(locale)

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}
`
  await writeFile(join(localePath, 'layout.tsx'), layout)

  // Create sample page
  const page = `import { useTranslations } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'

interface HomePageProps {
  params: Promise<{ locale: string }>
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params

  // Enable static rendering
  setRequestLocale(locale)

  return <HomeContent />
}

function HomeContent() {
  const t = useTranslations('Index')

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
      <p className="text-lg text-muted-foreground mb-8">{t('description')}</p>
      <div className="flex gap-4">
        <Link
          href="/dashboard"
          className="rounded-md bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90"
        >
          {t('getStarted')}
        </Link>
        <Link
          href="/about"
          className="rounded-md border border-input bg-background px-6 py-3 hover:bg-accent hover:text-accent-foreground"
        >
          {t('learnMore')}
        </Link>
      </div>
    </main>
  )
}
`
  await writeFile(join(localePath, 'page.tsx'), page)

  // Create not-found page
  const notFound = `import { useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'

export default function NotFoundPage() {
  const t = useTranslations('Errors')

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">{t('notFound')}</h1>
      <p className="text-lg text-muted-foreground mb-8">
        {t('notFoundDescription')}
      </p>
      <Link
        href="/"
        className="rounded-md bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90"
      >
        {t('goHome')}
      </Link>
    </main>
  )
}
`
  await writeFile(join(localePath, 'not-found.tsx'), notFound)
}

async function updatePackageJson(projectPath: string): Promise<void> {
  const packageJsonPath = join(projectPath, 'package.json')
  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'))

  if (!packageJson.dependencies) packageJson.dependencies = {}

  packageJson.dependencies['next-intl'] = '^4.5.5'

  await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2))
}

async function updateNextConfig(projectPath: string): Promise<void> {
  const configPath = join(projectPath, 'next.config.ts')

  try {
    let configContent = await readFile(configPath, 'utf-8')

    // Check if already configured
    if (configContent.includes('withNextIntl') || configContent.includes('next-intl/plugin')) {
      return
    }

    // Add import at the top
    const importStatement = `import createNextIntlPlugin from 'next-intl/plugin'\n`
    const pluginInit = `const withNextIntl = createNextIntlPlugin('./src/lib/i18n/request.ts')\n\n`

    // Add import
    if (!configContent.includes('next-intl/plugin')) {
      configContent = importStatement + configContent
    }

    // Find export default and wrap it
    const exportDefaultRegex = /export\s+default\s+(\w+);?\s*$/m
    const match = configContent.match(exportDefaultRegex)

    if (match) {
      const configName = match[1]
      configContent = configContent.replace(
        exportDefaultRegex,
        `${pluginInit}export default withNextIntl(${configName})\n`
      )
    } else {
      // If no simple export found, try to handle inline exports
      const inlineExportRegex = /export\s+default\s+({[\s\S]*?})\s*;?\s*$/m
      const inlineMatch = configContent.match(inlineExportRegex)

      if (inlineMatch) {
        configContent = configContent.replace(
          inlineExportRegex,
          `const nextConfig = ${inlineMatch[1]}\n\n${pluginInit}export default withNextIntl(nextConfig)\n`
        )
      }
    }

    await writeFile(configPath, configContent)
  } catch (error) {
    console.warn(
      'Could not update next.config.ts automatically. Please wrap your config with withNextIntl manually.'
    )
  }
}
