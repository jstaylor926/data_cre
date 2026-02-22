import type { BaseMapStyle } from "./types";

// Map defaults — centered on the Norcross / Peachtree Corners parcel cluster
export const MAP_DEFAULT_CENTER: [number, number] = [-84.1950, 33.9450];
export const MAP_DEFAULT_ZOOM = 14;

// Map styles
export const MAP_STYLES: Record<BaseMapStyle, string> = {
  streets: "mapbox://styles/mapbox/dark-v11",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
  hybrid: "mapbox://styles/mapbox/satellite-streets-v12",
};

// Layer IDs
export const PARCEL_FILL_LAYER = "parcels-fill";
export const PARCEL_LINE_LAYER = "parcels-line";
export const PARCEL_SOURCE = "parcels";
export const ZONING_FILL_LAYER = "zoning-fill";
export const ZONING_LINE_LAYER = "zoning-line";
export const ZONING_SOURCE = "zoning";

// Layout dimensions
export const TOPBAR_HEIGHT = 48;
export const PANEL_WIDTH = 380;
export const MOBILE_TAB_BAR_HEIGHT = 52;
export const MOBILE_BREAKPOINT = 1024;

// Parcel layer paint colors (from wireframes)
export const PARCEL_BORDER_COLOR = "rgba(0, 212, 200, 0.22)";
export const PARCEL_BORDER_SELECTED = "#00d4c8";
export const PARCEL_FILL_SELECTED = "rgba(0, 212, 200, 0.10)";
export const PARCEL_FILL_SAVED = "rgba(245, 166, 35, 0.12)";
export const PARCEL_BORDER_SAVED = "#f5a623";

// DC Hotspot Markets
export const HOTSPOT_ZOOM_THRESHOLD = 13;
export const HOTSPOT_FLY_ZOOM = 12;
export const HOTSPOT_MARKER_COLOR = "#f97316"; // orange-500
export const HOTSPOT_MARKER_BORDER = "#fb923c"; // orange-400

// Zoning color map
export const ZONING_COLORS: Record<string, string> = {
  "C-1": "#3b82f6",   // Commercial — blue
  "C-2": "#2563eb",
  "C-3": "#1d4ed8",
  "R-1": "#22c55e",   // Residential — green
  "R-2": "#16a34a",
  "R-3": "#15803d",
  "I-1": "#f97316",   // Industrial — orange
  "I-2": "#ea580c",
  "MU-1": "#a78bfa",  // Mixed-Use — purple
  "MU-2": "#8b5cf6",
  "PD": "#06b6d4",    // Planned Development — cyan
  "A": "#84cc16",     // Agricultural — lime
};
