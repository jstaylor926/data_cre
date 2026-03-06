import { NextRequest } from "next/server";
import { getParcelByAPN, MOCK_PARCELS } from "@/lib/mock-data";
import type { ResearchCriteria, ResearchParcelResult } from "@/lib/types";

/**
 * POST /api/research/chat
 *
 * Accepts a conversation history + attachments and returns an SSE stream with:
 *   - event: "status"       → status text for the UI
 *   - event: "criteria"     → extracted search criteria from conversation
 *   - event: "results"      → matched parcel results
 *   - event: "message"      → assistant text response (streamed in chunks)
 *   - event: "done"         → stream complete
 *   - event: "error"        → error message
 *
 * In dev mode, uses mock data. In production, this would call Claude API
 * to interpret the conversation and query Supabase/PostGIS for parcels.
 */

interface ChatBody {
  messages: { role: "user" | "assistant"; content: string }[];
  attachments?: { name: string; extractedText?: string }[];
  criteria?: ResearchCriteria | null;
}

export async function POST(request: NextRequest) {
  const body: ChatBody = await request.json();
  const { messages, attachments, criteria: existingCriteria } = body;

  const lastUserMessage =
    [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

  // Build SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ event, data })}\n\n`)
        );
      };

      try {
        send("status", "Analyzing your requirements...");
        await sleep(400);

        // ── Step 1: Extract / refine criteria from conversation ──────────
        const criteria = extractCriteria(lastUserMessage, existingCriteria);
        send("criteria", criteria);
        send("status", "Searching for matching properties...");
        await sleep(500);

        // ── Step 2: Search parcels that match criteria ───────────────────
        const results = searchMockParcels(criteria);
        if (results.length > 0) {
          send("results", results);
        }
        send("status", "Composing analysis...");
        await sleep(300);

        // ── Step 3: Generate assistant response ─────────────────────────
        const response = generateMockResponse(
          lastUserMessage,
          criteria,
          results,
          attachments
        );

        // Stream response in chunks to simulate AI streaming
        const words = response.split(" ");
        let chunk = "";
        for (let i = 0; i < words.length; i++) {
          chunk += (i > 0 ? " " : "") + words[i];
          if (chunk.length >= 30 || i === words.length - 1) {
            send("message", chunk);
            chunk = "";
            await sleep(50);
          }
        }

        send("done", null);
      } catch (err) {
        send("error", (err as Error).message || "Research failed");
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function extractCriteria(
  message: string,
  existing?: ResearchCriteria | null
): ResearchCriteria {
  const lower = message.toLowerCase();
  const criteria: ResearchCriteria = { ...existing };

  // Property type detection
  if (lower.includes("industrial") || lower.includes("warehouse") || lower.includes("distribution")) {
    criteria.propertyType = "industrial";
  } else if (lower.includes("retail") || lower.includes("shopping") || lower.includes("store")) {
    criteria.propertyType = "retail";
  } else if (lower.includes("office")) {
    criteria.propertyType = "office";
  } else if (lower.includes("multifamily") || lower.includes("apartment") || lower.includes("residential")) {
    criteria.propertyType = "multifamily";
  } else if (lower.includes("mixed") || lower.includes("mixed-use")) {
    criteria.propertyType = "mixed-use";
  }

  // Acreage parsing
  const acreMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:\+|or more)\s*acres?/);
  if (acreMatch) criteria.minAcres = parseFloat(acreMatch[1]);

  const acreRangeMatch = lower.match(
    /(\d+(?:\.\d+)?)\s*(?:to|-)\s*(\d+(?:\.\d+)?)\s*acres?/
  );
  if (acreRangeMatch) {
    criteria.minAcres = parseFloat(acreRangeMatch[1]);
    criteria.maxAcres = parseFloat(acreRangeMatch[2]);
  }

  // Price parsing
  const priceMatch = lower.match(/under\s*\$?([\d,]+(?:k|m)?)/);
  if (priceMatch) {
    let val = priceMatch[1].replace(/,/g, "");
    if (val.endsWith("k")) val = String(parseFloat(val) * 1000);
    if (val.endsWith("m")) val = String(parseFloat(val) * 1000000);
    criteria.maxPrice = parseFloat(val);
  }

  // Location hints
  const locationPatterns = [
    /near\s+([\w\s-]+(?:highway|hwy|road|rd|blvd|avenue|ave|i-\d+))/i,
    /in\s+([\w\s]+(?:county|ga|georgia))/i,
    /(?:around|near|close to)\s+([\w\s]+)/i,
  ];
  for (const pattern of locationPatterns) {
    const match = lower.match(pattern);
    if (match) {
      criteria.locationHint = match[1].trim();
      break;
    }
  }

  // Use case
  if (lower.includes("last-mile") || lower.includes("last mile")) {
    criteria.useCase = "last-mile distribution";
  } else if (lower.includes("campus")) {
    criteria.useCase = "corporate campus";
  } else if (lower.includes("development")) {
    criteria.useCase = "ground-up development";
  }

  return criteria;
}

