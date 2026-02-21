"use client";

import { Source, Layer } from "react-map-gl/mapbox";
import {
  ZONING_SOURCE,
  ZONING_FILL_LAYER,
  ZONING_LINE_LAYER,
  ZONING_COLORS,
} from "@/lib/constants";

const EMPTY_GEOJSON: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

// Map Gwinnett County zoning codes to colors
const COUNTY_ZONING_COLORS: Record<string, string> = {
  // Commercial
  "C1": "#3b82f6",
  "C2": "#2563eb",
  "C3": "#1d4ed8",
  "OI": "#60a5fa",
  // Residential
  "R100": "#22c55e",
  "R100MOD": "#22c55e",
  "R75": "#16a34a",
  "R60": "#15803d",
  "R140": "#4ade80",
  "R150": "#4ade80",
  "RA200": "#86efac",
  "RL": "#bbf7d0",
  "RSL": "#bbf7d0",
  // Multi-family
  "RM": "#a78bfa",
  "RM6": "#a78bfa",
  "RM8": "#8b5cf6",
  "RM10": "#7c3aed",
  "RM13": "#6d28d9",
  // Industrial
  "M1": "#f97316",
  "M2": "#ea580c",
  // Mixed-Use / Planned
  "MU": "#c084fc",
  "MUD": "#c084fc",
  "TND": "#06b6d4",
  "PD": "#06b6d4",
  ...ZONING_COLORS,
};

// County data uses TYPE field for zoning code
const zoneColorMatch = [
  "match",
  ["get", "TYPE"],
  ...Object.entries(COUNTY_ZONING_COLORS).flat(),
  "#6b7280", // fallback gray
] as unknown[];

interface ZoningLayerProps {
  geojson?: GeoJSON.FeatureCollection | null;
}

export default function ZoningLayer({ geojson }: ZoningLayerProps) {
  const data = geojson || EMPTY_GEOJSON;

  return (
    <Source id={ZONING_SOURCE} type="geojson" data={data}>
      <Layer
        id={ZONING_FILL_LAYER}
        type="fill"
        source={ZONING_SOURCE}
        paint={{
          "fill-color": zoneColorMatch as never,
          "fill-opacity": 0.18,
        }}
      />
      <Layer
        id={ZONING_LINE_LAYER}
        type="line"
        source={ZONING_SOURCE}
        paint={{
          "line-color": zoneColorMatch as never,
          "line-width": 1.5,
          "line-opacity": 0.5,
        }}
      />
    </Source>
  );
}
