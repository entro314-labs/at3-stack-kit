import { detect as detectPackageManager } from "detect-package-manager";
import { existsSync, readFileSync, readdirSync } from "fs";
import { join, resolve } from "path";
import type { DependencyInfo, ProjectInfo, ProjectType } from "../types/migration.js";
import type { Logger } from "../utils/logger.js";

export class ProjectDetector {
  constructor(private logger: Logger) {}

  async detectProject(projectPath: string): Promise<ProjectInfo> {
    this.logger.debug(`Detecting project at: ${projectPath}`);

    if (!existsSync(projectPath)) {
      throw new Error(`Project path does not exist: ${projectPath}`);
    }

    const packageJsonPath = join(projectPath, "package.json");
    if (!existsSync(packageJsonPath)) {
      throw new Error("No package.json found. This does not appear to be a Node.js project.");
    }

    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
    const packageManager = await detectPackageManager({ cwd: projectPath });

    // Detect project type
    const projectType = this.detectProjectType(packageJson, projectPath);

    // Analyze dependencies with version info
    const dependencies = await this.analyzeDependencies(packageJson, projectPath);

    // Find configuration files
    const configFiles = this.findConfigFiles(projectPath);

    // Feature detection
    const hasTypeScript = this.hasTypeScript(projectPath, dependencies);
    const hasNextJs = this.hasDependency(dependencies, "next");
    const hasReact = this.hasDependency(dependencies, "react");
    const hasVue = this.hasDependency(dependencies, "vue");
    const hasTailwind = this.hasDependency(dependencies, "tailwindcss");
    const hasEslint = this.hasDependency(dependencies, "eslint");
    const hasPrettier = this.hasDependency(dependencies, "prettier");
    const hasBiome = this.hasDependency(dependencies, "@biomejs/biome");

    // AIT3E-specific features
    const hasAISupport = this.detectAISupport(dependencies);
    const hasSupabase = this.detectSupabase(dependencies, projectPath);
    const hasEdgeRuntime = this.detectEdgeRuntime(projectPath);
    const hasVectorDB = this.hasSupabaseVectorConfig(projectPath);

    // Additional feature detection
    const hasDrizzle = this.detectDrizzle(dependencies, projectPath);
    const hasPrisma = this.detectPrisma(dependencies, projectPath);
    const authProvider = this.detectAuthProvider(dependencies, projectPath);
    const hasTRPC = this.detectTRPC(dependencies);
    const hasPWA = this.detectPWA(dependencies, projectPath);
    const hasI18n = this.detectI18n(dependencies, projectPath);
    const hasTesting = this.detectTesting(dependencies, projectPath);

    return {
      path: projectPath,
      type: projectType,
      packageManager: packageManager as any,
      dependencies,
      configFiles,
      hasTypeScript,
      hasNextJs,
      hasReact,
      hasVue,
      hasTailwind,
      hasEslint,
      hasPrettier,
      hasBiome,
      hasAISupport,
      hasSupabase,
      hasEdgeRuntime,
      hasVectorDB,
      // Extended detection results
      hasDrizzle,
      hasPrisma,
      authProvider,
      hasTRPC,
      hasPWA,
      hasI18n,
      hasTesting,
    };
  }

  private detectProjectType(packageJson: any, projectPath: string): ProjectType {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    // Check for AIT3E stack (AI + T3 + Edge)
    const hasAI =
      deps.ai || deps["@ai-sdk/openai"] || deps["@ai-sdk/anthropic"] || deps["@ai-sdk/google"];
    const hasSupabase = deps["@supabase/supabase-js"] || deps["@supabase/ssr"];
    const hasNextJS = deps.next;
    const hasTailwind = deps.tailwindcss;
    const hasTypeScript = deps.typescript || existsSync(join(projectPath, "tsconfig.json"));

    if (hasAI && hasSupabase && hasNextJS && (hasTailwind || hasTypeScript)) {
      return "ait3e";
    }

    // Check for T3 stack variants
    if (deps.next && deps["@trpc/server"]) {
      // T3 with Prisma
      if (deps.prisma || deps["@prisma/client"]) {
        return "nextjs"; // Treat as Next.js with T3 patterns
      }
      // T3 with Drizzle
      if (deps["drizzle-orm"]) {
        return "nextjs";
      }
    }

    // Check for Next.js
    if (deps.next) return "nextjs";

    // Check for Nuxt
    if (deps.nuxt || deps["@nuxt/core"]) return "nuxt";

    // Check for Vue
    if (deps.vue) return "vue";

    // Check for React
    if (deps.react) return "react";

    // Check for Vite
    if (deps.vite) return "vite";

    // Check for Webpack
    if (deps.webpack) return "webpack";

    // Default to Node.js
    return "node";
  }

