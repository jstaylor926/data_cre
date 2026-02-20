"use client";

import { Source, Layer } from "react-map-gl/mapbox";
import { MOCK_ZONING_GEOJSON } from "@/lib/mock-geojson";
import {
  ZONING_SOURCE,
  ZONING_FILL_LAYER,
  ZONING_LINE_LAYER,
  ZONING_COLORS,
} from "@/lib/constants";

// Build a match expression for zone colors
// ['match', ['get', 'zone'], 'C-1', '#3b82f6', 'C-2', '#2563eb', ..., '#6b7280']
const zoneColorMatch = [
  "match",
  ["get", "zone"],
  ...Object.entries(ZONING_COLORS).flat(),
  "#6b7280", // fallback gray
] as unknown[];

export default function ZoningLayer() {
  return (
    <Source id={ZONING_SOURCE} type="geojson" data={MOCK_ZONING_GEOJSON}>
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
