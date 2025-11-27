import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'

import { cn } from '@/lib/utils'

import './globals.css'

// Vercel Analytics and Speed Insights components (optional)
// Install with: pnpm add @vercel/analytics @vercel/speed-insights
function VercelAnalytics() {
  try {
    // Dynamic import to avoid build errors when packages aren't installed
    const { Analytics } = require('@vercel/analytics/react')
    return <Analytics />
  } catch {
    return null
  }
}

function VercelSpeedInsights() {
  try {
    const { SpeedInsights } = require('@vercel/speed-insights/next')
    return <SpeedInsights />
  } catch {
    return null
  }
}

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: 'AIT3E-Stack-Starter',
    template: '%s | AIT3E-Stack-Starter',
  },
  description:
    'The AI-native evolution of the T3 stack, built for edge deployment and serverless infrastructure.',
  keywords: [
    'Next.js',
    'React',
    'TypeScript',
    'Tailwind CSS',
    'Supabase',
    'Starter Template',
    '2025',
  ],
  authors: [
    {
      name: 'entro314-labs',
      url: 'https://yourwebsite.com',
    },
  ],
  creator: 'entro314-labs',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://your-domain.com',
    siteName: 'AIT3E-Stack-Starter',
    title: 'AIT3E-Stack-Starter',
    description:
      'The AI-native evolution of the T3 stack, built for edge deployment and serverless infrastructure.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AIT3E-Stack-Starter',
    description:
      'The AI-native evolution of the T3 stack, built for edge deployment and serverless infrastructure.',
    creator: '@yourtwitterhandle',
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
  icons: {
    icon: '/icons/favicon.ico',
    shortcut: '/icons/favicon-96x96.png',
    apple: '/icons/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={cn('min-h-screen bg-background font-sans antialiased', inter.variable)}
        suppressHydrationWarning
      >
        {children}
        <VercelAnalytics />
        <VercelSpeedInsights />
      </body>
    </html>
  )
}
