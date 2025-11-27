export interface MigrationOptions {
  projectPath: string;
  interactive?: boolean;
  overwrite?: boolean;
  skipDeps?: boolean;
  updateVersions?: boolean;
  replaceLinting?: boolean;
  dryRun?: boolean;
  force?: boolean;
  verbose?: boolean;
  configPath?: string;
  backupDir?: string;
}

export interface ProjectInfo {
  path: string;
  type: ProjectType;
  packageManager: PackageManager;
  dependencies: DependencyInfo[];
  configFiles: string[];
  hasTypeScript: boolean;
  hasNextJs: boolean;
  hasReact: boolean;
  hasVue: boolean;
  hasTailwind: boolean;
  hasEslint: boolean;
  hasPrettier: boolean;
  hasBiome: boolean;
  hasAISupport: boolean;
  hasSupabase: boolean;
  hasEdgeRuntime: boolean;
  hasVectorDB: boolean;
  // Extended detection fields
  hasDrizzle?: boolean;
  hasPrisma?: boolean;
  authProvider?: AuthProvider;
  hasTRPC?: boolean;
  hasPWA?: boolean;
  hasI18n?: boolean;
  hasTesting?: TestingInfo;
}

export type AuthProvider = "supabase" | "clerk" | "better-auth" | "next-auth" | "lucia" | "none";

export interface TestingInfo {
  unit: "vitest" | "jest" | "none";
  e2e: "playwright" | "cypress" | "none";
}

export type ProjectType =
  | "ait3e"
  | "nextjs"
  | "react"
  | "vue"
  | "nuxt"
  | "vite"
  | "webpack"
  | "node"
  | "unknown";

export type PackageManager = "pnpm" | "npm" | "yarn" | "bun";

export interface DependencyInfo {
  name: string;
  version: string;
  type: "dependency" | "devDependency" | "peerDependency";
  current?: string;
  latest?: string;
}

export interface MigrationStep {
  id: string;
  name: string;
  description: string;
  required: boolean;
  execute: (options: MigrationOptions) => Promise<void>;
}

export interface MigrationPlan {
  steps: MigrationStep[];
  conflicts: ConflictInfo[];
  backupFiles: string[];
}

export interface ConflictInfo {
  file: string;
  type: "overwrite" | "merge" | "rename";
  description: string;
  resolution: "auto" | "manual" | "skip";
}

export interface ConfigTemplate {
  name: string;
  path: string;
  content: string;
  type: "json" | "js" | "ts" | "css" | "yaml" | "toml" | "text";
  merge?: boolean;
}

export interface BackupInfo {
  timestamp: string;
  files: string[];
  migrationId: string;
  canRollback: boolean;
}

export interface MigrationResult {
  success: boolean;
  steps: MigrationStepResult[];
  backupPath?: string;
  errors: MigrationError[];
  warnings: string[];
}

export interface MigrationStepResult {
  stepId: string;
  success: boolean;
  error?: string;
  filesModified: string[];
  duration: number;
}

export interface MigrationError {
  step: string;
  message: string;
  file?: string;
  code?: string;
  severity: "error" | "warning";
}
