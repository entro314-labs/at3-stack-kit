import { detect as detectPackageManager } from "detect-package-manager";
import { existsSync, readFileSync } from "fs";
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

    // Analyze dependencies
    const dependencies = this.analyzeDependencies(packageJson);

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
    const hasAISupport =
      this.hasDependency(dependencies, "ai") ||
      this.hasDependency(dependencies, "@ai-sdk/openai") ||
      this.hasDependency(dependencies, "@ai-sdk/anthropic") ||
      this.hasDependency(dependencies, "@ai-sdk/google");
    const hasSupabase =
      this.hasDependency(dependencies, "@supabase/supabase-js") ||
      this.hasDependency(dependencies, "@supabase/ssr");
    const hasEdgeRuntime =
      existsSync(join(projectPath, "middleware.ts")) ||
      existsSync(join(projectPath, "src/middleware.ts"));
    const hasVectorDB = this.hasSupabaseVectorConfig(projectPath);

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

  private analyzeDependencies(packageJson: any): DependencyInfo[] {
    const deps: DependencyInfo[] = [];

    // Production dependencies
    if (packageJson.dependencies) {
      Object.entries(packageJson.dependencies).forEach(([name, version]) => {
        deps.push({
          name,
          version: version as string,
          type: "dependency",
        });
      });
    }

    // Development dependencies
    if (packageJson.devDependencies) {
      Object.entries(packageJson.devDependencies).forEach(([name, version]) => {
        deps.push({
          name,
          version: version as string,
          type: "devDependency",
        });
      });
    }

    // Peer dependencies
    if (packageJson.peerDependencies) {
      Object.entries(packageJson.peerDependencies).forEach(([name, version]) => {
        deps.push({
          name,
          version: version as string,
          type: "peerDependency",
        });
      });
    }

    return deps;
  }

  private findConfigFiles(projectPath: string): string[] {
    const configFiles: string[] = [];

    const commonConfigFiles = [
      // TypeScript
      "tsconfig.json",
      "tsconfig.build.json",

      // Next.js
      "next.config.js",
      "next.config.ts",
      "next.config.mjs",

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

      // Testing
      "vitest.config.ts",
      "vitest.config.js",
      "jest.config.js",
      "jest.config.ts",
      "playwright.config.ts",

      // Build tools
      "vite.config.ts",
      "vite.config.js",
      "webpack.config.js",
      "rollup.config.js",

      // Other
      ".gitignore",
      ".env.example",
      ".env.local",
      "README.md",
    ];

    commonConfigFiles.forEach((file) => {
      if (existsSync(join(projectPath, file))) {
        configFiles.push(file);
      }
    });

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

  private hasSupabaseVectorConfig(projectPath: string): boolean {
    // Check for Supabase migration files that might contain vector extensions
    const supabaseMigrationDir = join(projectPath, "supabase", "migrations");
    if (existsSync(supabaseMigrationDir)) {
      try {
        const { readdirSync, readFileSync } = require("fs");
        const migrationFiles = readdirSync(supabaseMigrationDir);

        return migrationFiles.some((file: string) => {
          if (file.endsWith(".sql")) {
            const content = readFileSync(join(supabaseMigrationDir, file), "utf8");
            return content.includes("vector") || content.includes("embedding");
          }
          return false;
        });
      } catch (error) {
        this.logger.debug("Could not check Supabase migrations for vector config");
        return false;
      }
    }
    return false;
  }
}
