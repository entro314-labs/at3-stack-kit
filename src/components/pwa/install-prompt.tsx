"use client";

import { Download, Share, Smartphone, X } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getInstallationInstructions, useInstallPrompt } from "@/lib/pwa/install";
import { cn } from "@/lib/utils";

interface InstallPromptProps {
  className?: string;
}

export function InstallPrompt({ className }: InstallPromptProps) {
  const { isInstallable, isInstalled, isIOS, install, dismiss } = useInstallPrompt();
  const [isInstalling, setIsInstalling] = React.useState(false);
  const [showInstructions, setShowInstructions] = React.useState(false);

  // Don't show if already installed or not installable
  if (isInstalled || (!isInstallable && !isIOS)) {
    return null;
  }

  const handleInstall = async () => {
    if (isIOS) {
      setShowInstructions(true);
      return;
    }

    setIsInstalling(true);
    try {
      await install();
    } catch (error) {
      console.error("Installation failed:", error);
    } finally {
      setIsInstalling(false);
    }
  };

  const instructions = getInstallationInstructions(isIOS);

  if (showInstructions) {
    return (
      <Card className={cn("w-full max-w-md mx-auto", className)}>
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
          <ol className="space-y-2 list-decimal list-inside text-sm">
            {instructions.map((instruction, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                  {index + 1}
                </span>
                <span className="flex-1">{instruction}</span>
              </li>
            ))}
          </ol>
          {isIOS && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-md border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Share className="h-4 w-4" />
                <span className="text-sm font-medium">Look for the Share button</span>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
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
    );
  }

  return (
    <Card className={cn("w-full max-w-md mx-auto", className)}>
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
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Works offline</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Quick access from home screen</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Native app-like experience</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" onClick={dismiss} className="flex-1">
          Not now
        </Button>
        <Button onClick={handleInstall} disabled={isInstalling} className="flex-1">
          {isInstalling ? "Installing..." : "Install"}
        </Button>
      </CardFooter>
    </Card>
  );
}
