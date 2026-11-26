import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { getSupabasePublicConfig } from '@/lib/supabase/config'

export async function getOptionalUser(): Promise<User | null> {
  if (!getSupabasePublicConfig()) {
    return null
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    return user
  } catch {
    return null
  }
}
