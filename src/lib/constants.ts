// ─── Map Defaults ─────────────────────────────────────────────
export const MAP_DEFAULT_CENTER: [number, number] = [-84.07, 33.95]; // Gwinnett County, GA
export const MAP_DEFAULT_ZOOM = 12;

export const MAP_STYLES = {
  streets: "mapbox://styles/mapbox/dark-v11",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
  hybrid: "mapbox://styles/mapbox/satellite-streets-v12",
} as const;

// ─── Layer IDs ────────────────────────────────────────────────
export const PARCEL_SOURCE = "parcels-source";
export const PARCEL_FILL_LAYER = "parcels-fill";
export const PARCEL_LINE_LAYER = "parcels-line";
export const ZONING_SOURCE = "zoning-source";
export const ZONING_FILL_LAYER = "zoning-fill";
export const ZONING_LINE_LAYER = "zoning-line";
export const INFRA_SUBSTATION_LAYER = "infra-substations";
export const INFRA_TX_LINE_LAYER = "infra-tx-lines";
export const INFRA_FIBER_LAYER = "infra-fiber";
export const SCOUT_RESULTS_LAYER = "scout-results";
export const SCOUT_RESULTS_SOURCE = "scout-results-source";

// ─── Colors ───────────────────────────────────────────────────
export const PARCEL_BORDER_COLOR = "rgba(0, 212, 200, 0.22)";
export const PARCEL_BORDER_SELECTED = "#00d4c8";
export const PARCEL_FILL_SELECTED = "rgba(0, 212, 200, 0.10)";
export const PARCEL_FILL_SAVED = "rgba(245, 166, 35, 0.12)";
export const PARCEL_BORDER_SAVED = "#f5a623";

export const TEAL = "#00d4c8";
export const INK = "#0f172a";
export const AMBER = "#f5a623";

// ─── Dimensions ───────────────────────────────────────────────
export const TOPBAR_HEIGHT = 48;
export const PANEL_WIDTH = 420;
export const MOBILE_TAB_BAR_HEIGHT = 52;
export const MOBILE_BREAKPOINT = 1024;

// ─── Zoning Color Map ─────────────────────────────────────────
export const ZONING_COLORS: Record<string, string> = {
  "C-1": "#3b82f6",
  "C-2": "#2563eb",
  "C-3": "#1d4ed8",
  "R-1": "#22c55e",
  "R-2": "#16a34a",
  "R-3": "#15803d",
  "I-1": "#f97316",
  "I-2": "#ea580c",
  "MU-1": "#a78bfa",
  "MU-2": "#8b5cf6",
  PD: "#06b6d4",
  A: "#84cc16",
};

// ─── Entitlement Status Colors ────────────────────────────────
export const ENTITLEMENT_COLORS: Record<string, string> = {
  BY_RIGHT: "#22c55e",     // green
  CUP_REQUIRED: "#eab308", // yellow
  PROHIBITED: "#ef4444",   // red
  UNCLEAR: "#6b7280",      // gray
};

// ─── DC Scoring ───────────────────────────────────────────────
export const COST_PER_MILE_TRENCHING = 1_750_000; // $1.75M/mile avg
export const SUBSTATION_MAX_USEFUL_DIST_MILES = 5;
export const FIBER_MAX_USEFUL_DIST_MILES = 3;
export const FLOOD_ZONE_HIGH_RISK = ["A", "AE", "AH", "AO", "V", "VE"];

// ─── Due Diligence Default Checklist ──────────────────────────
export const DEFAULT_DD_TASKS: Array<{
  category: string;
  task_name: string;
}> = [
  { category: "Power", task_name: "Confirm utility provider & rate schedule" },
  { category: "Power", task_name: "Verify substation capacity & available MW" },
  { category: "Power", task_name: "Estimate time-to-power (TTP)" },
  { category: "Power", task_name: "Evaluate on-site generation options" },
  { category: "Fiber", task_name: "Identify carrier-neutral fiber providers" },
  { category: "Fiber", task_name: "Verify redundant fiber entry points" },
  { category: "Fiber", task_name: "Measure latency to nearest IXP" },
  { category: "Water", task_name: "Confirm municipal water access & capacity" },
  { category: "Water", task_name: "Evaluate drought / water scarcity risk" },
  { category: "Water", task_name: "Assess cooling water requirements" },
  { category: "Environmental", task_name: "Order Phase I ESA (Environmental Site Assessment)" },
  { category: "Environmental", task_name: "Check FEMA flood zone designation" },
  { category: "Environmental", task_name: "Verify National Wetlands Inventory (NWI)" },
  { category: "Environmental", task_name: "Check EPA Brownfields proximity" },
  { category: "Legal", task_name: "Confirm entitlement path (by-right vs CUP)" },
  { category: "Legal", task_name: "Review noise / decibel ordinances" },
  { category: "Legal", task_name: "Check moratorium status on data centers" },
  { category: "Zoning", task_name: "Extract setbacks & lot coverage limits" },
  { category: "Zoning", task_name: "Calculate net usable acreage" },
  { category: "Geotechnical", task_name: "Review topography / elevation change" },
  { category: "Geotechnical", task_name: "Preliminary soil assessment" },
  { category: "Financial", task_name: "Pull comparable land sales ($/acre)" },
  { category: "Financial", task_name: "Estimate cost-to-connect (power + fiber)" },
  { category: "Financial", task_name: "Prepare investment teaser / site brief" },
];
