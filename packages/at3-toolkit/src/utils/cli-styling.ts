import boxen from "boxen";
import chalk from "chalk";
import Table from "cli-table3";
import figures from "figures";
import gradient from "gradient-string";
import type { GradientUtils } from "../types/gradient.js";

// Cross-platform symbols
export const symbols = {
  success: figures.tick,
  error: figures.cross,
  warning: figures.warning,
  info: figures.info,
  arrow: figures.arrowRight,
  bullet: figures.bullet,
  pointer: figures.pointer,
  star: figures.star,
  heart: figures.heart,
  radioOn: figures.radioOn,
  radioOff: figures.radioOff,
  checkboxOn: figures.checkboxOn,
  checkboxOff: figures.checkboxOff,
} as const;

// Color schemes for AIT3E branding
export const colors = {
  primary: chalk.hex("#2563eb"), // Blue
  secondary: chalk.hex("#7c3aed"), // Purple
  success: chalk.green,
  error: chalk.red,
  warning: chalk.yellow,
  info: chalk.blue,
  muted: chalk.gray,
  accent: chalk.magenta,
  ai: chalk.hex("#10b981"), // Emerald for AI features
} as const;

// Gradient themes
const createGradients = (): GradientUtils => ({
  ait3e: gradient(["#2563eb", "#7c3aed", "#10b981"]) as any,
  primary: gradient(["#2563eb", "#1e40af"]) as any,
  success: gradient(["#10b981", "#059669"]) as any,
  rainbow: gradient.rainbow as any,
  morning: gradient.morning as any,
  atlas: gradient.atlas as any,
});

export const gradients = createGradients();

// Utility functions for consistent styling
export const style = {
  // Headers and titles
  title: (text: string) => gradients.ait3e(text),
  subtitle: (text: string) => colors.muted(text),
  header: (text: string) => colors.primary.bold(text),

  // Status indicators
  success: (text: string) => `${colors.success(symbols.success)} ${colors.success(text)}`,
  error: (text: string) => `${colors.error(symbols.error)} ${colors.error(text)}`,
  warning: (text: string) => `${colors.warning(symbols.warning)} ${colors.warning(text)}`,
  info: (text: string) => `${colors.info(symbols.info)} ${colors.info(text)}`,

  // Interactive elements
  selected: (text: string) => `${colors.primary(symbols.radioOn)} ${colors.primary(text)}`,
  unselected: (text: string) => `${colors.muted(symbols.radioOff)} ${colors.muted(text)}`,
  checked: (text: string) => `${colors.success(symbols.checkboxOn)} ${text}`,
  unchecked: (text: string) => `${colors.muted(symbols.checkboxOff)} ${colors.muted(text)}`,

  // Content formatting
  key: (text: string) => colors.primary(text),
  value: (text: string) => colors.muted(text),
  path: (text: string) => colors.accent(text),
  version: (text: string) => colors.secondary(text),
  command: (text: string) => colors.secondary.bold(`${text}`),
  muted: (text: string) => colors.muted(text),

  // Special formatting
  ai: (text: string) => `${colors.ai("🤖")} ${colors.ai(text)}`,
  edge: (text: string) => `${colors.accent("⚡")} ${colors.accent(text)}`,
  database: (text: string) => `${colors.primary("🗄️")} ${colors.primary(text)}`,
} as const;

// Box utilities
export const box = {
  info: (content: string, title?: string) =>
    boxen(content, {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "blue",
      ...(title && { title: colors.primary.bold(title) }),
    }),

  success: (content: string, title?: string) =>
    boxen(content, {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "green",
      ...(title && { title: colors.success.bold(title) }),
    }),

  error: (content: string, title?: string) =>
    boxen(content, {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "red",
      ...(title && { title: colors.error.bold(title) }),
    }),

  warning: (content: string, title?: string) =>
    boxen(content, {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "yellow",
      ...(title && { title: colors.warning.bold(title) }),
    }),

  note: (content: string, title?: string) =>
    boxen(content, {
      padding: 1,
      margin: 1,
      borderStyle: "single",
      borderColor: "gray",
      ...(title && { title: colors.muted.bold(title) }),
    }),
} as const;

