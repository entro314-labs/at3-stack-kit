'use client'

import { Globe } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  addLocaleToPathname,
  type Locale,
  locales,
  removeLocaleFromPathname,
} from '@/lib/i18n/config'
import { cn } from '@/lib/utils'

const languageNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
}

const languageFlags: Record<Locale, string> = {
  en: '🇺🇸',
  es: '🇪🇸',
}

interface LanguageSwitcherProps {
  className?: string
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const locale = useLocale() as Locale
  const pathname = usePathname()
  const router = useRouter()

  const switchLanguage = (newLocale: Locale) => {
    const currentPath = pathname || '/'
    const cleanPathname = removeLocaleFromPathname(currentPath)
    const newPathname = addLocaleToPathname(cleanPathname, newLocale)
    router.push(newPathname)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={cn('h-9 w-9', className)}>
          <Globe className="h-4 w-4" />
          <span className="sr-only">Switch language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((lng) => (
          <DropdownMenuItem
            key={lng}
            onClick={() => switchLanguage(lng)}
            className={cn('cursor-pointer', locale === lng && 'bg-accent')}
          >
            <span className="mr-2">{languageFlags[lng]}</span>
            {languageNames[lng]}
            {locale === lng && (
              <span className="ml-auto text-muted-foreground text-xs">Current</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
