import { NextRequest, NextResponse } from "next/server";
import { fetchPropertyByPIN, mapTaxToParcel } from "@/lib/arcgis";
import { getCountyOrNull } from "@/lib/county-registry";
import { getParcelByAPN } from "@/lib/mock-data";
import { scoreParcel } from "@/lib/scoring";
import { getAnthropicClient, HAIKU } from "@/lib/claude";
import { isDevMode } from "@/lib/config";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ apn: string }> }
) {
  const { apn } = await params;
  const url = new URL(request.url);
  const countyId = url.searchParams.get("county");
  const county = countyId ? getCountyOrNull(countyId) ?? undefined : undefined;

  // 1. Fetch parcel data
  let parcel;
  try {
    const attrs = await fetchPropertyByPIN(apn, county);
    if (attrs) {
      parcel = mapTaxToParcel(attrs, apn, county);
    }
  } catch {
    // Fall through
  }

  if (!parcel && isDevMode) {
    parcel = getParcelByAPN(apn);
  }

  if (!parcel) {
    return NextResponse.json({ error: "Parcel not found" }, { status: 404 });
  }

  // 2. Rule-based scoring
  const score = scoreParcel(parcel);

  // 3. Claude narrative (brief tier justification)
  let narrative = "";
  try {
    const client = getAnthropicClient();
    const msg = await client.messages.create({
      model: HAIKU,
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `You are a CRE analyst. Write a 1-2 sentence site intelligence summary for this parcel.

Parcel: ${parcel.site_address || apn}
Zoning: ${parcel.zoning || "unknown"} (${parcel.zoning_desc || "—"})
Acres: ${parcel.acres ?? "unknown"}
Assessed Value: $${parcel.assessed_total?.toLocaleString() ?? "unknown"}
Score: ${score.composite}/100 (${score.tier})

Be direct and data-driven. No filler. Mention the zoning tier and what the score means for investment potential.`,
        },
      ],
    });
    const block = msg.content[0];
    if (block.type === "text") narrative = block.text;
  } catch (err) {
    console.error("Claude score narrative failed:", err);
    // Return score without narrative — not fatal
  }

  return NextResponse.json(
    { ...score, narrative },
    {
      headers: {
        "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800",
      },
    }
  );
}
