import createMiddleware from 'next-intl/middleware'
import { defaultLocale, locales, localizedPathnames } from './config'

export default createMiddleware({
  // A list of all locales that are supported
  locales,

  // Used when no locale matches
  defaultLocale,

  // Always use locale prefix for all locales
  localePrefix: 'as-needed',

  // Redirect to default locale if no locale prefix is present
  localeDetection: true,

  // Pathnames configuration
  pathnames: localizedPathnames,
})