  private async analyzeDependencies(packageJson: any, projectPath: string): Promise<DependencyInfo[]> {
    const deps: DependencyInfo[] = [];

    // Production dependencies
    if (packageJson.dependencies) {
      for (const [name, version] of Object.entries(packageJson.dependencies)) {
        const depInfo = await this.getDependencyInfo(name, version as string, "dependency", projectPath);
        deps.push(depInfo);
      }
    }

    // Development dependencies
    if (packageJson.devDependencies) {
      for (const [name, version] of Object.entries(packageJson.devDependencies)) {
        const depInfo = await this.getDependencyInfo(name, version as string, "devDependency", projectPath);
        deps.push(depInfo);
      }
    }

    // Peer dependencies
    if (packageJson.peerDependencies) {
      for (const [name, version] of Object.entries(packageJson.peerDependencies)) {
        deps.push({
          name,
          version: version as string,
          type: "peerDependency",
        });
      }
    }

    return deps;
  }

  private async getDependencyInfo(
    name: string,
    version: string,
    type: "dependency" | "devDependency" | "peerDependency",
    projectPath: string
  ): Promise<DependencyInfo> {
    const info: DependencyInfo = { name, version, type };

    // Try to get installed version from node_modules
    try {
      const installedPkgPath = join(projectPath, "node_modules", name, "package.json");
      if (existsSync(installedPkgPath)) {
        const installedPkg = JSON.parse(readFileSync(installedPkgPath, "utf8"));
        info.current = installedPkg.version;
      }
    } catch {
      // Ignore errors reading installed package
    }

    return info;
  }

  private findConfigFiles(projectPath: string): string[] {
    const configFiles: string[] = [];

    const commonConfigFiles = [
      // TypeScript
      "tsconfig.json",
      "tsconfig.build.json",
      "tsconfig.test.json",

      // Next.js
      "next.config.js",
      "next.config.ts",
      "next.config.mjs",
      "next-env.d.ts",

      // Tailwind
      "tailwind.config.js",
      "tailwind.config.ts",
      "tailwind.config.mjs",
      "postcss.config.js",
      "postcss.config.mjs",

      // Linting
      ".eslintrc.js",
      ".eslintrc.json",
      ".eslintrc.yml",
      ".eslintrc.yaml",
      "eslint.config.js",
      "eslint.config.mjs",
      ".prettierrc",
      ".prettierrc.js",
      ".prettierrc.json",
      "biome.json",
      "biome.jsonc",

      // Testing
      "vitest.config.ts",
      "vitest.config.js",
      "vitest.config.mts",
      "jest.config.js",
      "jest.config.ts",
      "playwright.config.ts",
      "cypress.config.js",
      "cypress.config.ts",

      // Build tools
      "vite.config.ts",
      "vite.config.js",
      "webpack.config.js",
      "rollup.config.js",
      "esbuild.config.js",
      "turbo.json",

      // Database
      "drizzle.config.ts",
      "drizzle.config.js",
      "prisma/schema.prisma",

      // i18n
      "i18n.config.ts",
      "i18n.config.js",

      // Auth
      "auth.config.ts",
      "auth.ts",

      // Environment
      ".env",
      ".env.local",
      ".env.example",
      ".env.development",
      ".env.production",

      // Other
      ".gitignore",
      ".nvmrc",
      ".node-version",
      "package.json",
      "pnpm-workspace.yaml",
      "lerna.json",
      "README.md",
      "docker-compose.yml",
      "Dockerfile",
      "vercel.json",
      "netlify.toml",
    ];

    commonConfigFiles.forEach((file) => {
      if (existsSync(join(projectPath, file))) {
        configFiles.push(file);
      }
    });

    // Check for Supabase config
    if (existsSync(join(projectPath, "supabase", "config.toml"))) {
      configFiles.push("supabase/config.toml");
    }

    return configFiles;
  }

