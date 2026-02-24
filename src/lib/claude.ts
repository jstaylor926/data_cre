import { ZONING_TOOL_SCHEMA } from "./zoning-standards";
import type { ZoningExtraction } from "./types";

// ─── Server-side Claude integration ──────────────────────────
// Used in API routes (not client-side)

export async function extractZoningWithClaude(
  documentText: string,
  zoningCode: string
): Promise<ZoningExtraction | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("ANTHROPIC_API_KEY not set, returning null");
    return null;
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      tools: [ZONING_TOOL_SCHEMA],
      tool_choice: { type: "tool", name: "extract_zoning_parameters" },
      messages: [
        {
          role: "user",
          content: `You are a commercial real estate zoning analyst specializing in data center development.

Analyze the following municipal zoning code for zone "${zoningCode}" and extract the specific parameters relevant to building a data center facility.

Pay special attention to:
1. Whether "data processing facility", "data center", "telecommunications facility", or similar uses are permitted by-right, require a Conditional Use Permit (CUP), or are prohibited.
2. Maximum building height (data centers typically need 40-75 feet).
3. Setback requirements from property lines.
4. Noise/decibel limits at property lines (critical for cooling systems and backup generators).
5. Maximum lot coverage percentage.
6. Any fatal flaws that would block or severely impede data center development.

Municipal Code Text:
${documentText}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    console.error("Claude API error:", response.status);
    return null;
  }

  const data = await response.json();
  const toolUse = data.content?.find(
    (block: { type: string }) => block.type === "tool_use"
  );

  if (!toolUse?.input) return null;

  return toolUse.input as ZoningExtraction;
}

// ─── Zoning Chat (conversational follow-up) ──────────────────
export async function askZoningQuestion(
  question: string,
  zoningCode: string,
  documentContext?: string
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return "Claude API key not configured. Please set ANTHROPIC_API_KEY.";
  }

  const systemPrompt = `You are a commercial real estate zoning expert specializing in data center development.
You are analyzing zone "${zoningCode}".
${documentContext ? `Here is the relevant municipal code context:\n${documentContext}` : ""}
Answer questions concisely with specific code references when available.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: question }],
    }),
  });

  if (!response.ok) {
    return `Error: ${response.status}`;
  }

  const data = await response.json();
  return data.content?.[0]?.text ?? "No response";
}
