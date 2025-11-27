/// <reference types="vitest" />

import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    // Test environment
    environment: "jsdom",

    // Global test settings
    globals: true,
    setupFiles: ["./src/test/setup.ts"],

    // Include/exclude patterns
    include: ["src/**/*.{test,spec}.{js,ts,jsx,tsx}"],
    exclude: [
      "node_modules/**",
      "dist/**",
      ".next/**",
      "coverage/**",
      "src/**/*.browser.{test,spec}.{js,ts,jsx,tsx}",
    ],

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage",
      exclude: [
        "node_modules/**",
        "src/test/**",
        "**/*.d.ts",
        "**/*.config.*",
        "**/coverage/**",
        "**/.next/**",
        "**/*.stories.*",
        "**/*.test.*",
        "**/*.spec.*",
        "**/index.ts",
        "**/index.tsx",
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },

    // Timeouts
    testTimeout: 10000,
    hookTimeout: 10000,

    // Watch mode settings
    watch: true,

    // UI configuration
    ui: true,
    open: false,

    // Reporter configuration
    reporters: ["verbose", "html"],
    outputFile: {
      html: "./coverage/test-results.html",
    },

    // Projects configuration for multiple test types
    projects: [
      // Unit tests configuration
      {
        resolve: {
          alias: {
            "@": resolve(__dirname, "./src"),
            "~": resolve(__dirname, "./"),
          },
        },
        test: {
          name: "unit",
          environment: "jsdom",
          include: ["src/**/*.{test,spec}.{js,ts,jsx,tsx}"],
          exclude: [
            "node_modules/**",
            "dist/**",
            ".next/**",
            "coverage/**",
            "src/**/*.browser.{test,spec}.{js,ts,jsx,tsx}",
            "src/**/*.e2e.{test,spec}.{js,ts,jsx,tsx}",
          ],
        },
      },
      // Browser tests configuration
      {
        resolve: {
          alias: {
            "@": resolve(__dirname, "./src"),
            "~": resolve(__dirname, "./"),
          },
        },
        test: {
          name: "browser",
          browser: {
            enabled: true,
            instances: [
              {
                browser: "chromium",
              },
            ],
            headless: true,
          },
          include: ["src/**/*.browser.{test,spec}.{js,ts,jsx,tsx}"],
          exclude: [
            "node_modules/**",
            "dist/**",
            ".next/**",
            "coverage/**",
            "src/**/*.{test,spec}.{js,ts,jsx,tsx}",
          ],
        },
      },
    ],
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
    __DEV__: true,
    global: "globalThis",
  },
});
