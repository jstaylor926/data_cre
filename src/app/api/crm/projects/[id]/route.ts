import { NextResponse } from "next/server";
import { authorizationErrorResponse } from "@/lib/api-auth";
import { requireUserCapability } from "@/lib/capabilities";
import { createServerSupabase } from "@/lib/supabase-server";

interface UpdateProjectPayload {
  name?: string;
  description?: string | null;
  status?: "active" | "archived" | "closed";
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
    await requireUserCapability(supabase, "crm.projects.write");
  } catch (error) {
    return authorizationErrorResponse(error);
  }

  const body = (await request.json()) as UpdateProjectPayload;
  const patch: Record<string, string | null> = {};

  if (typeof body.name === "string") patch.name = body.name.trim();
  if (body.description !== undefined) patch.description = body.description?.trim() || null;
  if (body.status) patch.status = body.status;
  patch.updated_at = new Date().toISOString();

  if (Object.keys(patch).length === 1 && patch.updated_at) {
    return NextResponse.json({ error: "No update fields provided" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("projects")
    .update(patch)
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
    await requireUserCapability(supabase, "crm.projects.write");
  } catch (error) {
    return authorizationErrorResponse(error);
  }

  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