  private hasTypeScript(projectPath: string, dependencies: DependencyInfo[]): boolean {
    return (
      existsSync(join(projectPath, "tsconfig.json")) ||
      this.hasDependency(dependencies, "typescript")
    );
  }

  private hasDependency(dependencies: DependencyInfo[], name: string): boolean {
    return dependencies.some((dep) => dep.name === name);
  }

  private detectAISupport(dependencies: DependencyInfo[]): boolean {
    const aiDeps = [
      "ai",
      "@ai-sdk/openai",
      "@ai-sdk/anthropic",
      "@ai-sdk/google",
      "@ai-sdk/azure",
      "@ai-sdk/mistral",
      "@ai-sdk/cohere",
      "openai",
      "@anthropic-ai/sdk",
      "@google/generative-ai",
      "langchain",
      "@langchain/core",
      "llamaindex",
    ];

    return aiDeps.some((dep) => this.hasDependency(dependencies, dep));
  }

  private detectSupabase(dependencies: DependencyInfo[], projectPath: string): boolean {
    const hasSupabaseDeps =
      this.hasDependency(dependencies, "@supabase/supabase-js") ||
      this.hasDependency(dependencies, "@supabase/ssr") ||
      this.hasDependency(dependencies, "@supabase/auth-helpers-nextjs");

    const hasSupabaseConfig = existsSync(join(projectPath, "supabase", "config.toml"));

    return hasSupabaseDeps || hasSupabaseConfig;
  }

  private detectEdgeRuntime(projectPath: string): boolean {
    // Check for middleware files
    const middlewarePaths = [
      join(projectPath, "middleware.ts"),
      join(projectPath, "middleware.js"),
      join(projectPath, "src/middleware.ts"),
      join(projectPath, "src/middleware.js"),
    ];

    if (middlewarePaths.some((p) => existsSync(p))) {
      return true;
    }

    // Check for edge runtime exports in API routes
    const apiRoutes = [
      join(projectPath, "app/api"),
      join(projectPath, "src/app/api"),
      join(projectPath, "pages/api"),
    ];

    for (const apiPath of apiRoutes) {
      if (existsSync(apiPath)) {
        try {
          const files = this.getAllFiles(apiPath, [".ts", ".js"]);
          for (const file of files) {
            const content = readFileSync(file, "utf8");
            if (content.includes("export const runtime = 'edge'")) {
              return true;
            }
          }
        } catch {
          // Ignore errors reading files
        }
      }
    }

    return false;
  }

  private hasSupabaseVectorConfig(projectPath: string): boolean {
    const supabaseMigrationDir = join(projectPath, "supabase", "migrations");
    if (!existsSync(supabaseMigrationDir)) return false;

    try {
      const migrationFiles = readdirSync(supabaseMigrationDir);

      return migrationFiles.some((file: string) => {
        if (file.endsWith(".sql")) {
          const content = readFileSync(join(supabaseMigrationDir, file), "utf8");
          return (
            content.includes("vector") ||
            content.includes("embedding") ||
            content.includes("pgvector")
          );
        }
        return false;
      });
    } catch {
      this.logger.debug("Could not check Supabase migrations for vector config");
      return false;
    }
  }

  private detectDrizzle(dependencies: DependencyInfo[], projectPath: string): boolean {
    const hasDrizzleDeps =
      this.hasDependency(dependencies, "drizzle-orm") ||
      this.hasDependency(dependencies, "drizzle-kit");

    const hasDrizzleConfig =
      existsSync(join(projectPath, "drizzle.config.ts")) ||
      existsSync(join(projectPath, "drizzle.config.js"));

    return hasDrizzleDeps || hasDrizzleConfig;
  }

  private detectPrisma(dependencies: DependencyInfo[], projectPath: string): boolean {
    const hasPrismaDeps =
      this.hasDependency(dependencies, "prisma") ||
      this.hasDependency(dependencies, "@prisma/client");

    const hasPrismaSchema = existsSync(join(projectPath, "prisma", "schema.prisma"));

    return hasPrismaDeps || hasPrismaSchema;
  }

