import { NextResponse } from "next/server";
import { getParcelByAPN, getInfraForParcel } from "@/lib/mock-data";
import { calculateDCScore } from "@/lib/dc-scoring";
import type { DCPersona } from "@/lib/types";

export async function POST(request: Request) {
  const body = await request.json();
  const { apns, persona = "HYPERSCALE" }: { apns: string[]; persona?: DCPersona } = body;

  if (!apns?.length) {
    return NextResponse.json({ error: "No APNs provided" }, { status: 400 });
  }

  const parcels = apns
    .map((apn) => getParcelByAPN(apn))
    .filter(Boolean);

  if (parcels.length === 0) {
    return NextResponse.json({ error: "No parcels found" }, { status: 404 });
  }

  // Calculate aggregate metrics
  const totalAcres = parcels.reduce((sum, p) => sum + (p!.acres ?? 0), 0);

  // Calculate blended score using the first parcel's infra as representative
  const primaryInfra = getInfraForParcel(parcels[0]!.apn);
  const blendedParcel = {
    ...parcels[0]!,
    acres: totalAcres,
  };
  const blendedScore = calculateDCScore(blendedParcel, primaryInfra, persona);

  // Aggregate zoning codes
  const zoningCodes = [...new Set(parcels.map((p) => p!.zoning).filter(Boolean))];

  return NextResponse.json({
    parcels: parcels,
    totalAcres,
    parcelCount: parcels.length,
    blendedZoning: zoningCodes.join(" / "),
    blendedScore,
  });
}
