/// <reference types="vitest" />

import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    // Browser testing configuration
    browser: {
      enabled: true,
      name: "chromium",
      provider: "playwright",

      // Browser-specific settings
      headless: true,
      screenshotFailures: true,

      // Viewport configuration
      viewport: {
        width: 1280,
        height: 720,
      },

      // Provider options for Playwright
      providerOptions: {
        launch: {
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
          devtools: false,
        },
        context: {
          // Context options
          ignoreHTTPSErrors: true,
          viewport: { width: 1280, height: 720 },
        },
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

    // Pool configuration
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
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
