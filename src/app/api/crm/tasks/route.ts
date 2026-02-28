import { NextResponse } from "next/server";
import { authorizationErrorResponse } from "@/lib/api-auth";
import { requireUserCapability } from "@/lib/capabilities";
import { createServerSupabase } from "@/lib/supabase-server";

interface NewTaskPayload {
  project_id?: string;
  title?: string;
  description?: string | null;
  status?: "todo" | "in_progress" | "done";
  due_date?: string | null;
  assigned_to?: string | null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("project_id");

  const supabase = await createServerSupabase();
  try {
    await requireUserCapability(supabase, "crm.view");
  } catch (error) {
    return authorizationErrorResponse(error);
  }

  let query = supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  try {
    await requireUserCapability(supabase, "crm.tasks.write");
  } catch (error) {
    return authorizationErrorResponse(error);
  }

  const body = (await request.json()) as NewTaskPayload;
  const projectId = body.project_id?.trim();
  const title = body.title?.trim();

  if (!projectId || !title) {
    return NextResponse.json(
      { error: "project_id and title are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      project_id: projectId,
      title,
      description: body.description?.trim() || null,
      status: body.status ?? "todo",
      due_date: body.due_date || null,
      assigned_to: body.assigned_to?.trim() || null,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
