import type { SupabaseClient } from "@supabase/supabase-js";
import type { FeatureFlags } from "@/store/useAppStore";
import { requireAuthenticatedUserId } from "@/lib/auth";
import {
  CAPABILITY_KEYS,
  GUEST_CAPABILITIES,
  LEGACY_AUTHENTICATED_CAPABILITIES,
  capabilitiesToFeatureFlags,
  normalizeCapabilityMap,
  type CapabilityKey,
  type CapabilityMap,
} from "@/lib/capability-constants";

export const CAPABILITY_FORBIDDEN_ERROR = "Insufficient permissions";

interface SupabaseErrorLike {
  code?: string | null;
  message?: string;
}

export class CapabilityForbiddenError extends Error {
  readonly capability: CapabilityKey;

  constructor(capability: CapabilityKey) {
    super(`Missing capability: ${capability}`);
    this.name = "CapabilityForbiddenError";
    this.capability = capability;
  }
}

export interface CapabilityContext {
  authenticated: boolean;
  user: {
    id: string;
    email: string | null;
    user_metadata?: Record<string, unknown>;
  } | null;
  capabilities: CapabilityMap;
  features: FeatureFlags;
}

function isMissingRelationError(error: SupabaseErrorLike | null): boolean {
  if (!error) return false;
  if (error.code === "42P01" || error.code === "PGRST204" || error.code === "PGRST205") {
    return true;
  }
  return /does not exist|schema cache/i.test(error.message ?? "");
}

function toOverrideMap(
  rows: Array<{ capability_key: string | null; enabled: boolean | null }> | null
): Partial<Record<string, boolean>> {
  if (!rows || rows.length === 0) return {};
  const overrides: Partial<Record<string, boolean>> = {};
  for (const row of rows) {
    if (
      typeof row.capability_key === "string" &&
      CAPABILITY_KEYS.includes(row.capability_key as CapabilityKey) &&
      typeof row.enabled === "boolean"
    ) {
      overrides[row.capability_key] = row.enabled;
    }
  }
  return overrides;
}

async function fetchUserCapabilityOverrides(
  supabase: SupabaseClient,
  userId: string
): Promise<Partial<Record<string, boolean>>> {
  const { data, error } = await supabase
    .from("user_capability_overrides")
    .select("capability_key, enabled")
    .eq("user_id", userId);

  if (error) {
    if (isMissingRelationError(error)) {
      return {};
    }
    console.error("Failed to read user capability overrides:", error);
    return {};
  }

  return toOverrideMap(
    (data as Array<{ capability_key: string | null; enabled: boolean | null }> | null) ?? null
  );
}

export async function resolveCapabilitiesForUser(
  supabase: SupabaseClient,
  userId: string | null
): Promise<CapabilityMap> {
  if (!userId) return { ...GUEST_CAPABILITIES };

  const overrides = await fetchUserCapabilityOverrides(supabase, userId);
  return normalizeCapabilityMap(overrides, LEGACY_AUTHENTICATED_CAPABILITIES);
}

export async function resolveCapabilityContext(
  supabase: SupabaseClient
): Promise<CapabilityContext> {
  const { data, error } = await supabase.auth.getUser();
  const user = !error ? data.user : null;
  const userId = user?.id ?? null;
  const capabilities = await resolveCapabilitiesForUser(supabase, userId);

  return {
    authenticated: Boolean(userId),
    user: user
      ? {
          id: user.id,
          email: user.email ?? null,
          user_metadata: user.user_metadata,
        }
      : null,
    capabilities,
    features: capabilitiesToFeatureFlags(capabilities),
  };
}

export async function requireUserCapability(
  supabase: SupabaseClient,
  capability: CapabilityKey
): Promise<{ userId: string; capabilities: CapabilityMap }> {
  const userId = await requireAuthenticatedUserId(supabase);
  const capabilities = await resolveCapabilitiesForUser(supabase, userId);
  if (!capabilities[capability]) {
    throw new CapabilityForbiddenError(capability);
  }
  return { userId, capabilities };
}

export function hasCapability(capabilities: CapabilityMap, capability: CapabilityKey): boolean {
  return capabilities[capability];
}
