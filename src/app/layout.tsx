import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'

import { InstallPrompt } from '@/components/pwa/install-prompt'
import { PWAProvider } from '@/components/providers/pwa-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { cn } from '@/lib/utils'

import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  authors: [
    {
      name: 'entro314-labs',
      url: 'https://yourwebsite.com',
    },
  ],
  creator: 'entro314-labs',
  description:
    'The AI-native evolution of the T3 stack, built for edge deployment and serverless infrastructure.',
  icons: {
    icon: '/icons/favicon.ico',
    shortcut: '/icons/favicon-96x96.png',
    apple: '/icons/apple-touch-icon.png',
  },
  keywords: [
    'Next.js',
    'React',
    'TypeScript',
    'Tailwind CSS',
    'Supabase',
    'Starter Template',
    '2025',
  ],
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://your-domain.com',
    siteName: 'AIT3E-Stack-Starter',
    title: 'AIT3E-Stack-Starter',
    description:
      'The AI-native evolution of the T3 stack, built for edge deployment and serverless infrastructure.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  title: {
    default: 'AIT3E-Stack-Starter',
    template: '%s | AIT3E-Stack-Starter',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AIT3E-Stack-Starter',
    description:
      'The AI-native evolution of the T3 stack, built for edge deployment and serverless infrastructure.',
    creator: '@yourtwitterhandle',
  },
}

export const viewport: Viewport = {
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
  width: 'device-width',
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()])

  return (
    <html lang={locale} suppressHydrationWarning>
      <head />
      <body
        className={cn('bg-background min-h-screen font-sans antialiased', inter.variable)}
        suppressHydrationWarning
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider>
            <PWAProvider>
              <div className="fixed top-4 right-4 z-50">
                <LanguageSwitcher />
              </div>
              {children}
              <div className="pointer-events-none fixed right-4 bottom-4 z-50 max-w-sm">
                <div className="pointer-events-auto">
                  <InstallPrompt />
                </div>
              </div>
            </PWAProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
