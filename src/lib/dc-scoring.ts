/**
 * Data Center site scoring engine — Phase 3.
 * Pure client-side calculation; all inputs come from DCInfrastructure.
 * Re-runs instantly when MW target changes (no API round-trip).
 *
 * Weights: Power 40% · Fiber 30% · Water 20% · Environmental 10%
 * Max scores: power=40, fiber=30, water=20, environ=10
 * DISQUALIFIED if any critical environmental flag exists.
 */

import type { DCInfrastructure, DCScore, EnvFlag, Substation } from "./types";

// ─── Tier helpers ─────────────────────────────────────────────────────────────

export function mwTier(mw: number): string {
  if (mw < 1) return "Edge";
  if (mw <= 100) return "Enterprise";
  return "Hyperscale";
}

/** Minimum voltage (kV) required for the given MW target */
function minVoltage(mw: number): number {
  if (mw < 1) return 69;
  if (mw <= 10) return 115;
  if (mw <= 100) return 230;
  return 500;
}

/** Search radius in miles for the given MW target */
export function effectiveRadius(mw: number): number {
  if (mw < 1) return 5;
  if (mw <= 10) return 10;
  if (mw <= 100) return 20;
  return 35;
}

// ─── Power score (0–40) ───────────────────────────────────────────────────────

function scorePower(
  substations: Substation[],
  nearestTxVoltage: number | null,
  mw: number
): { score: number; nearest?: Substation; redundancy: boolean } {
  const radius = effectiveRadius(mw);
  const minV = minVoltage(mw);

  // Filter to substations within radius
  const inRange = substations.filter((s) => s.distance <= radius);
  if (inRange.length === 0) return { score: 2, redundancy: false };

  // Sort: higher voltage first, then closer
  const sorted = [...inRange].sort((a, b) =>
    b.voltage !== a.voltage ? b.voltage - a.voltage : a.distance - b.distance
  );
  const nearest = sorted[0];

  // Sub Distance score (0–12): closer = higher
  let distScore = 0;
  const d = nearest.distance;
  if (d <= 0.5) distScore = 12;
  else if (d <= 1) distScore = 11;
  else if (d <= 2) distScore = 10;
  else if (d <= 3) distScore = 9;
  else if (d <= 5) distScore = 8;
  else if (d <= 8) distScore = 6;
  else if (d <= 12) distScore = 4;
  else distScore = 2;

  // Voltage Capacity score (0–10): higher voltage = higher score
  let voltScore = 0;
  const v = nearest.voltage;
  if (v >= 500) voltScore = 10;
  else if (v >= 345) voltScore = 9;
  else if (v >= 230) voltScore = 8;
  else if (v >= 161) voltScore = 7;
  else if (v >= 115) voltScore = 6;
  else if (v >= 69) voltScore = 4;
  else voltScore = 2;

  // Redundancy score (0–8): ≥2 substations of different voltages within radius
  const voltages = new Set(inRange.map((s) => {
    if (s.voltage >= 345) return "500+";
    if (s.voltage >= 161) return "230";
    if (s.voltage >= 69) return "115";
    return "69-";
  }));
  const redundancy = voltages.size >= 2 && inRange.length >= 2;
  const redundScore = redundancy ? 8 : 0;

  // TX line proximity score (0–10): bonus for having high-voltage TX nearby
  let txScore = 0;
  if (nearestTxVoltage !== null) {
    if (nearestTxVoltage >= 500) txScore = 10;
    else if (nearestTxVoltage >= 230) txScore = 8;
    else if (nearestTxVoltage >= 115) txScore = 6;
    else txScore = 4;
  }

  // Penalise if nearest sub voltage is below minimum required for MW target
  const voltPenalty = nearest.voltage < minV ? -4 : 0;

  const score = Math.max(0, Math.min(40, distScore + voltScore + redundScore + txScore + voltPenalty));
  return { score, nearest, redundancy };
}

// ─── Fiber score (0–30) ───────────────────────────────────────────────────────

