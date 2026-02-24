import { NextResponse } from "next/server";
import { lookupEntity } from "@/lib/mock-data";

export async function POST(request: Request) {
  const body = await request.json();
  const { llc_name } = body;

  if (!llc_name) {
    return NextResponse.json(
      { error: "Missing llc_name" },
      { status: 400 }
    );
  }

  const entity = lookupEntity(llc_name);
  if (!entity) {
    return NextResponse.json(
      { error: "Entity not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(entity);
}
