import { NextResponse } from "next/server";

// In-memory store for development
const collections: Map<
  string,
  { id: string; user_id: string; name: string; org_id: string | null; created_at: string }
> = new Map();

let counter = 0;

export async function GET() {
  return NextResponse.json(Array.from(collections.values()));
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name } = body as { name: string };

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const id = `col-${++counter}`;
  const collection = {
    id,
    user_id: "dev-user",
    name,
    org_id: null,
    created_at: new Date().toISOString(),
  };

  collections.set(id, collection);
  return NextResponse.json(collection, { status: 201 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (id) collections.delete(id);
  return NextResponse.json({ ok: true });
}
