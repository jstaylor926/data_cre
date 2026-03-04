import { NextRequest, NextResponse } from "next/server";
import { mapTaxToParcel } from "@/lib/arcgis";
import {
  getCountyOrNull,
  getCounty,
  getLayerQueryUrl,
  DEFAULT_COUNTY_ID,
  type CountyConfig,
} from "@/lib/county-registry";

/**
 * GET /api/parcel/batch?pins=PIN1,PIN2,PIN3&county=gwinnett
 *
 * Batch-fetches property data for multiple PINs in a single request.
 * Returns a Record<string, Parcel> keyed by PIN.
 * The `county` query param selects which county to query (defaults to Gwinnett).
 */
export async function GET(request: NextRequest) {
  const pinsParam = request.nextUrl.searchParams.get("pins");

  if (!pinsParam) {
    return NextResponse.json({});
  }

  const pins = pinsParam
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 50); // Limit to 50 at a time

  if (pins.length === 0) {
    return NextResponse.json({});
  }

  // Resolve county config
  const countyId = request.nextUrl.searchParams.get("county");
  const county: CountyConfig = countyId
    ? getCountyOrNull(countyId) ?? getCounty(DEFAULT_COUNTY_ID)
    : getCounty(DEFAULT_COUNTY_ID);

  const apnField = county.fields.apn;

  try {
    // Build WHERE clause using county-specific APN field
    const pinList = pins.map((p) => `'${p.replace(/'/g, "''")}'`).join(",");
    const where = `${apnField} IN (${pinList})`;

    // Fetch tax data
    const taxLayerId = county.taxLayerId ?? county.parcelLayerId;
    const taxUrl = new URL(getLayerQueryUrl(county, taxLayerId));
    taxUrl.searchParams.set("where", where);
    taxUrl.searchParams.set("outFields", "*");
    taxUrl.searchParams.set("returnGeometry", "false");
    taxUrl.searchParams.set("resultRecordCount", "50");
    taxUrl.searchParams.set("f", "json");

    // Fetch centroids from parcel layer
    const parcelUrl = new URL(getLayerQueryUrl(county, county.parcelLayerId));
    parcelUrl.searchParams.set("where", where);
    parcelUrl.searchParams.set("outFields", apnField);
    parcelUrl.searchParams.set("returnGeometry", "true");
    parcelUrl.searchParams.set("outSR", "4326");
    parcelUrl.searchParams.set("f", county.supportsGeoJSON ? "geojson" : "json");

    const [taxRes, parcelRes] = await Promise.all([
      fetch(taxUrl.toString()),
      fetch(parcelUrl.toString()),
    ]);

    // Process tax data
    const result: Record<string, Record<string, unknown>> = {};

    if (taxRes.ok) {
      const taxData = await taxRes.json();
      for (const feature of taxData.features || []) {
        const attrs = feature.attributes;
        const pin = String(attrs[apnField] || "");
        if (pin) {
          result[pin] = mapTaxToParcel(attrs, pin, county);
        }
      }
    }

    // Add centroids from parcel geometry
    if (parcelRes.ok) {
      const parcelData = await parcelRes.json();

      if (county.supportsGeoJSON) {
        // GeoJSON format
        for (const feature of parcelData.features || []) {
          const pin = feature.properties?.[apnField];
          if (pin && result[String(pin)] && feature.geometry?.type === "Polygon") {
            const coords = feature.geometry.coordinates[0] as [number, number][];
            const lng = coords.reduce((s: number, c: [number, number]) => s + c[0], 0) / coords.length;
            const lat = coords.reduce((s: number, c: [number, number]) => s + c[1], 0) / coords.length;
            (result[String(pin)] as Record<string, unknown>).centroid = [lng, lat];
          }
        }
      } else {
        // Esri JSON format (MapServer)
        for (const feature of parcelData.features || []) {
          const pin = feature.attributes?.[apnField];
          const geom = feature.geometry;
          if (pin && result[String(pin)] && geom) {
            let lng: number | null = null;
            let lat: number | null = null;
            if (geom.x !== undefined && geom.y !== undefined) {
              lng = geom.x;
              lat = geom.y;
            } else if (geom.rings) {
              const ring: number[][] = geom.rings[0];
              lng = ring.reduce((s: number, p: number[]) => s + p[0], 0) / ring.length;
              lat = ring.reduce((s: number, p: number[]) => s + p[1], 0) / ring.length;
            }
            if (lng !== null && lat !== null) {
              (result[String(pin)] as Record<string, unknown>).centroid = [lng, lat];
            }
          }
        }
      }
    }

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (err) {
    console.error("Batch parcel fetch failed:", err);
    return NextResponse.json({ error: "Batch fetch failed" }, { status: 502 });
  }
}
