export interface SupabasePublicConfig {
  anonKey: string
  url: string
}

export function getSupabasePublicConfig(
  env: Record<string, string | undefined> = process.env
): SupabasePublicConfig | null {
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    return null
  }

  try {
    const parsedUrl = new URL(url)
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return null
    }
  } catch {
    return null
  }

  return { anonKey, url }
}
