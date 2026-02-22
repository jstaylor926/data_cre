/**
 * Gwinnett County zoning code → ZoningSummary lookup table.
 * Source: Gwinnett County Unified Development Ordinance (UDO)
 */
import type { ZoningSummary, ZoningFlag, ZoningStandard } from "./types";

interface ZoneDefinition {
  name: string;
  flags: ZoningFlag[];
  standards: ZoningStandard[];
}

const ZONE_DEFINITIONS: Record<string, ZoneDefinition> = {
  "C1": {
    name: "Neighborhood Commercial",
    flags: [
      { label: "Retail (by right)", type: "permitted" },
      { label: "Professional Office", type: "permitted" },
      { label: "Restaurant", type: "permitted" },
      { label: "Drive-Through", type: "conditional" },
      { label: "Auto Service", type: "prohibited" },
      { label: "Outdoor Storage", type: "prohibited" },
    ],
    standards: [
      { label: "Min Lot Size", value: "15,000 sq ft" },
      { label: "Max Height", value: "35 ft (2 stories)" },
      { label: "Front Setback", value: "25 ft" },
      { label: "Side Setback", value: "10 ft" },
      { label: "Rear Setback", value: "30 ft" },
      { label: "Max Lot Coverage", value: "60%" },
      { label: "Parking Ratio", value: "1 space per 250 sq ft GFA" },
    ],
  },
  "C2": {
    name: "General Commercial",
    flags: [
      { label: "Retail (by right)", type: "permitted" },
      { label: "Restaurant", type: "permitted" },
      { label: "Drive-Through", type: "permitted" },
      { label: "Auto Dealership", type: "permitted" },
      { label: "Fuel Station", type: "permitted" },
      { label: "Hotel/Motel", type: "permitted" },
      { label: "Outdoor Storage", type: "conditional" },
      { label: "Heavy Industrial", type: "prohibited" },
    ],
    standards: [
      { label: "Min Lot Size", value: "22,000 sq ft" },
      { label: "Max Height", value: "50 ft" },
      { label: "Front Setback", value: "30 ft" },
      { label: "Side Setback", value: "10 ft" },
      { label: "Rear Setback", value: "30 ft" },
      { label: "Max Lot Coverage", value: "70%" },
      { label: "Parking Ratio", value: "1 space per 200 sq ft GFA" },
      { label: "Drive-Through Stacking", value: "≥150 ft (§505.3)" },
    ],
  },
  "C3": {
    name: "Highway Commercial",
    flags: [
      { label: "Retail (by right)", type: "permitted" },
      { label: "Auto Service", type: "permitted" },
      { label: "Warehouse Showroom", type: "permitted" },
      { label: "Outdoor Storage", type: "conditional" },
      { label: "Residential", type: "prohibited" },
    ],
    standards: [
      { label: "Min Lot Size", value: "30,000 sq ft" },
      { label: "Max Height", value: "50 ft" },
      { label: "Front Setback", value: "35 ft" },
      { label: "Side Setback", value: "15 ft" },
      { label: "Rear Setback", value: "35 ft" },
      { label: "Max Lot Coverage", value: "65%" },
    ],
  },
  "OI": {
    name: "Office-Institutional",
    flags: [
      { label: "Professional Office", type: "permitted" },
      { label: "Medical Office", type: "permitted" },
      { label: "Research & Development", type: "permitted" },
      { label: "Retail (ground floor)", type: "conditional" },
      { label: "Restaurant (limited)", type: "conditional" },
      { label: "Drive-Through", type: "prohibited" },
      { label: "Industrial", type: "prohibited" },
    ],
    standards: [
      { label: "Min Lot Size", value: "20,000 sq ft" },
      { label: "Max Height", value: "60 ft" },
      { label: "Front Setback", value: "30 ft" },
      { label: "Side Setback", value: "15 ft" },
      { label: "Rear Setback", value: "35 ft" },
      { label: "Max Lot Coverage", value: "55%" },
      { label: "Parking Ratio", value: "1 space per 300 sq ft GFA" },
    ],
  },
  "MU": {
    name: "Mixed Use",
    flags: [
      { label: "Retail (ground floor)", type: "permitted" },
      { label: "Office", type: "permitted" },
      { label: "Multifamily Residential", type: "permitted" },
      { label: "Restaurant", type: "permitted" },
      { label: "Live/Work Units", type: "permitted" },
      { label: "Drive-Through", type: "conditional" },
      { label: "Auto-Oriented Uses", type: "prohibited" },
    ],
    standards: [
      { label: "Min Lot Size", value: "None" },
      { label: "Max Height", value: "65 ft (6 stories)" },
      { label: "Front Setback", value: "0–10 ft (build-to)" },
      { label: "Side Setback", value: "0 ft (shared walls permitted)" },
      { label: "Min Ground Floor Commercial", value: "50% of street frontage" },
      { label: "Parking", value: "Shared / structured preferred" },
    ],
  },
  "MUD": {
    name: "Mixed Use District",
    flags: [
      { label: "Retail", type: "permitted" },
      { label: "Office", type: "permitted" },
      { label: "Multifamily", type: "permitted" },
      { label: "Restaurant", type: "permitted" },
      { label: "Hotel", type: "permitted" },
      { label: "Single-Family", type: "prohibited" },
    ],
    standards: [
      { label: "Max Height", value: "80 ft" },
      { label: "Ground Floor Use", value: "Non-residential required" },
      { label: "Front Setback", value: "Build-to-line" },
      { label: "Open Space", value: "10% of net site area" },
    ],
  },
  "M1": {
    name: "Light Industrial",
    flags: [
      { label: "Warehouse / Distribution", type: "permitted" },
      { label: "Light Manufacturing", type: "permitted" },
      { label: "Flex Space", type: "permitted" },
      { label: "Research & Development", type: "permitted" },
      { label: "Retail (limited)", type: "conditional" },
      { label: "Residential", type: "prohibited" },
      { label: "Heavy Manufacturing", type: "prohibited" },
    ],
    standards: [
      { label: "Min Lot Size", value: "1 acre" },
      { label: "Max Height", value: "60 ft" },
      { label: "Front Setback", value: "40 ft" },
      { label: "Side Setback", value: "20 ft" },
      { label: "Rear Setback", value: "40 ft" },
      { label: "Max Lot Coverage", value: "60%" },
      { label: "Loading Docks", value: "Required per UDO §620" },
    ],
  },
  "M2": {
    name: "Heavy Industrial",
    flags: [
      { label: "Heavy Manufacturing", type: "permitted" },
      { label: "Outdoor Storage", type: "permitted" },
      { label: "Salvage Yard", type: "conditional" },
      { label: "Residential", type: "prohibited" },
      { label: "Retail", type: "prohibited" },
    ],
    standards: [
      { label: "Min Lot Size", value: "2 acres" },
      { label: "Max Height", value: "75 ft" },
      { label: "Front Setback", value: "50 ft" },
      { label: "Buffer to Residential", value: "200 ft" },
    ],
  },
  "TND": {
    name: "Traditional Neighborhood Development",
    flags: [
      { label: "Retail (village center)", type: "permitted" },
      { label: "Restaurant", type: "permitted" },
      { label: "Mixed Use Structures", type: "permitted" },
      { label: "Single-Family Residential", type: "permitted" },
      { label: "Townhomes", type: "permitted" },
      { label: "Drive-Through", type: "prohibited" },
      { label: "Surface Parking Lots", type: "prohibited" },
    ],
    standards: [
      { label: "Design Standard", value: "Urban form / walkability required" },
      { label: "Max Block Length", value: "400 ft" },
      { label: "Sidewalk Requirement", value: "Both sides, min 6 ft" },
      { label: "Parking Location", value: "Rear or structured only" },
    ],
  },
  "RTH": {
    name: "Residential Townhome",
    flags: [
      { label: "Attached Townhomes", type: "permitted" },
      { label: "Single-Family Detached", type: "conditional" },
      { label: "Home Occupation", type: "conditional" },
      { label: "Commercial Uses", type: "prohibited" },
      { label: "Multi-Family Apartments", type: "prohibited" },
    ],
    standards: [
      { label: "Min Lot Width", value: "20 ft per unit" },
      { label: "Max Height", value: "35 ft (3 stories)" },
      { label: "Front Setback", value: "20 ft" },
      { label: "Rear Setback", value: "20 ft" },
      { label: "Side Setback", value: "0 ft (shared walls) / 5 ft (end units)" },
      { label: "Max Density", value: "8 units/acre" },
      { label: "Open Space", value: "15% of net site area" },
      { label: "Note", value: "CRE redevelopment requires rezoning — limited by-right commercial potential" },
    ],
  },
  "RM": {
    name: "Residential Multi-Family",
    flags: [
      { label: "Apartments", type: "permitted" },
      { label: "Townhomes", type: "permitted" },
      { label: "Condominiums", type: "permitted" },
      { label: "Commercial Uses", type: "prohibited" },
      { label: "Industrial", type: "prohibited" },
    ],
    standards: [
      { label: "Min Lot Size", value: "1 acre" },
      { label: "Max Height", value: "45 ft" },
      { label: "Max Density", value: "12–24 units/acre (varies by subtype)" },
      { label: "Front Setback", value: "25 ft" },
      { label: "Note", value: "Multifamily — redevelopment possible via rezoning to MU/MUD" },
    ],
  },
  "R75": {
    name: "Single-Family Residential (7,500 SF lots)",
    flags: [
      { label: "Single-Family Detached", type: "permitted" },
      { label: "Home Occupation", type: "conditional" },
      { label: "Accessory Dwelling", type: "conditional" },
      { label: "Commercial", type: "prohibited" },
    ],
    standards: [
      { label: "Min Lot Size", value: "7,500 sq ft" },
      { label: "Max Height", value: "35 ft" },
      { label: "Front Setback", value: "25 ft" },
      { label: "Side Setback", value: "5 ft" },
      { label: "Rear Setback", value: "25 ft" },
    ],
  },
  "A": {
    name: "Agricultural",
    flags: [
      { label: "Agricultural Uses", type: "permitted" },
      { label: "Single-Family Home", type: "permitted" },
      { label: "Commercial (limited)", type: "conditional" },
      { label: "Industrial", type: "prohibited" },
    ],
    standards: [
      { label: "Min Lot Size", value: "4 acres" },
      { label: "Max Height", value: "35 ft" },
      { label: "Front Setback", value: "60 ft" },
      { label: "Side Setback", value: "30 ft" },
    ],
  },
};

// Aliases for common code variations
const ALIASES: Record<string, string> = {
  "C-1": "C1", "C-2": "C2", "C-3": "C3", "O-I": "OI",
  "I-1": "M1", "I-2": "M2", "M-1": "M1", "M-2": "M2",
  "MU-1": "MU", "MU-2": "MU",
};

export function getZoningStandards(code: string | null): ZoningSummary {
  if (!code) {
    return {
      code: "UNKNOWN",
      name: "Unknown Zoning",
      flags: [{ label: "Contact planning dept", type: "conditional" }],
      standards: [{ label: "Note", value: "Zoning classification not available" }],
    };
  }

  const normalized = code.trim().toUpperCase();
  const key = ALIASES[normalized] ?? normalized;
  const def = ZONE_DEFINITIONS[key];

  if (!def) {
    return {
      code: normalized,
      name: `Zoning District ${normalized}`,
      flags: [{ label: "Verify with county", type: "conditional" }],
      standards: [
        { label: "Note", value: "Standards not yet mapped — check Gwinnett UDO" },
      ],
    };
  }

  return {
    code: normalized,
    name: def.name,
    flags: def.flags,
    standards: def.standards,
  };
}
