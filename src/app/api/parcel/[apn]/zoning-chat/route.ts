import { getAnthropicClient, HAIKU } from "@/lib/claude";
import { getZoningStandards } from "@/lib/zoning-standards";
import { fetchPropertyByPIN, mapTaxToParcel } from "@/lib/arcgis";
import { getParcelByAPN } from "@/lib/mock-data";
import { isDevMode } from "@/lib/config";
import { getCountyOrNull, getCounty, DEFAULT_COUNTY_ID, type CountyConfig } from "@/lib/county-registry";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ apn: string }> }
) {
  const { apn } = await params;
  const body = await request.json() as {
    message: string;
    history: Array<{ role: "user" | "assistant"; content: string }>;
  };
  const { message, history } = body;

  // Resolve county from query param
  const url = new URL(request.url);
  const countyId = url.searchParams.get("county");
  const county: CountyConfig = countyId
    ? getCountyOrNull(countyId) ?? getCounty(DEFAULT_COUNTY_ID)
    : getCounty(DEFAULT_COUNTY_ID);

  // Fetch zoning context
  let zoning: string | null = null;
  let address: string | null = null;
  try {
    const attrs = await fetchPropertyByPIN(apn, county);
    if (attrs) {
      const p = mapTaxToParcel(attrs, apn, county);
      zoning = p.zoning;
      address = p.site_address;
    }
  } catch {
    if (isDevMode) {
      const mock = getParcelByAPN(apn);
      zoning = mock?.zoning ?? null;
      address = mock?.site_address ?? null;
    }
  }

  const zoningSummary = getZoningStandards(zoning);
  const standardsText = zoningSummary.standards
    .map((s) => `• ${s.label}: ${s.value}`)
    .join("\n");
  const flagsText = zoningSummary.flags
    .map((f) => `• ${f.label} [${f.type}]`)
    .join("\n");

  const countyLabel = `${county.fullName}, ${county.state === "GA" ? "Georgia" : county.state}`;
  const systemPrompt = `You are a commercial real estate zoning analyst specializing in ${countyLabel}. You answer precise, actionable questions about zoning regulations based on the county's zoning ordinance.

Current parcel context:
- APN: ${apn}
- Address: ${address ?? "Unknown"}
- Zoning: ${zoningSummary.code} — ${zoningSummary.name}

Key Standards:
${standardsText}

Permitted / Conditional / Prohibited Uses:
${flagsText}

Rules:
- Be concise and direct. No marketing language.
- Always cite relevant UDO section numbers when stating specific requirements.
- Flag any conditional use permit (CUP) requirements explicitly.
- If you're not certain, say so and recommend the user confirm with the ${county.name} County Planning Division.
- When there is a specific regulatory constraint, prefix it with ⚠ on a new line.`;

  const client = getAnthropicClient();

  // Build messages from prior history + new user message
  const messages: Array<{ role: "user" | "assistant"; content: string }> = [
    ...history,
    { role: "user", content: message },
  ];

  // Stream the response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = await client.messages.stream({
          model: HAIKU,
          max_tokens: 512,
          system: systemPrompt,
          messages,
        });

        for await (const chunk of anthropicStream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`)
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
