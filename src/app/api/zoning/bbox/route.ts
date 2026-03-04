import { NextRequest, NextResponse } from "next/server";
import { fetchZoningByBBox } from "@/lib/arcgis";
import { getCountyOrNull, type CountyConfig } from "@/lib/county-registry";

/**
 * GET /api/zoning/bbox?west=...&south=...&east=...&north=...&county=gwinnett
 *
 * Returns GeoJSON FeatureCollection of zoning polygons within the bounding box.
 * The `county` param selects which county's ArcGIS service to query (defaults to Gwinnett).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const west = parseFloat(searchParams.get("west") || "");
  const south = parseFloat(searchParams.get("south") || "");
  const east = parseFloat(searchParams.get("east") || "");
  const north = parseFloat(searchParams.get("north") || "");

  if ([west, south, east, north].some(isNaN)) {
    return NextResponse.json(
      { error: "Missing or invalid bbox params: west, south, east, north" },
      { status: 400 }
    );
  }

  // Resolve county config
  const countyId = searchParams.get("county");
  const county: CountyConfig | undefined = countyId
    ? getCountyOrNull(countyId) ?? undefined
    : undefined;

  try {
    const geojson = await fetchZoningByBBox(west, south, east, north, county);
    return NextResponse.json(geojson, {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
      },
    });
  } catch (err) {
    console.error("Zoning bbox query failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch zoning" },
      { status: 502 }
    );
  }
}
