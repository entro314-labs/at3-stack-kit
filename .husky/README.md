# Husky Git Hooks Configuration

This directory contains modern Husky v9+ git hooks for automated code quality checks.

## Available Hooks

### pre-commit
- Runs `lint-staged` to automatically lint and format staged files
- Uses Biome for linting and formatting TypeScript/JavaScript files
- Runs type checking for staged TypeScript files

### commit-msg
- Validates commit messages using commitlint
- Enforces conventional commit format (e.g., `feat:`, `fix:`, `docs:`)
- See `commitlint` configuration in `package.json` for allowed commit types

### pre-push
- Runs test suite (`pnpm run test:ci`)
- Performs TypeScript type checking (`pnpm run typecheck`)
- Prevents pushing if tests fail or there are type errors

## Configuration

The hooks are configured to work with:
- **lint-staged**: Configured in `package.json`
- **commitlint**: Configured in `package.json` with conventional commit rules
- **Biome**: Used for linting and formatting instead of ESLint/Prettier

## Disabling Hooks

To temporarily disable all hooks:
```bash
export HUSKY=0
```

To skip hooks for a single commit:
```bash
git commit --no-verify -m "emergency fix"
```

## Modern Features

This setup uses Husky v9+ which provides:
- Native git hooks integration
- Better performance compared to older versions  
- Simplified configuration
- Works with all package managers (npm, pnpm, yarn, bun)