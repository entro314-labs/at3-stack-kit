'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

interface InstallPromptHook {
  isInstallable: boolean
  isInstalled: boolean
  isIOS: boolean
  install: () => Promise<void>
  dismiss: () => void
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

export function useInstallPrompt(): InstallPromptHook {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(isIOSDevice)

    // Listen for the install prompt
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setInstallPrompt(e)
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setInstallPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const install = async (): Promise<void> => {
    if (!installPrompt) {
      throw new Error('Install prompt is not available')
    }

    try {
      await installPrompt.prompt()
      const choiceResult = await installPrompt.userChoice

      if (choiceResult.outcome === 'accepted') {
        setInstallPrompt(null)
      }
    } catch (error) {
      console.error('Error during installation:', error)
      throw error
    }
  }

  const dismiss = (): void => {
    setInstallPrompt(null)
  }

  return {
    isInstallable: !!installPrompt,
    isInstalled,
    isIOS,
    install,
    dismiss,
  }
}

export function getInstallationInstructions(isIOS: boolean): string[] {
  if (isIOS) {
    return [
      'Tap the Share button at the bottom of the screen',
      "Scroll down and tap 'Add to Home Screen'",
      "Tap 'Add' to confirm",
    ]
  }

  return [
    "Look for the install button in your browser's address bar",
    "Or use the menu and select 'Install App'",
    'Follow the prompts to complete installation',
  ]
}

// Service Worker registration utilities
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    })

    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker is available
            window.dispatchEvent(new CustomEvent('swUpdate', { detail: registration }))
          }
        })
      }
    })

    return registration
  } catch (error) {
    console.error('Service Worker registration failed:', error)
    return null
  }
}

export async function unregisterServiceWorkers(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map((registration) => registration.unregister()))
  } catch (error) {
    console.error('Failed to unregister service workers:', error)
  }
}

// Notification utilities
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    throw new Error('This browser does not support notifications')
  }

  return await Notification.requestPermission()
}

export function canShowNotifications(): boolean {
  return 'Notification' in window && Notification.permission === 'granted'
}

export function showNotification(
  title: string,
  options?: NotificationOptions
): Notification | null {
  if (!canShowNotifications()) {
    return null
  }

  return new Notification(title, {
    badge: '/icons/icon-96x96.png',
    icon: '/icons/icon-192x192.png',
    ...options,
  })
}
