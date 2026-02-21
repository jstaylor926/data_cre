import { NextRequest, NextResponse } from "next/server";
import { fetchParcelsByBBox } from "@/lib/arcgis";

/**
 * GET /api/parcels/bbox?west=...&south=...&east=...&north=...
 *
 * Returns GeoJSON FeatureCollection of parcel polygons within the bounding box.
 * Proxies the Gwinnett County ArcGIS Feature Service.
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
    const geojson = await fetchParcelsByBBox(west, south, east, north);
    return NextResponse.json(geojson, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (err) {
    console.error("Parcel bbox query failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch parcels" },
      { status: 502 }
    );
  }
}
