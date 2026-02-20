import { NextResponse } from "next/server";

// In-memory store for development (replace with Supabase when ready)
const savedParcels: Map<
  string,
  { id: string; user_id: string; apn: string; notes: string | null; collection_id: string | null; created_at: string }
> = new Map();

let counter = 0;

export async function GET() {
  // TODO: Replace with Supabase query for authenticated user
  const parcels = Array.from(savedParcels.values());
  return NextResponse.json(parcels);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { apn, notes, collection_id } = body as {
    apn: string;
    notes?: string;
    collection_id?: string;
  };

  if (!apn) {
    return NextResponse.json({ error: "apn is required" }, { status: 400 });
  }

  // Check if already saved
  const existing = Array.from(savedParcels.values()).find(
    (p) => p.apn === apn
  );
  if (existing) {
    return NextResponse.json(existing);
  }

  const id = `saved-${++counter}`;
  const saved = {
    id,
    user_id: "dev-user",
    apn,
    notes: notes ?? null,
    collection_id: collection_id ?? null,
    created_at: new Date().toISOString(),
  };

  savedParcels.set(id, saved);
  return NextResponse.json(saved, { status: 201 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const apn = searchParams.get("apn");

  if (id) {
    savedParcels.delete(id);
  } else if (apn) {
    const entry = Array.from(savedParcels.entries()).find(
      ([, v]) => v.apn === apn
    );
    if (entry) savedParcels.delete(entry[0]);
  }

  return NextResponse.json({ ok: true });
}
