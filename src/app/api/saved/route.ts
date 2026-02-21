import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

// TODO: Replace with auth.uid() when authentication is added
const DEV_USER_ID = "dev-user";

export async function GET() {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("saved_parcels")
    .select("*")
    .eq("user_id", DEV_USER_ID)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch saved parcels:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
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

  const supabase = await createServerSupabase();

  // Upsert: if already saved, return existing
  const { data, error } = await supabase
    .from("saved_parcels")
    .upsert(
      {
        user_id: DEV_USER_ID,
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
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const apn = searchParams.get("apn");

  const supabase = await createServerSupabase();

  if (id) {
    await supabase
      .from("saved_parcels")
      .delete()
      .eq("id", id)
      .eq("user_id", DEV_USER_ID);
  } else if (apn) {
    await supabase
      .from("saved_parcels")
      .delete()
      .eq("apn", apn)
      .eq("user_id", DEV_USER_ID);
  }

  return NextResponse.json({ ok: true });
}
