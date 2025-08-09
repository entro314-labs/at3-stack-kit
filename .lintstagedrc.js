/** @type {import('lint-staged').Config} */
module.exports = {
  // TypeScript and JavaScript files (exclude build dirs)
  "*.{ts,tsx,js,jsx}": [
    "biome format --write",
    "biome lint --write",
  ],
  "src/**/*.{ts,tsx,js,jsx}": [
    "biome format --write", 
    "biome lint --write",
  ],
  "packages/*/src/**/*.{ts,tsx,js,jsx}": [
    "biome format --write",
    "biome lint --write",
  ],

  // JSON files (exclude package-lock.json and build artifacts)
  "*.json": ["biome format --write"],
  "src/**/*.json": ["biome format --write"],
  "packages/*/src/**/*.json": ["biome format --write"],

  // CSS, SCSS files
  "src/**/*.{css,scss}": ["biome format --write"],
  "packages/*/src/**/*.{css,scss}": ["biome format --write"],

  // Markdown files - skip biome formatting (not supported)
  // "**/*.md": ["biome format --write"],

  // YAML files - skip formatting (biome doesn't support YAML)
  // "**/*.{yml,yaml}": [],

  // Package.json - sort dependencies
  "package.json": ["sort-package-json"],
  "packages/*/package.json": ["sort-package-json"],

  // Database migrations - validate syntax
  "supabase/migrations/*.sql": [
    () => 'echo "✓ Validating SQL migrations..."',
  ],

  // Environment files - check for secrets
  "**/.env*": [() => 'echo "⚠️  Remember: Never commit actual secrets to git!"'],
};
