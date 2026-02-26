/**
 * App mode configuration.
 *
 * Set NEXT_PUBLIC_APP_MODE in .env.local:
 *   "dev"  — mock data fallbacks, hardcoded dev-user, mock entity lookup
 *   "prod" — real data sources only, requires auth, no mocks
 */

export const APP_MODE = (process.env.NEXT_PUBLIC_APP_MODE ?? "dev") as
  | "dev"
  | "prod";

export const isDevMode = APP_MODE === "dev";
export const isProdMode = APP_MODE === "prod";

/**
 * Returns the current user ID.
 *
 * In dev mode: returns a hardcoded "dev-user" for local development.
 * In prod mode: throws until real authentication is wired up.
 *
 * TODO: Replace prod path with Supabase auth.uid() or session-based user ID.
 */
export function getUserId(): string {
  if (isDevMode) return "dev-user";
  throw new Error("Authentication required — no user session found");
}
