import { NextRequest, NextResponse } from "next/server";
import { fetchParcelsByBBox } from "@/lib/arcgis";
import { getCountyOrNull, getCounty, DEFAULT_COUNTY_ID, type CountyConfig } from "@/lib/county-registry";

/**
 * GET /api/parcels/bbox?west=...&south=...&east=...&north=...&county=gwinnett
 *
 * Returns GeoJSON FeatureCollection of parcel polygons within the bounding box.
 * Properties are normalized to standard field names (PIN, ADDRESS, CALCULATEDACREAGE)
 * regardless of the upstream county's native field names.
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

    // Normalize feature properties to standard field names so the map UI
    // doesn't need county-specific awareness (PIN, ADDRESS, CALCULATEDACREAGE).
    const c = county ?? getCounty(DEFAULT_COUNTY_ID);
    const { apn: apnField, address: addressField, acres: acresField } = c.fields;
    const needsNormalization =
      apnField !== "PIN" || (addressField && addressField !== "ADDRESS") || (acresField && acresField !== "CALCULATEDACREAGE");

    if (needsNormalization && geojson.features) {
      // Pick first non-pipe segment of address field (pipe = multi-field concat)
      const addrKey = addressField?.split("|")[0] ?? null;
      for (const feature of geojson.features) {
        const props = feature.properties;
        if (!props) continue;
        if (apnField !== "PIN" && props[apnField] !== undefined) {
          props.PIN = props[apnField];
        }
        if (addrKey && addrKey !== "ADDRESS" && props[addrKey] !== undefined) {
          props.ADDRESS = props[addrKey];
        }
        if (acresField && acresField !== "CALCULATEDACREAGE" && props[acresField] !== undefined) {
          props.CALCULATEDACREAGE = props[acresField];
        }
      }
    }

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
