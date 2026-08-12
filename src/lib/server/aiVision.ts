import type { AiImageAnalysis } from "../types";

/**
 * AI Vision provider abstraction (Phase 5).
 * Calls any OpenAI-compatible chat/completions endpoint, so providers can be
 * swapped via environment variables without code changes:
 *
 *   AI_PROVIDER=openai        -> https://api.openai.com/v1      (default)
 *   AI_PROVIDER=groq          -> https://api.groq.com/openai/v1 (free tier)
 *   AI_PROVIDER=openrouter    -> https://openrouter.ai/api/v1   (free models)
 *   AI_BASE_URL=<any>         -> custom OpenAI-compatible base URL
 *
 * Key: AI_API_KEY (shared env var for every provider). Model: AI_MODEL.
 * AI_MOCK=1 bypasses the network and returns a deterministic fake analysis,
 * useful for testing the UI/review flow without spending any credits.
 */

const BASE_URLS: Record<string, string> = {
  openai: "https://api.openai.com/v1",
  groq: "https://api.groq.com/openai/v1",
  openrouter: "https://openrouter.ai/api/v1"
};

const PROVIDER = process.env.AI_PROVIDER || "openai";
const BASE_URL = process.env.AI_BASE_URL || BASE_URLS[PROVIDER] || BASE_URLS.openai;
const MODEL = process.env.AI_MODEL || "gpt-4o-mini";
const MOCK = process.env.AI_MOCK === "1" || process.env.AI_MOCK === "true";

const SYSTEM_PROMPT = `You are a product image analyzer for an e-commerce catalog.
Do not think out loud; answer directly.
Analyze the product photograph and return STRICT JSON with exactly these keys:
{
  "product_type": string|null,
  "brand": string|null,
  "model": string|null,
  "color": string|null,
  "visible_text": string[],
  "category": string|null,
  "variant": string|null,
  "confidence": number
}
Rules:
- Describe the actual product in the image. Do NOT invent a brand/model you cannot see.
- "visible_text" = any readable text on the product or packaging.
- "confidence" = 0-100, how sure you are the subject is a real product vs decorative/abstract.
- If a field is unknown, return null (except visible_text/confidence which must always be present).
- category should be a short noun phrase like "kitchen pot", "electric kettle", "handbag", "extension socket".
- No markdown, no commentary. Output the JSON object only.`;

function openAiPayload(imageDataUrl: string) {
  return {
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: "Identify this product for catalog matching." },
          { type: "image_url", image_url: { url: imageDataUrl } }
        ]
      }
    ],
    temperature: 0.1,
    response_format: { type: "json_object" },
    max_tokens: 2000
  };
}

async function callOpenAiCompatible(imageDataUrl: string): Promise<AiImageAnalysis> {
  const key = process.env.AI_API_KEY;
  if (!key) throw new Error("AI_API_KEY is not configured. Add it to .env.local to enable AI matching.");

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      ...(PROVIDER === "openrouter" ? { "HTTP-Referer": "https://gadgethub.app", "X-Title": "Gadget Hub" } : {})
    },
    body: JSON.stringify(openAiPayload(imageDataUrl)),
    signal: AbortSignal.timeout(45_000)
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`AI Vision request failed (${res.status}) ${text.slice(0, 200)}`);
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI Vision returned no content");

  const parsed = JSON.parse(content) as Partial<AiImageAnalysis>;
  return sanitizeAnalysis(parsed);
}

function sanitizeAnalysis(parsed: Partial<AiImageAnalysis>): AiImageAnalysis {
  const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim().slice(0, 120) : null);
  return {
    product_type: str(parsed.product_type),
    brand: str(parsed.brand),
    model: str(parsed.model),
    color: str(parsed.color),
    visible_text: Array.isArray(parsed.visible_text)
      ? parsed.visible_text.filter((t): t is string => typeof t === "string").map((t) => t.trim().slice(0, 120)).filter(Boolean).slice(0, 20)
      : [],
    category: str(parsed.category),
    variant: str(parsed.variant),
    confidence: typeof parsed.confidence === "number" ? Math.max(0, Math.min(100, Math.round(parsed.confidence <= 1 ? parsed.confidence * 100 : parsed.confidence))) : 0
  };
}

/** Deterministic offline analysis for UI/testing without any API credits. */
function mockAnalysis(imageDataUrl: string): AiImageAnalysis {
  const marker = imageDataUrl.slice(0, 64);
  const hash = [...marker].reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) >>> 0, 7);
  const words = ["kitchen pot", "electric kettle", "handbag", "extension socket", "rice cooker", "solar panel", "ceiling fan", "luggage bag", "cutlery set", "power strip"];
  const word = words[hash % words.length];
  const parts = word.split(" ");
  const brand = parts.length > 1 ? "generic" : "unnamed";
  return {
    product_type: word,
    brand,
    model: null,
    color: hash % 2 === 0 ? "black" : "silver",
    visible_text: [],
    category: word,
    variant: null,
    confidence: 90
  };
}

export async function analyzeImage(imageDataUrl: string): Promise<AiImageAnalysis> {
  if (MOCK) return mockAnalysis(imageDataUrl);
  return callOpenAiCompatible(imageDataUrl);
}
