import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { authorizationErrorResponse } from "@/lib/api-auth";
import { requireUserCapability } from "@/lib/capabilities";

export async function GET() {
  const supabase = await createServerSupabase();
  let userId: string;
  try {
    ({ userId } = await requireUserCapability(supabase, "collections.manage"));
  } catch (error) {
    return authorizationErrorResponse(error);
  }

  const { data, error } = await supabase
    .from("collections")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch collections:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  let userId: string;
  try {
    ({ userId } = await requireUserCapability(supabase, "collections.manage"));
  } catch (error) {
    return authorizationErrorResponse(error);
  }

  const body = await request.json();
  const { name } = body as { name: string };

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("collections")
    .insert({
      user_id: userId,
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

export async function PATCH(request: Request) {
  const supabase = await createServerSupabase();
  let userId: string;
  try {
    ({ userId } = await requireUserCapability(supabase, "collections.manage"));
  } catch (error) {
    return authorizationErrorResponse(error);
  }

  const body = await request.json();
  const { id, name } = body as { id: string; name: string };

  if (!id || !name) {
    return NextResponse.json({ error: "id and name are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("collections")
    .update({ name })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("Failed to rename collection:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const supabase = await createServerSupabase();
  let userId: string;
  try {
    ({ userId } = await requireUserCapability(supabase, "collections.manage"));
  } catch (error) {
    return authorizationErrorResponse(error);
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  await supabase
    .from("collections")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  return NextResponse.json({ ok: true });
}
