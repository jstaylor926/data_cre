export interface Parcel {
  apn: string;
  county: string;
  owner_name: string | null;
  owner_mailing_address: string | null;
  site_address: string | null;
  acres: number | null;
  land_use_code: string | null;
  zoning: string | null;
  zoning_desc?: string | null;
  assessed_total: number | null;
  land_value?: number | null;
  improvement_value?: number | null;
  last_sale_date: string | null;
  last_sale_price: number | null;
  legal_desc?: string | null;
  deed_refs?: string[];
  previous_owners?: string[];
  geom?: GeoJSON.MultiPolygon | null;
}

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

export interface EntityResult {
  llc_name: string;
  state: string;
  principal_name: string | null;
  agent_name: string | null;
  status: string | null;
  formed_date: string | null;
  related_parcels: Parcel[];
}

export interface SearchResult {
  id: string;
  place_name: string;
  address: string;
  coordinates: [number, number]; // [lng, lat]
  type: string;
}

export type BaseMapStyle = "streets" | "satellite" | "hybrid";

export type PanelTab = "data" | "score" | "zoning" | "comps";

export interface SiteScore {
  composite: number;
  tier: string;
  zoning: number;
  access: number;
  demographics: number;
  market: number;
  infrastructure: number;
}

export interface ZoningFlag {
  label: string;
  type: "permitted" | "conditional" | "prohibited";
}

export interface ZoningStandard {
  label: string;
  value: string;
}

export interface ZoningSummary {
  code: string;
  name: string;
  flags: ZoningFlag[];
  standards: ZoningStandard[];
}

export interface Comp {
  id: string;
  address: string;
  distance: number;
  acres: number;
  date: string;
  price: number;
  psf: number;
  coordinates: [number, number];
}

export interface FirmHistoryMatch {
  id: string;
  deal_name: string;
  year: number;
  outcome: "closed" | "passed" | "loi";
  similarity: number;
  excerpt: string;
}

export interface ChatMessage {
  role: "user" | "ai";
  content: string;
  warning?: string;
}

export type BriefStatus = "idle" | "generating" | "generated";

export interface BriefSection {
  id: string;
  label: string;
  status: "pending" | "current" | "done";
  description?: string;
  time?: string;
}

// ─── Phase 4: Firm Intelligence Platform ──────────────────────────────────────

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  created_at: string;
  settings?: Record<string, unknown>;
}

export interface Project {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  status: "active" | "archived" | "closed";
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done";
  due_date: string | null;
  assigned_to?: string | null;
  created_at: string;
}

export interface Note {
  id: string;
  project_id: string;
  apn: string;
  content: string;
  author_id: string;
  created_at: string;
}

// ─── Phase 3: Data Center Mode ───────────────────────────────────────────────

export type AppMode = "dev" | "datacenter" | "phase4";

export type DCPanelTab = "dc-score" | "power" | "fiber" | "water" | "environ";

export interface Substation {
  id: string;
  name: string;
  voltage: number;        // kV: 500, 345, 230, 161, 115, 69, etc.
  operator: string;
  coordinates: [number, number]; // [lng, lat]
  distance: number;       // miles from selected parcel
}

export interface EnvFlag {
  type: "critical" | "warning" | "clear";
  code: string;
  label: string;
  description: string;
  source?: string;
}

/** Raw infrastructure data fetched once per parcel; score re-computed client-side on MW change */
export interface DCInfrastructure {
  substations: Substation[];
  nearestTxVoltage: number | null;
  floodZone: string | null;
  floodZoneSubtype: string | null;
  envFlags: EnvFlag[];
  fiberCarriers: string[];
  tieDistance: number | null;
  waterCapacity: number | null;
  utilityTerritory: string | null;
}

export interface DCScore {
  composite: number;
  disqualified: boolean;
  criticalFlag?: EnvFlag;
  tier: string;
  mwTarget: number;
  power: number;         // 0–40
  fiber: number;         // 0–30
  water: number;         // 0–20
  environ: number;       // 0–10
  nearestSub?: Substation;
  redundancy: boolean;
}

export interface ComparisonSite {
  apn: string;
  address: string;
  dcScore: DCScore;
  infrastructure: DCInfrastructure | null;
  mwTarget: number;
}

// ─── Phase 3: Site Scout ───────────────────────────────────────────────────────

/** Parsed intent extracted from a user's natural language query */
export interface ScoutIntent {
  mw: number;
  minVoltage: number | null;
  avoidFloodZones: boolean;
  fiberPriority: boolean;
  region: string | null;         // e.g. "Southeast", "Georgia", "Alabama"
  locationHint: string | null;   // e.g. "near I-85", "Gwinnett County"
  rawQuery: string;
}

/** Tier 1: a candidate sub-market suggested by Claude and validated by HIFLD */
export interface SubMarketCandidate {
  id: string;
  name: string;                  // e.g. "Coweta County Corridor"
  rationale: string;             // Claude's reasoning
  bbox: [number, number, number, number]; // [west, south, east, north]
  center: [number, number];      // [lng, lat] for map flyTo
  // HIFLD-validated power data
  substationCount: number;
  maxVoltage: number | null;
  nearestSubDistance: number | null;
  quickScore: number;            // 0–100 rough estimate
  floodRisk: "low" | "moderate" | "high" | "unknown";
}

/** Tier 2: a scored parcel candidate within a chosen sub-market */
export interface RankedCandidate {
  rank: number;
  apn: string;
  address: string;
  acres: number | null;
  zoning: string | null;
  centroid: [number, number];    // [lng, lat]
  quickScore: number;            // fast proximity-based score
  dcScore: DCScore | null;       // full score (top 5 only)
  infrastructure: DCInfrastructure | null;
}

/** Overall scout mode */
export type ScoutMode = "idle" | "discovering" | "area" | "results";

/** State of the active scout session */
export interface ScoutSession {
  mode: ScoutMode;
  query: string;
  intent: ScoutIntent | null;
  subMarkets: SubMarketCandidate[];  // Tier 1 results
  candidates: RankedCandidate[];     // Tier 2 results
  activeSubMarket: SubMarketCandidate | null;
  summary: string;                   // streaming AI synthesis
  loading: boolean;
  error: string | null;
}
