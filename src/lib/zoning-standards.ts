import { z } from "zod";

// ─── Zod Schema for Claude Tool Use ──────────────────────────
export const ZoningExtractionSchema = z.object({
  entitlementStatus: z.enum(["BY_RIGHT", "CUP_REQUIRED", "PROHIBITED", "UNCLEAR"]),
  maxHeightFeet: z.number().nullable(),
  setbacks: z.object({
    front: z.number().nullable(),
    side: z.number().nullable(),
    rear: z.number().nullable(),
  }),
  maxLotCoverage: z.number().nullable(),
  noiseLimitsDBA: z.number().nullable(),
  parkingRequirements: z.string().nullable(),
  permittedUses: z.array(z.string()),
  conditionalUses: z.array(z.string()),
  prohibitedUses: z.array(z.string()),
  fatalFlaws: z.array(z.string()),
});

export type ZoningExtractionInput = z.infer<typeof ZoningExtractionSchema>;

// ─── JSON Schema for Anthropic Tool Use ──────────────────────
export const ZONING_TOOL_SCHEMA = {
  name: "extract_zoning_parameters",
  description:
    "Extract specific real estate zoning constraints relevant to data center development from a municipal code document. Focus on entitlement path, building height, setbacks, noise limits, lot coverage, and use classifications.",
  input_schema: {
    type: "object" as const,
    properties: {
      entitlementStatus: {
        type: "string",
        enum: ["BY_RIGHT", "CUP_REQUIRED", "PROHIBITED", "UNCLEAR"],
        description:
          "Whether a data center / data processing facility is permitted by-right, requires a Conditional Use Permit, is prohibited, or cannot be determined from the code.",
      },
      maxHeightFeet: {
        type: ["number", "null"],
        description: "Maximum building height in feet, or null if not specified.",
      },
      setbacks: {
        type: "object",
        properties: {
          front: { type: ["number", "null"], description: "Front setback in feet." },
          side: { type: ["number", "null"], description: "Side setback in feet." },
          rear: { type: ["number", "null"], description: "Rear setback in feet." },
        },
        required: ["front", "side", "rear"],
      },
      maxLotCoverage: {
        type: ["number", "null"],
        description: "Maximum lot coverage as a percentage (0-100), or null if not specified.",
      },
      noiseLimitsDBA: {
        type: ["number", "null"],
        description:
          "Maximum noise level at property line in dBA, or null if not specified. Critical for data center cooling equipment.",
      },
      parkingRequirements: {
        type: ["string", "null"],
        description: "Parking requirements summary, or null if not specified.",
      },
      permittedUses: {
        type: "array",
        items: { type: "string" },
        description: "List of uses permitted by-right in this zone.",
      },
      conditionalUses: {
        type: "array",
        items: { type: "string" },
        description: "List of uses requiring a conditional use permit.",
      },
      prohibitedUses: {
        type: "array",
        items: { type: "string" },
        description: "List of explicitly prohibited uses.",
      },
      fatalFlaws: {
        type: "array",
        items: { type: "string" },
        description:
          "Critical issues that could block data center development (e.g., DC moratorium, height restrictions below 40ft, noise limits below 55 dBA).",
      },
    },
    required: [
      "entitlementStatus",
      "maxHeightFeet",
      "setbacks",
      "maxLotCoverage",
      "noiseLimitsDBA",
      "parkingRequirements",
      "permittedUses",
      "conditionalUses",
      "prohibitedUses",
      "fatalFlaws",
    ],
  },
};

// ─── Mock Zoning Extractions ─────────────────────────────────
export const MOCK_ZONING_EXTRACTIONS: Record<string, ZoningExtractionInput> = {
  "I-2": {
    entitlementStatus: "BY_RIGHT",
    maxHeightFeet: 75,
    setbacks: { front: 50, side: 25, rear: 30 },
    maxLotCoverage: 60,
    noiseLimitsDBA: 70,
    parkingRequirements: "1 space per 1,000 sf",
    permittedUses: [
      "Manufacturing",
      "Warehousing",
      "Data Processing Facility",
      "Utility Substation",
      "Distribution Center",
    ],
    conditionalUses: ["Outdoor Storage", "Hazardous Materials"],
    prohibitedUses: ["Residential", "Schools", "Hospitals"],
    fatalFlaws: [],
  },
  "I-1": {
    entitlementStatus: "CUP_REQUIRED",
    maxHeightFeet: 55,
    setbacks: { front: 40, side: 20, rear: 25 },
    maxLotCoverage: 50,
    noiseLimitsDBA: 60,
    parkingRequirements: "1 space per 800 sf",
    permittedUses: [
      "Light Manufacturing",
      "Office / Flex",
      "Warehousing",
      "Research Facility",
    ],
    conditionalUses: [
      "Data Processing Facility",
      "Heavy Equipment",
      "Outdoor Operations",
    ],
    prohibitedUses: ["Residential", "Retail", "Schools"],
    fatalFlaws: [
      "Data center requires CUP (12-24 month timeline risk)",
      "Noise limit 60 dBA may restrict cooling equipment",
    ],
  },
  "C-2": {
    entitlementStatus: "CUP_REQUIRED",
    maxHeightFeet: 45,
    setbacks: { front: 30, side: 15, rear: 20 },
    maxLotCoverage: 70,
    noiseLimitsDBA: 55,
    parkingRequirements: "1 space per 300 sf",
    permittedUses: ["Retail", "Office", "Restaurant", "Medical Office"],
    conditionalUses: ["Data Processing Facility", "Telecommunications"],
    prohibitedUses: ["Manufacturing", "Warehousing", "Heavy Industrial"],
    fatalFlaws: [
      "Height limit 45ft restricts 2-story DC design",
      "Noise limit 55 dBA severely restricts cooling systems",
      "High parking requirements reduce usable footprint",
    ],
  },
  A: {
    entitlementStatus: "PROHIBITED",
    maxHeightFeet: 35,
    setbacks: { front: 100, side: 50, rear: 75 },
    maxLotCoverage: 20,
    noiseLimitsDBA: 45,
    parkingRequirements: "N/A",
    permittedUses: ["Farming", "Single-Family Residential", "Forestry"],
    conditionalUses: ["Agritourism", "Solar Farm"],
    prohibitedUses: [
      "Commercial",
      "Industrial",
      "Data Center",
      "Manufacturing",
    ],
    fatalFlaws: [
      "Data centers prohibited in Agricultural zones",
      "Rezoning required (18-36 month process)",
      "Maximum lot coverage 20% severely limits build footprint",
    ],
  },
};

// ─── Net Usable Acreage Calculation ──────────────────────────
export function calculateNetUsableAcres(
  totalAcres: number,
  setbacks: { front: number | null; side: number | null; rear: number | null },
  maxLotCoverage: number | null
): number {
  // Rough calculation: reduce total acreage by setback estimates
  // This is a simplification—proper calculation needs parcel geometry
  const avgSetbackFt =
    ((setbacks.front ?? 0) + (setbacks.side ?? 0) * 2 + (setbacks.rear ?? 0)) / 4;
  // Assume a roughly square parcel
  const parcelSideFt = Math.sqrt(totalAcres * 43560); // 1 acre = 43,560 sqft
  const usableSideFt = Math.max(parcelSideFt - avgSetbackFt * 2, 0);
  const usableAcresFromSetbacks = (usableSideFt * usableSideFt) / 43560;

  if (maxLotCoverage != null) {
    return Math.min(usableAcresFromSetbacks, totalAcres * (maxLotCoverage / 100));
  }
  return usableAcresFromSetbacks;
}
