import { NextRequest, NextResponse } from "next/server";
import { fetchPropertyByPIN, mapTaxToParcel } from "@/lib/arcgis";
import { getParcelByAPN } from "@/lib/mock-data";
import { getCountyOrNull, type CountyConfig } from "@/lib/county-registry";
import { isDevMode } from "@/lib/config";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ apn: string }> }
) {
  const { apn } = await params;

  // Resolve county from query param (defaults to Gwinnett if omitted)
  const countyId = request.nextUrl.searchParams.get("county");
  const county: CountyConfig | undefined = countyId
    ? getCountyOrNull(countyId) ?? undefined
    : undefined;

  // Try real county data first
  try {
    const attrs = await fetchPropertyByPIN(apn, county);
    if (attrs) {
      const parcel = mapTaxToParcel(attrs, apn, county);
      return NextResponse.json(parcel, {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      });
    }
  } catch (err) {
    console.error("County data fetch failed:", err);
  }

  // Dev mode: fallback to mock data if county API is down
  if (isDevMode) {
    const parcel = getParcelByAPN(apn);
    if (parcel) return NextResponse.json(parcel);
  }

  console.warn(`[API] Parcel not found in any source: ${apn}`);

  return NextResponse.json(
    { error: "Parcel not found" },
    { status: 404 }
  );
}
