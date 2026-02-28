/**
 * Rule-based CRE site scoring engine.
 * Produces a 0–100 composite score from county parcel attributes.
 *
 * Dimensions (each 0–20):
 *   Zoning       — commercial desirability of the zone code
 *   Market       — assessed value per acre as proxy for market depth
 *   Infrastructure — improvement ratio (built environment quality)
 *   Access       — parcel-level proxy score (until traffic/transit integration)
 *   Demographics — parcel-level proxy score (until census integration)
 */
import type { Parcel } from "./types";
import type { SiteScore } from "./types";

// ─── Zoning Score ───────────────────────────────────────────────────────────

const ZONING_SCORES: Record<string, number> = {
  // Commercial — most desirable for CRE
  "C1": 18, "C-1": 18,
  "C2": 19, "C-2": 19,
  "C3": 17, "C-3": 17,
  "OI": 17, "O-I": 17,          // Office-Institutional
  "C4": 16, "C-4": 16,
  // Mixed-use — very strong
  "MU": 16, "MUD": 16, "MU-1": 16, "MU-2": 15,
  "TND": 15,                     // Traditional Neighborhood Development
  // Industrial — good for industrial CRE
  "M1": 14, "M-1": 14, "I-1": 14,
  "M2": 12, "M-2": 12, "I-2": 12,
  // Agricultural
  "A":   8, "RA200": 7, "RL": 6,
  // Residential — low CRE score (not target product type)
  "RTH": 5,  // Townhome — some density value but limited redevelopment flexibility
  "RM":  6,  // Multi-family — redevelopment potential via rezoning
  "RSL": 5,
  "R60": 4, "R-60": 4,
  "R75": 4, "R-75": 4,
  "R100": 3, "R-100": 3,
  "R-1": 4, "R-2": 3, "R-3": 3,
};

function scoreZoning(zoning: string | null): number {
  if (!zoning) return 8;
  const code = zoning.trim().toUpperCase();
  if (code in ZONING_SCORES) return ZONING_SCORES[code];
  // Prefix match fallback
  for (const [key, val] of Object.entries(ZONING_SCORES)) {
    if (code.startsWith(key.toUpperCase())) return val;
  }
  return 10; // Unknown zone — neutral
}

// ─── Market Score ────────────────────────────────────────────────────────────
// Based on assessed value per acre (proxy for market depth/pricing)

function scoreMarket(assessed_total: number | null, acres: number | null): number {
  if (!assessed_total || !acres || acres <= 0) return 10;
  const perAcre = assessed_total / acres;
  if (perAcre >= 1_500_000) return 20;
  if (perAcre >= 1_000_000) return 18;
  if (perAcre >= 750_000)  return 16;
  if (perAcre >= 500_000)  return 14;
  if (perAcre >= 300_000)  return 12;
  if (perAcre >= 150_000)  return 10;
  if (perAcre >= 75_000)   return 8;
  return 6;
}

// ─── Infrastructure Score ────────────────────────────────────────────────────
// Improvement value / total assessed = built environment ratio

function scoreInfrastructure(
  improvement_value: number | null | undefined,
  assessed_total: number | null
): number {
  if (!assessed_total || assessed_total <= 0) return 10;
  const impv = improvement_value ?? 0;
  const ratio = impv / assessed_total;
  if (ratio >= 0.85) return 20;
  if (ratio >= 0.70) return 17;
  if (ratio >= 0.55) return 15;
  if (ratio >= 0.40) return 13;
  if (ratio >= 0.25) return 11;
  if (ratio >= 0.10) return 9;
  return 7; // Land-heavy (vacant / teardown)
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(20, Math.round(value)));
}

// ─── Access Proxy Score ───────────────────────────────────────────────────────
// Proxy until traffic/transit APIs are integrated.
function scoreAccess(parcel: Parcel): number {
  let score = 8;
  const zoning = parcel.zoning?.trim().toUpperCase() ?? "";
  const acres = parcel.acres ?? 0;

  if (parcel.site_address) score += 2;

  if (
    zoning.startsWith("C") ||
    zoning.startsWith("M") ||
    zoning.startsWith("I") ||
    zoning.startsWith("OI") ||
    zoning.startsWith("O-I") ||
    zoning.startsWith("MU") ||
    zoning.startsWith("TND")
  ) {
    score += 5;
  } else if (zoning.startsWith("R")) {
    score += 1;
  }

  if (acres >= 20) score += 5;
  else if (acres >= 5) score += 4;
  else if (acres >= 1) score += 3;
  else if (acres > 0) score += 1;

  return clampScore(score);
}

// ─── Demographics Proxy Score ────────────────────────────────────────────────
// Proxy until census and mobility feeds are integrated.
function scoreDemographics(parcel: Parcel): number {
  let score = 8;
  const assessed = parcel.assessed_total ?? 0;
  const acres = parcel.acres ?? 0;
  const perAcre = acres > 0 ? assessed / acres : 0;
  const landUse = parcel.land_use_code?.toUpperCase() ?? "";
  const address = parcel.site_address?.toUpperCase() ?? "";

  if (perAcre >= 1_200_000) score += 6;
  else if (perAcre >= 750_000) score += 5;
  else if (perAcre >= 450_000) score += 4;
  else if (perAcre >= 250_000) score += 3;
  else if (perAcre > 0) score += 1;

  if (landUse.includes("COMM") || landUse.includes("OFFICE") || landUse.includes("IND")) {
    score += 2;
  }

  if (
    address.includes("LAWRENCEVILLE") ||
    address.includes("DULUTH") ||
    address.includes("SUWANEE") ||
    address.includes("NORCROSS") ||
    address.includes("BUFORD")
  ) {
    score += 2;
  }

  return clampScore(score);
}

// ─── Tier Labels ─────────────────────────────────────────────────────────────

function tierLabel(composite: number): string {
  if (composite >= 85) return "Prime";
  if (composite >= 70) return "Strong";
  if (composite >= 55) return "Moderate";
  if (composite >= 40) return "Speculative";
  return "Weak";
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function scoreParcel(parcel: Parcel): SiteScore {
  const zoning       = scoreZoning(parcel.zoning);
  const market       = scoreMarket(parcel.assessed_total, parcel.acres);
  const infrastructure = scoreInfrastructure(parcel.improvement_value, parcel.assessed_total);
  const access       = scoreAccess(parcel);
  const demographics = scoreDemographics(parcel);

  const composite = zoning + market + infrastructure + access + demographics;

  return {
    composite,
    tier: tierLabel(composite),
    zoning,
    market,
    infrastructure,
    access,
    demographics,
  };
}
