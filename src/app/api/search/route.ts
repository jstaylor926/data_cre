import { NextRequest, NextResponse } from "next/server";

const TAX_TABLE_URL =
  "https://services3.arcgis.com/RfpmnkSAQleRbndX/arcgis/rest/services/Property_and_Tax/FeatureServer/3/query";

const PARCELS_URL =
  "https://services3.arcgis.com/RfpmnkSAQleRbndX/arcgis/rest/services/Property_and_Tax/FeatureServer/0/query";

/**
 * GET /api/search?q=...
 *
 * Searches Gwinnett County property data by:
 * - PIN (exact or partial match)
 * - Owner name (contains match)
 * - Address (contains match)
 *
 * Returns up to 8 results with PIN, owner, address, zoning, and centroid coordinates.
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  // Escape single quotes for ArcGIS SQL
  const escaped = q.replace(/'/g, "''").toUpperCase();

  // Build WHERE clause: search PIN, owner, and address
  const where = `UPPER(PIN) LIKE '%${escaped}%' OR UPPER(OWNER1) LIKE '%${escaped}%' OR UPPER(LOCADDR) LIKE '%${escaped}%'`;

  try {
    // Query tax table for matches
    const taxUrl = new URL(TAX_TABLE_URL);
    taxUrl.searchParams.set("where", where);
    taxUrl.searchParams.set("outFields", "PIN,OWNER1,LOCADDR,LOCCITY,ZONING,LEGALAC");
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
    const pins = features.map((f: { attributes: { PIN: string } }) => f.attributes.PIN);
    const pinWhere = pins.map((p: string) => `PIN='${p.replace(/'/g, "''")}'`).join(" OR ");

    const parcelUrl = new URL(PARCELS_URL);
    parcelUrl.searchParams.set("where", pinWhere);
    parcelUrl.searchParams.set("outFields", "PIN");
    parcelUrl.searchParams.set("returnGeometry", "true");
    parcelUrl.searchParams.set("outSR", "4326");
    parcelUrl.searchParams.set("returnCentroid", "true");
    parcelUrl.searchParams.set("f", "geojson");

    const parcelRes = await fetch(parcelUrl.toString());
    const parcelData = parcelRes.ok ? await parcelRes.json() : { features: [] };

    // Build a PIN → centroid lookup
    const centroids: Record<string, [number, number]> = {};
    for (const pf of parcelData.features || []) {
      if (pf.properties?.PIN && pf.geometry?.type === "Polygon") {
        const coords = pf.geometry.coordinates[0];
        const lng = coords.reduce((s: number, c: number[]) => s + c[0], 0) / coords.length;
        const lat = coords.reduce((s: number, c: number[]) => s + c[1], 0) / coords.length;
        centroids[pf.properties.PIN] = [lng, lat];
      }
    }

    // Combine tax data with coordinates
    const results = features.map((f: { attributes: Record<string, unknown> }) => {
      const a = f.attributes;
      const pin = String(a.PIN || "");
      const coords = centroids[pin] || null;
      return {
        pin,
        owner: a.OWNER1 || null,
        address: [a.LOCADDR, a.LOCCITY].filter(Boolean).join(", "),
        zoning: a.ZONING || null,
        acres: a.LEGALAC || null,
        coordinates: coords,
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
