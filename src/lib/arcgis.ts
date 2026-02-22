/**
 * Gwinnett County ArcGIS Feature Service helpers
 *
 * Data sources (free, public):
 *   - Parcels (polygons):     FeatureServer/0
 *   - Zoning (polygons):      FeatureServer/1
 *   - Property & Tax (table): FeatureServer/3
 */

const BASE_URL =
  "https://services3.arcgis.com/RfpmnkSAQleRbndX/arcgis/rest/services/Property_and_Tax/FeatureServer";

const PARCELS_LAYER = 0;
const ZONING_LAYER = 1;
const TAX_TABLE_LAYER = 3;

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

async function queryLayer(layer: number, params: ArcGISQueryParams): Promise<Response> {
  const url = new URL(`${BASE_URL}/${layer}/query`);
  const defaults: ArcGISQueryParams = {
    where: "1=1",
    outSR: "4326",
    f: "geojson",
    returnGeometry: true,
  };
  const merged = { ...defaults, ...params };
  for (const [key, value] of Object.entries(merged)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }
  // Note: Next.js data cache is skipped for responses >2MB (ArcGIS bbox queries).
  // Use no-store to avoid the warning; HTTP caching still applies via ArcGIS CDN.
  return fetch(url.toString(), { cache: "no-store" });
}

/**
 * Fetch parcel polygons within a bounding box (for map rendering).
 * Returns GeoJSON FeatureCollection with PIN, ADDRESS, CALCULATEDACREAGE.
 */
export async function fetchParcelsByBBox(
  west: number,
  south: number,
  east: number,
  north: number
): Promise<GeoJSON.FeatureCollection> {
  const geometry = `${west},${south},${east},${north}`;
  const res = await queryLayer(PARCELS_LAYER, {
    geometry,
    geometryType: "esriGeometryEnvelope",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "PIN,ADDRESS,CALCULATEDACREAGE,TAXPIN",
    resultRecordCount: PAGE_SIZE,
  });

  if (!res.ok) {
    throw new Error(`ArcGIS parcel query failed: ${res.status}`);
  }

  return res.json();
}

/**
 * Fetch a single parcel polygon by PIN (for centroid calculation / highlight).
 */
export async function fetchParcelGeometry(pin: string): Promise<GeoJSON.FeatureCollection> {
  const res = await queryLayer(PARCELS_LAYER, {
    where: `PIN='${pin.replace(/'/g, "''")}'`,
    outFields: "PIN,ADDRESS,CALCULATEDACREAGE,TAXPIN",
  });

  if (!res.ok) {
    throw new Error(`ArcGIS parcel geometry query failed: ${res.status}`);
  }

  return res.json();
}

/**
 * Fetch full property details from the tax table by PIN.
 * Returns JSON (not GeoJSON — it's a table, no geometry).
 */
export async function fetchPropertyByPIN(pin: string): Promise<Record<string, unknown> | null> {
  const res = await queryLayer(TAX_TABLE_LAYER, {
    where: `PIN='${pin.replace(/'/g, "''")}'`,
    outFields: "*",
    returnGeometry: false,
    f: "json",
  });

  if (!res.ok) {
    throw new Error(`ArcGIS tax query failed: ${res.status}`);
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
  north: number
): Promise<GeoJSON.FeatureCollection> {
  const geometry = `${west},${south},${east},${north}`;
  const res = await queryLayer(ZONING_LAYER, {
    geometry,
    geometryType: "esriGeometryEnvelope",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "TYPE,JURISDICTION",
    resultRecordCount: PAGE_SIZE,
  });

  if (!res.ok) {
    throw new Error(`ArcGIS zoning query failed: ${res.status}`);
  }

  return res.json();
}

/**
 * Map county tax table attributes to our Parcel interface fields.
 */
export function mapTaxToParcel(
  attrs: Record<string, unknown>,
  pin: string
): {
  apn: string;
  county: string;
  owner_name: string | null;
  owner_mailing_address: string | null;
  site_address: string | null;
  acres: number | null;
  land_use_code: string | null;
  zoning: string | null;
  zoning_desc: string | null;
  assessed_total: number | null;
  land_value: number | null;
  improvement_value: number | null;
  last_sale_date: string | null;
  last_sale_price: number | null;
  legal_desc: string | null;
  deed_refs: string[];
  previous_owners: string[];
} {
  const str = (v: unknown) => (v != null && v !== "" ? String(v) : null);
  const num = (v: unknown) => (v != null ? Number(v) || null : null);

  // Build site address from parts
  const locAddr = str(attrs.LOCADDR);
  const locCity = str(attrs.LOCCITY);
  const locState = str(attrs.LOCSTATE);
  const locZip = str(attrs.LOCZIP);
  const siteAddress = [locAddr, locCity, locState, locZip].filter(Boolean).join(", ");

  // Build mailing address
  const mailAddr = str(attrs.MAILADDR);
  const mailCity = str(attrs.MAILCITY);
  const mailState = str(attrs.MAILSTAT);
  const mailZip = str(attrs.MAILZIP);
  const mailingAddress = [mailAddr, mailCity, mailState, mailZip].filter(Boolean).join(", ");

  // Deed references
  const deedRefs = [str(attrs.DOC1REF), str(attrs.DOC2REF), str(attrs.DOC3REF)].filter(
    (r): r is string => r !== null
  );

  // Previous owners / grantors
  const prevOwners = [str(attrs.GRANTOR1), str(attrs.GRANTOR2), str(attrs.GRANTOR3)].filter(
    (o): o is string => o !== null
  );

  return {
    apn: pin,
    county: "Gwinnett",
    owner_name: str(attrs.OWNER1),
    owner_mailing_address: mailingAddress || null,
    site_address: siteAddress || null,
    acres: num(attrs.LEGALAC),
    land_use_code: str(attrs.PCDESC),
    zoning: str(attrs.ZONING),
    zoning_desc: str(attrs.ZONEDESC),
    assessed_total: num(attrs.TOTVAL1),
    land_value: num(attrs.LANDVAL1),
    improvement_value: num(attrs.DWLGVAL1),
    last_sale_date: null, // Not available in county open data
    last_sale_price: null, // Not available in county open data
    legal_desc: str(attrs.LEGAL1),
    deed_refs: deedRefs,
    previous_owners: prevOwners,
  };
}

/**
 * Compute the centroid [lng, lat] of a parcel polygon by PIN.
 * Used by Phase 3 DC score API to locate the parcel for proximity queries.
 */
export async function getParcelCentroid(pin: string): Promise<[number, number] | null> {
  try {
    const url = new URL(`${BASE_URL}/${PARCELS_LAYER}/query`);
    url.searchParams.set("where", `PIN='${pin.replace(/'/g, "''")}'`);
    url.searchParams.set("outFields", "PIN");
    url.searchParams.set("returnGeometry", "true");
    url.searchParams.set("outSR", "4326");
    url.searchParams.set("f", "json");

    const res = await fetch(url.toString(), { cache: "no-store" });
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
