import { NextResponse } from "next/server";
import { fetchPropertyByPIN, mapTaxToParcel } from "@/lib/arcgis";
import { getParcelByAPN } from "@/lib/mock-data";

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
    console.error("County data fetch failed, falling back to mock:", err);
  }

  // Fallback to mock data for non-Gwinnett parcels or if county API is down
  const parcel = getParcelByAPN(apn);

  if (!parcel) {
    return NextResponse.json(
      { error: "Parcel not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(parcel);
}
