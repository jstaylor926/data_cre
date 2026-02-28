import { NextResponse } from "next/server";
import { authorizationErrorResponse } from "@/lib/api-auth";
import { requireUserCapability } from "@/lib/capabilities";
import { createServerSupabase } from "@/lib/supabase-server";

interface UpdateNotePayload {
  content?: string;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const supabase = await createServerSupabase();
  try {
    await requireUserCapability(supabase, "crm.notes.write");
  } catch (error) {
    return authorizationErrorResponse(error);
  }

  const body = (await request.json()) as UpdateNotePayload;
  const content = body.content?.trim();
  if (!content) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("notes")
    .update({ content })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    const status = error.code === "PGRST116" ? 404 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const supabase = await createServerSupabase();
  try {
    await requireUserCapability(supabase, "crm.notes.write");
  } catch (error) {
    return authorizationErrorResponse(error);
  }

  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
