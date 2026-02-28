import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { resolveCapabilityContext } from "@/lib/capabilities";

export async function GET() {
  const supabase = await createServerSupabase();
  const context = await resolveCapabilityContext(supabase);

  return NextResponse.json(context, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
