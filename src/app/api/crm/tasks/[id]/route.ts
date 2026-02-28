import { NextResponse } from "next/server";
import { authorizationErrorResponse } from "@/lib/api-auth";
import { requireUserCapability } from "@/lib/capabilities";
import { createServerSupabase } from "@/lib/supabase-server";

interface UpdateTaskPayload {
  title?: string;
  description?: string | null;
  status?: "todo" | "in_progress" | "done";
  due_date?: string | null;
  assigned_to?: string | null;
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
    await requireUserCapability(supabase, "crm.tasks.write");
  } catch (error) {
    return authorizationErrorResponse(error);
  }

  const body = (await request.json()) as UpdateTaskPayload;
  const patch: Record<string, string | null> = {};

  if (typeof body.title === "string") patch.title = body.title.trim();
  if (body.description !== undefined) patch.description = body.description?.trim() || null;
  if (body.status) patch.status = body.status;
  if (body.due_date !== undefined) patch.due_date = body.due_date;
  if (body.assigned_to !== undefined) patch.assigned_to = body.assigned_to?.trim() || null;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No update fields provided" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("tasks")
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
    await requireUserCapability(supabase, "crm.tasks.write");
  } catch (error) {
    return authorizationErrorResponse(error);
  }

  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
