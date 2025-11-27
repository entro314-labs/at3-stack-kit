/**
 * Add PWA support to existing project
 */

import { join } from 'node:path'
import { ensureDir, pathExists, readFile, writeFile } from 'fs-extra'

export async function addPWA(projectPath: string): Promise<void> {
  const srcPath = join(projectPath, 'src')
  const publicPath = join(projectPath, 'public')

  await ensureDir(publicPath)
  await ensureDir(join(publicPath, 'icons'))

  // Add manifest.json
  await addManifest(publicPath)

  // Add custom service worker
  await addServiceWorker(publicPath)

  // Add offline page
  await addOfflinePage(srcPath)

  // Add PWA hooks and utilities
  await addPWAUtils(srcPath)

  // Add install prompt component
  await addInstallPrompt(srcPath)

  // Add PWA provider
  await addPWAProvider(srcPath)

  // Update package.json
  await updatePackageJson(projectPath)

  // Update next.config.ts
  await updateNextConfig(projectPath)

  // Update layout to include PWA meta tags
  await updateLayout(srcPath)

  console.log('✓ PWA support added')
}

async function addManifest(publicPath: string): Promise<void> {
  const manifest = {
    name: 'AT3 App',
    short_name: 'AT3',
    description: 'AT3 Stack Application - AI-native, edge-first',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#6366f1',
    orientation: 'portrait-primary',
    scope: '/',
    lang: 'en',
    categories: ['productivity', 'utilities'],
    icons: [
      {
        src: '/icons/icon-72x72.png',
        sizes: '72x72',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-128x128.png',
        sizes: '128x128',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-144x144.png',
        sizes: '144x144',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-152x152.png',
        sizes: '152x152',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-384x384.png',
        sizes: '384x384',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    screenshots: [
      {
        src: '/screenshots/desktop.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Desktop view',
      },
      {
        src: '/screenshots/mobile.png',
        sizes: '750x1334',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Mobile view',
      },
    ],
    shortcuts: [
      {
        name: 'Dashboard',
        short_name: 'Dashboard',
        description: 'Go to dashboard',
        url: '/dashboard',
        icons: [{ src: '/icons/dashboard-96x96.png', sizes: '96x96' }],
      },
    ],
  }

  await writeFile(join(publicPath, 'manifest.json'), JSON.stringify(manifest, null, 2))
}

async function addServiceWorker(publicPath: string): Promise<void> {
  const serviceWorker = `// Custom Service Worker for AT3 PWA
// This works alongside @ducanh2912/next-pwa

const CACHE_NAME = 'at3-cache-v1'
const OFFLINE_URL = '/offline'

// Resources to pre-cache
const PRECACHE_RESOURCES = [
  '/',
  '/offline',
  '/manifest.json',
]

// Install event - pre-cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching resources')
      return cache.addAll(PRECACHE_RESOURCES)
    })
  )
  // Force waiting service worker to become active
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          })
      )
    })
  )
  // Take control of all pages immediately
  self.clients.claim()
})

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return

  // Handle navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL)
      })
    )
    return
  }

  // Network first strategy for API requests
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(
          JSON.stringify({ error: 'Offline', message: 'No network connection' }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      })
    )
    return
  }

  // Cache first strategy for static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached response and update cache in background
        event.waitUntil(
          fetch(event.request).then((networkResponse) => {
            if (networkResponse.ok) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse.clone())
              })
            }
          })
        )
        return cachedResponse
      }

      // If not in cache, fetch from network
      return fetch(event.request).then((networkResponse) => {
        // Cache successful responses
        if (networkResponse.ok) {
          const responseClone = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone)
          })
        }
        return networkResponse
      })
    })
  )
})

// Push notification event
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()
  const options = {
    body: data.body || 'New notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
    },
    actions: data.actions || [],
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'AT3 App', options)
  )
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus()
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})

// Background sync event
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData())
  }
})

async function syncData() {
  // Implement your background sync logic here
  console.log('[SW] Background sync triggered')
}
`
  await writeFile(join(publicPath, 'sw.js'), serviceWorker)
}

async function addOfflinePage(srcPath: string): Promise<void> {
  const offlinePath = join(srcPath, 'app', 'offline')
  await ensureDir(offlinePath)

  const offlinePage = `export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-background text-foreground">
      <div className="text-center">
        <div className="mb-8">
          <svg
            className="mx-auto h-24 w-24 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a5 5 0 01-7.072-7.072m0 0l2.829 2.829M6.343 6.343L3 3"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          You&apos;re offline
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-md mx-auto">
          It looks like you&apos;ve lost your internet connection.
          Please check your network and try again.
        </p>
        <div className="mt-8">
          <button
            onClick={() => window.location.reload()}
            className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Try again
          </button>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          Some features may still be available offline.
        </p>
      </div>
    </main>
  )
}
`
  await writeFile(join(offlinePath, 'page.tsx'), offlinePage)
}

async function addPWAUtils(srcPath: string): Promise<void> {
  const pwaPath = join(srcPath, 'lib', 'pwa')
  await ensureDir(pwaPath)

  const pwaHooks = `'use client'

import { useCallback, useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * Hook to manage PWA installation
 */
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const install = useCallback(async () => {
    if (!deferredPrompt) return false

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    setDeferredPrompt(null)
    setIsInstallable(false)

    return outcome === 'accepted'
  }, [deferredPrompt])

  return { isInstallable, isInstalled, install }
}

/**
 * Hook to check online/offline status
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}

/**
 * Hook to manage service worker registration
 */
export function useServiceWorker() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [updateAvailable, setUpdateAvailable] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg)

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true)
              }
            })
          }
        })
      })
    }
  }, [])

  const update = useCallback(() => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      window.location.reload()
    }
  }, [registration])

  const checkForUpdates = useCallback(async () => {
    if (registration) {
      await registration.update()
    }
  }, [registration])

  return { registration, updateAvailable, update, checkForUpdates }
}

/**
 * Hook to manage push notifications
 */
export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return false

    const result = await Notification.requestPermission()
    setPermission(result)
    return result === 'granted'
  }, [])

  const subscribe = useCallback(async (vapidPublicKey: string) => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return null
    }

    const registration = await navigator.serviceWorker.ready
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    })

    setSubscription(sub)
    return sub
  }, [])

  const unsubscribe = useCallback(async () => {
    if (subscription) {
      await subscription.unsubscribe()
      setSubscription(null)
    }
  }, [subscription])

  return { permission, subscription, requestPermission, subscribe, unsubscribe }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}
`
  await writeFile(join(pwaPath, 'hooks.ts'), pwaHooks)

  // Add index export
  const index = `export { useInstallPrompt, useOnlineStatus, useServiceWorker, usePushNotifications } from './hooks'
export { PWAProvider } from './provider'
export { InstallPrompt } from './install-prompt'
`
  await writeFile(join(pwaPath, 'index.ts'), index)
}

async function addInstallPrompt(srcPath: string): Promise<void> {
  const pwaPath = join(srcPath, 'lib', 'pwa')

  const installPrompt = `'use client'

import { useEffect, useState } from 'react'
import { useInstallPrompt } from './hooks'

interface InstallPromptProps {
  title?: string
  description?: string
  installText?: string
  dismissText?: string
  onInstall?: () => void
  onDismiss?: () => void
}

export function InstallPrompt({
  title = 'Install App',
  description = 'Install this app on your device for a better experience.',
  installText = 'Install',
  dismissText = 'Not now',
  onInstall,
  onDismiss,
}: InstallPromptProps) {
  const { isInstallable, isInstalled, install } = useInstallPrompt()
  const [isDismissed, setIsDismissed] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // Check if user has previously dismissed the prompt
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10)
      // Show again after 7 days
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        setIsDismissed(true)
      }
    }

    // Delay showing the prompt
    const timer = setTimeout(() => {
      setShowPrompt(true)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  if (!showPrompt || !isInstallable || isInstalled || isDismissed) {
    return null
  }

  const handleInstall = async () => {
    const installed = await install()
    if (installed) {
      onInstall?.()
    }
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
    onDismiss?.()
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
      <div className="bg-background border border-border rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-4">
          <div className="shrink-0">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center"
              <svg
                className="h-6 w-6 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleInstall}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {installText}
              </button>
              <button
                onClick={handleDismiss}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                {dismissText}
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
`
  await writeFile(join(pwaPath, 'install-prompt.tsx'), installPrompt)
}

async function addPWAProvider(srcPath: string): Promise<void> {
  const pwaPath = join(srcPath, 'lib', 'pwa')

  const provider = `'use client'

import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useOnlineStatus, useServiceWorker } from './hooks'

interface PWAContextType {
  isOnline: boolean
  updateAvailable: boolean
  update: () => void
  checkForUpdates: () => Promise<void>
}

const PWAContext = createContext<PWAContextType | null>(null)

export function usePWA() {
  const context = useContext(PWAContext)
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider')
  }
  return context
}

interface PWAProviderProps {
  children: ReactNode
}

export function PWAProvider({ children }: PWAProviderProps) {
  const isOnline = useOnlineStatus()
  const { updateAvailable, update, checkForUpdates } = useServiceWorker()

  // Register service worker on mount
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.error('Service Worker registration failed:', error)
      })
    }
  }, [])

  // Check for updates periodically
  useEffect(() => {
    const interval = setInterval(() => {
      checkForUpdates()
    }, 60 * 60 * 1000) // Check every hour

    return () => clearInterval(interval)
  }, [checkForUpdates])

  return (
    <PWAContext.Provider value={{ isOnline, updateAvailable, update, checkForUpdates }}>
      {children}
    </PWAContext.Provider>
  )
}
`
  await writeFile(join(pwaPath, 'provider.tsx'), provider)
}

async function updatePackageJson(projectPath: string): Promise<void> {
  const packageJsonPath = join(projectPath, 'package.json')
  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'))

  if (!packageJson.dependencies) packageJson.dependencies = {}

  // Using @ducanh2912/next-pwa for better App Router support
  packageJson.dependencies['@ducanh2912/next-pwa'] = '^10.2.9'

  await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2))
}

