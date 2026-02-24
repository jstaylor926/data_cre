import type { Feature, MultiPolygon, Polygon, Point } from "geojson";

// ─── Core Parcel ──────────────────────────────────────────────
export interface Parcel {
  apn: string;
  county: string;
  owner_name: string | null;
  owner_mailing_address: string | null;
  site_address: string | null;
  acres: number | null;
  land_use_code: string | null;
  zoning: string | null;
  assessed_total: number | null;
  assessed_land: number | null;
  assessed_improvement: number | null;
  last_sale_date: string | null;
  last_sale_price: number | null;
  year_built: number | null;
  building_sqft: number | null;
  geom?: MultiPolygon | Polygon | null;
}

export type ParcelFeature = Feature<Polygon | MultiPolygon, Parcel>;

// ─── Saved Parcels ────────────────────────────────────────────
export interface SavedParcel {
  id: string;
  user_id: string;
  apn: string;
  notes: string | null;
  collection_id: string | null;
  created_at: string;
  parcel?: Parcel;
}

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  org_id: string | null;
  created_at: string;
}

// ─── Entity / LLC ─────────────────────────────────────────────
export interface EntityResult {
  llc_name: string;
  state: string;
  principal_name: string | null;
  agent_name: string | null;
  status: string | null;
  formed_date: string | null;
  related_parcels: Parcel[];
}

// ─── UI State ─────────────────────────────────────────────────
export type PanelTab =
  | "data"
  | "score"
  | "zoning"
  | "comps"
  | "power"
  | "fiber"
  | "water"
  | "environ";

export type BaseMapStyle = "streets" | "satellite" | "hybrid";

// ─── Phase 1: DC Scoring ─────────────────────────────────────
export type DCPersona = "HYPERSCALE" | "EDGE_COMPUTE" | "ENTERPRISE";

export interface ScoringWeights {
  powerProximity: number;
  fiberLatency: number;
  acreage: number;
  hazardRisk: number;
  waterAccess: number;
}

export interface InfraData {
  distToSubstationMiles: number | null;
  distToTransmissionMiles: number | null;
  substationCapacityMW: number | null;
  distToFiberMiles: number | null;
  distToIXPMiles: number | null;
  fiberRedundantPaths: number;
  distToWaterMainMiles: number | null;
  droughtRiskScore: number | null; // 0-100
  femaFloodZone: string | null;
  nearWetlands: boolean;
  nearFaultLine: boolean;
  maxElevationChangePct: number | null;
}

export interface DCScoreResult {
  totalScore: number; // 0-100
  breakdown: {
    power: number;
    fiber: number;
    acreage: number;
    hazard: number;
    water: number;
  };
  persona: DCPersona;
  riskFlags: string[];
  estimatedMWCapacity: number | null;
  costToConnectPower: number | null; // in USD
}

// ─── Phase 2: Zoning Extraction ──────────────────────────────
export type EntitlementStatus =
  | "BY_RIGHT"
  | "CUP_REQUIRED"
  | "PROHIBITED"
  | "UNCLEAR";

export interface ZoningExtraction {
  entitlementStatus: EntitlementStatus;
  maxHeightFeet: number | null;
  setbacks: {
    front: number | null;
    side: number | null;
    rear: number | null;
  };
  maxLotCoverage: number | null; // percentage (0-100)
  noiseLimitsDBA: number | null;
  parkingRequirements: string | null;
  permittedUses: string[];
  conditionalUses: string[];
  prohibitedUses: string[];
  fatalFlaws: string[];
  netUsableAcres: number | null;
}

// ─── Phase 3: Site Brief ─────────────────────────────────────
export interface SiteBrief {
  apn: string;
  siteAddress: string;
  owner: string;
  acres: number;
  zoning: string;
  dcScore: DCScoreResult;
  zoningExtraction: ZoningExtraction;
  infraData: InfraData;
  mapSnapshotUrl: string;
  generatedAt: string;
}

// ─── Phase 4: Scout / Assemblage ─────────────────────────────
export interface ScoutQuery {
  minAcres: number;
  maxSubstationDistMiles: number;
  targetZoning: string[];
  excludeFloodplain: boolean;
  maxDistToFiberMiles?: number;
}

export interface ScoutResult {
  apn: string;
  acres: number;
  distToSubstationMiles: number;
  zoning: string;
  geom: Polygon | MultiPolygon;
}

export interface AssemblageResult {
  parcels: Parcel[];
  totalAcres: number;
  dissolvedGeom: Polygon | MultiPolygon;
  blendedScore: DCScoreResult | null;
}

// ─── Phase 5: Due Diligence ──────────────────────────────────
export type DDTaskStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "FATAL_FLAW";

export type DDCategory =
  | "Power"
  | "Fiber"
  | "Water"
  | "Environmental"
  | "Legal"
  | "Zoning"
  | "Geotechnical"
  | "Financial";

export interface DueDiligenceTask {
  id: string;
  saved_parcel_id: string;
  category: DDCategory;
  task_name: string;
  status: DDTaskStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Infrastructure Layers ───────────────────────────────────
export interface Substation {
  id: string;
  name: string;
  capacity_mw: number | null;
  voltage_kv: number | null;
  lat: number;
  lng: number;
}

export interface TransmissionLine {
  id: string;
  voltage_kv: number;
  owner: string | null;
  geom: Feature;
}

export interface FiberRoute {
  id: string;
  provider: string;
  type: "long_haul" | "metro" | "last_mile";
  geom: Feature;
}
