#!/usr/bin/env node

/**
 * AT3 Stack Kit - Development Server
 * Enhanced development experience with better CLI feedback
 */

const { spawn } = require("child_process");
const CLIUtils = require("./cli-utils");
const chalk = require("chalk");

async function startDev() {
  CLIUtils.header("Starting Development Server");

  // Environment check
  CLIUtils.printEnvInfo();

  // Check for required files
  const fs = require("fs");
  const requiredFiles = ["next.config.ts", "package.json", ".env.local"];

  const missingFiles = requiredFiles.filter((file) => !fs.existsSync(file));

  if (missingFiles.length > 0) {
    CLIUtils.warning("Missing configuration files:", missingFiles.join(", "));

    if (missingFiles.includes(".env.local")) {
      CLIUtils.info("Creating .env.local from template...");

      if (fs.existsSync("env.example")) {
        fs.copyFileSync("env.example", ".env.local");
        CLIUtils.success(".env.local created from env.example");
      } else {
        CLIUtils.error("env.example not found. Please create .env.local manually.");
        process.exit(1);
      }
    }
  }

  // Start development server
  CLIUtils.step("Starting Next.js development server...");
  CLIUtils.info("Server will be available at http://localhost:3000");

  console.log("");
  CLIUtils.divider("═", 60);

  const devProcess = spawn("next", ["dev"], {
    stdio: "inherit",
    env: { ...process.env, FORCE_COLOR: "1" },
  });

  // Handle process events
  devProcess.on("error", (error) => {
    CLIUtils.error("Failed to start development server", error.message);
    process.exit(1);
  });

  devProcess.on("close", (code) => {
    if (code !== 0) {
      CLIUtils.error(`Development server exited with code ${code}`);
    } else {
      CLIUtils.success("Development server stopped");
    }
  });

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n");
    CLIUtils.info("Shutting down development server...");
    devProcess.kill("SIGINT");
  });

  process.on("SIGTERM", () => {
    console.log("\n");
    CLIUtils.info("Shutting down development server...");
    devProcess.kill("SIGTERM");
  });
}

// Run if called directly
if (require.main === module) {
  startDev().catch((error) => {
    CLIUtils.error("Failed to start development server", error.message);
    process.exit(1);
  });
}

module.exports = startDev;
