import { hasLocale } from 'next-intl'
import { getRequestConfig } from 'next-intl/server'

// Can be imported from a shared config
export const locales = ['en', 'es'] as const
export const defaultLocale = 'en' as const

export type Locale = (typeof locales)[number]
export type PathnameLocaleMap = {
  [key in Locale]: string
}

export const localizedPathnames = {
  '/': '/',
  '/about': {
    en: '/about',
    es: '/acerca',
  },
  '/blog': {
    en: '/blog',
    es: '/blog',
  },
  '/contact': {
    en: '/contact',
    es: '/contacto',
  },
  '/dashboard': {
    en: '/dashboard',
    es: '/panel',
  },
  '/profile': {
    en: '/profile',
    es: '/perfil',
  },
  '/settings': {
    en: '/settings',
    es: '/configuracion',
  },
} as const satisfies Record<string, string | PathnameLocaleMap>

export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = await requestLocale
  const validLocale = hasLocale(locales, requestedLocale) ? requestedLocale : defaultLocale

  return {
    formats: {
      dateTime: {
        short: {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        },
        medium: {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        },
        long: {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
        },
      },
      number: {
        precise: {
          maximumFractionDigits: 5,
        },
        currency: {
          style: 'currency',
          currency: 'USD',
        },
      },
      list: {
        enumeration: {
          style: 'long',
          type: 'conjunction',
        },
      },
    },
    locale: validLocale,
    messages: (await import(`../../../messages/${validLocale}.json`)).default,
    now: new Date(),
    timeZone: 'UTC',
  }
})

// Helper function to get locale from pathname
export function getLocaleFromPathname(pathname: string): Locale {
  const segments = pathname.split('/')
  const potentialLocale = segments[1]

  if (locales.includes(potentialLocale as Locale)) {
    return potentialLocale as Locale
  }

  return defaultLocale
}

// Helper function to remove locale from pathname
export function removeLocaleFromPathname(pathname: string): string {
  const normalizedPathname = pathname.startsWith('/') ? pathname : `/${pathname}`
  const segments = normalizedPathname.split('/')
  const potentialLocale = segments[1]

  if (!locales.includes(potentialLocale as Locale)) {
    return normalizedPathname
  }

  const pathWithoutLocale = `/${segments.slice(2).join('/')}`.replace(/\/+/g, '/')
  return pathWithoutLocale === '/' ? '/' : pathWithoutLocale.replace(/\/$/, '') || '/'
}

// Helper function to add locale to pathname
export function addLocaleToPathname(pathname: string, locale: Locale): string {
  const normalizedPathname = pathname.startsWith('/') ? pathname : `/${pathname}`

  if (locale === defaultLocale) {
    return normalizedPathname
  }

  const cleanPathname = removeLocaleFromPathname(normalizedPathname)
  return `/${locale}${cleanPathname}`
}

export function getCanonicalPathname(pathname: string): string {
  const cleanPathname = removeLocaleFromPathname(pathname)

  for (const [canonicalPathname, localizedValue] of Object.entries(localizedPathnames)) {
    if (typeof localizedValue === 'string') {
      if (localizedValue === cleanPathname) {
        return canonicalPathname
      }
      continue
    }

    const localizedMatches = Object.values(localizedValue) as string[]
    if (localizedMatches.includes(cleanPathname)) {
      return canonicalPathname
    }
  }

  return cleanPathname
}

export function getLocalizedPathname(pathname: string, locale: Locale): string {
  const canonicalPathname = getCanonicalPathname(pathname)
  const localizedValue = localizedPathnames[canonicalPathname as keyof typeof localizedPathnames]

  if (!localizedValue) {
    return canonicalPathname
  }

  if (typeof localizedValue === 'string') {
    return localizedValue
  }

  return localizedValue[locale]
}
