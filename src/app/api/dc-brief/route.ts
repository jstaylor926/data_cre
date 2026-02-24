import { NextResponse } from "next/server";
import { getParcelByAPN, getInfraForParcel } from "@/lib/mock-data";
import { calculateDCScore } from "@/lib/dc-scoring";
import { MOCK_ZONING_EXTRACTIONS, calculateNetUsableAcres } from "@/lib/zoning-standards";
import type { DCPersona } from "@/lib/types";

export async function POST(request: Request) {
  const body = await request.json();
  const { apn, persona = "HYPERSCALE" }: { apn: string; persona?: DCPersona } = body;

  const parcel = getParcelByAPN(apn);
  if (!parcel) {
    return NextResponse.json({ error: "Parcel not found" }, { status: 404 });
  }

  const infra = getInfraForParcel(apn);
  const dcScore = calculateDCScore(parcel, infra, persona);
  const zoningData = parcel.zoning
    ? MOCK_ZONING_EXTRACTIONS[parcel.zoning] ?? null
    : null;

  const netUsableAcres = zoningData
    ? calculateNetUsableAcres(parcel.acres ?? 0, zoningData.setbacks, zoningData.maxLotCoverage)
    : null;

  // Generate a JSON brief (Phase 3 - PDF rendering handled client-side via @react-pdf/renderer)
  const brief = {
    title: "Data Center Site Brief",
    subtitle: "Investment Teaser",
    generatedAt: new Date().toISOString(),
    parcel: {
      apn: parcel.apn,
      address: parcel.site_address ?? "N/A",
      owner: parcel.owner_name ?? "N/A",
      county: parcel.county,
      acres: parcel.acres,
      zoning: parcel.zoning,
      lastSalePrice: parcel.last_sale_price,
      lastSaleDate: parcel.last_sale_date,
    },
    score: {
      total: dcScore.totalScore,
      grade:
        dcScore.totalScore >= 80
          ? "A"
          : dcScore.totalScore >= 65
          ? "B"
          : dcScore.totalScore >= 50
          ? "C"
          : dcScore.totalScore >= 35
          ? "D"
          : "F",
      persona,
      breakdown: dcScore.breakdown,
      estimatedMWCapacity: dcScore.estimatedMWCapacity,
      costToConnectPower: dcScore.costToConnectPower,
    },
    infrastructure: {
      distToSubstationMiles: infra.distToSubstationMiles,
      substationCapacityMW: infra.substationCapacityMW,
      distToFiberMiles: infra.distToFiberMiles,
      fiberRedundantPaths: infra.fiberRedundantPaths,
      distToWaterMainMiles: infra.distToWaterMainMiles,
      femaFloodZone: infra.femaFloodZone,
      droughtRiskScore: infra.droughtRiskScore,
    },
    zoning: zoningData
      ? {
          entitlementStatus: zoningData.entitlementStatus,
          maxHeightFeet: zoningData.maxHeightFeet,
          noiseLimitsDBA: zoningData.noiseLimitsDBA,
          maxLotCoverage: zoningData.maxLotCoverage,
          netUsableAcres,
          fatalFlaws: zoningData.fatalFlaws,
        }
      : null,
    riskFlags: dcScore.riskFlags,
  };

  return NextResponse.json(brief);
}
