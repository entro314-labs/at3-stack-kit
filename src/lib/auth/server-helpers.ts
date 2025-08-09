import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Server-side auth helpers (for use in server components/actions only)
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export async function requireAuth() {
  const user = await getUser();
  if (!user) {
    redirect("/auth/sign-in");
  }
  return user;
}
