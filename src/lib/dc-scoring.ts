import type {
  DCPersona,
  ScoringWeights,
  Parcel,
  InfraData,
  DCScoreResult,
} from "./types";
import {
  COST_PER_MILE_TRENCHING,
  SUBSTATION_MAX_USEFUL_DIST_MILES,
  FIBER_MAX_USEFUL_DIST_MILES,
  FLOOD_ZONE_HIGH_RISK,
} from "./constants";

// ─── Persona Weight Matrices ──────────────────────────────────
const PERSONA_WEIGHTS: Record<DCPersona, ScoringWeights> = {
  HYPERSCALE: {
    powerProximity: 0.55,
    acreage: 0.2,
    fiberLatency: 0.1,
    hazardRisk: 0.05,
    waterAccess: 0.1,
  },
  EDGE_COMPUTE: {
    powerProximity: 0.2,
    acreage: 0.05,
    fiberLatency: 0.5,
    hazardRisk: 0.15,
    waterAccess: 0.1,
  },
  ENTERPRISE: {
    powerProximity: 0.3,
    acreage: 0.15,
    fiberLatency: 0.25,
    hazardRisk: 0.15,
    waterAccess: 0.15,
  },
};

// ─── Normalize Helpers (raw → 0-100 scale) ───────────────────
function normalizePower(infra: InfraData): number {
  if (infra.distToSubstationMiles == null) return 0;
  // Closer = better. Max useful dist = 5mi → score 0. 0mi → score 100.
  const capped = Math.min(infra.distToSubstationMiles, SUBSTATION_MAX_USEFUL_DIST_MILES);
  const base = (1 - capped / SUBSTATION_MAX_USEFUL_DIST_MILES) * 80;
  // Bonus for high-capacity substations
  const capacityBonus = infra.substationCapacityMW
    ? Math.min((infra.substationCapacityMW / 500) * 20, 20)
    : 0;
  return Math.min(base + capacityBonus, 100);
}

function normalizeFiber(infra: InfraData): number {
  if (infra.distToFiberMiles == null) return 0;
  const capped = Math.min(infra.distToFiberMiles, FIBER_MAX_USEFUL_DIST_MILES);
  const base = (1 - capped / FIBER_MAX_USEFUL_DIST_MILES) * 70;
  // Bonus for redundant paths
  const redundancyBonus = Math.min(infra.fiberRedundantPaths * 10, 30);
  return Math.min(base + redundancyBonus, 100);
}

function normalizeAcreage(parcel: Parcel, persona: DCPersona): number {
  const acres = parcel.acres ?? 0;
  if (persona === "HYPERSCALE") {
    // Ideal: 50-500 acres
    if (acres >= 100) return 100;
    if (acres >= 50) return 70 + ((acres - 50) / 50) * 30;
    return Math.max((acres / 50) * 70, 0);
  }
  if (persona === "EDGE_COMPUTE") {
    // Ideal: 5-20 acres
    if (acres >= 5 && acres <= 20) return 100;
    if (acres > 20) return Math.max(100 - (acres - 20) * 2, 30);
    return (acres / 5) * 80;
  }
  // ENTERPRISE: 20-80 acres ideal
  if (acres >= 20 && acres <= 80) return 100;
  if (acres > 80) return Math.max(100 - (acres - 80), 50);
  return (acres / 20) * 80;
}

function normalizeHazard(infra: InfraData): number {
  let score = 100;
  // Flood zone penalty
  if (infra.femaFloodZone && FLOOD_ZONE_HIGH_RISK.includes(infra.femaFloodZone)) {
    score -= 50;
  }
  // Wetlands penalty
  if (infra.nearWetlands) score -= 20;
  // Fault line penalty
  if (infra.nearFaultLine) score -= 30;
  // Steep grade penalty
  if (infra.maxElevationChangePct != null && infra.maxElevationChangePct > 4) {
    score -= 20;
  }
  return Math.max(score, 0);
}

function normalizeWater(infra: InfraData): number {
  let score = 50; // baseline
  if (infra.distToWaterMainMiles != null) {
    const proxScore = Math.max(0, (1 - infra.distToWaterMainMiles / 3) * 50);
    score = proxScore + 30;
  }
  // Drought penalty
  if (infra.droughtRiskScore != null) {
    score -= (infra.droughtRiskScore / 100) * 30;
  }
  return Math.max(Math.min(score, 100), 0);
}

// ─── Risk Flag Detection ─────────────────────────────────────
function detectRiskFlags(parcel: Parcel, infra: InfraData): string[] {
  const flags: string[] = [];
  if (infra.femaFloodZone && FLOOD_ZONE_HIGH_RISK.includes(infra.femaFloodZone)) {
    flags.push(`FEMA Flood Zone: ${infra.femaFloodZone}`);
  }
  if (infra.nearWetlands) {
    flags.push("National Wetlands Inventory overlap");
  }
  if (infra.nearFaultLine) {
    flags.push("Proximity to seismic fault line");
  }
  if (infra.maxElevationChangePct != null && infra.maxElevationChangePct > 4) {
    flags.push(`High grade: ${infra.maxElevationChangePct.toFixed(1)}% elevation change`);
  }
  if (infra.droughtRiskScore != null && infra.droughtRiskScore > 60) {
    flags.push(`High drought risk: ${infra.droughtRiskScore}/100`);
  }
  if (infra.fiberRedundantPaths < 2) {
    flags.push("Single fiber path (no redundancy)");
  }
  if (infra.distToSubstationMiles != null && infra.distToSubstationMiles > 3) {
    flags.push("Substation distance > 3 miles (high connection cost)");
  }
  return flags;
}

// ─── Estimated MW Capacity ───────────────────────────────────
function estimateMWCapacity(acres: number | null): number | null {
  if (acres == null) return null;
  // Rule of thumb: ~10 MW per acre for modern high-density DC
  // Conservative: 5-8 MW/acre accounting for setbacks, parking, cooling
  return Math.round(acres * 6);
}

// ─── Main Scoring Function ───────────────────────────────────
export function calculateDCScore(
  parcel: Parcel,
  infra: InfraData,
  persona: DCPersona
): DCScoreResult {
  const weights = PERSONA_WEIGHTS[persona];

  const power = normalizePower(infra);
  const fiber = normalizeFiber(infra);
  const acreage = normalizeAcreage(parcel, persona);
  const hazard = normalizeHazard(infra);
  const water = normalizeWater(infra);

  const totalScore =
    power * weights.powerProximity +
    fiber * weights.fiberLatency +
    acreage * weights.acreage +
    hazard * weights.hazardRisk +
    water * weights.waterAccess;

  const costToConnect =
    infra.distToSubstationMiles != null
      ? Math.round(infra.distToSubstationMiles * COST_PER_MILE_TRENCHING)
      : null;

  return {
    totalScore: Math.round(totalScore * 10) / 10,
    breakdown: {
      power: Math.round(power),
      fiber: Math.round(fiber),
      acreage: Math.round(acreage),
      hazard: Math.round(hazard),
      water: Math.round(water),
    },
    persona,
    riskFlags: detectRiskFlags(parcel, infra),
    estimatedMWCapacity: estimateMWCapacity(parcel.acres),
    costToConnectPower: costToConnect,
  };
}

export { PERSONA_WEIGHTS };
