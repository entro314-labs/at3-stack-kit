# create-at3-app

<div align="center">

![AT3 Logo](../../docs/media/at3-logo-text1.png)

**Scaffold AT3 projects with template + stack options**

[![npm version](https://badge.fury.io/js/@entro314labs%2Fcreate-at3-app.svg)](https://badge.fury.io/js/@entro314labs%2Fcreate-at3-app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D24.19.0-brightgreen.svg)](https://nodejs.org/)

</div>

`@entro314labs/create-at3-app` scaffolds AT3 projects with template defaults plus explicit database/auth/lint/AI choices.

## Quick Start

```bash
# interactive
npx @entro314labs/create-at3-app@latest

# with project name; defaults to 83-flavor
npx @entro314labs/create-at3-app@latest my-app

# pnpm
pnpm dlx @entro314labs/create-at3-app my-app

# yarn
yarn dlx @entro314labs/create-at3-app my-app
```

## Templates

- `t3`
- `t3-edge`
- `t3-ai-custom`
- `t3-ai-vercel`
- `t3-ai-both`
- `suggested`
- `83-flavor` (default profile)

## Non-interactive mode

```bash
npx @entro314labs/create-at3-app@latest my-app \
  --template 83-flavor \
  --pm pnpm \
  --database neon \
  --auth clerk \
  --lint oxc \
  --ai \
  --ai-mode vercel
```

### Options

- `--template, -t <template>`
- `--pm <manager>` (`pnpm`, `npm`, `yarn`)
- `--database <database>` (`supabase`, `neon`, `drizzle`, `none`)
- `--auth <auth>` (`supabase`, `clerk`, `none`)
- `--lint <tool>` (`biome`, `oxc`)
- `--ai`
- `--ai-mode <mode>` (`vercel`, `custom`, `both`)
- `--without-ai`
- `--no-install`
- `--no-git`

## Feature behavior

- `t3-ai-vercel` and `--ai-mode vercel` scaffold an OpenAI chat route with `OPENAI_API_KEY`.
- `t3-ai-custom`, `t3-ai-both`, `--ai-mode custom`, and `--ai-mode both` scaffold OpenAI, Anthropic, and Google provider selection with matching env placeholders.
- AI-disabled scaffolds remove AI chat route and AI dependencies from `package.json`.
- Supabase auth selection automatically enforces Supabase database.
- Supabase auth scaffolds verify the server session through Supabase instead of checking cookie names directly.

## Requirements

- Node.js `>=24.x`
- npm / pnpm / yarn

## Related packages

- [`@entro314labs/at3-stack-kit`](../at3-stack-kit)
- [`@entro314labs/at3-toolkit`](../at3-toolkit)

## Support

- 📖 [Documentation](https://at3-stack.dev)
- 🐛 [Issues](https://github.com/entro314-labs/at3-stack-kit/issues)

## License

MIT © [entro314-labs](https://github.com/entro314-labs)