function scoreFiber(carriers: string[], tieDistance: number | null): number {
  // Carrier count score (0–15)
  const carrierScore = Math.min(15, carriers.length * 5);

  // TIE (Internet Exchange) proximity (0–15)
  let tieScore = 0;
  if (tieDistance === null) tieScore = 5;          // unknown = neutral
  else if (tieDistance <= 5) tieScore = 15;
  else if (tieDistance <= 10) tieScore = 13;
  else if (tieDistance <= 15) tieScore = 11;
  else if (tieDistance <= 25) tieScore = 8;
  else if (tieDistance <= 40) tieScore = 5;
  else tieScore = 2;

  return Math.min(30, carrierScore + tieScore);
}

// ─── Water score (0–20) ───────────────────────────────────────────────────────

function scoreWater(capacity: number | null): number {
  if (capacity === null) return 10; // unknown = neutral
  if (capacity >= 50) return 20;
  if (capacity >= 20) return 17;
  if (capacity >= 10) return 14;
  if (capacity >= 5) return 11;
  if (capacity >= 1) return 8;
  return 4;
}

// ─── Environmental score (0–10) ───────────────────────────────────────────────

const CRITICAL_ZONES = ["A", "AE", "AH", "AO", "VE", "V"];

function isCriticalFloodZone(zone: string | null): boolean {
  if (!zone) return false;
  const z = zone.toUpperCase().trim();
  return CRITICAL_ZONES.some((c) => z === c || z.startsWith(c));
}

function scoreEnviron(flags: EnvFlag[]): { score: number; critical?: EnvFlag } {
  const critical = flags.find((f) => f.type === "critical");
  if (critical) return { score: 0, critical };

  const warnings = flags.filter((f) => f.type === "warning").length;
  const score = Math.max(0, 10 - warnings * 3);
  return { score };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function computeDCScore(infra: DCInfrastructure, mw: number): DCScore {
  const { score: environ, critical } = scoreEnviron(infra.envFlags);
  const disqualified = !!critical;

  const { score: power, nearest: nearestSub, redundancy } = scorePower(
    infra.substations,
    infra.nearestTxVoltage,
    mw
  );
  const fiber = scoreFiber(infra.fiberCarriers, infra.tieDistance);
  const water = scoreWater(infra.waterCapacity);

  const composite = disqualified ? 0 : power + fiber + water + environ;
  const tier = disqualified ? "DISQUALIFIED" : mwTier(mw) + " · " + dcTierLabel(composite);

  return {
    composite,
    disqualified,
    criticalFlag: critical,
    tier,
    mwTarget: mw,
    power,
    fiber,
    water,
    environ,
    nearestSub,
    redundancy,
  };
}

function dcTierLabel(composite: number): string {
  if (composite >= 85) return "Tier IV Capable";
  if (composite >= 70) return "Tier III Capable";
  if (composite >= 55) return "Tier II Capable";
  if (composite >= 40) return "Tier I Capable";
  return "Below Standard";
}

/** Build EnvFlags from raw FEMA zone data */
export function buildEnvFlags(
  floodZone: string | null,
  floodSubtype: string | null,
): EnvFlag[] {
  const flags: EnvFlag[] = [];

  if (floodZone) {
    const isCritical = isCriticalFloodZone(floodZone);
    flags.push({
      type: isCritical ? "critical" : floodZone.startsWith("X") ? "clear" : "warning",
      code: `FEMA_${floodZone}`,
      label: isCritical
        ? `CRITICAL · FEMA Zone ${floodZone} · 100-yr Floodplain`
        : `FEMA Zone ${floodZone}${floodSubtype ? " · " + floodSubtype : ""}`,
      description: isCritical
        ? "Site is within the FEMA 100-year floodplain. Data center electrical infrastructure cannot be insured at this location."
        : floodZone === "X"
          ? "Minimal flood risk — outside 500-year floodplain."
          : "Moderate flood risk — verify with structural engineer.",
      source: "FEMA National Flood Hazard Layer (NFHL)",
    });
  }

  return flags;
}