  private detectAuthProvider(
    dependencies: DependencyInfo[],
    projectPath: string
  ): "supabase" | "clerk" | "better-auth" | "next-auth" | "lucia" | "none" {
    // Supabase Auth
    if (
      this.hasDependency(dependencies, "@supabase/auth-helpers-nextjs") ||
      this.hasDependency(dependencies, "@supabase/ssr")
    ) {
      // Check if actually using Supabase auth
      const hasAuthConfig =
        existsSync(join(projectPath, "src/lib/supabase")) ||
        existsSync(join(projectPath, "lib/supabase"));
      if (hasAuthConfig) return "supabase";
    }

    // Clerk
    if (
      this.hasDependency(dependencies, "@clerk/nextjs") ||
      this.hasDependency(dependencies, "@clerk/clerk-react")
    ) {
      return "clerk";
    }

    // Better Auth
    if (this.hasDependency(dependencies, "better-auth")) {
      return "better-auth";
    }

    // NextAuth / Auth.js
    if (
      this.hasDependency(dependencies, "next-auth") ||
      this.hasDependency(dependencies, "@auth/core")
    ) {
      return "next-auth";
    }

    // Lucia
    if (this.hasDependency(dependencies, "lucia")) {
      return "lucia";
    }

    return "none";
  }

  private detectTRPC(dependencies: DependencyInfo[]): boolean {
    return (
      this.hasDependency(dependencies, "@trpc/server") ||
      this.hasDependency(dependencies, "@trpc/client") ||
      this.hasDependency(dependencies, "@trpc/react-query")
    );
  }

  private detectPWA(dependencies: DependencyInfo[], projectPath: string): boolean {
    const hasPWADeps =
      this.hasDependency(dependencies, "@ducanh2912/next-pwa") ||
      this.hasDependency(dependencies, "next-pwa") ||
      this.hasDependency(dependencies, "workbox-webpack-plugin");

    const hasManifest = existsSync(join(projectPath, "public", "manifest.json"));
    const hasServiceWorker =
      existsSync(join(projectPath, "public", "sw.js")) ||
      existsSync(join(projectPath, "public", "service-worker.js"));

    return hasPWADeps || (hasManifest && hasServiceWorker);
  }

  private detectI18n(dependencies: DependencyInfo[], projectPath: string): boolean {
    const hasI18nDeps =
      this.hasDependency(dependencies, "next-intl") ||
      this.hasDependency(dependencies, "next-i18next") ||
      this.hasDependency(dependencies, "react-i18next") ||
      this.hasDependency(dependencies, "i18next");

    const hasMessagesDir =
      existsSync(join(projectPath, "messages")) ||
      existsSync(join(projectPath, "locales")) ||
      existsSync(join(projectPath, "public/locales"));

    return hasI18nDeps || hasMessagesDir;
  }

  private detectTesting(dependencies: DependencyInfo[], projectPath: string): {
    unit: "vitest" | "jest" | "none";
    e2e: "playwright" | "cypress" | "none";
  } {
    // Unit testing
    let unit: "vitest" | "jest" | "none" = "none";
    if (this.hasDependency(dependencies, "vitest")) {
      unit = "vitest";
    } else if (this.hasDependency(dependencies, "jest")) {
      unit = "jest";
    }

    // E2E testing
    let e2e: "playwright" | "cypress" | "none" = "none";
    if (
      this.hasDependency(dependencies, "@playwright/test") ||
      this.hasDependency(dependencies, "playwright")
    ) {
      e2e = "playwright";
    } else if (this.hasDependency(dependencies, "cypress")) {
      e2e = "cypress";
    }

    return { unit, e2e };
  }

  private getAllFiles(dirPath: string, extensions: string[]): string[] {
    const files: string[] = [];

    try {
      const entries = readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dirPath, entry.name);
        if (entry.isDirectory()) {
          files.push(...this.getAllFiles(fullPath, extensions));
        } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    } catch {
      // Ignore errors
    }

    return files;
  }
}
