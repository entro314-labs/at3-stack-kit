/// <reference types="vitest" />

import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Note: Vitest 4.x browser mode requires @vitest/browser and a provider package
// Run: pnpm add -D @vitest/browser @playwright/test
export default defineConfig({
  plugins: [react()],
  test: {
    // Browser testing configuration
    browser: {
      enabled: true,
      instances: [
        {
          browser: "chromium",
        },
      ],

      // Browser-specific settings
      headless: true,
      screenshotFailures: true,

      // Viewport configuration
      viewport: {
        width: 1280,
        height: 720,
      },
    },

    // Global test settings
    globals: true,
    setupFiles: ["./src/test/browser-setup.ts"],

    // Include/exclude patterns for browser tests
    include: ["src/**/*.browser.{test,spec}.{js,ts,jsx,tsx}"],
    exclude: [
      "node_modules/**",
      "dist/**",
      ".next/**",
      "coverage/**",
      "src/**/*.{test,spec}.{js,ts,jsx,tsx}", // Exclude regular unit tests
    ],

    // Timeouts (longer for browser tests)
    testTimeout: 30000,
    hookTimeout: 30000,

    // Coverage in browser mode
    coverage: {
      enabled: true,
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage/browser",
    },

    // Reporter configuration
    reporters: ["verbose"],

    // Retry configuration for flaky browser tests
    retry: 2,
  },

  // Resolve configuration
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "~": resolve(__dirname, "./"),
    },
  },

  // Define global constants
  define: {
    __TEST__: true,
    __BROWSER_TEST__: true,
  },
});
