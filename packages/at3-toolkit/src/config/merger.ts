import { readFile, writeFile } from "fs/promises";
import TOML from "toml";
import YAML from "yaml";
import type { Logger } from "../utils/logger.js";

export class ConfigMerger {
  constructor(private logger: Logger) {}

  async mergePackageJson(filePath: string, updates: any): Promise<any> {
    try {
      const content = await readFile(filePath, "utf8");
      const existing = JSON.parse(content);

      const merged = this.deepMerge(existing, updates);
      await writeFile(filePath, JSON.stringify(merged, null, 2));

      return merged;
    } catch (error) {
      this.logger.error(`Failed to merge package.json: ${error}`);
      throw error;
    }
  }

  async mergeJsonConfig(filePath: string, updates: any): Promise<any> {
    try {
      let existing = {};
      try {
        const content = await readFile(filePath, "utf8");
        existing = JSON.parse(content);
      } catch (error: any) {
        if (error.code !== "ENOENT") throw error;
      }

      const merged = this.deepMerge(existing, updates);
      return merged;
    } catch (error) {
      this.logger.error(`Failed to merge JSON config: ${error}`);
      throw error;
    }
  }

  async mergeBiomeConfig(filePath: string, updates: any): Promise<any> {
    return this.mergeJsonConfig(filePath, updates);
  }

  async mergeNextConfig(filePath: string, updates: any): Promise<string> {
    try {
      let content = "";
      try {
        content = await readFile(filePath, "utf8");
      } catch (error: any) {
        if (error.code !== "ENOENT") throw error;
      }

      if (filePath.endsWith(".ts")) {
        return this.mergeNextConfigTS(content, updates);
      }
      return this.mergeNextConfigJS(content, updates);
    } catch (error) {
      this.logger.error(`Failed to merge Next.js config: ${error}`);
      throw error;
    }
  }

  async mergeTailwindConfig(filePath: string, updates: any, version: "v3" | "v4"): Promise<string> {
    if (version === "v4") {
      return this.mergeTailwindV4CSS(filePath, updates);
    }
    return this.mergeTailwindV3Config(filePath, updates);
  }

  async mergeYamlConfig(filePath: string, updates: any): Promise<string> {
    try {
      let existing = {};
      try {
        const content = await readFile(filePath, "utf8");
        existing = YAML.parse(content);
      } catch (error: any) {
        if (error.code !== "ENOENT") throw error;
      }

      const merged = this.deepMerge(existing, updates);
      return YAML.stringify(merged);
    } catch (error) {
      this.logger.error(`Failed to merge YAML config: ${error}`);
      throw error;
    }
  }

  async writeConfig(filePath: string, content: any, type: "json" | "js" | "yaml"): Promise<void> {
    try {
      let output: string;

      switch (type) {
        case "json":
          output = JSON.stringify(content, null, 2);
          break;
        case "js":
          output =
            typeof content === "string"
              ? content
              : `module.exports = ${JSON.stringify(content, null, 2)};`;
          break;
        case "yaml":
          output = YAML.stringify(content);
          break;
        default:
          throw new Error(`Unsupported config type: ${type}`);
      }

      await writeFile(filePath, output);
    } catch (error) {
      this.logger.error(`Failed to write config file: ${error}`);
      throw error;
    }
  }

  async backupConfig(filePath: string): Promise<void> {
    try {
      const content = await readFile(filePath, "utf8");
      const backupPath = `${filePath}.backup.${Date.now()}`;
      await writeFile(backupPath, content);
    } catch (error) {
      this.logger.debug(`Failed to backup config file: ${error}`);
    }
  }

  validateConfig(config: any, type: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (typeof config !== "object" || config === null) {
      errors.push("Config must be an object");
      return { isValid: false, errors };
    }

    if (type === "package.json") {
      if (!config.name) errors.push("Missing required field: name");
      if (!config.version) errors.push("Missing required field: version");
    }

    return { isValid: errors.length === 0, errors };
  }

  private deepMerge(target: any, source: any): any {
    const result = { ...target };

    for (const key in source) {
      if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }

  private mergeNextConfigTS(content: string, updates: any): string {
    if (!content) {
      return `import type { NextConfig } from 'next';

const nextConfig: NextConfig = ${JSON.stringify(updates, null, 2)};

export default nextConfig;`;
    }

    // Simple merge for existing content
    const configMatch = content.match(/const\s+\w+Config:\s*NextConfig\s*=\s*({[\s\S]*?});/);
    if (configMatch && configMatch[1]) {
      try {
        const existing = JSON.parse(configMatch[1]);
        const merged = this.deepMerge(existing, updates);
        return content.replace(configMatch[1], JSON.stringify(merged, null, 2));
      } catch {
        // Fallback if parsing fails
        return content;
      }
    }

    return content;
  }

  private mergeNextConfigJS(content: string, updates: any): string {
    if (!content) {
      return `module.exports = ${JSON.stringify(updates, null, 2)};`;
    }
    return content; // Simple fallback
  }

  private async mergeTailwindV4CSS(filePath: string, updates: any): Promise<string> {
    let content = "";
    try {
      content = await readFile(filePath, "utf8");
    } catch (error: any) {
      if (error.code !== "ENOENT") throw error;
    }

    if (!content) {
      content =
        '@import "tailwindcss";\n\n@theme {\n  --color-primary: hsl(222.2 47.4% 11.2%);\n}\n';
    }

    // Simple theme merging for v4
    if (updates.theme) {
      let themeSection = content.match(/@theme\s*{([^}]*)}/)?.[1] || "";
      for (const [key, value] of Object.entries(updates.theme)) {
        if (!themeSection.includes(key)) {
          themeSection += `\n  ${key}: ${value};`;
        }
      }
      if (content.includes("@theme")) {
        content = content.replace(/@theme\s*{[^}]*}/, `@theme {${themeSection}\n}`);
      } else {
        content += `\n@theme {${themeSection}\n}`;
      }
    }

    return content;
  }

  private mergeTailwindV3Config(filePath: string, updates: any): string {
    // Placeholder for v3 config merging
    return `module.exports = ${JSON.stringify(updates, null, 2)};`;
  }
}
