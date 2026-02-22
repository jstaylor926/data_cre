/**
 * POST /api/dc-scout/discover
 *
 * Tier 1: Open-ended data center site discovery.
 * Takes a natural language query, uses Claude to identify promising
 * geographic sub-markets, validates each with live HIFLD data, then
 * streams a ranked synthesis back to the client.
 *
 * Flow:
 *   1. Haiku — parse NL query → ScoutIntent JSON
 *   2. Sonnet — geographic reasoning → candidate sub-markets with bboxes
 *   3. HIFLD — parallel validation of each candidate's power infrastructure
 *   4. Sonnet — stream ranked recommendation synthesis
 */

import { getAnthropicClient, HAIKU, SONNET } from "@/lib/claude";
import { fetchSubstationsNear, fetchNearestTxVoltage } from "@/lib/hifld";
import type { ScoutIntent, SubMarketCandidate } from "@/lib/types";

// ── Haiku: parse natural language intent ─────────────────────────────────────

async function parseIntent(query: string): Promise<ScoutIntent> {
  const client = getAnthropicClient();
  const res = await client.messages.create({
    model: HAIKU,
    max_tokens: 400,
    messages: [
      {
        role: "user",
        content: `Extract data center site requirements from this query. Return ONLY valid JSON, no markdown.

Query: "${query}"

JSON schema:
{
  "mw": number (default 10 if not specified),
  "minVoltage": number | null (69/115/230/345/500 — null if not specified),
  "avoidFloodZones": boolean (true if user mentions flood risk avoidance),
  "fiberPriority": boolean (true if latency/fiber/connectivity emphasized),
  "region": string | null ("Southeast" / "Georgia" / "Alabama" / "Carolinas" etc),
  "locationHint": string | null (specific area like "near I-85", "Gwinnett County", "Atlanta metro"),
  "rawQuery": "${query}"
}`,
      },
    ],
  });

  const text = res.content[0].type === "text" ? res.content[0].text : "{}";
  try {
    return JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
  } catch {
    return {
      mw: 10, minVoltage: null, avoidFloodZones: true,
      fiberPriority: false, region: "Georgia", locationHint: null,
      rawQuery: query,
    };
  }
}

// ── Sonnet: geographic sub-market reasoning ───────────────────────────────────

interface RawSubMarket {
  id: string;
  name: string;
  rationale: string;
  bbox: [number, number, number, number]; // [west, south, east, north]
  center: [number, number];              // [lng, lat]
}

async function generateSubMarkets(intent: ScoutIntent): Promise<RawSubMarket[]> {
  const client = getAnthropicClient();

  const locationContext = intent.locationHint
    ? `Focus the search near: ${intent.locationHint}.`
    : intent.region
    ? `Focus on the ${intent.region} region.`
    : "Focus on Georgia and Alabama — the primary Southeast data center markets.";

  const voltageNote = intent.minVoltage
    ? `Minimum substation voltage required: ${intent.minVoltage}kV.`
    : `Target load is ${intent.mw}MW — minimum voltage class: ${intent.mw > 100 ? "500kV" : intent.mw > 10 ? "230kV" : "115kV"}.`;

  const res = await client.messages.create({
    model: SONNET,
    max_tokens: 1200,
    messages: [
      {
        role: "user",
        content: `You are a data center site selection expert specializing in the Southeast US power grid and commercial real estate markets.

A client needs a site for a ${intent.mw}MW data center. ${voltageNote} ${locationContext}
${intent.avoidFloodZones ? "Avoid FEMA flood zones." : ""}
${intent.fiberPriority ? "Fiber latency to TIE Atlanta internet exchange is a priority." : ""}

Identify exactly 4 candidate sub-markets. For each, provide a real geographic area in the Southeast where power infrastructure, land availability, and zoning conditions are favorable for data center development at this scale.

Consider: existing transmission corridors (Southern Company, Georgia Power, Alabama Power, TVA), industrial land banks, proximity to major IXPs, existing data center clusters (Suwanee GA, Lithia Springs GA, Huntsville AL, etc.), state incentive programs.

Return ONLY a valid JSON array. No markdown, no explanation outside the JSON.

[
  {
    "id": "unique-slug",
    "name": "Short area name (e.g. Coweta County Corridor)",
    "rationale": "2-3 sentences explaining WHY this area is strong for this specific requirement",
    "bbox": [west_lng, south_lat, east_lng, north_lat],
    "center": [center_lng, center_lat]
  }
]

Use real, accurate WGS84 coordinates. bbox should cover roughly one county or industrial zone (~0.2–0.5 degree span). Do not invent infrastructure — base rationale on known grid topology and market facts.`,
      },
    ],
  });

  const text = res.content[0].type === "text" ? res.content[0].text : "[]";
  try {
    const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
    return Array.isArray(parsed) ? parsed.slice(0, 4) : [];
  } catch {
    return [];
  }
}

// ── HIFLD: validate each sub-market ──────────────────────────────────────────

