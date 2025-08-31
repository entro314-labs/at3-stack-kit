'use client'

import { Download, Share, Smartphone, X } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { getInstallationInstructions, useInstallPrompt } from '@/lib/pwa/install'
import { cn } from '@/lib/utils'

interface InstallPromptProps {
  className?: string
}

export function InstallPrompt({ className }: InstallPromptProps) {
  const { isInstallable, isInstalled, isIOS, install, dismiss } = useInstallPrompt()
  const [isInstalling, setIsInstalling] = React.useState(false)
  const [showInstructions, setShowInstructions] = React.useState(false)

  // Don't show if already installed or not installable
  if (isInstalled || !(isInstallable || isIOS)) {
    return null
  }

  const handleInstall = async () => {
    if (isIOS) {
      setShowInstructions(true)
      return
    }

    setIsInstalling(true)
    try {
      await install()
    } catch (error) {
      console.error('Installation failed:', error)
    } finally {
      setIsInstalling(false)
    }
  }

  const instructions = getInstallationInstructions(isIOS)

  if (showInstructions) {
    return (
      <Card className={cn('mx-auto w-full max-w-md', className)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              <CardTitle className="text-lg">Install App</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowInstructions(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>Follow these steps to install the app on your device:</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-inside list-decimal space-y-2 text-sm">
            {instructions.map((instruction, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground text-xs">
                  {index + 1}
                </span>
                <span className="flex-1">{instruction}</span>
              </li>
            ))}
          </ol>
          {isIOS && (
            <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Share className="h-4 w-4" />
                <span className="font-medium text-sm">Look for the Share button</span>
              </div>
              <p className="mt-1 text-blue-600 text-xs dark:text-blue-400">
                It's usually located at the bottom center of Safari
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => setShowInstructions(false)} className="w-full">
            Got it
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className={cn('mx-auto w-full max-w-md', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            <CardTitle className="text-lg">Install App</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={dismiss} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Install this app for a better experience with offline access and quick launch.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span>Works offline</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span>Quick access from home screen</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span>Native app-like experience</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" onClick={dismiss} className="flex-1">
          Not now
        </Button>
        <Button onClick={handleInstall} disabled={isInstalling} className="flex-1">
          {isInstalling ? 'Installing...' : 'Install'}
        </Button>
      </CardFooter>
    </Card>
  )
}
