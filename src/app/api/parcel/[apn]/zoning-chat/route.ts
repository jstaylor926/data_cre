import { getAnthropicClient, HAIKU } from "@/lib/claude";
import { getZoningStandards } from "@/lib/zoning-standards";
import { fetchPropertyByPIN, mapTaxToParcel } from "@/lib/arcgis";
import { getParcelByAPN } from "@/lib/mock-data";
import { isDevMode } from "@/lib/config";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ apn: string }> }
) {
  const { apn } = await params;
  const { message, history } = await request.json() as {
    message: string;
    history: Array<{ role: "user" | "assistant"; content: string }>;
  };

  // Fetch zoning context
  let zoning: string | null = null;
  let address: string | null = null;
  try {
    const attrs = await fetchPropertyByPIN(apn);
    if (attrs) {
      const p = mapTaxToParcel(attrs, apn);
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

  const systemPrompt = `You are a commercial real estate zoning analyst specializing in Gwinnett County, Georgia. You answer precise, actionable questions about zoning regulations based on the Gwinnett County Unified Development Ordinance (UDO).

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
- If you're not certain, say so and recommend the user confirm with the Gwinnett County Planning Division.
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
