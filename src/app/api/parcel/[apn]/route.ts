import { NextResponse } from "next/server";
import { fetchPropertyByPIN, mapTaxToParcel } from "@/lib/arcgis";
import { getParcelByAPN } from "@/lib/mock-data";
import { isDevMode } from "@/lib/config";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ apn: string }> }
) {
  const { apn } = await params;

  // Try real county data first (Gwinnett County ArcGIS)
  try {
    const attrs = await fetchPropertyByPIN(apn);
    if (attrs) {
      const parcel = mapTaxToParcel(attrs, apn);
      return NextResponse.json(parcel, {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      });
    }
  } catch (err) {
    console.error("County data fetch failed:", err);
  }

  // Dev mode: fallback to mock data for non-Gwinnett parcels or if county API is down
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
