/**
 * Supabase utilities for AT3 Stack
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

// Supabase configuration schema
export const supabaseConfigSchema = z.object({
  url: z.string().url(),
  anonKey: z.string(),
  serviceRoleKey: z.string().optional(),
})

export type SupabaseConfig = z.infer<typeof supabaseConfigSchema>

/**
 * Validate Supabase configuration
 */
export function validateSupabaseConfig(config: unknown): SupabaseConfig {
  return supabaseConfigSchema.parse(config)
}

/**
 * Create Supabase client with configuration
 */
export function createSupabaseClient(config: SupabaseConfig): SupabaseClient {
  return createClient(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  })
}

/**
 * Create Supabase admin client with service role key
 */
export function createSupabaseAdminClient(config: SupabaseConfig): SupabaseClient {
  if (!config.serviceRoleKey) {
    throw new Error('Service role key is required for admin client')
  }

  return createClient(config.url, config.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Get Supabase configuration from environment variables
 */
export function getSupabaseConfigFromEnv(): SupabaseConfig {
  const config = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }

  if (!(config.url && config.anonKey)) {
    throw new Error('Missing required Supabase environment variables')
  }

  return validateSupabaseConfig(config)
}

// Common database types and utilities
export interface BaseRecord {
  id: string
  created_at: string
  updated_at: string
}

/**
 * Type-safe database query builder helpers
 */
export class QueryBuilder<T extends BaseRecord> {
  constructor(
    private client: SupabaseClient,
    private table: string
  ) {}

  /**
   * Select records with type safety
   */
  select(columns?: string) {
    return this.client.from(this.table).select(columns || '*')
  }

  /**
   * Insert a new record
   */
  insert(data: Omit<T, 'id' | 'created_at' | 'updated_at'>) {
    return this.client.from(this.table).insert(data)
  }

  /**
   * Update a record by ID
   */
  update(id: string, data: Partial<Omit<T, 'id' | 'created_at'>>) {
    return this.client
      .from(this.table)
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
  }

  /**
   * Delete a record by ID
   */
  delete(id: string) {
    return this.client.from(this.table).delete().eq('id', id)
  }
}

// Re-export Supabase types
export type {
  AuthError,
  PostgrestError,
  Session,
  SupabaseClient,
  User,
} from '@supabase/supabase-js'
