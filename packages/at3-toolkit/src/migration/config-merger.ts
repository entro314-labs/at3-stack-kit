import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { parse as parseToml } from "toml";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import type { Logger } from "../utils/logger.js";

export class ConfigMerger {
  constructor(private logger: Logger) {}

  async mergeJsonConfig(
    targetPath: string,
    newConfig: any,
    strategy: "merge" | "overwrite" = "merge"
  ): Promise<void> {
    if (!existsSync(targetPath)) {
      writeFileSync(targetPath, JSON.stringify(newConfig, null, 2));
      this.logger.debug(`Created new config file: ${targetPath}`);
      return;
    }

    if (strategy === "overwrite") {
      writeFileSync(targetPath, JSON.stringify(newConfig, null, 2));
      this.logger.debug(`Overwrote config file: ${targetPath}`);
      return;
    }

    try {
      const existingConfig = JSON.parse(readFileSync(targetPath, "utf8"));
      const mergedConfig = this.deepMerge(existingConfig, newConfig);

      writeFileSync(targetPath, JSON.stringify(mergedConfig, null, 2));
      this.logger.debug(`Merged config file: ${targetPath}`);
    } catch (error) {
      this.logger.warn(`Failed to parse existing config ${targetPath}, overwriting`);
      writeFileSync(targetPath, JSON.stringify(newConfig, null, 2));
    }
  }

  async mergePackageJson(targetPath: string, updates: any): Promise<void> {
    if (!existsSync(targetPath)) {
      throw new Error(`package.json not found at ${targetPath}`);
    }

    try {
      const packageJson = JSON.parse(readFileSync(targetPath, "utf8"));

      // Merge dependencies
      if (updates.dependencies) {
        packageJson.dependencies = {
          ...packageJson.dependencies,
          ...updates.dependencies,
        };
      }

      if (updates.devDependencies) {
        packageJson.devDependencies = {
          ...packageJson.devDependencies,
          ...updates.devDependencies,
        };
      }

      // Merge scripts
      if (updates.scripts) {
        packageJson.scripts = {
          ...packageJson.scripts,
          ...updates.scripts,
        };
      }

      // Remove conflicting dependencies
      if (updates.removeDependencies) {
        for (const dep of updates.removeDependencies) {
          delete packageJson.dependencies?.[dep];
          delete packageJson.devDependencies?.[dep];
        }
      }

      // Update other fields
      const fieldsToUpdate = ["engines", "packageManager", "type"];
      fieldsToUpdate.forEach((field) => {
        if (updates[field]) {
          packageJson[field] = updates[field];
        }
      });

      writeFileSync(targetPath, JSON.stringify(packageJson, null, 2));
      this.logger.success("Updated package.json");
    } catch (error) {
      throw new Error(`Failed to update package.json: ${error}`);
    }
  }

  async mergeYamlConfig(
    targetPath: string,
    newConfig: any,
    strategy: "merge" | "overwrite" = "merge"
  ): Promise<void> {
    if (!existsSync(targetPath)) {
      writeFileSync(targetPath, stringifyYaml(newConfig));
      return;
    }

    if (strategy === "overwrite") {
      writeFileSync(targetPath, stringifyYaml(newConfig));
      return;
    }

    try {
      const existingConfig = parseYaml(readFileSync(targetPath, "utf8"));
      const mergedConfig = this.deepMerge(existingConfig, newConfig);

      writeFileSync(targetPath, stringifyYaml(mergedConfig));
      this.logger.debug(`Merged YAML config: ${targetPath}`);
    } catch (error) {
      this.logger.warn(`Failed to parse existing YAML config ${targetPath}, overwriting`);
      writeFileSync(targetPath, stringifyYaml(newConfig));
    }
  }

  async mergeTextConfig(
    targetPath: string,
    newContent: string,
    strategy: "merge" | "overwrite" = "overwrite"
  ): Promise<void> {
    if (!existsSync(targetPath) || strategy === "overwrite") {
      writeFileSync(targetPath, newContent);
      return;
    }

    // For text files, we typically append or replace sections
    const existingContent = readFileSync(targetPath, "utf8");

    // Simple merge strategy for CSS/config files
    if (targetPath.endsWith(".css")) {
      const mergedContent = this.mergeCssContent(existingContent, newContent);
      writeFileSync(targetPath, mergedContent);
    } else {
      // For other text files, append with separator
      const mergedContent = existingContent + "\n\n" + newContent;
      writeFileSync(targetPath, mergedContent);
    }
  }

  private mergeCssContent(existing: string, newContent: string): string {
    // Remove existing Tailwind imports if present
    const withoutOldImports = existing.replace(/@import\s+["']tailwindcss[^"']*["'];?\s*/g, "");

    // Add new content at the beginning
    return newContent + "\n\n" + withoutOldImports.trim();
  }

  private deepMerge(target: any, source: any): any {
    if (typeof target !== "object" || target === null) {
      return source;
    }

    if (typeof source !== "object" || source === null) {
      return target;
    }

    const result = { ...target };

    for (const key in source) {
      if (Array.isArray(source[key])) {
        result[key] = Array.isArray(target[key])
          ? [...new Set([...target[key], ...source[key]])]
          : source[key];
      } else if (typeof source[key] === "object" && source[key] !== null) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }

  async detectConfigType(
    filePath: string
  ): Promise<"json" | "yaml" | "toml" | "js" | "ts" | "css" | "text"> {
    const extension = filePath.split(".").pop()?.toLowerCase();

    switch (extension) {
      case "json":
      case "jsonc":
        return "json";
      case "yaml":
      case "yml":
        return "yaml";
      case "toml":
        return "toml";
      case "js":
      case "mjs":
        return "js";
      case "ts":
        return "ts";
      case "css":
        return "css";
      default:
        return "text";
    }
  }

  async backupFile(filePath: string, backupDir: string): Promise<string> {
    const fileName = filePath.split("/").pop() || "unknown";
    const backupPath = join(backupDir, fileName);

    if (existsSync(filePath)) {
      const content = readFileSync(filePath);
      writeFileSync(backupPath, content);
      this.logger.debug(`Backed up: ${fileName}`);
    }

    return backupPath;
  }
}
