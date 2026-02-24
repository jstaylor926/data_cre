import { NextResponse } from "next/server";
import { getParcelByAPN } from "@/lib/mock-data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ apn: string }> }
) {
  const { apn } = await params;
  const parcel = getParcelByAPN(apn);

  if (!parcel) {
    return NextResponse.json({ error: "Parcel not found" }, { status: 404 });
  }

  return NextResponse.json(parcel);
}
