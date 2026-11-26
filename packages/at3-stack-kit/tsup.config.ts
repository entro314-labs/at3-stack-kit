import { defineConfig } from 'tsup'

export default defineConfig([
  // Main library
  {
    clean: true,
    dts: false,
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    sourcemap: true,
    target: 'node18',
  },
  // CLI binary
  {
    banner: {
      js: '#!/usr/bin/env node',
    },
    clean: false,
    dts: false,
    entry: ['src/cli.ts'],
    format: ['esm'],
    shims: true,
    sourcemap: true,
    target: 'node18',
  },
])
