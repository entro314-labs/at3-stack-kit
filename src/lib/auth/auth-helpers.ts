import { createClient as createBrowserClient } from "@/lib/supabase/client";

// Client-side auth helpers (safe for use in client components)
export function signOut() {
  const supabase = createBrowserClient();
  return supabase.auth.signOut();
}

export function signInWithEmail(email: string, password: string) {
  const supabase = createBrowserClient();
  return supabase.auth.signInWithPassword({ email, password });
}

export function signUpWithEmail(email: string, password: string) {
  const supabase = createBrowserClient();
  return supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}

export function signInWithProvider(provider: "github" | "google") {
  const supabase = createBrowserClient();
  return supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}

export function resetPassword(email: string) {
  const supabase = createBrowserClient();
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });
}
