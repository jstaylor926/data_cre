import { NextRequest, NextResponse } from "next/server";
import {
  getCountyOrNull,
  getCounty,
  getLayerQueryUrl,
  DEFAULT_COUNTY_ID,
  type CountyConfig,
} from "@/lib/county-registry";

/**
 * GET /api/search?q=...&county=gwinnett
 *
 * Searches county property data by:
 * - PIN (exact or partial match)
 * - Owner name (contains match)
 * - Address (contains match)
 *
 * Returns up to 8 results with PIN, owner, address, zoning, and centroid coordinates.
 * The `county` query param selects which county to search (defaults to Gwinnett).
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  // Resolve county config
  const countyId = request.nextUrl.searchParams.get("county");
  const county: CountyConfig = countyId
    ? getCountyOrNull(countyId) ?? getCounty(DEFAULT_COUNTY_ID)
    : getCounty(DEFAULT_COUNTY_ID);

  const { fields } = county;

  // Escape single quotes for ArcGIS SQL
  const escaped = q.replace(/'/g, "''").toUpperCase();

  // Build WHERE clause using county-specific field names
  const whereParts: string[] = [];
  whereParts.push(`UPPER(${fields.apn}) LIKE '%${escaped}%'`);
  if (fields.owner) whereParts.push(`UPPER(${fields.owner}) LIKE '%${escaped}%'`);
  if (fields.address) {
    // For multi-field addresses, search the first field (street address)
    const addrField = county.multiFieldAddress
      ? fields.address.split("|")[0]
      : fields.address;
    whereParts.push(`UPPER(${addrField}) LIKE '%${escaped}%'`);
  }
  const where = whereParts.join(" OR ");

  // Build outFields list for the tax/search query
  const searchFields: string[] = [fields.apn];
  if (fields.owner) searchFields.push(fields.owner);
  if (fields.address) {
    if (county.multiFieldAddress) {
      // Include all address sub-fields
      searchFields.push(...fields.address.split("|"));
    } else {
      searchFields.push(fields.address);
    }
  }
  if (fields.zoning) searchFields.push(fields.zoning);
  if (fields.acres) searchFields.push(fields.acres);

  try {
    // Query tax/parcel table for matches
    const layerId = county.taxLayerId ?? county.parcelLayerId;
    const taxUrl = new URL(getLayerQueryUrl(county, layerId));
    taxUrl.searchParams.set("where", where);
    taxUrl.searchParams.set("outFields", searchFields.join(","));
    taxUrl.searchParams.set("returnGeometry", "false");
    taxUrl.searchParams.set("resultRecordCount", "8");
    taxUrl.searchParams.set("f", "json");

    const taxRes = await fetch(taxUrl.toString());
    if (!taxRes.ok) throw new Error(`Tax query failed: ${taxRes.status}`);

    const taxData = await taxRes.json();
    const features = taxData.features || [];

    if (features.length === 0) {
      return NextResponse.json([]);
    }

    // Get centroids for the matched PINs from the parcels layer
    const apnField = fields.apn;
    const pins = features.map(
      (f: { attributes: Record<string, unknown> }) => String(f.attributes[apnField] ?? "")
    );
    const pinWhere = pins
      .map((p: string) => `${apnField}='${p.replace(/'/g, "''")}'`)
      .join(" OR ");

    const parcelUrl = new URL(getLayerQueryUrl(county, county.parcelLayerId));
    parcelUrl.searchParams.set("where", pinWhere);
    parcelUrl.searchParams.set("outFields", apnField);
    parcelUrl.searchParams.set("returnGeometry", "true");
    parcelUrl.searchParams.set("outSR", "4326");
    if (county.supportsGeoJSON) {
      parcelUrl.searchParams.set("returnCentroid", "true");
      parcelUrl.searchParams.set("f", "geojson");
    } else {
      parcelUrl.searchParams.set("f", "json");
    }

    const parcelRes = await fetch(parcelUrl.toString());
    const parcelData = parcelRes.ok ? await parcelRes.json() : { features: [] };

    // Build a PIN → centroid lookup
    const centroids: Record<string, [number, number]> = {};

    if (county.supportsGeoJSON) {
      // GeoJSON format
      for (const pf of parcelData.features || []) {
        const pin = pf.properties?.[apnField];
        if (pin && pf.geometry?.type === "Polygon") {
          const coords = pf.geometry.coordinates[0];
          const lng = coords.reduce((s: number, c: number[]) => s + c[0], 0) / coords.length;
          const lat = coords.reduce((s: number, c: number[]) => s + c[1], 0) / coords.length;
          centroids[String(pin)] = [lng, lat];
        }
      }
    } else {
      // Esri JSON format (MapServer)
      for (const pf of parcelData.features || []) {
        const pin = pf.attributes?.[apnField];
        const geom = pf.geometry;
        if (pin && geom) {
          if (geom.x !== undefined && geom.y !== undefined) {
            centroids[String(pin)] = [geom.x, geom.y];
          } else if (geom.rings) {
            const ring: number[][] = geom.rings[0];
            const lng = ring.reduce((s: number, p: number[]) => s + p[0], 0) / ring.length;
            const lat = ring.reduce((s: number, p: number[]) => s + p[1], 0) / ring.length;
            centroids[String(pin)] = [lng, lat];
          }
        }
      }
    }

    // Combine tax data with coordinates
    const results = features.map((f: { attributes: Record<string, unknown> }) => {
      const a = f.attributes;
      const pin = String(a[apnField] || "");
      const coords = centroids[pin] || null;

      // Build address from county-specific fields
      let address: string | null = null;
      if (fields.address) {
        if (county.multiFieldAddress) {
          const parts = fields.address.split("|").map((field) => a[field]);
          address = parts.filter(Boolean).join(", ");
        } else {
          address = a[fields.address] ? String(a[fields.address]) : null;
        }
      }

      return {
        pin,
        owner: fields.owner ? a[fields.owner] || null : null,
        address: address || null,
        zoning: fields.zoning ? a[fields.zoning] || null : null,
        acres: fields.acres ? a[fields.acres] || null : null,
        coordinates: coords,
        county: county.id,
      };
    });

    return NextResponse.json(results, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (err) {
    console.error("Search failed:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 502 });
  }
}
