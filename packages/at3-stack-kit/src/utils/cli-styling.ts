/**
 * CLI styling utilities for AT3 Stack Kit
 * Aligned with at3-toolkit's sophisticated styling system
 */

import boxen from "boxen";
import chalk from "chalk";
import figures from "figures";
import gradient from "gradient-string";

// Color palette
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

// Gradients
export const gradients = {
  at3: gradient("#2563eb", "#10b981"), // Blue to Emerald
  ai: gradient("#10b981", "#059669"), // Emerald gradient
  success: gradient("#22c55e", "#16a34a"), // Green gradient
  warning: gradient("#f59e0b", "#d97706"), // Amber gradient
  error: gradient("#ef4444", "#dc2626"), // Red gradient
} as const;

// Icons and symbols
export const symbols = {
  success: colors.success(figures.tick),
  error: colors.error(figures.cross),
  warning: colors.warning(figures.warning),
  info: colors.info(figures.info),
  arrow: colors.muted(figures.arrowRight),
  bullet: colors.muted(figures.bullet),
  line: colors.muted(figures.line),
  ai: colors.ai("🤖"),
  stack: colors.primary("📚"),
  edge: colors.secondary("⚡"),
  database: colors.info("🗄️"),
  config: colors.muted("⚙️"),
} as const;

// Text styling utilities
export const style = {
  title: (text: string) => gradients.at3(text),
  subtitle: (text: string) => colors.secondary(text),
  heading: (text: string) => colors.primary.bold(text),
  label: (text: string) => colors.muted(text),
  value: (text: string) => colors.primary(text),
  success: (text: string) => colors.success(text),
  error: (text: string) => colors.error(text),
  warning: (text: string) => colors.warning(text),
  info: (text: string) => colors.info(text),
  muted: (text: string) => colors.muted(text),
  accent: (text: string) => colors.accent(text),
  ai: (text: string) => colors.ai(text),
  code: (text: string) => chalk.cyan.italic(text),
  path: (text: string) => chalk.dim.underline(text),
  command: (text: string) => chalk.bgBlack.white.bold(` ${text} `),
} as const;

// Box utilities
export const box = {
  info: (content: string, title?: string) =>
    boxen(content, {
      ...(title && { title }),
      titleAlignment: "center",
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "blue",
    }),
  success: (content: string, title?: string) =>
    boxen(content, {
      ...(title && { title }),
      titleAlignment: "center",
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "green",
    }),
  warning: (content: string, title?: string) =>
    boxen(content, {
      ...(title && { title }),
      titleAlignment: "center",
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "yellow",
    }),
  error: (content: string, title?: string) =>
    boxen(content, {
      ...(title && { title }),
      titleAlignment: "center",
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "red",
    }),
} as const;

// Progress indicators
export const progress = {
  step: (current: number, total: number, description: string) =>
    `${colors.muted(`[${current}/${total}]`)} ${description}`,

  percentage: (percent: number) => {
    const filled = Math.floor(percent / 5);
    const empty = 20 - filled;
    const bar = "█".repeat(filled) + "░".repeat(empty);
    return `${colors.primary(bar)} ${colors.muted(`${percent}%`)}`;
  },
};

// Header utilities
export const header = {
  main: (title: string, subtitle?: string) => {
    const titleText = gradients.at3.multiline(title);
    const subtitleText = subtitle ? `\n${colors.muted(subtitle)}` : "";
    return `${titleText}${subtitleText}`;
  },

  section: (title: string) =>
    `\n${colors.primary.bold(title)}\n${colors.muted("─".repeat(title.length))}`,
};

// List utilities
export const list = {
  item: (text: string, symbol = symbols.bullet) => `${symbol} ${text}`,
  checkItem: (text: string, checked = false) => {
    const icon = checked ? symbols.success : colors.muted(figures.radioOff);
    return `${icon} ${text}`;
  },
  numbered: (items: string[]) =>
    items.map((item, i) => `${colors.muted(`${i + 1}.`)} ${item}`).join("\n"),
};
