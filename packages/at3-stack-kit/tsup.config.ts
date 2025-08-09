import { defineConfig } from "tsup";

export default defineConfig([
  // Main library
  {
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    dts: false,
    clean: true,
    sourcemap: true,
    target: "node18",
  },
  // CLI binary
  {
    entry: ["src/cli.ts"],
    format: ["esm"],
    dts: false,
    clean: false,
    sourcemap: true,
    target: "node18",
    banner: {
      js: "#!/usr/bin/env node",
    },
    shims: true,
  },
]);
