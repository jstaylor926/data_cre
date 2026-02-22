/**
 * Anthropic Claude client singleton.
 * Requires ANTHROPIC_API_KEY in .env.local
 */
import Anthropic from "@anthropic-ai/sdk";

// Lazily instantiated so import doesn't fail if key is missing at module load
let _client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY is not set. Add it to .env.local:\nANTHROPIC_API_KEY=sk-ant-..."
      );
    }
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

/** Fast model for chat + quick analysis */
export const HAIKU = "claude-haiku-4-5-20251001";

/** Capable model for scoring narratives + brief generation */
export const SONNET = "claude-sonnet-4-5-20250929";
