# AT3 Toolkit

<div align="center">

![AT3 Logo](../../docs/media/at3-logo-text1.png)

**Migration and analysis toolkit for AT3 projects**

[![npm version](https://badge.fury.io/js/@entro314labs%2Fat3-toolkit.svg)](https://badge.fury.io/js/@entro314labs%2Fat3-toolkit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D24.19.0-brightgreen.svg)](https://nodejs.org/)

</div>

`@entro314labs/at3-toolkit` provides project detection, guided migration, initialization, and rollback tooling for AT3/AIT3E workflows.

## Install / Run

```bash
# One-off usage
npx @entro314labs/at3-toolkit

# pnpm
pnpm dlx @entro314labs/at3-toolkit

# global
npm install -g @entro314labs/at3-toolkit
at3t
```

## CLI usage

### Migrate current project

```bash
# default migration
at3t

# interactive migration
at3t --interactive

# dry run
at3t --dry-run

# update versions + replace linting
at3t --update-versions --replace-linting
```

### Additional commands

```bash
# detect project capabilities
at3t detect [project-path]

# rollback latest snapshot from .migration-backup
at3t rollback [project-path]

# scaffold via create-at3-app wrapper
at3t init [project-name] --template 83-flavor --database neon --auth clerk --lint oxc --ai
```

### Main options

- `--interactive`
- `--overwrite`
- `--no-deps`
- `--update-versions`
- `--replace-linting`
- `--dry-run`
- `--force`
- `--verbose`
- `--config <path>`
- `--backup-dir <dir>`

## Programmatic usage

```ts
import { detectProject, migrateProject, rollbackProject } from '@entro314labs/at3-toolkit'

await migrateProject('/path/to/project', {
  dryRun: false,
  replaceLinting: true,
  updateVersions: true,
})

const info = await detectProject('/path/to/project')
await rollbackProject('/path/to/project', true)
```

## Requirements

- Node.js `>=24.x`
- npm / pnpm / yarn / bun

## Notes

- Migration backups are stored under `.migration-backup/`.
- Rollback restores files that existed before migration and removes tracked files created by the migration.
- Tailwind migration updates the existing `app/globals.css` or `src/app/globals.css` path instead of assuming one layout.

## Related packages

- [`@entro314labs/create-at3-app`](../create-at3-app)
- [`@entro314labs/at3-stack-kit`](../at3-stack-kit)

## Support

- 🐛 [Issues](https://github.com/entro314-labs/at3-stack-kit/issues)
- 📖 [Docs](https://at3-stack.dev)

## License

MIT © [entro314-labs](https://github.com/entro314-labs)