// Table utilities
export const table = {
  create: (headers: string[], options?: any) =>
    new Table({
      head: headers.map((h) => colors.primary.bold(h)),
      style: {
        head: [],
        border: ["gray"],
        compact: true,
      },
      ...options,
    }),

  dependencies: () =>
    new Table({
      head: [
        colors.primary.bold("Package"),
        colors.primary.bold("Current"),
        colors.primary.bold("Latest"),
        colors.primary.bold("Status"),
      ],
      style: {
        head: [],
        border: ["gray"],
        compact: true,
      },
    }),

  features: () =>
    new Table({
      head: [
        colors.primary.bold("Feature"),
        colors.primary.bold("Status"),
        colors.primary.bold("Description"),
      ],
      style: {
        head: [],
        border: ["gray"],
        compact: true,
      },
    }),
} as const;

// Layout utilities
export const layout = {
  // Create consistent spacing
  spacing: {
    small: "\n",
    medium: "\n\n",
    large: "\n\n\n",
  },

  // Create separator lines
  separator: (char: string = "─", width: number = 50) => colors.muted(char.repeat(width)),

  // Create indented content
  indent: (content: string, level: number = 1) => {
    const spaces = "  ".repeat(level);
    return content
      .split("\n")
      .map((line) => `${spaces}${line}`)
      .join("\n");
  },

  // Create columns for data display
  columns: (data: Array<{ key: string; value: string }>, keyWidth: number = 20) => {
    return data
      .map(({ key, value }) => `${colors.primary(key.padEnd(keyWidth))} ${colors.muted(value)}`)
      .join("\n");
  },
} as const;

// Progress indicators
export const progress = {
  dots: (current: number, total: number) => {
    const completed = "●".repeat(current);
    const remaining = "○".repeat(total - current);
    return `${colors.primary(completed)}${colors.muted(remaining)}`;
  },

  percentage: (current: number, total: number) => {
    const percent = Math.round((current / total) * 100);
    return colors.secondary(`${percent}%`);
  },

  fraction: (current: number, total: number) => {
    return colors.muted(`${current}/${total}`);
  },
} as const;

// Banner creation
export const banner = {
  ait3e: () => {
    const title = gradients.ait3e(
      [
        "  ▄▄▄     ██▓▄▄▄█████▓▌ ██▓▓█████",
        " ▒████▄  ▓██▒▓  ██▒ ▓▒ ▒▓██▒▓█   ▀",
        " ▒██  ▀█▄▒██▒▒ ▓██░ ▒░ ░▒██▒▒███  ",
        " ░██▄▄▄▄██▒██░░ ▓██▓ ░  ░██░▒▓█  ▄",
        "  ▓█   ▓██▒██░  ▒██▒ ░   ██░░▒████▒",
        "  ▒▒   ▓▒█░▓    ▒ ░░   ░▓  ░░ ▒░ ░",
        "   ▒   ▒▒ ░▒ ░    ░     ▒ ░ ░ ░  ░",
        "   ░   ▒  ░▒ ░  ░       ▒ ░   ░   ",
        "       ░  ░░              ░    ░  ░",
      ].join("\n")
    );

    const subtitle = colors.muted("AT3 Toolset - Smart migration for AIT3E stack");

    return boxen(`${title}\n\n${subtitle}`, {
      padding: 1,
      margin: 1,
      borderStyle: "double",
      borderColor: "blue",
      align: "center",
    });
  },

  simple: (title: string, subtitle?: string) => {
    const content = subtitle
      ? `${gradients.ait3e(title)}\n${colors.muted(subtitle)}`
      : gradients.ait3e(title);

    return boxen(content, {
      padding: 1,
      margin: { top: 1, bottom: 1, left: 0, right: 0 },
      borderStyle: "round",
      borderColor: "blue",
      align: "center",
    });
  },
} as const;
