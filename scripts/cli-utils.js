/**
 * AT3 Stack Kit - CLI Utilities
 * Modern CLI aesthetics with reliable cross-platform support
 */

const chalk = require("chalk");
const boxen = require("boxen");
const figures = require("figures");
const gradient = require("gradient-string").default || require("gradient-string");
const ora = require("ora");

// AT3 Brand Colors
const AT3_COLORS = {
  primary: "#6366F1",
  secondary: "#10B981",
  accent: "#F59E0B",
  error: "#EF4444",
  warning: "#F59E0B",
  success: "#10B981",
  info: "#3B82F6",
  muted: "#6B7280",
};

// Unicode Symbols (Cross-platform Safe)
const symbols = {
  success: figures.tick,
  error: figures.cross,
  warning: figures.warning,
  info: figures.info,
  arrow: figures.arrowRight,
  bullet: figures.bullet,
  star: figures.star,
  heart: figures.heart,
  pointer: figures.pointer,
  radioOn: figures.radioOn,
  radioOff: figures.radioOff,
  checkboxOn: figures.checkboxOn,
  checkboxOff: figures.checkboxOff,
  triangleUp: figures.triangleUp,
  triangleDown: figures.triangleDown,
};

// AT3 Gradient
const at3Gradient = gradient(["#6366F1", "#10B981", "#F59E0B"]);

class CLIUtils {
  /**
   * Print AT3 branded header
   */
  static header(title) {
    const logo = `
 █████╗ ████████╗██████╗ 
██╔══██╗╚══██╔══╝╚════██╗
███████║   ██║    █████╔╝
██╔══██║   ██║    ╚═══██╗
██║  ██║   ██║   ██████╔╝
╚═╝  ╚═╝   ╚═╝   ╚═════╝ 
    `;

    console.log("\n");
    console.log(at3Gradient(logo));
    console.log(chalk.bold.hex(AT3_COLORS.primary)(title));
    console.log(chalk.hex(AT3_COLORS.muted)("AI-native T3 stack for edge deployment"));
    console.log("\n");
  }

  /**
   * Success message with icon
   */
  static success(message, details = "") {
    console.log(chalk.hex(AT3_COLORS.success)(`${symbols.success} ${message}`));
    if (details) {
      console.log(chalk.hex(AT3_COLORS.muted)(`  ${details}`));
    }
  }

  /**
   * Error message with icon
   */
  static error(message, details = "") {
    console.log(chalk.hex(AT3_COLORS.error)(`${symbols.error} ${message}`));
    if (details) {
      console.log(chalk.hex(AT3_COLORS.muted)(`  ${details}`));
    }
  }

  /**
   * Warning message with icon
   */
  static warning(message, details = "") {
    console.log(chalk.hex(AT3_COLORS.warning)(`${symbols.warning} ${message}`));
    if (details) {
      console.log(chalk.hex(AT3_COLORS.muted)(`  ${details}`));
    }
  }

  /**
   * Info message with icon
   */
  static info(message, details = "") {
    console.log(chalk.hex(AT3_COLORS.info)(`${symbols.info} ${message}`));
    if (details) {
      console.log(chalk.hex(AT3_COLORS.muted)(`  ${details}`));
    }
  }

  /**
   * Step message with arrow
   */
  static step(message, details = "") {
    console.log(chalk.hex(AT3_COLORS.primary)(`${symbols.arrow} ${message}`));
    if (details) {
      console.log(chalk.hex(AT3_COLORS.muted)(`  ${details}`));
    }
  }

  /**
   * Create a spinner with AT3 branding
   */
  static spinner(text) {
    return ora({
      text: chalk.hex(AT3_COLORS.primary)(text),
      color: "blue",
      spinner: "dots",
    });
  }

  /**
   * Create a boxed message
   */
  static box(message, options = {}) {
    const defaultOptions = {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: AT3_COLORS.primary,
      backgroundColor: "#1F2937",
      ...options,
    };

    console.log(boxen(chalk.white(message), defaultOptions));
  }