async function updateNextConfig(projectPath: string): Promise<void> {
  const configPath = join(projectPath, 'next.config.ts')

  try {
    let configContent = await readFile(configPath, 'utf-8')

    // Check if already configured
    if (configContent.includes('withPWA')) return

    // Add import
    const importStatement = `import withPWAInit from "@ducanh2912/next-pwa"\n`

    // Initialize plugin
    const pluginInit = `
const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
})
`

    // Add import at the top
    if (!configContent.includes('@ducanh2912/next-pwa')) {
      configContent = importStatement + configContent
    }

    // Find export default and wrap it
    const exportDefaultRegex = /export\s+default\s+(\w+)\s*;?\s*$/m
    const match = configContent.match(exportDefaultRegex)

    if (match) {
      const configName = match[1]
      configContent = configContent.replace(
        exportDefaultRegex,
        `${pluginInit}\nexport default withPWA(${configName})\n`
      )
    } else {
      // Handle wrapped configs like withNextIntl(nextConfig)
      const wrappedExportRegex = /export\s+default\s+(with\w+\([^)]+\))\s*;?\s*$/m
      const wrappedMatch = configContent.match(wrappedExportRegex)

      if (wrappedMatch) {
        configContent = configContent.replace(
          wrappedExportRegex,
          `${pluginInit}\nexport default withPWA(${wrappedMatch[1]})\n`
        )
      }
    }

    await writeFile(configPath, configContent)
  } catch (error) {
    console.warn(
      'Could not update next.config.ts automatically. Please wrap your config with withPWA manually.'
    )
  }
}

