/**
 * HIFLD (Homeland Infrastructure Foundation-Level Data) API client.
 * Queries the public ArcGIS FeatureServer endpoints for electric substations
 * and transmission lines. All data is free/public.
 */

const SUBSTATIONS_URL =
  "https://services1.arcgis.com/Hp6G80Pky0om7QvQ/arcgis/rest/services/Electric_Substations/FeatureServer/0/query";

const TX_LINES_URL =
  "https://services1.arcgis.com/Hp6G80Pky0om7QvQ/arcgis/rest/services/Electric_Power_Transmission_Lines/FeatureServer/0/query";

export interface RawSubstation {
  id: string;
  name: string;
  voltage: number;   // MAX_VOLTAGE field
  operator: string;
  lng: number;
  lat: number;
}

export interface RawTxLine {
  id: string;
  voltage: number;
}

/**
 * Fetch substations within `radiusMiles` of a coordinate.
 * Uses esriSpatialRelIntersects with a distance parameter.
 */
export async function fetchSubstationsNear(
  lng: number,
  lat: number,
  radiusMiles: number = 20
): Promise<RawSubstation[]> {
  const radiusMeters = radiusMiles * 1609.34;

  const params = new URLSearchParams({
    where: "STATUS = 'IN SERVICE'",
    geometry: JSON.stringify({ x: lng, y: lat }),
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    distance: String(radiusMeters),
    units: "esriSRUnit_Meter",
    outFields: "OBJECTID,NAME,MAX_VOLTAGE,MIN_VOLTAGE,OPERATOR,NAICS_CODE",
    returnGeometry: "true",
    outSR: "4326",
    f: "json",
  });

  const res = await fetch(`${SUBSTATIONS_URL}?${params}`, { cache: "no-store" });
  if (!res.ok) return [];

  const json = await res.json();
  const features = json?.features ?? [];

  return features
    .map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (f: any): RawSubstation | null => {
        const v = Number(f.attributes?.MAX_VOLTAGE ?? 0);
        if (v < 50) return null; // skip distribution-level
        const x = f.geometry?.x ?? f.geometry?.rings?.[0]?.[0]?.[0];
        const y = f.geometry?.y ?? f.geometry?.rings?.[0]?.[0]?.[1];
        if (!x || !y) return null;
        return {
          id: String(f.attributes?.OBJECTID ?? Math.random()),
          name: f.attributes?.NAME ?? "Unknown Substation",
          voltage: v,
          operator: f.attributes?.OPERATOR ?? "Unknown",
          lng: x,
          lat: y,
        };
      }
    )
    .filter(Boolean) as RawSubstation[];
}

/**
 * Fetch the highest-voltage transmission line near a coordinate.
 * Returns the max voltage found within `radiusMiles`.
 */
export async function fetchNearestTxVoltage(
  lng: number,
  lat: number,
  radiusMiles: number = 5
): Promise<number | null> {
  const radiusMeters = radiusMiles * 1609.34;

  const params = new URLSearchParams({
    where: "STATUS = 'IN SERVICE'",
    geometry: JSON.stringify({ x: lng, y: lat }),
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    distance: String(radiusMeters),
    units: "esriSRUnit_Meter",
    outFields: "OBJECTID,VOLTAGE",
    returnGeometry: "false",
    f: "json",
  });

  const res = await fetch(`${TX_LINES_URL}?${params}`, { cache: "no-store" });
  if (!res.ok) return null;

  const json = await res.json();
  const features = json?.features ?? [];
  if (features.length === 0) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const voltages = features.map((f: any) => Number(f.attributes?.VOLTAGE ?? 0)).filter((v: number) => v > 0);
  return voltages.length > 0 ? Math.max(...voltages) : null;
}

/**
 * Query FEMA NFHL for the flood zone at a specific point.
 */
export async function fetchFemaFloodZone(
  lng: number,
  lat: number
): Promise<{ zone: string | null; subtype: string | null }> {
  const FEMA_URL =
    "https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query";

  const params = new URLSearchParams({
    geometry: `${lng},${lat}`,
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "FLD_ZONE,ZONE_SUBTY,SFHA_TF",
    returnGeometry: "false",
    f: "json",
  });

  try {
    const res = await fetch(`${FEMA_URL}?${params}`, { cache: "no-store" });
    if (!res.ok) return { zone: null, subtype: null };

    const json = await res.json();
    const feature = json?.features?.[0];
    return {
      zone: feature?.attributes?.FLD_ZONE ?? null,
      subtype: feature?.attributes?.ZONE_SUBTY ?? null,
    };
  } catch {
    return { zone: null, subtype: null };
  }
}

/**
 * Query EPA SDWIS (via ArcGIS) for the water system serving a specific point.
 */
export async function fetchWaterSystemData(
  lng: number,
  lat: number
): Promise<{ name: string | null; population: number | null }> {
  const WATER_URL =
    "https://services.arcgis.com/cJ9vO99S79isU896/arcgis/rest/services/Water_System_Service_Areas/FeatureServer/0/query";

  const params = new URLSearchParams({
    geometry: `${lng},${lat}`,
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "PWS_NAME,POPULATION_SERVED_COUNT",
    returnGeometry: "false",
    f: "json",
  });

  try {
    const res = await fetch(`${WATER_URL}?${params}`, { cache: "no-store" });
    if (!res.ok) return { name: null, population: null };

    const json = await res.json();
    const feature = json?.features?.[0];
    return {
      name: feature?.attributes?.PWS_NAME ?? null,
      population: Number(feature?.attributes?.POPULATION_SERVED_COUNT ?? 0),
    };
  } catch {
    return { name: null, population: null };
  }
}
