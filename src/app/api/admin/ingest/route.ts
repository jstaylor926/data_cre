import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { requireUserCapability } from "@/lib/capabilities";
import { chunkText, createEmbedding } from "@/lib/embeddings";

/**
 * POST /api/admin/ingest
 * Gated by admin.capabilities.manage
 * 
 * Body: {
 *   orgId: UUID,
 *   projectId?: UUID,
 *   filename: string,
 *   text: string, // Extraction should happen client-side or via another tool
 *   metadata?: any
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    
    // 1. Authorization
    await requireUserCapability(supabase, "admin.capabilities.manage");

    // 2. Parse request
    const { orgId, projectId, filename, text, metadata = {} } = await req.json();

    if (!orgId || !filename || !text) {
      return NextResponse.json({ error: "Missing required fields (orgId, filename, text)" }, { status: 400 });
    }

    // 3. Chunk text
    const chunks = chunkText(text);
    console.log(`Ingesting ${filename}: ${chunks.length} chunks`);

    // 4. Process chunks (Create embeddings and store)
    const errors: string[] = [];
    let successCount = 0;

    for (let i = 0; i < chunks.length; i++) {
      try {
        const chunk = chunks[i];
        const embedding = await createEmbedding(chunk);

        const { error } = await supabase.from("deal_documents").insert({
          org_id: orgId,
          project_id: projectId || null,
          filename,
          content: chunk,
          metadata: {
            ...metadata,
            chunk_index: i,
            total_chunks: chunks.length,
          },
          embedding,
        });

        if (error) throw error;
        successCount++;
      } catch (err) {
        const error = err as Error;
        console.error(`Failed to process chunk ${i}:`, error);
        errors.push(`Chunk ${i}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      total_chunks: chunks.length,
      processed_chunks: successCount,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    const err = error as Error;
    if (err.name === "CapabilityForbiddenError") {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
