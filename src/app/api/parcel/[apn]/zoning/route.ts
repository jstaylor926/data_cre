import { NextResponse } from "next/server";
import { fetchPropertyByPIN, mapTaxToParcel } from "@/lib/arcgis";
import { getParcelByAPN } from "@/lib/mock-data";
import { getZoningStandards } from "@/lib/zoning-standards";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ apn: string }> }
) {
  const { apn } = await params;

  // Fetch parcel to get the zoning code
  let zoning: string | null = null;
  try {
    const attrs = await fetchPropertyByPIN(apn);
    if (attrs) {
      const p = mapTaxToParcel(attrs, apn);
      zoning = p.zoning;
    }
  } catch {
    // Fall through to mock
  }

  if (!zoning) {
    const mock = getParcelByAPN(apn);
    zoning = mock?.zoning ?? null;
  }

  const summary = getZoningStandards(zoning);

  return NextResponse.json(summary, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
    },
  });
}
