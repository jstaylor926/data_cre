import { NextResponse } from "next/server";
import { getParcelByAPN } from "@/lib/mock-data";
import { MOCK_ZONING_EXTRACTIONS, calculateNetUsableAcres } from "@/lib/zoning-standards";
import { extractZoningWithClaude } from "@/lib/claude";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ apn: string }> }
) {
  const { apn } = await params;
  const parcel = getParcelByAPN(apn);

  if (!parcel) {
    return NextResponse.json({ error: "Parcel not found" }, { status: 404 });
  }

  const zoningCode = parcel.zoning;
  if (!zoningCode) {
    return NextResponse.json({ error: "No zoning code" }, { status: 404 });
  }

  // Try mock data first
  const mock = MOCK_ZONING_EXTRACTIONS[zoningCode];
  if (mock) {
    const netUsableAcres = calculateNetUsableAcres(
      parcel.acres ?? 0,
      mock.setbacks,
      mock.maxLotCoverage
    );
    return NextResponse.json({ ...mock, netUsableAcres });
  }

  // Fallback to Claude (if API key configured)
  const extraction = await extractZoningWithClaude(
    `Zone: ${zoningCode} - Standard municipal code for ${parcel.county} County, GA`,
    zoningCode
  );

  if (extraction) {
    const netUsableAcres = calculateNetUsableAcres(
      parcel.acres ?? 0,
      extraction.setbacks,
      extraction.maxLotCoverage
    );
    return NextResponse.json({ ...extraction, netUsableAcres });
  }

  return NextResponse.json(
    { error: "Could not extract zoning data" },
    { status: 404 }
  );
}
