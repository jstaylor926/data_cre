import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

const DEV_USER_ID = "dev-user";

export async function GET() {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("collections")
    .select("*")
    .eq("user_id", DEV_USER_ID)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch collections:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name } = body as { name: string };

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("collections")
    .insert({
      user_id: DEV_USER_ID,
      name,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create collection:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const supabase = await createServerSupabase();

  await supabase
    .from("collections")
    .delete()
    .eq("id", id)
    .eq("user_id", DEV_USER_ID);

  return NextResponse.json({ ok: true });
}
