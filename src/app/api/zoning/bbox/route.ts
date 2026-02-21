import { NextRequest, NextResponse } from "next/server";
import { fetchZoningByBBox } from "@/lib/arcgis";

/**
 * GET /api/zoning/bbox?west=...&south=...&east=...&north=...
 *
 * Returns GeoJSON FeatureCollection of zoning polygons within the bounding box.
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

  try {
    const geojson = await fetchZoningByBBox(west, south, east, north);
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
