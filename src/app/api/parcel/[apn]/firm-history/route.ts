import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { resolveCapabilityContext } from "@/lib/capabilities";
import { createEmbedding } from "@/lib/embeddings";
import { fetchPropertyByPIN } from "@/lib/arcgis";

/**
 * GET /api/parcel/[apn]/firm-history
 * Performs a vector similarity search to find historical deal documents 
 * related to the current parcel.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ apn: string }> }
) {
  try {
    const { apn } = await params;
    const supabase = await createServerSupabase();
    
    // 1. Authorization
    const context = await resolveCapabilityContext(supabase);
    if (!context.authenticated || !context.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // We assume CRM access is required to see firm history
    if (!context.capabilities["crm.view"]) {
      return NextResponse.json({ error: "CRM access required" }, { status: 403 });
    }

    // Need to know the org to filter results
    const orgId = context.user.user_metadata?.org_id;
    if (!orgId) {
      return NextResponse.json({ error: "No organization context found" }, { status: 400 });
    }

    // 2. Resolve Parcel Context for Query
    // We use the parcel address and legal description as the basis for similarity
    const parcel = await fetchPropertyByPIN(apn);
    if (!parcel) {
      return NextResponse.json({ error: "Parcel not found" }, { status: 404 });
    }

    const queryText = `
      Parcel APN: ${parcel.PIN}
      Address: ${parcel.LOCADDR}, ${parcel.LOCCITY}, ${parcel.LOCSTATE} ${parcel.LOCZIP}
      Legal: ${parcel.LEGAL1} ${parcel.LEGAL2}
      Owner: ${parcel.OWNER1}
    `.trim();

    // 3. Create Query Embedding
    const embedding = await createEmbedding(queryText);

    // 4. Perform Similarity Search
    // match_deal_documents(query_embedding, match_threshold, match_count, filter_org_id)
    const { data: matches, error: searchError } = await supabase.rpc("match_deal_documents", {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: 5,
      filter_org_id: orgId,
    });

    if (searchError) {
      console.error("Vector search failed:", searchError);
      return NextResponse.json({ error: searchError.message }, { status: 500 });
    }

    return NextResponse.json({ matches });

  } catch (error) {
    const err = error as Error;
    console.error("Firm history retrieval failed:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
