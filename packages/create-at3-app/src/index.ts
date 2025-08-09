#!/usr/bin/env node

/**
 * create-at3-app
 * Create AT3 (AIT3E) apps with a single command
 */

import { existsSync, promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  cancel,
  confirm,
  intro,
  isCancel,
  note,
  outro,
  select,
  spinner,
  text,
} from "@clack/prompts";
import chalk from "chalk";
import { program } from "commander";
import spawn from "cross-spawn";
import { detect as detectPackageManager } from "detect-package-manager";
import validateNpmPackageName from "validate-npm-package-name";
import { formatFeatures } from "./utils/cli-styling.js";
import { createAT3Config, getWorkflowSuggestions, suggestAT3Tools } from "./utils/integration.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Template configurations
const TEMPLATES = {
  t3: {
    name: "T3 Base",
    description: "Classic T3 stack: Next.js + TypeScript + Tailwind + tRPC",
    features: ["nextjs", "typescript", "tailwind", "trpc"],
  },
  "t3-edge": {
    name: "T3 + Edge",
    description: "T3 stack + Supabase for edge-first deployment",
    features: ["nextjs", "typescript", "tailwind", "supabase", "edge"],
  },
  "t3-ai-custom": {
    name: "T3 + AI (Custom)",
    description: "T3 + custom AI integration with multiple providers",
    features: ["nextjs", "typescript", "tailwind", "custom-ai", "openai", "anthropic"],
  },
  "t3-ai-vercel": {
    name: "T3 + AI (Vercel SDK)",
    description: "T3 + Vercel AI SDK integration",
    features: ["nextjs", "typescript", "tailwind", "vercel-ai", "streaming"],
  },
  "t3-ai-both": {
    name: "T3 + AI (Both)",
    description: "T3 + both custom AI and Vercel SDK integration",
    features: ["nextjs", "typescript", "tailwind", "custom-ai", "vercel-ai", "streaming"],
  },
  suggested: {
    name: "AT3 Suggested",
    description: "Everything included: T3 + Supabase + AI + PWA + i18n + testing",
    features: [
      "nextjs",
      "typescript",
      "tailwind",
      "supabase",
      "custom-ai",
      "vercel-ai",
      "pwa",
      "i18n",
      "testing",
      "edge",
    ],
  },
  "83-flavor": {
    name: "83 Flavor",
    description: "Signature stack: T3 + Supabase/Vercel Edge + Vercel AI SDK",
    features: [
      "nextjs",
      "typescript",
      "tailwind",
      "supabase",
      "vercel-edge",
      "vercel-ai",
      "streaming",
    ],
  },
} as const;

type Template = keyof typeof TEMPLATES;
type PackageManager = "pnpm" | "npm" | "yarn";

interface CreateAppParams {
  projectName: string;
  projectDir: string;
  template: Template;
  packageManager: PackageManager;
  installDeps: boolean;
  setupSupabase: boolean;
  skipGit: boolean;
}

/**
 * Main interactive setup flow
 */
