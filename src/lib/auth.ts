import type { SupabaseClient } from "@supabase/supabase-js";

export const AUTH_REQUIRED_ERROR = "Authentication required";

/**
 * Resolve the active user id from Supabase auth session.
 */
export async function requireAuthenticatedUserId(
  supabase: SupabaseClient
): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (!error && data.user?.id) {
    return data.user.id;
  }

  throw new Error(AUTH_REQUIRED_ERROR);
}