function haversineMiles(lng1: number, lat1: number, lng2: number, lat2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function validateSubMarket(
  market: RawSubMarket,
  mw: number
): Promise<SubMarketCandidate> {
  const [lng, lat] = market.center;
  const radius = mw > 100 ? 35 : mw > 10 ? 20 : 10;

  const [substations, maxTxVoltage] = await Promise.all([
    fetchSubstationsNear(lng, lat, radius).catch(() => []),
    fetchNearestTxVoltage(lng, lat, 10).catch(() => null),
  ]);

  const substationCount = substations.length;
  const maxVoltage = substations.length > 0
    ? Math.max(...substations.map((s) => s.voltage))
    : null;

  // Nearest sub distance
  const withDist = substations.map((s) => ({
    ...s,
    dist: haversineMiles(lng, lat, s.lng, s.lat),
  }));
  withDist.sort((a, b) => a.dist - b.dist);
  const nearestSubDistance = withDist[0]?.dist ?? null;

  // Quick score (0–100): weight power heavily
  let score = 0;
  // Substation count (0–30)
  score += Math.min(30, substationCount * 5);
  // Max voltage tier (0–30)
  if (maxVoltage) {
    if (maxVoltage >= 500) score += 30;
    else if (maxVoltage >= 345) score += 26;
    else if (maxVoltage >= 230) score += 22;
    else if (maxVoltage >= 115) score += 16;
    else score += 8;
  }
  // TX line (0–20)
  if (maxTxVoltage) {
    if (maxTxVoltage >= 500) score += 20;
    else if (maxTxVoltage >= 230) score += 15;
    else if (maxTxVoltage >= 115) score += 10;
    else score += 5;
  }
  // Distance bonus (0–20): closer subs = better
  if (nearestSubDistance !== null) {
    if (nearestSubDistance <= 1) score += 20;
    else if (nearestSubDistance <= 3) score += 16;
    else if (nearestSubDistance <= 5) score += 12;
    else if (nearestSubDistance <= 10) score += 8;
    else score += 4;
  }

  // Flood risk: rough proxy from bbox latitude (lowlands tend to be south of certain lat)
  const floodRisk: SubMarketCandidate["floodRisk"] =
    substationCount === 0 ? "unknown" : lat < 31.5 ? "moderate" : "low";

  return {
    id: market.id,
    name: market.name,
    rationale: market.rationale,
    bbox: market.bbox,
    center: market.center,
    substationCount,
    maxVoltage,
    nearestSubDistance,
    quickScore: Math.min(100, score),
    floodRisk,
  };
}

// ── Sonnet: streaming synthesis ───────────────────────────────────────────────

function buildSynthesisPrompt(
  intent: ScoutIntent,
  markets: SubMarketCandidate[]
): string {
  const ranked = [...markets].sort((a, b) => b.quickScore - a.quickScore);
  const marketDesc = ranked
    .map(
      (m, i) =>
        `${i + 1}. ${m.name} (Score: ${m.quickScore}/100)
   - Substations within radius: ${m.substationCount}
   - Max voltage found: ${m.maxVoltage ? `${m.maxVoltage}kV` : "None confirmed"}
   - Nearest sub distance: ${m.nearestSubDistance ? `${m.nearestSubDistance.toFixed(1)}mi` : "Unknown"}
   - Claude's rationale: ${m.rationale}`
    )
    .join("\n\n");

  return `You are a data center site selection consultant presenting findings to a client looking for a ${intent.mw}MW site.

You scouted ${markets.length} sub-markets across the Southeast and validated each with live federal infrastructure data (HIFLD substations). Here are the results:

${marketDesc}

Write a concise 3-paragraph scouting summary (150–200 words). Plain text, no markdown.

Paragraph 1 — RECOMMENDATION: Name the top area and give the single most compelling reason based on the validated data.
Paragraph 2 — TRADE-OFFS: What separates the top area from #2? What does #2 offer that #1 doesn't? Be specific — reference voltage levels and distances.
Paragraph 3 — NEXT STEPS: What should the client do first when they visit the top market? Name 2 specific due diligence actions (utility rep meeting, flood map verification, etc.).`;
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  let query: string;
  try {
    const body = await request.json();
    query = typeof body.query === "string" ? body.query.trim() : "";
    if (!query) return new Response("Query required", { status: 400 });
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ event, data })}\n\n`)
        );
      };

      try {
        // Step 1 — parse intent
        send("status", "Parsing your requirements…");
        const intent = await parseIntent(query);
        send("intent", intent);

        // Step 2 — geographic reasoning
        send("status", "Identifying candidate sub-markets…");
        const rawMarkets = await generateSubMarkets(intent);

        if (rawMarkets.length === 0) {
          send("error", "Could not identify candidate markets. Try a more specific query.");
          controller.close();
          return;
        }

        // Step 3 — parallel HIFLD validation
        send("status", `Validating ${rawMarkets.length} markets with live power data…`);
        const validated = await Promise.all(
          rawMarkets.map((m) => validateSubMarket(m, intent.mw))
        );

        // Sort by quick score
        validated.sort((a, b) => b.quickScore - a.quickScore);
        send("markets", validated);

        // Step 4 — stream synthesis
        send("status", "Generating recommendation…");
        const synthesisPrompt = buildSynthesisPrompt(intent, validated);
        const client = getAnthropicClient();

        const anthropicStream = await client.messages.stream({
          model: SONNET,
          max_tokens: 500,
          messages: [{ role: "user", content: synthesisPrompt }],
        });

        for await (const chunk of anthropicStream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            send("summary_chunk", chunk.delta.text);
          }
        }

        send("done", null);
        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        send("error", msg);
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
