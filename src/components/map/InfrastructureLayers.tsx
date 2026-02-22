"use client";
/**
 * Renders DC mode infrastructure layers on the Mapbox map:
 *  - Transmission lines (voltage-tiered colors)
 *  - Substation markers (scaled by voltage)
 *  - Fiber route indicator lines
 *
 * Data is fetched live from HIFLD via /api/infrastructure/substations
 * and /api/infrastructure/tx-lines whenever the viewport bbox changes.
 */

import { useEffect, useState, useCallback } from "react";
import { Source, Layer, Marker } from "react-map-gl/mapbox";
import { useAppStore } from "@/store/useAppStore";
import type { Substation } from "@/lib/types";

// Voltage → color mapping (matches wireframe spec)
function voltageColor(v: number): string {
  if (v >= 500) return "#ef4444"; // red  — 500kV
  if (v >= 230) return "#eab308"; // yellow — 230kV
  if (v >= 115) return "#22c55e"; // green — 115kV
  return "#3b82f6";               // blue  — 69kV
}

function voltageSize(v: number): number {
  if (v >= 500) return 18;
  if (v >= 230) return 14;
  if (v >= 115) return 11;
  return 8;
}

interface TxFeature {
  id: string;
  voltage: number;
  coordinates: [number, number][];
}

// Approximate degrees-per-pixel for a given zoom level
function bboxFromViewport(lat: number, lng: number, zoom: number) {
  // Rough tile-based approach: at zoom 14 with 1280×800 viewport
  const tilesX = Math.pow(2, zoom);
  const degPerTile = 360 / tilesX;
  const span = degPerTile * 3; // roughly 3 tiles of padding each side
  return {
    west:  lng - span,
    east:  lng + span,
    south: lat - span * 0.6,
    north: lat + span * 0.6,
  };
}

export default function InfrastructureLayers() {
  const dcInfrastructure = useAppStore((s) => s.dcInfrastructure);
  const selectedAPN = useAppStore((s) => s.selectedAPN);
  const viewportLat  = useAppStore((s) => s.viewportLat);
  const viewportLng  = useAppStore((s) => s.viewportLng);
  const viewportZoom = useAppStore((s) => s.viewportZoom);
  const [txLines, setTxLines] = useState<TxFeature[]>([]);

  const bbox = bboxFromViewport(viewportLat, viewportLng, viewportZoom);

  // Fetch TX lines for current viewport
  const fetchTxLines = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        west: String(bbox.west),
        south: String(bbox.south),
        east: String(bbox.east),
        north: String(bbox.north),
      });
      const res = await fetch(`/api/infrastructure/tx-lines?${params}`);
      if (res.ok) {
        const data: TxFeature[] = await res.json();
        setTxLines(data);
      }
    } catch {
      // Silently fail — infra layers are enhancement, not core
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewportLat, viewportLng, viewportZoom]);

  useEffect(() => {
    fetchTxLines();
  }, [fetchTxLines]);

  // Build GeoJSON for TX lines grouped by voltage tier
  const txGeojson: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: txLines.map((line) => ({
      type: "Feature",
      id: line.id,
      properties: { voltage: line.voltage, color: voltageColor(line.voltage) },
      geometry: { type: "LineString", coordinates: line.coordinates },
    })),
  };

  // Substations from already-fetched DCInfrastructure (selected parcel radius)
  const substations: Substation[] = dcInfrastructure?.substations ?? [];

  return (
    <>
      {/* TX Lines */}
      <Source id="tx-lines" type="geojson" data={txGeojson}>
        <Layer
          id="tx-lines-layer"
          type="line"
          source="tx-lines"
          paint={{
            "line-color": ["get", "color"],
            "line-width": [
              "interpolate", ["linear"], ["get", "voltage"],
              69, 1.5,
              115, 2,
              230, 2.5,
              500, 3,
            ],
            "line-opacity": 0.75,
          }}
        />
      </Source>

      {/* Substation markers (only when a parcel is selected + infra is loaded) */}
      {selectedAPN && substations.map((sub) => {
        const size = voltageSize(sub.voltage);
        const color = voltageColor(sub.voltage);
        return (
          <Marker
            key={sub.id}
            longitude={sub.coordinates[0]}
            latitude={sub.coordinates[1]}
            anchor="center"
          >
            <div
              title={`${sub.name} · ${sub.voltage}kV · ${sub.distance.toFixed(1)}mi`}
              style={{
                width: size,
                height: size,
                borderRadius: 3,
                border: `2px solid ${color}`,
                background: `${color}22`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "default",
              }}
            >
              {sub.voltage >= 230 && (
                <span style={{ fontSize: Math.max(5, size - 8), color, lineHeight: 1 }}>⚡</span>
              )}
            </div>
          </Marker>
        );
      })}
    </>
  );
}
