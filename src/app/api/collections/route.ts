import { NextResponse } from "next/server";
import type { Collection } from "@/lib/types";

const collections: Collection[] = [];

export async function GET() {
  return NextResponse.json(collections);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name } = body;

  if (!name) {
    return NextResponse.json({ error: "Missing name" }, { status: 400 });
  }

  const newCollection: Collection = {
    id: crypto.randomUUID(),
    user_id: "demo-user",
    name,
    org_id: null,
    created_at: new Date().toISOString(),
  };
  collections.push(newCollection);

  return NextResponse.json(newCollection, { status: 201 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  const idx = collections.findIndex((c) => c.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  collections.splice(idx, 1);
  return NextResponse.json({ success: true });
}
