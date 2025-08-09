/**
 * Integration utilities for at3-toolkit
 * Enables smart detection and suggestions for other AT3 tools
 */

import { existsSync } from "fs";
import { join } from "path";
import type { ProjectInfo } from "../types/migration.js";
import { colors, style } from "./cli-styling.js";

export interface AT3Config {
  version: string;
  created: string;
  template?: string;
  features: string[];
  toolsUsed: string[];
  suggestedWorkflows?: string[];
  lastMigration?: string;
  lastToolkitRun?: string;
}

/**
 * Update AT3 configuration after toolkit operations
 */
export function updateAT3Config(projectPath: string, operation: string): AT3Config {
  const configPath = join(projectPath, ".at3-config.json");
  let config: AT3Config;

  if (existsSync(configPath)) {
    try {
      config = JSON.parse(require("fs").readFileSync(configPath, "utf8"));
    } catch {
      config = createDefaultConfig();
    }
  } else {
    config = createDefaultConfig();
  }

  // Update config
  config.toolsUsed = [...new Set([...config.toolsUsed, "@entro314-labs/at3t"])];
  config.lastToolkitRun = new Date().toISOString();

  if (operation === "migrate") {
    config.lastMigration = new Date().toISOString();
  }

  // Write config file (optional for integration)
  try {
    require("fs").writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch {
    // Silently fail - integration is optional
  }

  return config;
}

function createDefaultConfig(): AT3Config {
  return {
    version: "0.1.0",
    created: new Date().toISOString(),
    features: [],
    toolsUsed: ["@entro314-labs/at3t"],
  };
}

/**
 * Detect if project was created with AT3 tools
 */
export function detectAT3Project(projectPath: string): AT3Config | null {
  const configPath = join(projectPath, ".at3-config.json");

  if (!existsSync(configPath)) {
    return null;
  }

  try {
    const config = JSON.parse(require("fs").readFileSync(configPath, "utf8"));
    return config;
  } catch {
    return null;
  }
}

/**
 * Suggest complementary AT3 tools based on project analysis
 */
export function suggestAT3Tools(projectInfo: ProjectInfo): string[] {
  const suggestions: string[] = [];
  const at3Config = detectAT3Project(projectInfo.path);

  // Suggest create-at3-app for new projects
  if (!at3Config?.toolsUsed?.includes("create-at3-app")) {
    suggestions.push(
      `${colors.info("💡 Tip:")} For new AT3 projects, use ${style.command("create-at3-app")} to start with optimized templates`
    );
  }

  // Suggest at3-stack-kit for adding features
  if (projectInfo.type === "nextjs" || projectInfo.type === "react") {
    if (!at3Config?.toolsUsed?.includes("at3-stack-kit")) {
      suggestions.push(
        `${colors.info("💡 Tip:")} Use ${style.command("at3-kit")} to upgrade your project with AI, edge, and modern AT3 features`
      );
    }
  }

  // Suggest specific features based on project gaps
  if (projectInfo.type !== "ait3e") {
    const missingFeatures = [];
    if (!projectInfo.hasSupabase) missingFeatures.push("Supabase");
    if (!projectInfo.hasAISupport) missingFeatures.push("AI integration");

    if (missingFeatures.length > 0) {
      suggestions.push(
        `${colors.info("💡 Enhancement:")} Consider adding ${missingFeatures.join(", ")} with at3-kit`
      );
    }
  }

  return suggestions;
}

/**
 * Get workflow recommendations based on project state and toolkit operations
 */
export function getWorkflowRecommendations(projectInfo: ProjectInfo, operation: string): string[] {
  const workflows: string[] = [];
  const at3Config = detectAT3Project(projectInfo.path);

  switch (operation) {
    case "migrate":
      workflows.push("Review the migration changes and test your project");
      workflows.push(
        `Run ${style.command(projectInfo.packageManager + " run build")} to verify everything works`
      );

      if (projectInfo.hasSupabase) {
        workflows.push("Update your Supabase configuration if needed");
      }

      if (projectInfo.hasAISupport) {
        workflows.push("Verify your AI provider configurations");
      }
      break;

    case "detect":
      if (projectInfo.type === "ait3e") {
        workflows.push("Your project is already using the complete AT3 stack!");
        workflows.push("Use toolkit commands to maintain and optimize your setup");
      } else {
        workflows.push("Consider migrating to AT3 stack for enhanced capabilities");
        workflows.push(`Use ${style.command("at3t migrate")} to start the migration process`);
      }
      break;

    case "rollback":
      workflows.push("Rollback completed - verify your project is in the expected state");
      workflows.push("You can re-run migration with different options if needed");
      break;
  }

  // Add tool suggestions if not already provided
  if (!at3Config || at3Config.toolsUsed.length === 1) {
    workflows.push(...suggestAT3Tools(projectInfo));
  }

  return workflows;
}
