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
  last_sale_date: string | null;
  last_sale_price: number | null;
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
