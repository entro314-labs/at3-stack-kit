// Main library exports for programmatic usage

import type { MigrationOptions } from "./types/migration.js";

export { ProjectDetector } from "./detection/detector.js";
export { ConfigMerger } from "./migration/config-merger.js";
export { MigrationRunner } from "./migration/runner.js";
export type {
  BackupInfo,
  ConfigTemplate,
  ConflictInfo,
  DependencyInfo,
  MigrationError,
  MigrationOptions,
  MigrationPlan,
  MigrationResult,
  MigrationStep,
  MigrationStepResult,
  PackageManager,
  ProjectInfo,
  ProjectType,
} from "./types/migration.js";
export { Logger } from "./utils/logger.js";

// Convenience functions for common use cases
export async function migrateProject(projectPath: string, options: Partial<MigrationOptions> = {}) {
  const { MigrationRunner } = await import("./migration/runner.js");
  const { Logger } = await import("./utils/logger.js");

  const logger = new Logger(options.verbose || false);
  const runner = new MigrationRunner(logger);

  const migrationOptions: MigrationOptions = {
    projectPath,
    interactive: false,
    overwrite: false,
    skipDeps: false,
    updateVersions: true,
    replaceLinting: false,
    dryRun: false,
    force: false,
    verbose: false,
    ...options,
  };

  return await runner.migrate(migrationOptions);
}

export async function detectProject(projectPath: string) {
  const { ProjectDetector } = await import("./detection/detector.js");
  const { Logger } = await import("./utils/logger.js");

  const detector = new ProjectDetector(new Logger(false));
  return await detector.detectProject(projectPath);
}

export async function rollbackProject(projectPath: string, force: boolean = false) {
  const { MigrationRunner } = await import("./migration/runner.js");
  const { Logger } = await import("./utils/logger.js");

  const logger = new Logger(false);
  const runner = new MigrationRunner(logger);

  return await runner.rollback(projectPath, force);
}