async function main() {
  console.clear();

  intro(chalk.bgCyan.black(" create-at3-app "));

  // Get project name
  const projectName = await text({
    message: "What is your project named?",
    placeholder: "my-at3-app",
    validate(value) {
      if (!value) return "Project name is required";

      const validation = validateNpmPackageName(value);
      if (!validation.validForNewPackages) {
        return "Invalid project name. Use lowercase letters, numbers, and hyphens only.";
      }
      return;
    },
  });

  if (isCancel(projectName)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  // Get template selection
  const template = await select({
    message: "Which template would you like to use?",
    options: Object.entries(TEMPLATES).map(([key, template]) => ({
      value: key,
      label: template.name,
      hint: template.description,
    })),
  });

  if (isCancel(template)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  // Detect or ask for package manager preference
  let detectedPackageManager: PackageManager = "pnpm";
  try {
    detectedPackageManager = (await detectPackageManager({ cwd: process.cwd() })) as PackageManager;
  } catch {
    // Fall back to file-based detection
    if (existsSync(path.join(process.cwd(), "pnpm-lock.yaml"))) detectedPackageManager = "pnpm";
    else if (existsSync(path.join(process.cwd(), "yarn.lock"))) detectedPackageManager = "yarn";
    else if (existsSync(path.join(process.cwd(), "package-lock.json")))
      detectedPackageManager = "npm";
  }

  const packageManager = await select({
    message: "Which package manager would you like to use?",
    options: [
      { value: "pnpm", label: "pnpm", hint: "Recommended - fast and efficient" },
      { value: "npm", label: "npm", hint: "Default Node.js package manager" },
      { value: "yarn", label: "yarn", hint: "Popular alternative" },
    ],
    initialValue: detectedPackageManager,
  });

  if (isCancel(packageManager)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  // Ask about dependency installation
  const installDeps = await confirm({
    message: "Install dependencies?",
    initialValue: true,
  });

  if (isCancel(installDeps)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  // Ask about Supabase setup
  const setupSupabase = await confirm({
    message: "Set up Supabase project?",
    initialValue: true,
  });

  if (isCancel(setupSupabase)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  // Ask about Git initialization
  const skipGit = await confirm({
    message: "Initialize Git repository?",
    initialValue: true,
  });

  if (isCancel(skipGit)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  const projectDir = path.resolve(process.cwd(), projectName);

  // Check if directory exists
  try {
    await fs.access(projectDir);
    const overwrite = await confirm({
      message: `Directory ${projectName} already exists. Overwrite?`,
      initialValue: false,
    });

    if (isCancel(overwrite) || !overwrite) {
      cancel("Operation cancelled.");
      process.exit(0);
    }
  } catch {
    // Directory doesn't exist, continue
  }

  // Create the app
  await createApp({
    projectName,
    projectDir,
    template: template as Template,
    packageManager: packageManager as PackageManager,
    installDeps,
    setupSupabase,
    skipGit: !skipGit,
  });

  // Create AT3 configuration for project tracking
  const selectedTemplate = TEMPLATES[template as Template];
  createAT3Config(projectDir, {
    template: template as string,
    features: [...selectedTemplate.features],
    toolsUsed: ["create-at3-app"],
  });

  // Get tool suggestions and workflows
  const toolSuggestions = suggestAT3Tools(template as string, [...selectedTemplate.features]);
  const _workflows = getWorkflowSuggestions(template as string);

  outro(chalk.green("🎉 Your AT3 app is ready!"));

  note(
    `
${chalk.cyan("Next steps:")}

  ${chalk.dim("1.")} cd ${projectName}
  ${chalk.dim("2.")} Copy .env.example to .env.local and add your API keys
  ${chalk.dim("3.")} ${packageManager} dev

${chalk.cyan("Template features:")}
  ${formatFeatures([...selectedTemplate.features])}

${chalk.cyan("Documentation:")}
  ${chalk.dim("•")} Getting Started: https://at3-stack.dev/docs/getting-started
  ${chalk.dim("•")} AI Integration: https://at3-stack.dev/docs/ai-integration
  ${chalk.dim("•")} Deployment: https://at3-stack.dev/docs/deployment

${
  toolSuggestions.length > 0
    ? `${chalk.cyan("AT3 Ecosystem:")}
  ${toolSuggestions.map((s) => `${chalk.dim("•")} ${s}`).join("\n  ")}

`
    : ""
}${chalk.cyan("Community:")}
  ${chalk.dim("•")} GitHub: https://github.com/entro314-labs/at3-stack-kit
  ${chalk.dim("•")} Discord: https://discord.gg/at3-stack
  `,
    "Welcome to AT3!"
  );
}

/**
 * Create the AT3 app with the given parameters
 */
async function createApp(params: CreateAppParams) {
  const { projectName, projectDir, template, packageManager, installDeps, setupSupabase, skipGit } =
    params;

  const s = spinner();

  try {
    // Create project structure
    s.start("Creating project structure...");
    await copyTemplate(template, projectDir);
    s.stop("Project structure created");

    // Update package.json
    s.start("Updating package.json...");
    await updatePackageJson(projectDir, projectName);
    s.stop("package.json updated");

    // Initialize Git
    if (!skipGit) {
      s.start("Initializing Git repository...");
      await initGit(projectDir);
      s.stop("Git repository initialized");
    }

    // Install dependencies
    if (installDeps) {
      s.start(`Installing dependencies with ${packageManager}...`);
      await installDependencies(projectDir, packageManager);
      s.stop("Dependencies installed");
    }

    // Setup Supabase
    if (setupSupabase) {
      s.start("Setting up Supabase...");
      await setupSupabaseProject(projectDir, packageManager);
      s.stop("Supabase configured");
    }
  } catch (error) {
    s.stop("Error occurred");
    console.error(chalk.red("Error creating app:"), error);
    process.exit(1);
  }
}

/**
 * Copy template files to the project directory
 */
async function copyTemplate(template: Template, projectDir: string) {
  // Try to find template-specific directory first
  const templateDir = path.resolve(__dirname, `../templates/${template}`);
  let sourceDir: string;

  try {
    await fs.access(templateDir);
    sourceDir = templateDir;
  } catch {
    // Fall back to using the monorepo root as template
    sourceDir = path.resolve(__dirname, "../../../");
  }

  await fs.cp(sourceDir, projectDir, {
    recursive: true,
    filter: (src) => {
      const basename = path.basename(src);
      const skipList = [
        "node_modules",
        ".git",
        ".next",
        "dist",
        "build",
        ".turbo",
        ".env.local",
        "packages", // Don't copy the packages directory
      ];
      return !skipList.includes(basename);
    },
  });

  // Ensure .env.example exists
  const envExamplePath = path.join(projectDir, ".env.example");
  try {
    await fs.access(envExamplePath);
  } catch {
    // Create a basic .env.example if it doesn't exist
    const envContent = `# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Providers (choose one or more)
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
GOOGLE_AI_API_KEY=your_google_ai_api_key

# Optional: OpenRouter for additional models
OPENROUTER_API_KEY=your_openrouter_api_key

# Analytics (optional)
NEXT_PUBLIC_VERCEL_ANALYTICS=true
NEXT_PUBLIC_GA_ID=your_google_analytics_id

# Other
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
`;
    await fs.writeFile(envExamplePath, envContent);
  }
}

/**
 * Update package.json with project name and version
 */
async function updatePackageJson(projectDir: string, projectName: string) {
  const packageJsonPath = path.join(projectDir, "package.json");
  const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf-8"));

  packageJson.name = projectName;
  packageJson.version = "0.1.0";
  packageJson.author = undefined; // Remove template author

  await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

/**
 * Initialize Git repository
 */
function initGit(projectDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("git", ["init"], {
      cwd: projectDir,
      stdio: "ignore",
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Git init failed with code ${code}`));
      }
    });
  });
}

/**
 * Install dependencies using the specified package manager
 */
function installDependencies(projectDir: string, packageManager: PackageManager): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(packageManager, ["install"], {
      cwd: projectDir,
      stdio: "inherit",
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Package installation failed with code ${code}`));
      }
    });
  });
}

/**
 * Setup Supabase project
 */
function setupSupabaseProject(projectDir: string, packageManager: PackageManager): Promise<void> {
  return new Promise((resolve, _reject) => {
    const child = spawn(packageManager, ["dlx", "supabase", "init"], {
      cwd: projectDir,
      stdio: "inherit",
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        console.warn(
          chalk.yellow("Warning: Supabase setup failed. You can set it up manually later.")
        );
        resolve(); // Don't fail the entire process
      }
    });
  });
}

// CLI Setup
program
  .name("create-at3-app")
  .description("Create AT3 (AIT3E) apps with a single command")
  .version("0.1.0")
  .argument("[project-name]", "Name of the project")
  .option("-t, --template <template>", "Template to use", "minimal")
  .option("--pm <package-manager>", "Package manager to use", "pnpm")
  .option("--no-install", "Skip installing dependencies")
  .option("--no-git", "Skip Git initialization")
  .option("--no-supabase", "Skip Supabase setup")
  .action(async (projectName, options) => {
    if (projectName) {
      // Non-interactive mode
      const projectDir = path.resolve(process.cwd(), projectName);

      await createApp({
        projectName,
        projectDir,
        template: options.template as Template,
        packageManager: options.pm as PackageManager,
        installDeps: options.install !== false,
        setupSupabase: options.supabase !== false,
        skipGit: options.git === false,
      });

      console.log(chalk.green(`✅ Created ${projectName} successfully!`));
    } else {
      // Interactive mode
      await main();
    }
  });

program.parse();
