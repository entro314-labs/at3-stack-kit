"use client";

import * as React from "react";
import { registerServiceWorker } from "@/lib/pwa/install";

interface PWAProviderProps {
  children: React.ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  React.useEffect(() => {
    // Register service worker
    if (process.env.NODE_ENV === "production") {
      registerServiceWorker()
        .then((registration) => {
          if (registration) {
            console.log("Service Worker registered successfully");

            // Listen for service worker updates
            registration.addEventListener("updatefound", () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener("statechange", () => {
                  if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                    // Show update notification
                    if (window.confirm("A new version is available. Would you like to update?")) {
                      newWorker.postMessage({ type: "SKIP_WAITING" });
                      window.location.reload();
                    }
                  }
                });
              }
            });
          }
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });
    }

    // Handle visibility change for better UX
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // App became visible, refresh data if needed
        console.log("App is now visible");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Handle online/offline status
    const handleOnline = () => {
      console.log("App is online");
      // Dispatch custom event for components to react to
      window.dispatchEvent(new CustomEvent("app-online"));
    };

    const handleOffline = () => {
      console.log("App is offline");
      // Dispatch custom event for components to react to
      window.dispatchEvent(new CustomEvent("app-offline"));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return <>{children}</>;
}
