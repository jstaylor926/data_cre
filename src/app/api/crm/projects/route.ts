import { NextResponse } from "next/server";
import { authorizationErrorResponse } from "@/lib/api-auth";
import { requireUserCapability } from "@/lib/capabilities";
import { createServerSupabase } from "@/lib/supabase-server";

interface NewProjectPayload {
  org_id?: string;
  name?: string;
  description?: string | null;
  status?: "active" | "archived" | "closed";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("org_id");

  const supabase = await createServerSupabase();
  let userId: string;
  try {
    ({ userId } = await requireUserCapability(supabase, "crm.view"));
  } catch (error) {
    return authorizationErrorResponse(error);
  }

  let membershipQuery = supabase
    .from("organization_memberships")
    .select("org_id")
    .eq("user_id", userId);

  if (orgId) {
    membershipQuery = membershipQuery.eq("org_id", orgId);
  }

  const { data: memberships, error: membershipError } = await membershipQuery;
  if (membershipError) {
    return NextResponse.json({ error: membershipError.message }, { status: 500 });
  }

  const scopedOrgIds = (memberships ?? []).map((m) => m.org_id);
  if (scopedOrgIds.length === 0) {
    return NextResponse.json([]);
  }

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .in("org_id", scopedOrgIds)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  let userId: string;
  try {
    ({ userId } = await requireUserCapability(supabase, "crm.projects.write"));
  } catch (error) {
    return authorizationErrorResponse(error);
  }

  const body = (await request.json()) as NewProjectPayload;
  const orgId = body.org_id?.trim();
  const name = body.name?.trim();

  if (!orgId || !name) {
    return NextResponse.json(
      { error: "org_id and name are required" },
      { status: 400 }
    );
  }

  const { data: membership, error: membershipError } = await supabase
    .from("organization_memberships")
    .select("id")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .maybeSingle();

  if (membershipError) {
    return NextResponse.json({ error: membershipError.message }, { status: 500 });
  }

  if (!membership) {
    return NextResponse.json(
      { error: "You do not have access to this organization" },
      { status: 403 }
    );
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({
      org_id: orgId,
      name,
      description: body.description?.trim() || null,
      status: body.status ?? "active",
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
