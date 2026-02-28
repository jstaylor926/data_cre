/**
 * App mode configuration.
 *
 * Set NEXT_PUBLIC_APP_MODE in .env.local:
 *   "dev"  — mock-data fallbacks enabled for non-auth features
 *   "prod" — production-safe defaults, authentication required for user data APIs
 */

export const APP_MODE = (process.env.NEXT_PUBLIC_APP_MODE || "prod") as
  | "dev"
  | "prod";

export const isDevMode = APP_MODE === "dev";
export const isProdMode = APP_MODE === "prod";
