/**
 * POST /api/dc-brief/compare
 * Streams a Claude AI recommendation comparing 2–4 data center sites.
 * Body: { sites: ComparisonSite[] }
 * Returns: plain text stream
 */
import { getAnthropicClient, SONNET } from "@/lib/claude";
import type { ComparisonSite } from "@/lib/types";

interface RequestBody {
  sites: ComparisonSite[];
}

function buildComparisonPrompt(sites: ComparisonSite[]): string {
  const siteDescriptions = sites
    .map((s, i) => {
      const infra = s.infrastructure;
      const score = s.dcScore;
      const lines = [
        `Site ${i + 1}: ${s.address}`,
        `  APN: ${s.apn}`,
        `  MW Target: ${s.mwTarget} MW`,
        `  Composite Score: ${score.disqualified ? "DISQUALIFIED" : `${score.composite}/100`} (${score.tier})`,
        `  Power Score: ${score.power}/40`,
        `    - Nearest Sub: ${score.nearestSub ? `${score.nearestSub.voltage}kV at ${score.nearestSub.distance.toFixed(1)}mi` : "None found"}`,
        `    - Redundancy: ${score.redundancy ? "Dual-feed capable" : "Single feed only"}`,
        `    - TX Line Proximity: ${infra?.nearestTxVoltage ? `${infra.nearestTxVoltage}kV within 5mi` : "None"}`,
        `  Fiber Score: ${score.fiber}/30`,
        `    - FCC Carriers: ${infra?.fiberCarriers.join(", ") || "None"}`,
        `    - TIE Atlanta Distance: ${infra?.tieDistance != null ? `${infra.tieDistance.toFixed(1)}mi` : "Unknown"}`,
        `  Water Score: ${score.water}/20`,
        `  Environmental Score: ${score.environ}/10`,
        `    - FEMA Flood Zone: ${infra?.floodZone ?? "None"}`,
        score.disqualified && score.criticalFlag
          ? `    - CRITICAL: ${score.criticalFlag.description}`
          : "",
      ]
        .filter(Boolean)
        .join("\n");
      return lines;
    })
    .join("\n\n");

  return `You are a senior data center site selection consultant analyzing ${sites.length} candidate sites in Gwinnett County, Georgia for a potential data center development.

CANDIDATE SITES:
${siteDescriptions}

SCORING SYSTEM:
- Composite score out of 100 (Power 40% + Fiber 30% + Water 20% + Environmental 10%)
- DISQUALIFIED = site is in a critical FEMA flood zone — insurance cannot be written
- Power score considers substation proximity, voltage tier, redundancy, and TX line access
- Fiber score considers FCC-reported carrier count and proximity to TIE Atlanta IX
- Water score reflects municipal capacity data availability
- Environmental score based on FEMA NFHL flood zone data

Write a concise 3-section recommendation (200-300 words total). Use plain text, no markdown. Be direct and data-driven.

RECOMMENDATION STRUCTURE:
1. WINNER: State which site is the best candidate and the single most important reason why.
2. KEY DIFFERENTIATORS: In 3-4 sentences, explain what separates the top site from the others. Reference specific data points (kV ratings, distances, scores).
3. RISK FLAGS: Note 2-3 specific due diligence items for the winning site. If any sites are disqualified or have critical issues, call those out explicitly.

Do not repeat the data back verbatim. Focus on the insight and recommendation.`;
}

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { sites } = body;
  if (!Array.isArray(sites) || sites.length < 2 || sites.length > 4) {
    return new Response("Provide 2–4 sites for comparison", { status: 400 });
  }

  const prompt = buildComparisonPrompt(sites);
  const client = getAnthropicClient();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = await client.messages.stream({
          model: SONNET,
          max_tokens: 600,
          messages: [{ role: "user", content: prompt }],
        });

        for await (const chunk of anthropicStream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }

        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(encoder.encode(`\n[Error: ${msg}]`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "Transfer-Encoding": "chunked",
    },
  });
}