  /**
   * Print a divider
   */
  static divider(char = "─", length = 50) {
    console.log(chalk.hex(AT3_COLORS.muted)(char.repeat(length)));
  }

  /**
   * Format time duration
   */
  static formatTime(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  }

  /**
   * Create a progress logger
   */
  static createProgressLogger() {
    let current = 0;
    let total = 0;
    let startTime = Date.now();

    return {
      start(totalSteps) {
        total = totalSteps;
        current = 0;
        startTime = Date.now();
        console.log(chalk.hex(AT3_COLORS.muted)(`Starting ${total} tasks...\n`));
      },

      step(message) {
        current++;
        const percentage = Math.round((current / total) * 100);
        const elapsed = Date.now() - startTime;
        const remaining = current > 0 ? (elapsed / current) * (total - current) : 0;

        console.log(
          chalk.hex(AT3_COLORS.primary)(`[${current}/${total}]`) +
            chalk.hex(AT3_COLORS.muted)(` (${percentage}%) `) +
            chalk.white(message) +
            chalk.hex(AT3_COLORS.muted)(` • ${CLIUtils.formatTime(elapsed)} elapsed`)
        );
      },

      complete() {
        const totalTime = Date.now() - startTime;
        console.log("\n");
        CLIUtils.success(
          `All ${total} tasks completed`,
          `Total time: ${CLIUtils.formatTime(totalTime)}`
        );
      },

      fail(error) {
        const totalTime = Date.now() - startTime;
        CLIUtils.error(
          `Task ${current}/${total} failed`,
          `Time elapsed: ${CLIUtils.formatTime(totalTime)}`
        );
        if (error.message) {
          console.log(chalk.hex(AT3_COLORS.muted)(`  Error: ${error.message}`));
        }
      },
    };
  }

  /**
   * Print environment information
   */
  static printEnvInfo() {
    const nodeVersion = process.version;
    const platform = process.platform;
    const arch = process.arch;

    console.log(chalk.hex(AT3_COLORS.muted)("Environment:"));
    console.log(chalk.hex(AT3_COLORS.muted)(`  ${symbols.bullet} Node.js: ${nodeVersion}`));
    console.log(chalk.hex(AT3_COLORS.muted)(`  ${symbols.bullet} Platform: ${platform} (${arch})`));
    console.log(chalk.hex(AT3_COLORS.muted)(`  ${symbols.bullet} Directory: ${process.cwd()}`));
    console.log("");
  }

  /**
   * Create a table-like display
   */
  static table(data, headers) {
    const columnify = require("columnify");

    const table = columnify(data, {
      columnSplitter: " │ ",
      config: headers
        ? Object.fromEntries(headers.map((header) => [header, { minWidth: 15, maxWidth: 40 }]))
        : {},
    });

    console.log(chalk.hex(AT3_COLORS.muted)(table));
  }

  /**
   * Print command help
   */
  static help(commands) {
    console.log(chalk.bold.hex(AT3_COLORS.primary)("Available Commands:"));
    console.log("");

    commands.forEach(({ command, description, example }) => {
      console.log(chalk.hex(AT3_COLORS.secondary)(`  ${command}`));
      console.log(chalk.hex(AT3_COLORS.muted)(`    ${description}`));
      if (example) {
        console.log(chalk.hex(AT3_COLORS.accent)(`    Example: ${example}`));
      }
      console.log("");
    });
  }

  /**
   * Interactive confirmation
   */
  static async confirm(message, defaultValue = false) {
    const readline = require("readline");

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      const prompt = defaultValue
        ? `${symbols.warning} ${message} (Y/n): `
        : `${symbols.warning} ${message} (y/N): `;

      rl.question(chalk.hex(AT3_COLORS.warning)(prompt), (answer) => {
        rl.close();

        if (!answer.trim()) {
          resolve(defaultValue);
        } else {
          resolve(answer.toLowerCase().startsWith("y"));
        }
      });
    });
  }
}

module.exports = CLIUtils;
