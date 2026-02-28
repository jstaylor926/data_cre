import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { AUTH_REQUIRED_ERROR, requireAuthenticatedUserId } from "@/lib/auth";

export async function GET() {
  const supabase = await createServerSupabase();
  let userId: string;
  try {
    userId = await requireAuthenticatedUserId(supabase);
  } catch {
    return NextResponse.json({ error: AUTH_REQUIRED_ERROR }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("saved_parcels")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch saved parcels:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  let userId: string;
  try {
    userId = await requireAuthenticatedUserId(supabase);
  } catch {
    return NextResponse.json({ error: AUTH_REQUIRED_ERROR }, { status: 401 });
  }

  const body = await request.json();
  const { apn, notes, collection_id } = body as {
    apn: string;
    notes?: string;
    collection_id?: string;
  };

  if (!apn) {
    return NextResponse.json({ error: "apn is required" }, { status: 400 });
  }

  // Upsert: if already saved, return existing
  const { data, error } = await supabase
    .from("saved_parcels")
    .upsert(
      {
        user_id: userId,
        apn,
        notes: notes ?? null,
        collection_id: collection_id ?? null,
      },
      { onConflict: "user_id,apn" }
    )
    .select()
    .single();

  if (error) {
    console.error("Failed to save parcel:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(request: Request) {
  const supabase = await createServerSupabase();
  let userId: string;
  try {
    userId = await requireAuthenticatedUserId(supabase);
  } catch {
    return NextResponse.json({ error: AUTH_REQUIRED_ERROR }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const apn = searchParams.get("apn");

  if (id) {
    await supabase
      .from("saved_parcels")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
  } else if (apn) {
    await supabase
      .from("saved_parcels")
      .delete()
      .eq("apn", apn)
      .eq("user_id", userId);
  }

  return NextResponse.json({ ok: true });
}