async function updateLayout(srcPath: string): Promise<void> {
  // Add PWA meta tags component
  const componentsPath = join(srcPath, 'components', 'pwa')
  await ensureDir(componentsPath)

  const pwaMeta = `import type { Metadata, Viewport } from 'next'

export const pwaViewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export const pwaMetadata: Partial<Metadata> = {
  applicationName: 'AT3 App',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AT3 App',
  },
  formatDetection: {
    telephone: false,
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
}

/**
 * Usage in layout.tsx:
 *
 * import { pwaMetadata, pwaViewport } from '@/components/pwa/pwa-meta'
 *
 * export const metadata: Metadata = {
 *   ...pwaMetadata,
 *   title: 'Your App Title',
 *   description: 'Your app description',
 * }
 *
 * export const viewport: Viewport = pwaViewport
 */
`
  await writeFile(join(componentsPath, 'pwa-meta.ts'), pwaMeta)

  // Add update notification component
  const updateNotification = `'use client'

import { usePWA } from '@/lib/pwa'

export function UpdateNotification() {
  const { updateAvailable, update } = usePWA()

  if (!updateAvailable) return null

  return (
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
      <div className="bg-primary text-primary-foreground rounded-lg shadow-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span className="text-sm font-medium">Update available</span>
          </div>
          <button
            onClick={update}
            className="text-sm font-medium underline hover:no-underline"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  )
}
`
  await writeFile(join(componentsPath, 'update-notification.tsx'), updateNotification)

  // Add offline indicator component
  const offlineIndicator = `'use client'

import { usePWA } from '@/lib/pwa'

export function OfflineIndicator() {
  const { isOnline } = usePWA()

  if (isOnline) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-yellow-500 text-yellow-950 rounded-full px-4 py-2 shadow-lg">
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a5 5 0 01-7.072-7.072"
            />
          </svg>
          <span className="text-sm font-medium">You&apos;re offline</span>
        </div>
      </div>
    </div>
  )
}
`
  await writeFile(join(componentsPath, 'offline-indicator.tsx'), offlineIndicator)

  // Add index export
  const index = `export { pwaMetadata, pwaViewport } from './pwa-meta'
export { UpdateNotification } from './update-notification'
export { OfflineIndicator } from './offline-indicator'
`
  await writeFile(join(componentsPath, 'index.ts'), index)
}
