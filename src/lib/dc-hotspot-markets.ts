// ─── Data Center Hotspot Markets ─────────────────────────────────────────────
// Curated high-score data center market regions (Southern US focus).
// Displayed as cards + map markers in datacenter mode before user searches.

export interface DCHotspotMarket {
  id: string;
  name: string;
  state: string;
  region: string;
  center: [number, number]; // [lng, lat]
  bbox: [number, number, number, number]; // [west, south, east, north]
  dcScore: number; // 0–100 composite
  breakdown: {
    power: number; // 0–40  (grid capacity, substations, voltage)
    fiber: number; // 0–30  (carrier count, backbone proximity)
    landCost: number; // 0–20  (avg $/acre, lot availability)
    taxIncentives: number; // 0–10  (state/county programs, enterprise zones)
  };
  rationale: string;
  substationCount: number;
  maxVoltage: number | null; // kV
  floodRisk: "low" | "moderate" | "high";
}

export const DC_HOTSPOT_MARKETS: DCHotspotMarket[] = [
  {
    id: "atl-metro-north",
    name: "Atlanta Metro North",
    state: "GA",
    region: "Gwinnett / Forsyth",
    center: [-84.195, 33.945],
    bbox: [-84.35, 33.85, -84.05, 34.1],
    dcScore: 88,
    breakdown: { power: 36, fiber: 28, landCost: 16, taxIncentives: 8 },
    rationale:
      "Major fiber hub with 20+ carriers, multiple 345kV substations, Georgia tax credits",
    substationCount: 12,
    maxVoltage: 345,
    floodRisk: "low",
  },
  {
    id: "social-circle-newton",
    name: "Social Circle / Newton",
    state: "GA",
    region: "Newton County",
    center: [-83.718, 33.655],
    bbox: [-83.85, 33.55, -83.6, 33.75],
    dcScore: 81,
    breakdown: { power: 34, fiber: 22, landCost: 18, taxIncentives: 7 },
    rationale:
      "Facebook/Meta hyperscale campus, new 500kV transmission line, low land cost corridor",
    substationCount: 5,
    maxVoltage: 500,
    floodRisk: "low",
  },
  {
    id: "statesboro-bulloch",
    name: "Statesboro",
    state: "GA",
    region: "Bulloch County",
    center: [-81.783, 32.449],
    bbox: [-81.9, 32.35, -81.65, 32.55],
    dcScore: 74,
    breakdown: { power: 30, fiber: 18, landCost: 19, taxIncentives: 7 },
    rationale:
      "Emerging tier-2 market, abundant land, state enterprise zone, university talent pipeline",
    substationCount: 3,
    maxVoltage: 230,
    floodRisk: "low",
  },
  {
    id: "nashville-tn",
    name: "Nashville",
    state: "TN",
    region: "Davidson / Rutherford",
    center: [-86.784, 36.174],
    bbox: [-86.95, 36.05, -86.6, 36.3],
    dcScore: 83,
    breakdown: { power: 34, fiber: 26, landCost: 15, taxIncentives: 8 },
    rationale:
      "TVA low-cost power, major fiber crossroads, Tennessee no-income-tax advantage",
    substationCount: 9,
    maxVoltage: 345,
    floodRisk: "moderate",
  },
  {
    id: "charlotte-nc",
    name: "Charlotte",
    state: "NC",
    region: "Mecklenburg / Cabarrus",
    center: [-80.843, 35.227],
    bbox: [-81.0, 35.1, -80.65, 35.4],
    dcScore: 80,
    breakdown: { power: 32, fiber: 26, landCost: 14, taxIncentives: 8 },
    rationale:
      "Growing secondary market, Duke Energy capacity, 15+ fiber carriers, NC data center tax exemption",
    substationCount: 7,
    maxVoltage: 345,
    floodRisk: "low",
  },
  {
    id: "dallas-fort-worth",
    name: "Dallas–Fort Worth",
    state: "TX",
    region: "Tarrant / Ellis",
    center: [-96.999, 32.753],
    bbox: [-97.2, 32.55, -96.75, 32.95],
    dcScore: 91,
    breakdown: { power: 38, fiber: 29, landCost: 16, taxIncentives: 8 },
    rationale:
      "Tier-1 national market, ERCOT grid capacity, massive fiber density, Chapter 313 incentives",
    substationCount: 18,
    maxVoltage: 345,
    floodRisk: "low",
  },
  {
    id: "jacksonville-fl",
    name: "Jacksonville",
    state: "FL",
    region: "Duval County",
    center: [-81.656, 30.332],
    bbox: [-81.8, 30.2, -81.5, 30.45],
    dcScore: 76,
    breakdown: { power: 30, fiber: 24, landCost: 16, taxIncentives: 6 },
    rationale:
      "Submarine cable landing point, military fiber backbone, Florida no-income-tax, growing demand",
    substationCount: 6,
    maxVoltage: 230,
    floodRisk: "moderate",
  },
  {
    id: "memphis-tn",
    name: "Memphis",
    state: "TN",
    region: "Shelby County",
    center: [-89.971, 35.149],
    bbox: [-90.1, 35.0, -89.8, 35.3],
    dcScore: 72,
    breakdown: { power: 32, fiber: 20, landCost: 14, taxIncentives: 6 },
    rationale:
      "TVA low-cost power, logistics corridor, abundant industrial land, emerging DC hub",
    substationCount: 5,
    maxVoltage: 345,
    floodRisk: "moderate",
  },
];

/** Sort markets by dcScore descending for display priority */
export const DC_HOTSPOT_MARKETS_RANKED = [...DC_HOTSPOT_MARKETS].sort(
  (a, b) => b.dcScore - a.dcScore,
);

/** Get tier label for a DC hotspot score */
export function getHotspotTier(score: number): string {
  if (score >= 85) return "Prime";
  if (score >= 70) return "Strong";
  if (score >= 55) return "Moderate";
  if (score >= 40) return "Speculative";
  return "Weak";
}
