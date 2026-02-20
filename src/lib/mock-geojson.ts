import type { FeatureCollection, Feature, Polygon } from "geojson";

// Helper to create a rectangular parcel polygon from a center point and dimensions
function makeParcel(
  apn: string,
  centerLng: number,
  centerLat: number,
  widthDeg: number,
  heightDeg: number,
  zoning?: string
): Feature<Polygon> {
  const halfW = widthDeg / 2;
  const halfH = heightDeg / 2;
  return {
    type: "Feature",
    id: apn,
    properties: { apn, zoning: zoning ?? "C-2" },
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

// Approximate parcel sizes (in degrees):
// ~0.001 deg longitude ≈ 85m at 34°N
// ~0.001 deg latitude ≈ 111m
// A typical 1-acre parcel ≈ 0.0012 x 0.0009 degrees
// Larger commercial parcels can be 3-5x that

export const MOCK_PARCELS_GEOJSON: FeatureCollection<Polygon> = {
  type: "FeatureCollection",
  features: [
    // Norcross / Buford Hwy area parcels
    makeParcel("R7001-001", -84.2055, 33.9410, 0.0020, 0.0015, "C-2"),
    makeParcel("R7001-002", -84.2200, 33.9690, 0.0028, 0.0022, "MU-1"),
    makeParcel("R7001-003", -84.1650, 33.9560, 0.0012, 0.0009, "R-2"),
    makeParcel("R7001-004", -84.1980, 33.9350, 0.0016, 0.0012, "C-2"),
    makeParcel("R7001-005", -84.2150, 33.9650, 0.0045, 0.0035, "PD"),
    makeParcel("R7001-006", -84.1720, 33.9480, 0.0008, 0.0006, "R-1"),

    // Norcross Gateway / Buford Hwy
    makeParcel("R7001-007", -84.2100, 33.9380, 0.0022, 0.0018, "C-3"),
    makeParcel("R7001-008", -84.1900, 33.9300, 0.0038, 0.0028, "I-1"),

    // Peachtree Corners / Medlock Bridge
    makeParcel("R7001-009", -84.2250, 33.9720, 0.0010, 0.0008, "R-2"),
    makeParcel("R7001-010", -84.1850, 33.9550, 0.0018, 0.0014, "C-2"),
    makeParcel("R7001-011", -84.2180, 33.9710, 0.0032, 0.0025, "MU-2"),
    makeParcel("R7001-012", -84.1580, 33.9540, 0.0014, 0.0010, "C-1"),

    // Industrial / Best Friend Rd
    makeParcel("R7001-013", -84.1750, 33.9250, 0.0050, 0.0040, "I-2"),

    // Steve Reynolds Blvd
    makeParcel("R7001-014", -84.1950, 33.9420, 0.0024, 0.0020, "C-2"),

    // Fulton County parcels (more spread out, some near Atlanta)
    makeParcel("F4200-001", -84.3880, 33.7810, 0.0020, 0.0015, "MU-1"),
    makeParcel("F4200-002", -84.3540, 33.7390, 0.0008, 0.0006, "R-3"),
    makeParcel("F4200-003", -84.4050, 33.7720, 0.0030, 0.0022, "I-1"),
    makeParcel("F4200-004", -84.3620, 33.8430, 0.0018, 0.0014, "C-3"),
    makeParcel("F4200-005", -84.3650, 33.7580, 0.0026, 0.0020, "PD"),
    makeParcel("F4200-006", -84.3500, 33.8050, 0.0018, 0.0015, "C-2"),
  ],
};

// Zoning areas — larger polygons representing zoning districts (for the zoning overlay)
export const MOCK_ZONING_GEOJSON: FeatureCollection<Polygon> = {
  type: "FeatureCollection",
  features: [
    // Norcross commercial corridor
    {
      type: "Feature",
      properties: { zone: "C-2", name: "General Commercial" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-84.215, 33.932],
            [-84.195, 33.932],
            [-84.195, 33.948],
            [-84.215, 33.948],
            [-84.215, 33.932],
          ],
        ],
      },
    },
    // Peachtree Corners mixed-use
    {
      type: "Feature",
      properties: { zone: "MU-1", name: "Mixed Use" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-84.228, 33.962],
            [-84.210, 33.962],
            [-84.210, 33.978],
            [-84.228, 33.978],
            [-84.228, 33.962],
          ],
        ],
      },
    },
    // Norcross industrial
    {
      type: "Feature",
      properties: { zone: "I-1", name: "Light Industrial" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-84.198, 33.920],
            [-84.175, 33.920],
            [-84.175, 33.935],
            [-84.198, 33.935],
            [-84.198, 33.920],
          ],
        ],
      },
    },
    // Residential area
    {
      type: "Feature",
      properties: { zone: "R-2", name: "Medium Density Residential" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-84.175, 33.948],
            [-84.158, 33.948],
            [-84.158, 33.962],
            [-84.175, 33.962],
            [-84.175, 33.948],
          ],
        ],
      },
    },
  ],
};

// Helper to get parcel centroid from GeoJSON
export function getParcelCentroid(
  apn: string
): [number, number] | null {
  const feature = MOCK_PARCELS_GEOJSON.features.find(
    (f) => f.properties?.apn === apn
  );
  if (!feature) return null;

  const coords = feature.geometry.coordinates[0];
  const lngs = coords.map((c) => c[0]);
  const lats = coords.map((c) => c[1]);
  return [
    (Math.min(...lngs) + Math.max(...lngs)) / 2,
    (Math.min(...lats) + Math.max(...lats)) / 2,
  ];
}
