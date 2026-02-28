import { isDevMode } from "./config";

/**
 * Creates a vector embedding for the given text.
 * In production, this uses OpenAI's text-embedding-3-large (3072 dims).
 * In dev mode, it returns a random vector of the correct dimensionality.
 */
export async function createEmbedding(text: string): Promise<number[]> {
  if (isDevMode || !process.env.OPENAI_API_KEY) {
    // Return a mock vector for development
    // text-embedding-3-large is 3072 dimensions
    return Array.from({ length: 3072 }, () => Math.random() * 2 - 1);
  }

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      input: text.replace(/\n/g, " "),
      model: "text-embedding-3-large",
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI Embedding Error: ${error.error?.message || response.statusText}`);
  }

  const result = await response.json();
  return result.data[0].embedding;
}

/**
 * Naive text chunker for RAG.
 * Splits text into overlapping segments.
 */
export function chunkText(text: string, chunkSize = 1000, overlap = 200): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start += chunkSize - overlap;
  }

  return chunks;
}
