import { exec } from "child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { glob } from "glob";
import { dirname, join, relative, resolve } from "path";
import semver from "semver";
import { promisify } from "util";
import { ProjectDetector } from "../detection/detector.js";
import type {
  BackupInfo,
  MigrationOptions,
  MigrationPlan,
  MigrationResult,
  MigrationStep,
} from "../types/migration.js";
import type { Logger } from "../utils/logger.js";
import { ConfigMerger } from "./config-merger.js";

const execAsync = promisify(exec);

export class MigrationRunner {
  private detector: ProjectDetector;
  private configMerger: ConfigMerger;

  constructor(private logger: Logger) {
    this.detector = new ProjectDetector(logger);
    this.configMerger = new ConfigMerger(logger);
  }

  async migrate(options: MigrationOptions): Promise<MigrationResult> {
    const startTime = Date.now();
    this.logger.step(1, 6, "Analyzing project...");

    try {
      // 1. Detect project
      const projectInfo = await this.detector.detectProject(options.projectPath);

      // 2. Create migration plan
      this.logger.step(2, 6, "Creating migration plan...");
      const plan = await this.createMigrationPlan(projectInfo, options);

      // 3. Create backup
      this.logger.step(3, 6, "Creating backup...");
      const backupInfo = await this.createBackup(options.projectPath, options.backupDir);

      // 4. Execute migration steps
      this.logger.step(4, 6, "Executing migration...");
      const stepResults = await this.executeMigrationSteps(plan.steps, options);

      // 5. Update dependencies
      if (!options.skipDeps) {
        this.logger.step(5, 6, "Updating dependencies...");
        await this.updateDependencies(options, projectInfo);
      }

      // 6. Validate migration
      this.logger.step(6, 6, "Validating migration...");
      const validationErrors = await this.validateMigration(options.projectPath);

      const result: MigrationResult = {
        success: validationErrors.length === 0,
        steps: stepResults,
        backupPath: backupInfo.timestamp,
        errors: validationErrors,
        warnings: [],
      };

      const duration = Date.now() - startTime;
      this.logger.success(`Migration completed in ${duration}ms`);

      return result;
    } catch (error) {
      this.logger.error("Migration failed", error);
      throw error;
    }
  }

  async rollback(projectPath: string, force: boolean = false): Promise<void> {
    this.logger.info("Starting rollback process...");

    const backupDir = join(projectPath, ".migration-backup");
    if (!existsSync(backupDir)) {
      throw new Error("No backup found to rollback from");
    }

    if (!force) {
      // Interactive confirmation would go here
      this.logger.warn(
        "This will restore all files from the backup. Continue? (Not implemented in this version)"
      );
    }

    // Restore files from backup
    const files = await glob("**/*", { cwd: backupDir });

    for (const file of files) {
      const backupFile = join(backupDir, file);
      const targetFile = join(projectPath, file);

      if (existsSync(backupFile)) {
        // Ensure target directory exists
        mkdirSync(dirname(targetFile), { recursive: true });
        copyFileSync(backupFile, targetFile);
        this.logger.debug(`Restored: ${file}`);
      }
    }

    this.logger.success("Rollback completed successfully");
  }

