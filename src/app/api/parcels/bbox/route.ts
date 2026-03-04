import { NextRequest, NextResponse } from "next/server";
import { fetchParcelsByBBox } from "@/lib/arcgis";
import { getCountyOrNull, type CountyConfig } from "@/lib/county-registry";

/**
 * GET /api/parcels/bbox?west=...&south=...&east=...&north=...&county=gwinnett
 *
 * Returns GeoJSON FeatureCollection of parcel polygons within the bounding box.
 * The `county` param selects which county's ArcGIS service to query (defaults to Gwinnett).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const west = Math.round(parseFloat(searchParams.get("west") || "") * 1000000) / 1000000;
  const south = Math.round(parseFloat(searchParams.get("south") || "") * 1000000) / 1000000;
  const east = Math.round(parseFloat(searchParams.get("east") || "") * 1000000) / 1000000;
  const north = Math.round(parseFloat(searchParams.get("north") || "") * 1000000) / 1000000;

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
    const geojson = await fetchParcelsByBBox(west, south, east, north, county);
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
