import { NextResponse } from "next/server";
import { authorizationErrorResponse } from "@/lib/api-auth";
import { requireUserCapability } from "@/lib/capabilities";
import { createServerSupabase } from "@/lib/supabase-server";

interface NewOrganizationPayload {
  name?: string;
  slug?: string;
  logo_url?: string | null;
}

export async function GET() {
  const supabase = await createServerSupabase();
  try {
    await requireUserCapability(supabase, "crm.view");
  } catch (error) {
    return authorizationErrorResponse(error);
  }

  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .order("created_at", { ascending: false });

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

  const body = (await request.json()) as NewOrganizationPayload;
  const name = body.name?.trim();
  const slug = body.slug?.trim().toLowerCase();

  if (!name || !slug) {
    return NextResponse.json(
      { error: "name and slug are required" },
      { status: 400 }
    );
  }

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name,
      slug,
      logo_url: body.logo_url?.trim() || null,
    })
    .select("*")
    .single();

  if (orgError) {
    return NextResponse.json({ error: orgError.message }, { status: 500 });
  }

  const { error: membershipError } = await supabase
    .from("organization_memberships")
    .insert({
      org_id: org.id,
      user_id: userId,
      role: "owner",
    });

  if (membershipError) {
    return NextResponse.json(
      { error: `Organization created but membership setup failed: ${membershipError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json(org, { status: 201 });
}
