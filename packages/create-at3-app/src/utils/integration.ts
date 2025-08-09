/**
 * Integration utilities for create-at3-app
 * Enables smart detection and suggestions for other AT3 tools
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { colors, style } from "./cli-styling.js";

export interface AT3Config {
  version: string;
  created: string;
  template: string;
  features: string[];
  toolsUsed: string[];
  suggestedWorkflows?: string[];
}

/**
 * Create AT3 configuration file for project tracking
 */
export function createAT3Config(
  projectPath: string,
  config: Omit<AT3Config, "version" | "created">
): AT3Config {
  const fullConfig: AT3Config = {
    version: "0.1.0",
    created: new Date().toISOString(),
    ...config,
    toolsUsed: [...new Set(["create-at3-app", ...(config.toolsUsed || [])])],
  };

  // Write config file (optional for integration)
  try {
    const configPath = join(projectPath, ".at3-config.json");
    require("node:fs").writeFileSync(configPath, JSON.stringify(fullConfig, null, 2));
  } catch {
    // Silently fail - integration is optional
  }

  return fullConfig;
}

/**
 * Detect if other AT3 tools might be useful for this project
 */
export function suggestAT3Tools(template: string, features: string[]): string[] {
  const suggestions: string[] = [];

  // Suggest at3-stack-kit for existing projects
  if (template !== "83-flavor" && template !== "suggested") {
    suggestions.push(
      `${colors.info("💡 Tip:")} Use ${style.command("at3-kit")} to upgrade existing projects to AT3 Stack`
    );
  }

  // Suggest at3-toolkit for development workflow
  if (!features.includes("testing")) {
    suggestions.push(
      `${colors.info("💡 Tip:")} Use ${style.command("@entro314-labs/at3t")} for advanced linting, testing, and development tools`
    );
  }

  return suggestions;
}

/**
 * Check if project was created with AT3 tools
 */
export function detectAT3Project(projectPath: string): AT3Config | null {
  const configPath = join(projectPath, ".at3-config.json");

  if (!existsSync(configPath)) {
    return null;
  }

  try {
    const config = JSON.parse(require("node:fs").readFileSync(configPath, "utf8"));
    return config;
  } catch {
    return null;
  }
}

/**
 * Get workflow suggestions based on project state
 */
export function getWorkflowSuggestions(template: string): string[] {
  const workflows: string[] = [];

  switch (template) {
    case "t3":
      workflows.push("Consider adding AI features with at3-kit for enhanced functionality");
      workflows.push("Use at3t for advanced TypeScript and testing configurations");
      break;
    case "83-flavor":
      workflows.push("Your project includes the full AT3 stack - ready for production!");
      workflows.push("Use at3t migrate for advanced project maintenance");
      break;
    case "suggested":
      workflows.push("Complete AT3 stack configured - explore all features");
      workflows.push("Use at3-kit to fine-tune specific features as needed");
      break;
    default:
      workflows.push("Explore at3-kit to add more AT3 features");
      workflows.push("Use at3t for development workflow optimization");
  }

  return workflows;
}
