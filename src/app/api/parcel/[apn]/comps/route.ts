import { NextRequest, NextResponse } from "next/server";
import { fetchPropertyByPIN, mapTaxToParcel } from "@/lib/arcgis";
import { getParcelByAPN } from "@/lib/mock-data";
import {
  getCountyOrNull,
  getCounty,
  getLayerQueryUrl,
  DEFAULT_COUNTY_ID,
  type CountyConfig,
} from "@/lib/county-registry";
import type { Comp } from "@/lib/types";
import { isDevMode } from "@/lib/config";

/** Degrees of lat/lng per mile (approximate for Georgia, ~34°N) */
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

/** Extract centroid from Esri JSON geometry (point or polygon) */
function esriCentroid(geom: { x?: number; y?: number; rings?: number[][][] }): [number, number] | null {
  if (geom.x !== undefined && geom.y !== undefined) {
    return [geom.x, geom.y];
  }
  if (geom.rings) {
    const ring = geom.rings[0];
    if (ring && ring.length > 0) {
      const lng = ring.reduce((s, p) => s + p[0], 0) / ring.length;
      const lat = ring.reduce((s, p) => s + p[1], 0) / ring.length;
      return [lng, lat];
    }
  }
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ apn: string }> }
) {
  const { apn } = await params;

  // Resolve county config
  const countyId = request.nextUrl.searchParams.get("county");
  const county: CountyConfig = countyId
    ? getCountyOrNull(countyId) ?? getCounty(DEFAULT_COUNTY_ID)
    : getCounty(DEFAULT_COUNTY_ID);

  const { fields } = county;
  const apnField = fields.apn;

  // 1. Get subject parcel data
  let subjectParcel: ReturnType<typeof mapTaxToParcel> | null = null;
  try {
    const attrs = await fetchPropertyByPIN(apn, county);
    if (attrs) subjectParcel = mapTaxToParcel(attrs, apn, county);
  } catch {
    // Fall through to mock
  }

  if (!subjectParcel) {
    if (isDevMode) {
      const mock = getParcelByAPN(apn);
      if (!mock) {
        return NextResponse.json({ error: "Parcel not found" }, { status: 404 });
      }
      return NextResponse.json([]);
    }
    return NextResponse.json({ error: "Parcel not found" }, { status: 404 });
  }

  // 2. Get subject centroid from parcels layer
  let subLat: number | null = null;
  let subLng: number | null = null;
  try {
    const geoUrl = new URL(getLayerQueryUrl(county, county.parcelLayerId));
    geoUrl.searchParams.set("where", `${apnField}='${apn.replace(/'/g, "''")}'`);
    geoUrl.searchParams.set("outFields", apnField);
    geoUrl.searchParams.set("returnGeometry", "true");
    geoUrl.searchParams.set("outSR", "4326");
    geoUrl.searchParams.set("f", "json");

    const geoRes = await fetch(geoUrl.toString(), { next: { revalidate: 3600 } });
    if (geoRes.ok) {
      const geoData = await geoRes.json();
      const feature = geoData.features?.[0];
      if (feature?.geometry) {
        const centroid = esriCentroid(feature.geometry);
        if (centroid) {
          [subLng, subLat] = centroid;
        }
      }
    }
  } catch {
    return NextResponse.json([]);
  }

  if (subLat === null || subLng === null) return NextResponse.json([]);

  // 3. Query nearby parcels in bbox
  const west = subLng - SEARCH_RADIUS_MILES * MILES_TO_DEG_LNG;
  const east = subLng + SEARCH_RADIUS_MILES * MILES_TO_DEG_LNG;
  const south = subLat - SEARCH_RADIUS_MILES * MILES_TO_DEG_LAT;
  const north = subLat + SEARCH_RADIUS_MILES * MILES_TO_DEG_LAT;

  // Build outFields for nearby query using county-specific field names
  const nearbyFields: string[] = [apnField];
  if (fields.acres) nearbyFields.push(fields.acres);
  if (fields.assessedTotal) nearbyFields.push(fields.assessedTotal);
  if (fields.zoning) nearbyFields.push(fields.zoning);
  if (fields.improvementValue) nearbyFields.push(fields.improvementValue);
  if (fields.address) {
    if (county.multiFieldAddress) {
      nearbyFields.push(...fields.address.split("|"));
    } else {
      nearbyFields.push(fields.address);
    }
  }

  const spatialLayerId = county.parcelLayerId;
  const acresField = fields.acres;
  const acresFilter = acresField ? `${acresField} > 0` : "1=1";

  let nearbyFeatures: Array<{
    attributes: Record<string, unknown>;
    geometry?: { x?: number; y?: number; rings?: number[][][] };
  }> = [];

  try {
    const bboxUrl = new URL(getLayerQueryUrl(county, spatialLayerId));
    bboxUrl.searchParams.set("geometry", `${west},${south},${east},${north}`);
    bboxUrl.searchParams.set("geometryType", "esriGeometryEnvelope");
    bboxUrl.searchParams.set("inSR", "4326");
    bboxUrl.searchParams.set("spatialRel", "esriSpatialRelIntersects");
    bboxUrl.searchParams.set("where", acresFilter);
    bboxUrl.searchParams.set("outFields", nearbyFields.join(","));
    bboxUrl.searchParams.set("returnGeometry", "true");
    bboxUrl.searchParams.set("outSR", "4326");
    bboxUrl.searchParams.set("resultRecordCount", "50");
    bboxUrl.searchParams.set("f", "json");

    const bboxRes = await fetch(bboxUrl.toString(), { next: { revalidate: 1800 } });
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
    const pin = String(a[apnField] ?? "");
    if (pin === apn) continue;

    const zoning = fields.zoning && a[fields.zoning] ? String(a[fields.zoning]) : null;
    if (zoningClass(zoning) !== subjectClass) continue;

    const acres = fields.acres ? Number(a[fields.acres]) || null : null;
    if (!acres || acres <= 0) continue;

    const assessed = fields.assessedTotal ? Number(a[fields.assessedTotal]) || null : null;
    if (!assessed) continue;

    if (!feat.geometry) continue;
    const compCentroid = esriCentroid(feat.geometry);
    if (!compCentroid) continue;
    const [compLng, compLat] = compCentroid;

    const dist = distanceMiles(subLat!, subLng!, compLat, compLng);
    if (dist > SEARCH_RADIUS_MILES) continue;

    // Build address from county-specific fields
    let addr: string;
    if (fields.address) {
      if (county.multiFieldAddress) {
        const parts = fields.address.split("|").map((field) => a[field]);
        addr = parts.filter(Boolean).join(", ") || pin;
      } else {
        addr = a[fields.address] ? String(a[fields.address]) : pin;
      }
    } else {
      addr = pin;
    }

    const psf = acres > 0 ? assessed / (acres * 43560) : 0;

    comps.push({
      id: pin,
      address: String(addr),
      distance: Math.round(dist * 100) / 100,
      acres,
      date: "assessed_snapshot",
      price: assessed,
      psf: Math.round(psf * 100) / 100,
      coordinates: [compLng, compLat],
    });
  }

  comps.sort((a, b) => a.distance - b.distance);

  return NextResponse.json(comps.slice(0, 20), {
    headers: {
      "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800",
    },
  });
}
