# AT3 Stack Kit

<div align="center">

![AT3 Logo](../../docs/media/at3-logo-text1.png)

**Upgrade existing projects to AT3 Stack with guided feature additions**

[![npm version](https://badge.fury.io/js/@entro314labs%2Fat3-stack-kit.svg)](https://badge.fury.io/js/@entro314labs%2Fat3-stack-kit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D24.19.0-brightgreen.svg)](https://nodejs.org/)

</div>

`@entro314labs/at3-stack-kit` upgrades an existing project by adding AT3 capabilities (AI, auth, data, PWA, i18n, testing) through an interactive CLI.

## Quick Start

```bash
# Run in your current project
npx @entro314labs/at3-stack-kit

# pnpm
pnpm dlx @entro314labs/at3-stack-kit

# global install
npm install -g @entro314labs/at3-stack-kit
at3-kit
```

## What the CLI supports today

### Default command

```bash
at3-kit
```

Starts interactive mode:

1. Detect project type
2. Select features to add
3. Optionally install dependencies
4. Apply changes and print next steps

### Root options

```bash
at3-kit --dry-run
at3-kit --no-install
```

- `--dry-run`: previews planned changes without mutating files
- `--no-install`: applies feature changes but skips dependency installation

### Subcommands

```bash
# Add one feature directly
at3-kit add <feature> [--no-install]

# Detect project type and current stack hints
at3-kit detect
```

## Available features

| Feature       | Description                                   |
| ------------- | --------------------------------------------- |
| `ai-custom`   | Custom AI integration with multiple providers |
| `ai-vercel`   | Vercel AI SDK integration                     |
| `supabase`    | Supabase database/auth wiring                 |
| `neon`        | Neon serverless PostgreSQL integration        |
| `drizzle`     | Drizzle ORM + PostgreSQL wiring               |
| `clerk`       | Clerk authentication                          |
| `better-auth` | Better Auth with Drizzle/PostgreSQL wiring    |
| `pwa`         | Progressive Web App setup                     |
| `i18n`        | Internationalization setup                    |
| `testing`     | Vitest + Playwright setup                     |

Feature generators write paths according to the detected project layout. Projects with `src/app` receive generated files under `src`; root App Router projects receive generated files under the repository root.

## Requirements

- Node.js `>=24.x`
- npm / pnpm / yarn / bun

## AT3 Ecosystem

- [`create-at3-app`](../create-at3-app) - scaffold new projects
- [`@entro314labs/at3-toolkit`](../at3-toolkit) - migration + detection toolkit

## Support

- 📖 [Documentation](https://at3-stack.dev)
- 🐛 [Issues](https://github.com/entro314-labs/at3-stack-kit/issues)
- 💬 [Discord](https://discord.gg/at3-stack)

## License

MIT © [entro314-labs](https://github.com/entro314-labs)
