import { NextResponse } from "next/server";
import { getParcelCentroid } from "@/lib/arcgis";
import {
  fetchSubstationsNear,
  fetchNearestTxVoltage,
  fetchFemaFloodZone,
} from "@/lib/hifld";
import { buildEnvFlags, effectiveRadius } from "@/lib/dc-scoring";
import type { DCInfrastructure, Substation } from "@/lib/types";

// Known internet exchange distances from Atlanta metro (approx.)
// TIE = 55 Marietta St NW, Atlanta — major SE IX
const TIE_ATLANTA_LNG = -84.3963;
const TIE_ATLANTA_LAT = 33.7567;

function haversineMiles(lng1: number, lat1: number, lng2: number, lat2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ apn: string }> }
) {
  const { apn } = await params;
  const { searchParams } = new URL(request.url);
  const mw = Math.max(0.1, Math.min(500, Number(searchParams.get("mw") ?? 10)));

  // 1. Get parcel centroid
  const centroid = await getParcelCentroid(apn);
  if (!centroid) {
    return NextResponse.json({ error: "Parcel not found" }, { status: 404 });
  }
  const [lng, lat] = centroid;

  // 2. Fetch infrastructure data in parallel
  const radius = effectiveRadius(mw);
  const [rawSubs, nearestTxVoltage, fema] = await Promise.all([
    fetchSubstationsNear(lng, lat, radius),
    fetchNearestTxVoltage(lng, lat, 5),
    fetchFemaFloodZone(lng, lat),
  ]);

  // 3. Enrich substations with distances
  const substations: Substation[] = rawSubs.map((s) => ({
    id: s.id,
    name: s.name,
    voltage: s.voltage,
    operator: s.operator,
    coordinates: [s.lng, s.lat],
    distance: haversineMiles(lng, lat, s.lng, s.lat),
  }));

  // 4. Compute TIE distance (Atlanta IX)
  const tieDistance = haversineMiles(lng, lat, TIE_ATLANTA_LNG, TIE_ATLANTA_LAT);

  // 5. Build env flags from FEMA data
  const envFlags = buildEnvFlags(fema.zone, fema.subtype);

  // 6. Fiber carriers — use FCC BDC API for real data
  let fiberCarriers: string[] = [];
  try {
    const fccUrl = `https://broadbandmap.fcc.gov/api/public/map/listAvailability?latitude=${lat}&longitude=${lng}&unit=0&category=Fixed%20Broadband`;
    const fccRes = await fetch(fccUrl, { cache: "no-store" });
    if (fccRes.ok) {
      const fccData = await fccRes.json();
      // technology_code 50 = fiber; extract unique provider names with fiber
      const providers = fccData?.availability ?? [];
      fiberCarriers = [...new Set(
        providers
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((p: any) => p.technology_code === 50)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((p: any) => p.brand_name as string)
      )] as string[];
    }
  } catch {
    // FCC API unavailable — leave empty, scoring will use neutral value
  }

  const infrastructure: DCInfrastructure = {
    substations,
    nearestTxVoltage,
    floodZone: fema.zone,
    floodZoneSubtype: fema.subtype,
    envFlags,
    fiberCarriers,
    tieDistance,
    waterCapacity: null, // Phase 3.2 — EPA SDWIS integration
    utilityTerritory: substations[0]?.operator ?? null,
  };

  return NextResponse.json(infrastructure, {
    headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" },
  });
}