  private async createMigrationPlan(
    projectInfo: any,
    options: MigrationOptions
  ): Promise<MigrationPlan> {
    const steps: MigrationStep[] = [];

    // Add configuration migration steps
    if (projectInfo.hasNextJs) {
      steps.push({
        id: "next-config",
        name: "Update Next.js Configuration",
        description: "Migrate to Next.js 15.4 with modern features",
        required: true,
        execute: async () => this.migrateNextConfig(options.projectPath),
      });
    }

    if (projectInfo.hasTailwind || options.updateVersions) {
      steps.push({
        id: "tailwind-config",
        name: "Update Tailwind CSS Configuration",
        description: "Migrate to Tailwind CSS 4.x CSS-first configuration",
        required: true,
        execute: async () => this.migrateTailwindConfig(options.projectPath),
      });
    }

    if (options.replaceLinting && (projectInfo.hasEslint || projectInfo.hasPrettier)) {
      steps.push({
        id: "linting-config",
        name: "Replace ESLint/Prettier with Biome",
        description: "Modern unified linting and formatting",
        required: false,
        execute: async () => this.migrateLintingConfig(options.projectPath),
      });
    }

    if (projectInfo.hasTypeScript) {
      steps.push({
        id: "typescript-config",
        name: "Update TypeScript Configuration",
        description: "Modern TypeScript 5.9+ configuration",
        required: true,
        execute: async () => this.migrateTypeScriptConfig(options.projectPath),
      });
    }

    return {
      steps,
      conflicts: [],
      backupFiles: [],
    };
  }

  private async createBackup(projectPath: string, customBackupDir?: string): Promise<BackupInfo> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupDir = join(projectPath, customBackupDir || ".migration-backup", timestamp);

    mkdirSync(backupDir, { recursive: true });

    // Files to backup
    const filesToBackup = [
      "package.json",
      "next.config.*",
      "tailwind.config.*",
      "tsconfig.json",
      "biome.json",
      ".eslintrc.*",
      ".prettierrc*",
      "postcss.config.*",
      "src/app/globals.css",
    ];

    const backedUpFiles: string[] = [];

    for (const pattern of filesToBackup) {
      const files = await glob(pattern, { cwd: projectPath });

      for (const file of files) {
        const sourcePath = join(projectPath, file);
        const backupPath = join(backupDir, file);

        if (existsSync(sourcePath)) {
          mkdirSync(dirname(backupPath), { recursive: true });
          copyFileSync(sourcePath, backupPath);
          backedUpFiles.push(file);
          this.logger.debug(`Backed up: ${file}`);
        }
      }
    }

    // Create backup info file
    const backupInfo: BackupInfo = {
      timestamp,
      files: backedUpFiles,
      migrationId: `migration-${timestamp}`,
      canRollback: true,
    };

    writeFileSync(join(backupDir, "backup-info.json"), JSON.stringify(backupInfo, null, 2));

