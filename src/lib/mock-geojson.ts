import type { FeatureCollection, Feature, Polygon } from "geojson";

function makeRect(
  centerLng: number,
  centerLat: number,
  widthDeg: number,
  heightDeg: number,
  props: Record<string, string>
): Feature<Polygon> {
  const halfW = widthDeg / 2;
  const halfH = heightDeg / 2;
  return {
    type: "Feature",
    properties: props,
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [centerLng - halfW, centerLat - halfH],
          [centerLng + halfW, centerLat - halfH],
          [centerLng + halfW, centerLat + halfH],
          [centerLng - halfW, centerLat + halfH],
          [centerLng - halfW, centerLat - halfH],
        ],
      ],
    },
  };
}

// ─── Parcel GeoJSON ───────────────────────────────────────────
export const PARCEL_GEOJSON: FeatureCollection = {
  type: "FeatureCollection",
  features: [
    makeRect(-84.2135, 33.9410, 0.008, 0.006, { apn: "R7240-001", zoning: "I-2" }),
    makeRect(-84.2050, 33.9480, 0.010, 0.008, { apn: "R7240-002", zoning: "I-1" }),
    makeRect(-84.2200, 33.9600, 0.006, 0.004, { apn: "R7240-003", zoning: "C-2" }),
    makeRect(-84.1900, 33.9350, 0.012, 0.010, { apn: "R7240-004", zoning: "I-2" }),
    makeRect(-84.0730, 33.9590, 0.015, 0.012, { apn: "R7240-005", zoning: "C-3" }),
    makeRect(-84.0500, 33.9700, 0.011, 0.009, { apn: "R7240-006", zoning: "A" }),
    makeRect(-84.1950, 33.9250, 0.009, 0.007, { apn: "R7240-007", zoning: "I-2" }),
    makeRect(-84.2100, 33.9550, 0.007, 0.005, { apn: "R7240-008", zoning: "MU-1" }),
    makeRect(-84.3800, 33.7710, 0.005, 0.004, { apn: "F5100-001", zoning: "C-1" }),
    makeRect(-84.4200, 33.7900, 0.008, 0.007, { apn: "F5100-002", zoning: "I-1" }),
    makeRect(-84.3616, 34.0234, 0.012, 0.010, { apn: "F5100-003", zoning: "I-2" }),
    makeRect(-84.4494, 33.6535, 0.016, 0.014, { apn: "F5100-004", zoning: "I-2" }),
  ],
};

// ─── Zoning Districts GeoJSON ─────────────────────────────────
export const ZONING_GEOJSON: FeatureCollection = {
  type: "FeatureCollection",
  features: [
    makeRect(-84.2050, 33.9380, 0.030, 0.025, { zone: "I-2", label: "Heavy Industrial" }),
    makeRect(-84.2200, 33.9600, 0.015, 0.012, { zone: "C-2", label: "General Commercial" }),
    makeRect(-84.0730, 33.9590, 0.025, 0.020, { zone: "C-3", label: "Highway Commercial" }),
    makeRect(-84.0500, 33.9700, 0.020, 0.018, { zone: "A", label: "Agricultural" }),
    makeRect(-84.2100, 33.9550, 0.012, 0.010, { zone: "MU-1", label: "Mixed Use" }),
    makeRect(-84.4200, 33.7900, 0.020, 0.018, { zone: "I-1", label: "Light Industrial" }),
    makeRect(-84.3616, 34.0234, 0.025, 0.020, { zone: "I-2", label: "Heavy Industrial" }),
    makeRect(-84.4494, 33.6535, 0.030, 0.025, { zone: "I-2", label: "Heavy Industrial" }),
  ],
};

// ─── Substation GeoJSON ───────────────────────────────────────
export const SUBSTATION_GEOJSON: FeatureCollection = {
  type: "FeatureCollection",
  features: [
    { type: "Feature", properties: { id: "sub-001", name: "Norcross 230kV", capacity_mw: 450, voltage_kv: 230 }, geometry: { type: "Point", coordinates: [-84.2135, 33.9410] } },
    { type: "Feature", properties: { id: "sub-002", name: "Duluth 115kV", capacity_mw: 200, voltage_kv: 115 }, geometry: { type: "Point", coordinates: [-84.1485, 34.0054] } },
    { type: "Feature", properties: { id: "sub-003", name: "Lawrenceville 500kV", capacity_mw: 800, voltage_kv: 500 }, geometry: { type: "Point", coordinates: [-83.9880, 33.9562] } },
    { type: "Feature", properties: { id: "sub-004", name: "Roswell 230kV", capacity_mw: 350, voltage_kv: 230 }, geometry: { type: "Point", coordinates: [-84.3616, 34.0234] } },
    { type: "Feature", properties: { id: "sub-005", name: "College Park 115kV", capacity_mw: 280, voltage_kv: 115 }, geometry: { type: "Point", coordinates: [-84.4494, 33.6535] } },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────
export function getParcelCentroid(apn: string): [number, number] | null {
  const feature = PARCEL_GEOJSON.features.find(
    (f) => f.properties?.apn === apn
  );
  if (!feature || feature.geometry.type !== "Polygon") return null;
  const coords = feature.geometry.coordinates[0];
  const lngs = coords.map((c) => c[0]);
  const lats = coords.map((c) => c[1]);
  return [
    (Math.min(...lngs) + Math.max(...lngs)) / 2,
    (Math.min(...lats) + Math.max(...lats)) / 2,
  ];
}
