import { NextResponse } from "next/server";
import { fetchPropertyByPIN, mapTaxToParcel } from "@/lib/arcgis";
import { getParcelByAPN } from "@/lib/mock-data";
import type { Comp } from "@/lib/types";
import { isDevMode } from "@/lib/config";

const BASE_URL =
  "https://services3.arcgis.com/RfpmnkSAQleRbndX/arcgis/rest/services/Property_and_Tax/FeatureServer";

const PARCELS_LAYER = 0;
const TAX_TABLE_LAYER = 3;

/** Degrees of lat/lng per mile (approximate for Gwinnett County, ~34°N) */
const MILES_TO_DEG_LAT = 1 / 69.0;
const MILES_TO_DEG_LNG = 1 / 59.0;
const SEARCH_RADIUS_MILES = 1.0;

/** Normalize a zoning code to its class prefix for "same class" comparison */
function zoningClass(code: string | null): string {
  if (!code) return "UNKNOWN";
  const upper = code.trim().toUpperCase();
  if (upper.startsWith("C")) return "C";
  if (upper.startsWith("M") || upper.startsWith("I")) return "M";
  if (upper.startsWith("OI") || upper.startsWith("O-I")) return "OI";
  if (upper.startsWith("MU") || upper.startsWith("TND")) return "MU";
  if (upper.startsWith("R")) return "R";
  if (upper.startsWith("A")) return "A";
  return upper;
}

/** Haversine distance in miles between two lat/lng points */
function distanceMiles(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 3958.8; // Earth radius in miles
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
  _request: Request,
  { params }: { params: Promise<{ apn: string }> }
) {
  const { apn } = await params;

  // 1. Get subject parcel data
  let subjectParcel: ReturnType<typeof mapTaxToParcel> | null = null;
  try {
    const attrs = await fetchPropertyByPIN(apn);
    if (attrs) subjectParcel = mapTaxToParcel(attrs, apn);
  } catch {
    // Fall through to mock
  }

  if (!subjectParcel) {
    if (isDevMode) {
      const mock = getParcelByAPN(apn);
      if (!mock) {
        return NextResponse.json({ error: "Parcel not found" }, { status: 404 });
      }
      // Can't do spatial comps without real coordinates — return empty
      return NextResponse.json([]);
    }
    return NextResponse.json({ error: "Parcel not found" }, { status: 404 });
  }

  // 2. Get subject centroid from parcels layer
  let subLat: number | null = null;
  let subLng: number | null = null;
  try {
    const geoRes = await fetch(
      `${BASE_URL}/${PARCELS_LAYER}/query?where=${encodeURIComponent(`PIN='${apn}'`)}&outFields=PIN&returnGeometry=true&outSR=4326&f=json`,
      { next: { revalidate: 3600 } }
    );
    if (geoRes.ok) {
      const geoData = await geoRes.json();
      const feature = geoData.features?.[0];
      if (feature?.geometry) {
        const geom = feature.geometry;
        if (geom.x !== undefined && geom.y !== undefined) {
          subLng = geom.x;
          subLat = geom.y;
        } else if (geom.rings) {
          // Polygon — compute rough centroid from first ring
          const ring: [number, number][] = geom.rings[0];
          const lngSum = ring.reduce((s: number, p: [number, number]) => s + p[0], 0);
          const latSum = ring.reduce((s: number, p: [number, number]) => s + p[1], 0);
          subLng = lngSum / ring.length;
          subLat = latSum / ring.length;
        }
      }
    }
  } catch {
    // No centroid — can't do spatial query
    return NextResponse.json([]);
  }

  if (subLat === null || subLng === null) return NextResponse.json([]);

  // 3. Query nearby parcels in bbox
  const west = subLng - SEARCH_RADIUS_MILES * MILES_TO_DEG_LNG;
  const east = subLng + SEARCH_RADIUS_MILES * MILES_TO_DEG_LNG;
  const south = subLat - SEARCH_RADIUS_MILES * MILES_TO_DEG_LAT;
  const north = subLat + SEARCH_RADIUS_MILES * MILES_TO_DEG_LAT;

  let nearbyFeatures: Array<{ attributes: Record<string, unknown>; geometry: { x?: number; y?: number; rings?: number[][][] } }> = [];
  try {
    const bboxRes = await fetch(
      `${BASE_URL}/${TAX_TABLE_LAYER}/query?` +
        new URLSearchParams({
          geometry: `${west},${south},${east},${north}`,
          geometryType: "esriGeometryEnvelope",
          inSR: "4326",
          spatialRel: "esriSpatialRelIntersects",
          where: "LEGALAC > 0",
          outFields: "PIN,LOCADDR,LOCCITY,LEGALAC,TOTVAL1,ZONING,DWLGVAL1",
          returnGeometry: "true",
          outSR: "4326",
          resultRecordCount: "50",
          f: "json",
        }).toString(),
      { next: { revalidate: 1800 } }
    );
    if (bboxRes.ok) {
      const bboxData = await bboxRes.json();
      nearbyFeatures = bboxData.features ?? [];
    }
  } catch {
    return NextResponse.json([]);
  }

  const subjectClass = zoningClass(subjectParcel.zoning);

  // 4. Filter, compute distance, build Comp objects
  const comps: Comp[] = [];
  for (const feat of nearbyFeatures) {
    const a = feat.attributes;
    const pin = String(a.PIN ?? "");
    if (pin === apn) continue; // skip subject itself

    const zoning = a.ZONING ? String(a.ZONING) : null;
    if (zoningClass(zoning) !== subjectClass) continue;

    const acres = Number(a.LEGALAC) || null;
    if (!acres || acres <= 0) continue;

    const assessed = Number(a.TOTVAL1) || null;
    if (!assessed) continue;

    // Get lat/lng from geometry (tax table returns centroid points)
    let compLat: number | null = null;
    let compLng: number | null = null;
    const geom = feat.geometry;
    if (geom) {
      if (geom.x !== undefined && geom.y !== undefined) {
        compLng = geom.x;
        compLat = geom.y;
      } else if (geom.rings) {
        const ring = geom.rings[0];
        if (ring && ring.length > 0) {
          const lngSum = ring.reduce((s: number, p: number[]) => s + p[0], 0);
          const latSum = ring.reduce((s: number, p: number[]) => s + p[1], 0);
          compLng = lngSum / ring.length;
          compLat = latSum / ring.length;
        }
      }
    }
    if (compLat === null || compLng === null) continue;

    const dist = distanceMiles(subLat!, subLng!, compLat, compLng);
    if (dist > SEARCH_RADIUS_MILES) continue;

    const addr = [a.LOCADDR, a.LOCCITY].filter(Boolean).join(", ") || pin;
    const psf = acres > 0 ? assessed / (acres * 43560) : 0; // assessed $/sq ft

    comps.push({
      id: pin,
      address: String(addr),
      distance: Math.round(dist * 100) / 100,
      acres,
      date: new Date().toISOString().slice(0, 7), // Current month as proxy
      price: assessed, // Assessed value (not sale price — county data)
      psf: Math.round(psf * 100) / 100,
      coordinates: [compLng, compLat],
    });
  }

  // Sort by distance, limit to 20
  comps.sort((a, b) => a.distance - b.distance);

  return NextResponse.json(comps.slice(0, 20), {
    headers: {
      "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800",
    },
  });
}
