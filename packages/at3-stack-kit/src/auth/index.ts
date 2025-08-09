/**
 * Authentication utilities for AT3 Stack
 */

import { z } from "zod";

// User schema
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  avatar_url: z.string().url().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type User = z.infer<typeof userSchema>;

// Auth session schema
export const sessionSchema = z.object({
  user: userSchema,
  access_token: z.string(),
  refresh_token: z.string().optional(),
  expires_at: z.number().optional(),
});

export type AuthSession = z.infer<typeof sessionSchema>;

// Auth error types
export type AuthError = {
  message: string;
  status?: number;
};

/**
 * Validate user data
 */
export function validateUser(data: unknown): User {
  return userSchema.parse(data);
}

/**
 * Validate auth session
 */
export function validateSession(data: unknown): AuthSession {
  return sessionSchema.parse(data);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(session: AuthSession | null): session is AuthSession {
  return session !== null && session.user !== null;
}

/**
 * Get user initials from name or email
 */
export function getUserInitials(user: User): string {
  if (user.name) {
    return user.name
      .split(" ")
      .map((name) => name.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2);
  }

  return user.email.charAt(0).toUpperCase();
}

/**
 * Format user display name
 */
export function getUserDisplayName(user: User): string {
  return user.name || user.email?.split("@")[0] || "User";
}

/**
 * Check if session is expired
 */
export function isSessionExpired(session: AuthSession): boolean {
  if (!session.expires_at) return false;
  return Date.now() >= session.expires_at * 1000;
}

/**
 * Time until session expires (in milliseconds)
 */
export function getSessionTimeToExpiry(session: AuthSession): number | null {
  if (!session.expires_at) return null;
  return Math.max(0, session.expires_at * 1000 - Date.now());
}

// Common auth providers
export const authProviders = [
  "google",
  "github",
  "discord",
  "twitter",
  "facebook",
  "apple",
] as const;

export type AuthProvider = (typeof authProviders)[number];
