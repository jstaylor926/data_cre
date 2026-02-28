import { NextResponse } from "next/server";
import { authorizationErrorResponse } from "@/lib/api-auth";
import { requireUserCapability } from "@/lib/capabilities";
import { createServerSupabase } from "@/lib/supabase-server";

interface NewNotePayload {
  project_id?: string;
  apn?: string;
  content?: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("project_id");
  const apn = searchParams.get("apn");

  const supabase = await createServerSupabase();
  try {
    await requireUserCapability(supabase, "crm.view");
  } catch (error) {
    return authorizationErrorResponse(error);
  }

  let query = supabase
    .from("notes")
    .select("*")
    .order("created_at", { ascending: false });

  if (projectId) {
    query = query.eq("project_id", projectId);
  }
  if (apn) {
    query = query.eq("apn", apn);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  let userId: string;
  try {
    ({ userId } = await requireUserCapability(supabase, "crm.notes.write"));
  } catch (error) {
    return authorizationErrorResponse(error);
  }

  const body = (await request.json()) as NewNotePayload;
  const projectId = body.project_id?.trim();
  const apn = body.apn?.trim();
  const content = body.content?.trim();

  if (!projectId || !apn || !content) {
    return NextResponse.json(
      { error: "project_id, apn, and content are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("notes")
    .insert({
      project_id: projectId,
      apn,
      content,
      author_id: userId,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