function searchMockParcels(
  criteria: ResearchCriteria
): ResearchParcelResult[] {
  return MOCK_PARCELS.filter((p) => {
    if (criteria.minAcres && (p.acres ?? 0) < criteria.minAcres) return false;
    if (criteria.maxAcres && (p.acres ?? 0) > criteria.maxAcres) return false;
    if (criteria.maxPrice && (p.assessed_total ?? 0) > criteria.maxPrice)
      return false;
    if (criteria.propertyType) {
      const landUse = (p.land_use_code ?? "").toLowerCase();
      const zoning = (p.zoning ?? "").toLowerCase();
      const type = criteria.propertyType.toLowerCase();
      if (
        type === "industrial" &&
        !landUse.includes("industrial") &&
        !zoning.startsWith("m") &&
        !zoning.startsWith("i")
      )
        return false;
      if (
        type === "retail" &&
        !landUse.includes("commercial") &&
        !landUse.includes("retail") &&
        !zoning.startsWith("c")
      )
        return false;
      if (type === "mixed-use" && !landUse.includes("mixed") && !zoning.includes("mu"))
        return false;
    }
    return true;
  })
    .slice(0, 8)
    .map((p) => ({
      apn: p.apn,
      address: p.site_address ?? "Unknown address",
      acres: p.acres,
      zoning: p.zoning,
      assessed_total: p.assessed_total,
      coordinates: getParcelCoords(p.apn),
      matchReason: buildMatchReason(p, criteria),
      matchScore: Math.floor(60 + Math.random() * 35),
    }));
}

function getParcelCoords(apn: string): [number, number] {
  // Use mock centroids — in production these come from PostGIS ST_Centroid
  const parcel = getParcelByAPN(apn);
  if (parcel?.geom) {
    const coords = parcel.geom.coordinates[0]?.[0]?.[0];
    if (coords) return [coords[0], coords[1]];
  }
  // Fallback to Gwinnett County area
  return [-84.195 + Math.random() * 0.05, 33.945 + Math.random() * 0.05];
}

function buildMatchReason(
  parcel: (typeof MOCK_PARCELS)[0],
  criteria: ResearchCriteria
): string {
  const parts: string[] = [];
  if (criteria.propertyType)
    parts.push(
      `Zoned ${parcel.zoning ?? "unknown"}, compatible with ${criteria.propertyType} use`
    );
  if (criteria.minAcres)
    parts.push(`${parcel.acres?.toFixed(1)} acres meets ${criteria.minAcres}+ acre requirement`);
  if (parcel.last_sale_price)
    parts.push(`Last sold for $${parcel.last_sale_price.toLocaleString()}`);
  return parts.length > 0
    ? parts.join(". ") + "."
    : `Located in ${parcel.county} County with ${parcel.zoning} zoning.`;
}

function generateMockResponse(
  query: string,
  criteria: ResearchCriteria,
  results: ResearchParcelResult[],
  attachments?: { name: string; extractedText?: string }[]
): string {
  const parts: string[] = [];

  if (attachments && attachments.length > 0) {
    parts.push(
      `I've reviewed the uploaded document${attachments.length > 1 ? "s" : ""} (${attachments.map((a) => a.name).join(", ")}) and incorporated the relevant details into the search criteria.`
    );
  }

  if (criteria.propertyType) {
    parts.push(
      `Based on your description, I'm looking for **${criteria.propertyType}** properties${criteria.locationHint ? ` near ${criteria.locationHint}` : ""}.`
    );
  }

  if (criteria.minAcres || criteria.maxAcres) {
    const range = criteria.maxAcres
      ? `${criteria.minAcres ?? 0}–${criteria.maxAcres} acres`
      : `${criteria.minAcres}+ acres`;
    parts.push(`Filtering for parcels in the ${range} range.`);
  }

  if (results.length > 0) {
    parts.push(
      `\n\nI found **${results.length} matching properties** in the current dataset. The top matches are pinned on the map — click any result card to view full parcel details.\n\nKey highlights:`
    );
    results.slice(0, 3).forEach((r, i) => {
      parts.push(
        `\n${i + 1}. **${r.address}** — ${r.acres?.toFixed(1) ?? "?"} acres, ${r.zoning ?? "no zoning"} (Score: ${r.matchScore}/100)`
      );
    });
    if (results.length > 3) {
      parts.push(
        `\n\n...plus ${results.length - 3} more results. You can refine these by telling me more about your ideal site — access requirements, budget range, or specific zoning needs.`
      );
    }
  } else {
    parts.push(
      `I wasn't able to find matching properties with the current criteria. Try broadening your requirements — for example, adjusting the acreage range or considering adjacent zoning categories.`
    );
  }

  return parts.join(" ");
}
