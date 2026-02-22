"use client";
/**
 * SubMarketOverlay — bbox rectangle overlays for Tier 1 sub-market candidates.
 *
 * Reads `scoutSession.subMarkets` from Zustand. Each sub-market's bbox is
 * rendered as a subtle teal rectangle with an optional label marker.
 *
 * Must be rendered inside <Map> in ParcelMap.tsx.
 */

import { Source, Layer, Marker } from "react-map-gl/mapbox";
import { useAppStore } from "@/store/useAppStore";
import type { SubMarketCandidate } from "@/lib/types";
import type { FillLayerSpecification, LineLayerSpecification } from "mapbox-gl";

function bboxToPolygon(bbox: [number, number, number, number]): GeoJSON.Feature {
  const [west, south, east, north] = bbox;
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [[
        [west, south],
        [east, south],
        [east, north],
        [west, north],
        [west, south],
      ]],
    },
  };
}

function scoreToColor(score: number): string {
  if (score >= 70) return "#00d4c8";   // teal — strong
  if (score >= 50) return "#f5a623";   // amber — moderate
  return "#ef4444";                     // red — weak
}

interface SubMarketChipProps {
  market: SubMarketCandidate;
  onExplore: (market: SubMarketCandidate) => void;
}

function SubMarketChip({ market, onExplore }: SubMarketChipProps) {
  const color = scoreToColor(market.quickScore);
  return (
    <div
      className="flex cursor-pointer flex-col items-center gap-1"
      onClick={() => onExplore(market)}
    >
      {/* Score badge */}
      <div
        className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/80 text-[10px] font-bold text-white shadow-md transition-transform hover:scale-110"
        style={{ backgroundColor: color }}
        title={`${market.name}\nScore: ${market.quickScore}/100`}
      >
        {market.quickScore}
      </div>
      {/* Label */}
      <div
        className="max-w-[120px] truncate rounded bg-ink2/90 px-1.5 py-0.5 font-mono text-[8px] text-bright backdrop-blur-sm"
        style={{ borderColor: color, borderWidth: 1 }}
      >
        {market.name}
      </div>
    </div>
  );
}

interface SubMarketOverlayProps {
  onExplore: (market: SubMarketCandidate) => void;
}

export default function SubMarketOverlay({ onExplore }: SubMarketOverlayProps) {
  const subMarkets = useAppStore((s) => s.scoutSession.subMarkets);
  const mode = useAppStore((s) => s.scoutSession.mode);

  // Only show overlays in discovery/results mode (Tier 1)
  if (mode !== "discovering" && mode !== "results") return null;
  if (subMarkets.length === 0) return null;

  // Build a FeatureCollection of all bbox rectangles
  const geojson: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: subMarkets.map((m) => ({
      ...bboxToPolygon(m.bbox),
      properties: { id: m.id, score: m.quickScore },
    })),
  };

  const fillPaint: FillLayerSpecification["paint"] = {
    "fill-color": [
      "interpolate",
      ["linear"],
      ["get", "score"],
      0,   "#ef4444",
      50,  "#f5a623",
      70,  "#00d4c8",
      100, "#4ade80",
    ],
    "fill-opacity": 0.08,
  };

  const linePaint: LineLayerSpecification["paint"] = {
    "line-color": [
      "interpolate",
      ["linear"],
      ["get", "score"],
      0,   "#ef4444",
      50,  "#f5a623",
      70,  "#00d4c8",
      100, "#4ade80",
    ],
    "line-width": 1.5,
    "line-dasharray": [3, 3],
    "line-opacity": 0.6,
  };

  return (
    <>
      {/* Rectangle overlays */}
      <Source id="scout-submarkets" type="geojson" data={geojson}>
        <Layer
          id="scout-submarket-fill"
          type="fill"
          source="scout-submarkets"
          paint={fillPaint}
        />
        <Layer
          id="scout-submarket-line"
          type="line"
          source="scout-submarkets"
          paint={linePaint}
        />
      </Source>

      {/* Label/score chips at center of each bbox */}
      {subMarkets.map((market) => (
        <Marker
          key={market.id}
          longitude={market.center[0]}
          latitude={market.center[1]}
          anchor="bottom"
        >
          <SubMarketChip market={market} onExplore={onExplore} />
        </Marker>
      ))}
    </>
  );
}
