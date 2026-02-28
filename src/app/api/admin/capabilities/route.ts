import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { requireUserCapability } from "@/lib/capabilities";
import { CAPABILITY_KEYS, type CapabilityKey } from "@/lib/capability-constants";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    
    // 1. Check for admin.capabilities.manage capability
    const { userId: adminId } = await requireUserCapability(supabase, "admin.capabilities.manage");

    // 2. Parse request body
    const body = await req.json();
    const { userId, capability, enabled, reason } = body;

    // 3. Validate inputs
    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
    }

    if (!capability || !CAPABILITY_KEYS.includes(capability as CapabilityKey)) {
      return NextResponse.json({ error: "Invalid capability key" }, { status: 400 });
    }

    if (typeof enabled !== "boolean") {
      return NextResponse.json({ error: "enabled must be a boolean" }, { status: 400 });
    }

    // 4. Upsert override
    const { error } = await supabase
      .from("user_capability_overrides")
      .upsert({
        user_id: userId,
        capability_key: capability,
        enabled,
        reason: reason || null,
        updated_by: adminId,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id,capability_key"
      });

    if (error) {
      console.error("Failed to update capability override:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const err = error as Error;
    if (err.name === "CapabilityForbiddenError") {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    
    // Check for admin.capabilities.manage capability
    await requireUserCapability(supabase, "admin.capabilities.manage");

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    let query = supabase.from("user_capability_overrides").select("*");
    
    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch capability overrides:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    const err = error as Error;
    if (err.name === "CapabilityForbiddenError") {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
