import { NextResponse } from "next/server";

const TX_LINES_URL =
  "https://services1.arcgis.com/Hp6G80Pky0om7QvQ/arcgis/rest/services/Electric_Power_Transmission_Lines/FeatureServer/0/query";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const west = searchParams.get("west");
  const south = searchParams.get("south");
  const east = searchParams.get("east");
  const north = searchParams.get("north");

  if (!west || !south || !east || !north) {
    return NextResponse.json({ error: "bbox required" }, { status: 400 });
  }

  const params = new URLSearchParams({
    where: "STATUS = 'IN SERVICE'",
    geometry: JSON.stringify({ xmin: west, ymin: south, xmax: east, ymax: north }),
    geometryType: "esriGeometryEnvelope",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "OBJECTID,VOLTAGE",
    returnGeometry: "true",
    outSR: "4326",
    resultRecordCount: "500",
    f: "json",
  });

  try {
    const res = await fetch(`${TX_LINES_URL}?${params}`, { cache: "no-store" });
    if (!res.ok) return NextResponse.json([], { status: 200 });

    const json = await res.json();
    const features = json?.features ?? [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lines = features.map((f: any) => ({
      id: String(f.attributes?.OBJECTID ?? Math.random()),
      voltage: Number(f.attributes?.VOLTAGE ?? 0),
      coordinates: f.geometry?.paths?.[0] ?? [],
    })).filter((l: { coordinates: unknown[] }) => l.coordinates.length > 0);

    return NextResponse.json(lines, {
      headers: { "Cache-Control": "public, s-maxage=3600" },
    });
  } catch {
    return NextResponse.json([]);
  }
}
