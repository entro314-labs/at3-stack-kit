/**
 * CLI styling utilities for create-at3-app
 * Aligned with at3-toolkit's sophisticated styling system
 */

import chalk from "chalk";

// Color palette - simplified for create-at3-app
export const colors = {
  primary: chalk.cyan,
  secondary: chalk.blue,
  success: chalk.green,
  error: chalk.red,
  warning: chalk.yellow,
  info: chalk.blue,
  muted: chalk.gray,
  accent: chalk.magenta,
} as const;

// Text styling utilities
export const style = {
  title: (text: string) => colors.primary.bold(text),
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
  code: (text: string) => chalk.cyan.italic(text),
  path: (text: string) => chalk.dim.underline(text),
  command: (text: string) => chalk.bgBlack.white.bold(` ${text} `),
} as const;

// Template feature styling
export const featureStyle = {
  nextjs: chalk.black,
  typescript: chalk.blue,
  tailwind: chalk.cyan,
  trpc: chalk.magenta,
  supabase: chalk.green,
  ai: chalk.hex("#10b981"),
  edge: chalk.yellow,
  pwa: chalk.magenta,
  i18n: chalk.blue,
  testing: chalk.red,
  streaming: chalk.cyan,
} as const;

// Format template features for display
export const formatFeatures = (features: string[]) => {
  return features
    .map((feature) => {
      const colorFn = featureStyle[feature as keyof typeof featureStyle] || colors.muted;
      return colorFn(`#${feature}`);
    })
    .join(" ");
};
