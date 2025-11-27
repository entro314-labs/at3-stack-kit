import { createBrowserClient } from '@supabase/ssr'

import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    // biome-ignore lint/style/noNonNullAssertion: env vars validated at startup
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // biome-ignore lint/style/noNonNullAssertion: env vars validated at startup
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
