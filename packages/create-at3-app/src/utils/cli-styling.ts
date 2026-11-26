/**
 * CLI styling utilities for create-at3-app
 * Aligned with at3-toolkit's sophisticated styling system
 */

import chalk from 'chalk'

// Color palette - simplified for create-at3-app
export const colors = {
  accent: chalk.magenta,
  error: chalk.red,
  info: chalk.blue,
  muted: chalk.gray,
  primary: chalk.cyan,
  secondary: chalk.blue,
  success: chalk.green,
  warning: chalk.yellow,
} as const

// Text styling utilities
export const style = {
  accent: (text: string) => colors.accent(text),
  code: (text: string) => chalk.cyan.italic(text),
  command: (text: string) => chalk.bgBlack.white.bold(` ${text} `),
  error: (text: string) => colors.error(text),
  heading: (text: string) => colors.primary.bold(text),
  info: (text: string) => colors.info(text),
  label: (text: string) => colors.muted(text),
  muted: (text: string) => colors.muted(text),
  path: (text: string) => chalk.dim.underline(text),
  subtitle: (text: string) => colors.secondary(text),
  success: (text: string) => colors.success(text),
  title: (text: string) => colors.primary.bold(text),
  value: (text: string) => colors.primary(text),
  warning: (text: string) => colors.warning(text),
} as const

// Template feature styling
export const featureStyle = {
  ai: chalk.hex('#10b981'),
  edge: chalk.yellow,
  i18n: chalk.blue,
  nextjs: chalk.black,
  pwa: chalk.magenta,
  streaming: chalk.cyan,
  supabase: chalk.green,
  tailwind: chalk.cyan,
  testing: chalk.red,
  trpc: chalk.magenta,
  typescript: chalk.blue,
} as const

// Format template features for display
export const formatFeatures = (features: string[]) =>
  features
    .map((feature) => {
      const colorFn = featureStyle[feature as keyof typeof featureStyle] ?? colors.muted
      return colorFn(`#${feature}`)
    })
    .join(' ')
