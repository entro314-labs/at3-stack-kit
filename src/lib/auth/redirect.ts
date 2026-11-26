const SAFE_INTERNAL_PATH = /^\/(?!\/)/

function extractFirstString(
  value: string | string[] | null | undefined
): string | null {
  if (typeof value === 'string') {
    return value
  }

  if (Array.isArray(value)) {
    const first = value[0]
    return typeof first === 'string' ? first : null
  }

  return null
}

function normalizePath(
  value: string | null | undefined
): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  if (!SAFE_INTERNAL_PATH.test(trimmed)) {
    return null
  }

  try {
    const normalized = new URL(trimmed, 'http://localhost')
    if (normalized.origin !== 'http://localhost') {
      return null
    }

    return `${normalized.pathname}${normalized.search}${normalized.hash}`
  } catch {
    return null
  }
}

export function sanitizeRedirectPath(
  value: string | null | undefined,
  fallback: string
): string {
  const safeFallback = normalizePath(fallback) ?? '/'
  return normalizePath(value) ?? safeFallback
}

export function sanitizeRedirectParam(
  value: string | string[] | null | undefined,
  fallback: string
): string {
  return sanitizeRedirectPath(extractFirstString(value), fallback)
}
