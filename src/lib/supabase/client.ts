import { createBrowserClient } from '@supabase/ssr'

import type { Database } from '@/types/database'
import { getSupabasePublicConfig } from './config'

export function createClient() {
  const supabaseConfig = getSupabasePublicConfig()

  if (!supabaseConfig) {
    throw new Error('Missing or invalid Supabase environment variables')
  }

  return createBrowserClient<Database>(supabaseConfig.url, supabaseConfig.anonKey)
}
