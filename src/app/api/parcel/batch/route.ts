import { NextRequest, NextResponse } from "next/server";
import { mapTaxToParcel } from "@/lib/arcgis";

const TAX_TABLE_URL =
  "https://services3.arcgis.com/RfpmnkSAQleRbndX/arcgis/rest/services/Property_and_Tax/FeatureServer/3/query";

const PARCELS_URL =
  "https://services3.arcgis.com/RfpmnkSAQleRbndX/arcgis/rest/services/Property_and_Tax/FeatureServer/0/query";

/**
 * GET /api/parcel/batch?pins=PIN1,PIN2,PIN3
 *
 * Batch-fetches property data for multiple PINs in a single request.
 * Returns a Record<string, Parcel> keyed by PIN.
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

  try {
    // Build WHERE clause: PIN IN ('...', '...')
    const pinList = pins.map((p) => `'${p.replace(/'/g, "''")}'`).join(",");
    const where = `PIN IN (${pinList})`;

    // Fetch tax data
    const taxUrl = new URL(TAX_TABLE_URL);
    taxUrl.searchParams.set("where", where);
    taxUrl.searchParams.set("outFields", "*");
    taxUrl.searchParams.set("returnGeometry", "false");
    taxUrl.searchParams.set("resultRecordCount", "50");
    taxUrl.searchParams.set("f", "json");

    // Fetch centroids from parcel layer
    const parcelUrl = new URL(PARCELS_URL);
    parcelUrl.searchParams.set("where", where);
    parcelUrl.searchParams.set("outFields", "PIN");
    parcelUrl.searchParams.set("returnGeometry", "true");
    parcelUrl.searchParams.set("outSR", "4326");
    parcelUrl.searchParams.set("f", "geojson");

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
        const pin = String(attrs.PIN || "");
        if (pin) {
          result[pin] = mapTaxToParcel(attrs, pin);
        }
      }
    }

    // Add centroids from parcel geometry
    if (parcelRes.ok) {
      const parcelData = await parcelRes.json();
      for (const feature of parcelData.features || []) {
        const pin = feature.properties?.PIN;
        if (pin && result[pin] && feature.geometry?.type === "Polygon") {
          const coords = feature.geometry.coordinates[0] as [number, number][];
          const lng = coords.reduce((s: number, c: [number, number]) => s + c[0], 0) / coords.length;
          const lat = coords.reduce((s: number, c: [number, number]) => s + c[1], 0) / coords.length;
          (result[pin] as Record<string, unknown>).centroid = [lng, lat];
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