    this.logger.success(`Backup created: ${relative(projectPath, backupDir)}`);
    return backupInfo;
  }

  private async executeMigrationSteps(steps: MigrationStep[], options: MigrationOptions) {
    const results = [];

    for (const [index, step] of steps.entries()) {
      const spinner = this.logger.spinner(`Executing: ${step.name}`);
      const startTime = Date.now();

      try {
        if (!options.dryRun) {
          await step.execute(options);
        }

        const duration = Date.now() - startTime;
        spinner.succeed(`✓ ${step.name}`);

        results.push({
          stepId: step.id,
          success: true,
          filesModified: [], // Would need to track this in real implementation
          duration,
        });
      } catch (error) {
        const duration = Date.now() - startTime;
        spinner.fail(`✗ ${step.name}`);

        results.push({
          stepId: step.id,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          filesModified: [],
          duration,
        });

        if (step.required) {
          throw error;
        }
      }
    }

    return results;
  }

  private async updateDependencies(options: MigrationOptions, projectInfo: any) {
    if (options.dryRun) {
      this.logger.info("Dry run: Skipping dependency installation");
      return;
    }

    const spinner = this.logger.spinner("Installing dependencies...");

    try {
      const packageManager = projectInfo.packageManager;
      const installCommand = this.getInstallCommand(packageManager);

      await execAsync(installCommand, {
        cwd: options.projectPath,
        timeout: 300000, // 5 minute timeout
      });

      spinner.succeed("Dependencies updated successfully");
    } catch (error) {
      spinner.fail("Failed to update dependencies");
      this.logger.warn("You may need to run the package manager install command manually");
    }
  }

  private async validateMigration(projectPath: string) {
    const errors = [];

    // Check if key files exist and are valid
    const packageJsonPath = join(projectPath, "package.json");

    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
      // Validate package.json structure
    } catch (error) {
      errors.push({
        step: "validation",
        message: "Invalid package.json after migration",
        severity: "error" as const,
      });
    }

    return errors;
  }

  private async migrateNextConfig(projectPath: string) {
    this.logger.debug("Migrating Next.js configuration");

    const configPaths = [
      join(projectPath, "next.config.ts"),
      join(projectPath, "next.config.mjs"),
      join(projectPath, "next.config.js"),
    ];

    let configPath = configPaths.find((p) => existsSync(p));

    // Create new config if none exists
    if (!configPath) {
      configPath = join(projectPath, "next.config.ts");
    }

    const newConfig = `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Enable experimental features for AT3 stack
  experimental: {
    // Enable server actions
    serverActions: {
      bodySizeLimit: "2mb",
    },
    // Optimize package imports
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
      "framer-motion",
    ],
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },

  // Headers for security
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
`;

    writeFileSync(configPath, newConfig);
    this.logger.success("Created/updated next.config.ts");
  }

  private async migrateTailwindConfig(projectPath: string) {
    this.logger.debug("Migrating Tailwind CSS configuration");

    // For Tailwind CSS v4, we use CSS-first configuration
    const cssPath = join(projectPath, "src", "app", "globals.css");

    // Ensure directory exists
    mkdirSync(dirname(cssPath), { recursive: true });

    const tailwindCSS = `@import "tailwindcss";

/* Custom CSS variables for theming */
@theme {
  --color-background: #ffffff;
  --color-foreground: #0a0a0a;
  --color-primary: #6366f1;
  --color-primary-foreground: #ffffff;
  --color-secondary: #f4f4f5;
  --color-secondary-foreground: #18181b;
  --color-muted: #f4f4f5;
  --color-muted-foreground: #71717a;
  --color-accent: #f4f4f5;
  --color-accent-foreground: #18181b;
  --color-destructive: #ef4444;
  --color-destructive-foreground: #ffffff;
  --color-border: #e4e4e7;
  --color-input: #e4e4e7;
  --color-ring: #6366f1;
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
}

/* Dark mode theme */
@media (prefers-color-scheme: dark) {
  @theme {
    --color-background: #0a0a0a;
    --color-foreground: #fafafa;
    --color-primary: #818cf8;
    --color-secondary: #27272a;
    --color-secondary-foreground: #fafafa;
    --color-muted: #27272a;
    --color-muted-foreground: #a1a1aa;
    --color-accent: #27272a;
    --color-accent-foreground: #fafafa;
    --color-border: #27272a;
    --color-input: #27272a;
  }
}

/* Base styles */
@layer base {
  *,
  *::before,
  *::after {
    border-color: var(--color-border);
  }

  body {
    background-color: var(--color-background);
    color: var(--color-foreground);
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}

/* Utility classes */
@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}
`;

    writeFileSync(cssPath, tailwindCSS);

    // Create postcss.config.mjs
    const postcssConfig = `/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
`;

    writeFileSync(join(projectPath, "postcss.config.mjs"), postcssConfig);
    this.logger.success("Created Tailwind CSS v4 configuration");
  }

  private async migrateLintingConfig(projectPath: string) {
    this.logger.debug("Migrating linting configuration to Biome");

    // Remove ESLint and Prettier configs
    const filesToRemove = [
      ".eslintrc.js",
      ".eslintrc.json",
      ".eslintrc.yml",
      ".eslintrc.yaml",
      "eslint.config.js",
      "eslint.config.mjs",
      ".prettierrc",
      ".prettierrc.js",
      ".prettierrc.json",
      ".prettierrc.yaml",
      ".prettierrc.yml",
      ".prettierignore",
    ];

    for (const file of filesToRemove) {
      const filePath = join(projectPath, file);
      if (existsSync(filePath)) {
        const { unlinkSync } = require("fs");
        unlinkSync(filePath);
        this.logger.debug(`Removed: ${file}`);
      }
    }

    // Create Biome configuration
    const biomeConfig = {
      "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
      vcs: {
        enabled: true,
        clientKind: "git",
        useIgnoreFile: true,
      },
      files: {
        ignoreUnknown: true,
        ignore: [
          "node_modules",
          ".next",
          "dist",
          "build",
          "coverage",
          "*.min.js",
          "pnpm-lock.yaml",
        ],
      },
      formatter: {
        enabled: true,
        indentStyle: "space",
        indentWidth: 2,
        lineWidth: 100,
      },
      organizeImports: {
        enabled: true,
      },
      linter: {
        enabled: true,
        rules: {
          recommended: true,
          complexity: {
            noBannedTypes: "warn",
            noUselessTypeConstraint: "warn",
          },
          correctness: {
            noUnusedVariables: "warn",
            noUnusedImports: "warn",
            useExhaustiveDependencies: "warn",
          },
          style: {
            noNonNullAssertion: "off",
            useConst: "error",
            useImportType: "error",
          },
          suspicious: {
            noExplicitAny: "warn",
            noArrayIndexKey: "warn",
          },
          nursery: {
            useSortedClasses: {
              level: "warn",
              options: {
                attributes: ["className", "class"],
                functions: ["clsx", "cn", "twMerge"],
              },
            },
          },
        },
      },
      javascript: {
        formatter: {
          quoteStyle: "single",
          trailingCommas: "es5",
          semicolons: "asNeeded",
        },
      },
      json: {
        formatter: {
          trailingCommas: "none",
        },
      },
    };

    writeFileSync(join(projectPath, "biome.json"), JSON.stringify(biomeConfig, null, 2));

    // Update package.json to remove ESLint/Prettier and add Biome
    await this.configMerger.mergePackageJson(join(projectPath, "package.json"), {
      devDependencies: {
        "@biomejs/biome": "^2.3.8",
      },
      scripts: {
        lint: "biome check .",
        "lint:fix": "biome check --fix .",
        format: "biome format --write .",
        "format:check": "biome format .",
      },
      removeDependencies: [
        "eslint",
        "eslint-config-next",
        "eslint-config-prettier",
        "eslint-plugin-react",
        "eslint-plugin-react-hooks",
        "@typescript-eslint/eslint-plugin",
        "@typescript-eslint/parser",
        "prettier",
        "prettier-plugin-tailwindcss",
      ],
    });

    this.logger.success("Migrated to Biome for linting and formatting");
  }

  private async migrateTypeScriptConfig(projectPath: string) {
    this.logger.debug("Migrating TypeScript configuration");

    const tsConfig = {
      "$schema": "https://json.schemastore.org/tsconfig",
      compilerOptions: {
        target: "ES2022",
        lib: ["dom", "dom.iterable", "ES2022"],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: "ESNext",
        moduleResolution: "bundler",
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: "preserve",
        incremental: true,
        noUncheckedIndexedAccess: true,
        moduleDetection: "force",
        plugins: [
          {
            name: "next",
          },
        ],
        paths: {
          "@/*": ["./src/*"],
        },
      },
      include: [
        "next-env.d.ts",
        "**/*.ts",
        "**/*.tsx",
        ".next/types/**/*.ts",
      ],
      exclude: ["node_modules"],
    };

    writeFileSync(join(projectPath, "tsconfig.json"), JSON.stringify(tsConfig, null, 2));
    this.logger.success("Updated tsconfig.json for modern TypeScript");
  }

  private getInstallCommand(packageManager: string): string {
    switch (packageManager) {
      case "pnpm":
        return "pnpm install";
      case "yarn":
        return "yarn install";
      case "bun":
        return "bun install";
      default:
        return "npm install";
    }
  }
}
