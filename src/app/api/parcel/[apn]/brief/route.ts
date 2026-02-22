import { getAnthropicClient, SONNET } from "@/lib/claude";
import { fetchPropertyByPIN, mapTaxToParcel } from "@/lib/arcgis";
import { getParcelByAPN } from "@/lib/mock-data";
import { scoreParcel } from "@/lib/scoring";
import { getZoningStandards } from "@/lib/zoning-standards";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ apn: string }> }
) {
  const { apn } = await params;

  // Gather parcel data
  let parcel;
  try {
    const attrs = await fetchPropertyByPIN(apn);
    if (attrs) parcel = mapTaxToParcel(attrs, apn);
  } catch {
    // fall through
  }
  if (!parcel) parcel = getParcelByAPN(apn);
  if (!parcel) {
    return new Response(JSON.stringify({ error: "Parcel not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const score = scoreParcel(parcel);
  const zoningSummary = getZoningStandards(parcel.zoning);
  const standardsText = zoningSummary.standards.map((s) => `• ${s.label}: ${s.value}`).join("\n");
  const flagsText = zoningSummary.flags.map((f) => `• ${f.label} [${f.type}]`).join("\n");

  const prompt = `You are a senior commercial real estate analyst producing a formal Site Intelligence Brief for a Gwinnett County, Georgia property.

Subject Property:
- APN: ${apn}
- Address: ${parcel.site_address ?? "Unknown"}
- Owner: ${parcel.owner_name ?? "Unknown"}
- Zoning: ${parcel.zoning ?? "Unknown"} — ${zoningSummary.name}
- Acres: ${parcel.acres ?? "Unknown"}
- Land Use: ${parcel.land_use_code ?? "Unknown"}
- Assessed Total: $${parcel.assessed_total?.toLocaleString() ?? "Unknown"}
- Land Value: $${parcel.land_value?.toLocaleString() ?? "Unknown"}
- Improvement Value: $${parcel.improvement_value?.toLocaleString() ?? "Unknown"}
- Legal Description: ${parcel.legal_desc ?? "Not available"}

Site Intelligence Score: ${score.composite}/100 (Tier: ${score.tier})
  - Zoning:         ${score.zoning}/20
  - Market:         ${score.market}/20
  - Infrastructure: ${score.infrastructure}/20
  - Access:         ${score.access}/20 (estimated)
  - Demographics:   ${score.demographics}/20 (estimated)

Zoning Standards (${zoningSummary.code} — ${zoningSummary.name}):
${standardsText}

Use Classifications:
${flagsText}

Write a professional 5-section Site Intelligence Brief using the following structure. Use markdown headers for each section. Be factual, data-driven, and concise. No filler language.

# Executive Summary
2-3 sentences. What is this property, where does it score, and what is the headline investment insight?

# Development Score Analysis
Explain each of the 5 scoring dimensions and what they mean for this specific parcel. Call out the strongest and weakest dimensions.

# Zoning & Regulatory Analysis
Summarize the zoning classification, key permitted uses, and any notable restrictions or CUP requirements. Identify the highest-value use permitted by right.

# Comparable Properties & Market Context
Discuss the general market context for ${parcel.zoning ?? "this zoning class"} properties in Gwinnett County. Note any relevant market trends. (Note: specific sale comp data is not available from county records — base this on general market knowledge of the Gwinnett submarket.)

# Risk Analysis & Recommendations
Identify 3-5 specific risks or due diligence items. Close with a clear action recommendation (acquire for development, monitor, pass, etc.) and why.`;

  const client = getAnthropicClient();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = await client.messages.stream({
          model: SONNET,
          max_tokens: 2000,
          messages: [{ role: "user", content: prompt }],
        });

        for await (const chunk of anthropicStream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`
              )
            );
          }
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`)
        );
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
