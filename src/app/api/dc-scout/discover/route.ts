import { NextResponse } from "next/server";
import { MOCK_PARCELS, getInfraForParcel } from "@/lib/mock-data";
import { FLOOD_ZONE_HIGH_RISK } from "@/lib/constants";
import type { ScoutQuery, ScoutResult } from "@/lib/types";

export async function POST(request: Request) {
  const body: ScoutQuery = await request.json();
  const {
    minAcres,
    maxSubstationDistMiles,
    targetZoning,
    excludeFloodplain,
    maxDistToFiberMiles,
  } = body;

  // Filter parcels based on scout criteria
  // In production, this would be a PostGIS RPC call
  const results: ScoutResult[] = MOCK_PARCELS.filter((p) => {
    // Acreage filter
    if ((p.acres ?? 0) < minAcres) return false;

    // Zoning filter
    if (targetZoning.length > 0 && !targetZoning.includes(p.zoning ?? "")) {
      return false;
    }

    // Infrastructure filters
    const infra = getInfraForParcel(p.apn);

    // Distance to substation
    if (
      infra.distToSubstationMiles != null &&
      infra.distToSubstationMiles > maxSubstationDistMiles
    ) {
      return false;
    }

    // Floodplain exclusion
    if (
      excludeFloodplain &&
      infra.femaFloodZone &&
      FLOOD_ZONE_HIGH_RISK.includes(infra.femaFloodZone)
    ) {
      return false;
    }

    // Optional fiber distance
    if (
      maxDistToFiberMiles != null &&
      infra.distToFiberMiles != null &&
      infra.distToFiberMiles > maxDistToFiberMiles
    ) {
      return false;
    }

    return true;
  }).map((p) => {
    const infra = getInfraForParcel(p.apn);
    return {
      apn: p.apn,
      acres: p.acres ?? 0,
      distToSubstationMiles: infra.distToSubstationMiles ?? 999,
      zoning: p.zoning ?? "Unknown",
      geom: { type: "Polygon" as const, coordinates: [] },
    };
  });

  return NextResponse.json({
    results,
    count: results.length,
    query: body,
  });
}
