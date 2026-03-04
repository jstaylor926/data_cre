/**
 * County-aware ArcGIS query helpers.
 *
 * All functions accept a CountyConfig (from county-registry.ts) to route
 * queries to the correct ArcGIS service, layer, and field names.
 *
 * Backward-compatible: functions without a county param default to Gwinnett.
 */

import {
  type CountyConfig,
  getCounty,
  getLayerQueryUrl,
  mapAttrsToParcel,
  DEFAULT_COUNTY_ID,
} from "./county-registry";

// Max records per request (ArcGIS limit)
const PAGE_SIZE = 2000;

interface ArcGISQueryParams {
  where?: string;
  geometry?: string;
  geometryType?: string;
  inSR?: string;
  spatialRel?: string;
  outFields?: string;
  outSR?: string;
  resultRecordCount?: number;
  resultOffset?: number;
  returnCountOnly?: boolean;
  returnGeometry?: boolean;
  f?: string;
}

function queryUrl(county: CountyConfig, layerId: number, params: ArcGISQueryParams): string {
  const url = new URL(getLayerQueryUrl(county, layerId));
  const defaults: ArcGISQueryParams = {
    where: "1=1",
    outSR: "4326",
    f: county.supportsGeoJSON ? "geojson" : "json",
    returnGeometry: true,
  };
  const merged = { ...defaults, ...params };
  for (const [key, value] of Object.entries(merged)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function queryLayer(county: CountyConfig, layerId: number, params: ArcGISQueryParams): Promise<Response> {
  const url = queryUrl(county, layerId, params);
  return fetch(url, { cache: "no-store" });
}

// ─── Backward-compatible default county accessor ────────────────────────────

let _defaultCounty: CountyConfig | null = null;
function defaultCounty(): CountyConfig {
  if (!_defaultCounty) _defaultCounty = getCounty(DEFAULT_COUNTY_ID);
  return _defaultCounty;
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Fetch parcel polygons within a bounding box (for map rendering).
 * Returns GeoJSON FeatureCollection (or Esri JSON for MapServer counties).
 */
export async function fetchParcelsByBBox(
  west: number,
  south: number,
  east: number,
  north: number,
  county?: CountyConfig
): Promise<GeoJSON.FeatureCollection> {
  const c = county ?? defaultCounty();
  const geometry = `${west},${south},${east},${north}`;
  const res = await queryLayer(c, c.parcelLayerId, {
    geometry,
    geometryType: "esriGeometryEnvelope",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: c.parcelOutFields,
    resultRecordCount: PAGE_SIZE,
    f: c.supportsGeoJSON ? "geojson" : "json",
  });

  if (!res.ok) {
    throw new Error(`ArcGIS parcel query failed for ${c.name}: ${res.status}`);
  }

  const data = await res.json();

  // MapServer returns Esri JSON — convert to GeoJSON if needed
  if (!c.supportsGeoJSON && !data.type) {
    return esriToGeoJSON(data);
  }

  // Ensure FeatureServer returns at least a valid empty collection if data is malformed
  if (!data || !data.type) {
    return { type: "FeatureCollection", features: [] };
  }

  return data;
}

/**
 * Fetch a single parcel polygon by APN/PIN (for centroid calculation / highlight).
 */
export async function fetchParcelGeometry(pin: string, county?: CountyConfig): Promise<GeoJSON.FeatureCollection> {
  const c = county ?? defaultCounty();
  const apnField = c.fields.apn;
  const res = await queryLayer(c, c.parcelLayerId, {
    where: `${apnField}='${pin.replace(/'/g, "''")}'`,
    outFields: c.parcelOutFields,
    f: c.supportsGeoJSON ? "geojson" : "json",
  });

  if (!res.ok) {
    throw new Error(`ArcGIS parcel geometry query failed for ${c.name}: ${res.status}`);
  }

  const data = await res.json();
  if (!c.supportsGeoJSON && !data.type) {
    return esriToGeoJSON(data);
  }
  if (!data || !data.type) {
    return { type: "FeatureCollection", features: [] };
  }
  return data;
}

/**
 * Fetch full property details from the tax/parcel layer by APN/PIN.
 * Returns raw ArcGIS attributes (not yet mapped to Parcel interface).
 */
export async function fetchPropertyByPIN(pin: string, county?: CountyConfig): Promise<Record<string, unknown> | null> {
  const c = county ?? defaultCounty();
  // Use tax table if available, otherwise fall back to parcel layer
  const layerId = c.taxLayerId ?? c.parcelLayerId;
  const apnField = c.fields.apn;

  const res = await queryLayer(c, layerId, {
    where: `${apnField}='${pin.replace(/'/g, "''")}'`,
    outFields: "*",
    returnGeometry: false,
    f: "json",
  });

  if (!res.ok) {
    throw new Error(`ArcGIS tax query failed for ${c.name}: ${res.status}`);
  }

  const data = await res.json();
  const features = data.features;
  if (!features || features.length === 0) return null;
  return features[0].attributes;
}

/**
 * Fetch zoning polygons within a bounding box.
 */
export async function fetchZoningByBBox(
  west: number,
  south: number,
  east: number,
  north: number,
  county?: CountyConfig
): Promise<GeoJSON.FeatureCollection> {
  const c = county ?? defaultCounty();
  if (c.zoningLayerId === null) {
    // County has no separate zoning layer — return empty collection
    return { type: "FeatureCollection", features: [] };
  }

  const geometry = `${west},${south},${east},${north}`;
  const zoningFields = [c.zoningLayerField, c.zoningLayerDescField].filter(Boolean).join(",");

  const res = await queryLayer(c, c.zoningLayerId, {
    geometry,
    geometryType: "esriGeometryEnvelope",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: zoningFields || "*",
    resultRecordCount: PAGE_SIZE,
    f: c.supportsGeoJSON ? "geojson" : "json",
  });

  if (!res.ok) {
    throw new Error(`ArcGIS zoning query failed for ${c.name}: ${res.status}`);
  }

  const data = await res.json();
  if (!c.supportsGeoJSON && !data.type) {
    return esriToGeoJSON(data);
  }
  if (!data || !data.type) {
    return { type: "FeatureCollection", features: [] };
  }
  return data;
}

/**
 * Map county tax/parcel attributes to our Parcel interface fields.
 * County-aware replacement for the old hardcoded mapTaxToParcel().
 */
export function mapTaxToParcel(
  attrs: Record<string, unknown>,
  pin: string,
  county?: CountyConfig
) {
  const c = county ?? defaultCounty();
  return mapAttrsToParcel(c, attrs, pin);
}

/**
 * Search for parcels by owner name.
 * Used by Entity Lookup to find all holdings of a specific LLC or principal.
 */
export async function fetchParcelsByOwner(ownerName: string, county?: CountyConfig): Promise<Record<string, unknown>[]> {
  const c = county ?? defaultCounty();
  const ownerField = c.fields.owner;
  if (!ownerField) return []; // County doesn't have owner field mapped

  const layerId = c.taxLayerId ?? c.parcelLayerId;
  const res = await queryLayer(c, layerId, {
    where: `${ownerField} LIKE '%${ownerName.toUpperCase().replace(/'/g, "''")}%'`,
    outFields: c.searchOutFields,
    returnGeometry: false,
    f: "json",
    resultRecordCount: 50,
  });

  if (!res.ok) {
    throw new Error(`ArcGIS owner search failed for ${c.name}: ${res.status}`);
  }

  const data = await res.json();
  return data.features?.map((f: { attributes: Record<string, unknown> }) => f.attributes) || [];
}

/**
 * Compute the centroid [lng, lat] of a parcel polygon by APN/PIN.
 */
export async function getParcelCentroid(pin: string, county?: CountyConfig): Promise<[number, number] | null> {
  const c = county ?? defaultCounty();
  const apnField = c.fields.apn;

  try {
    const url = queryUrl(c, c.parcelLayerId, {
      where: `${apnField}='${pin.replace(/'/g, "''")}'`,
      outFields: apnField,
      returnGeometry: true,
      outSR: "4326",
      f: "json", // Always use json here for consistent geometry parsing
    });

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;

    const data = await res.json();
    const feature = data.features?.[0];
    if (!feature?.geometry) return null;

    const geom = feature.geometry;
    // Point geometry
    if (geom.x !== undefined && geom.y !== undefined) {
      return [geom.x, geom.y];
    }
    // Polygon geometry — compute centroid from first ring
    if (geom.rings) {
      const ring: [number, number][] = geom.rings[0];
      const lng = ring.reduce((s, p) => s + p[0], 0) / ring.length;
      const lat = ring.reduce((s, p) => s + p[1], 0) / ring.length;
      return [lng, lat];
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Esri JSON → GeoJSON Conversion ────────────────────────────────────────

interface EsriFeature {
  attributes: Record<string, unknown>;
  geometry?: {
    rings?: number[][][];
    x?: number;
    y?: number;
    points?: number[][];
  };
}

interface EsriResponse {
  features: EsriFeature[];
  geometryType?: string;
}

/**
 * Convert Esri JSON response (MapServer) to GeoJSON FeatureCollection.
 * Handles polygon (rings) and point (x/y) geometries.
 */
function esriToGeoJSON(esriData: EsriResponse): GeoJSON.FeatureCollection {
  const collection: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: [],
  };

  if (!esriData || !esriData.features || !Array.isArray(esriData.features)) {
    return collection;
  }

  collection.features = esriData.features
    .map((f) => {
      let geometry: GeoJSON.Geometry | null = null;

      if (f.geometry) {
        if (f.geometry.rings) {
          // Esri rings [ [[x,y],[x,y]], [[x,y],[x,y]] ] maps to GeoJSON Polygon coordinates
          geometry = {
            type: "Polygon",
            coordinates: f.geometry.rings,
          };
        } else if (f.geometry.x !== undefined && f.geometry.y !== undefined) {
          // Point
          geometry = {
            type: "Point",
            coordinates: [f.geometry.x, f.geometry.y],
          };
        }
      }

      if (!geometry) return null;

      return {
        type: "Feature" as const,
        properties: f.attributes || {},
        geometry: geometry!,
      };
    })
    .filter((f): f is GeoJSON.Feature => f !== null);

  return collection;
}
