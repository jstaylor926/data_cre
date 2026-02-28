import type { FeatureFlags } from "@/store/useAppStore";

export const CAPABILITY_KEYS = [
  "saved.read",
  "saved.write",
  "collections.manage",
  "feature.ai_zoning",
  "feature.auto_comps",
  "feature.dc_scoring",
  "feature.entity_lookup",
  "crm.view",
  "crm.projects.write",
  "crm.tasks.write",
  "crm.notes.write",
  "admin.capabilities.manage",
] as const;

export type CapabilityKey = (typeof CAPABILITY_KEYS)[number];
export type CapabilityMap = Record<CapabilityKey, boolean>;

function createCapabilityMap(defaultValue: boolean): CapabilityMap {
  return CAPABILITY_KEYS.reduce((acc, key) => {
    acc[key] = defaultValue;
    return acc;
  }, {} as CapabilityMap);
}

export const EMPTY_CAPABILITIES: CapabilityMap = createCapabilityMap(false);

export const GUEST_CAPABILITIES: CapabilityMap = {
  ...EMPTY_CAPABILITIES,
  "feature.ai_zoning": true,
  "feature.auto_comps": true,
  "feature.dc_scoring": true,
  "feature.entity_lookup": true,
  "crm.view": true,
};

export const LEGACY_AUTHENTICATED_CAPABILITIES: CapabilityMap = {
  ...EMPTY_CAPABILITIES,
  "saved.read": true,
  "saved.write": true,
  "collections.manage": true,
  "feature.ai_zoning": true,
  "feature.auto_comps": true,
  "feature.dc_scoring": true,
  "feature.entity_lookup": true,
  "crm.view": true,
  "crm.projects.write": true,
  "crm.tasks.write": true,
  "crm.notes.write": true,
  "admin.capabilities.manage": true,
};

export const PERSONAL_AUTHENTICATED_CAPABILITIES: CapabilityMap = {
  ...LEGACY_AUTHENTICATED_CAPABILITIES,
  "crm.view": false,
  "crm.projects.write": false,
  "crm.tasks.write": false,
  "crm.notes.write": false,
  "admin.capabilities.manage": false,
};

export function capabilitiesToFeatureFlags(capabilities: CapabilityMap): FeatureFlags {
  return {
    enableAIZoning: capabilities["feature.ai_zoning"],
    enableAutoComps: capabilities["feature.auto_comps"],
    enableDCScoring: capabilities["feature.dc_scoring"],
    enableFirmIntel: capabilities["crm.view"],
    enableEntityLookup: capabilities["feature.entity_lookup"],
  };
}

export function normalizeCapabilityMap(
  partial?: Partial<Record<string, boolean>> | null,
  fallback: CapabilityMap = EMPTY_CAPABILITIES
): CapabilityMap {
  const normalized = { ...fallback };
  if (!partial) return normalized;
  for (const key of CAPABILITY_KEYS) {
    if (typeof partial[key] === "boolean") {
      normalized[key] = partial[key] as boolean;
    }
  }
  return normalized;
}
