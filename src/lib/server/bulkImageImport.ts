import type { AiImageAnalysis, Product } from "../types";
import { tokenize, validateImage, MAX_FILE_BYTES, scoreCandidate, type ScoredCandidate } from "./imageImport";
import { getProduct, upsertProduct, getSettings, setSettings } from "./store";
import { analyzeImage } from "./aiVision";

/**
 * Temporary bulk importer that matches uploaded images to products.
 * 1) Tries the FILENAME first (free, no AI) — e.g. "logitech-m185-mouse.jpg".
 * 2) When the filename carries no useful information (junk names like
 *    "IMG-20240701-WA0048.jpg"), falls back to AI VISION: the pixels are
 *    analyzed and matched against the catalog. High-confidence matches are
 *    auto-attached, marginal ones are surfaced as review suggestions.
 *
 * Images are stored directly in the product record as base64 data URLs (the
 * same mechanism the existing admin Products.tsx already uses) — no AI credits
 * spent unless a junk filename forces the vision fallback, and no external
 * storage bucket required.
 *
 * This module is intentionally self-contained so it can be removed later once
 * the full AI + Supabase Storage pipeline is stable.
 */

export interface FilenameMatch {
  product: Product;
  score: number;
  matchedTokens: string[];
}

const JUNK_TOKENS = new Set([
  "img", "dsc", "photo", "image", "pic", "whatsapp", "wa", "jpg", "png", "webp", "sub", "status", "attachment"
]);

/**
 * Scores how well a filename describes a product. Ignores junk words such as
 * "IMG", "DSC", dates and phone numbers.
 */
export function matchByFilename(filename: string, products: Product[]): FilenameMatch | null {
  const base = filename.replace(/\.[^.]+$/, "");
  const rawTokens = tokenize(base);

  const tokens = rawTokens.filter((t) => {
    if (JUNK_TOKENS.has(t)) return false;
    if (/^\d{3,}$/.test(t)) return false; // sequence numbers like 0042
    if (/^\d{4}$/.test(t)) return false; // years like 2024
    return true;
  });

  if (tokens.length === 0) return null;

  let best: FilenameMatch | null = null;
  for (const product of products) {
    const titleTokens = new Set(tokenize(product.title));
    const brandTokens = new Set(tokenize(product.brand));
    const categoryTokens = new Set(tokenize(product.category));

    const matchedTokens = tokens.filter((t) => titleTokens.has(t) || categoryTokens.has(t));
    const brandHit = tokens.filter((t) => brandTokens.has(t)).length;

    // Non-brand tokens are the real signal; a fully described filename gets ~100.
    const nonBrand = tokens.filter((t) => !brandTokens.has(t));
    const coverage = nonBrand.length ? matchedTokens.length / nonBrand.length : 0;

    let score = 0;
    if (brandHit > 0 && brandHit >= tokens.length) score += 10;
    else if (brandHit > 0) score += 8;
    score += Math.round(coverage * 80);
    if (coverage >= 1 && brandHit === tokens.length) score += 10;

    score = Math.min(100, score);
    if (score <= 0) continue;
    if (!best || score > best.score) {
      best = { product, score, matchedTokens };
    }
  }

  return best && best.score >= 40 ? best : null;
}

export const DEFAULT_NAME_MATCH_MIN_SCORE = 40;

export type BulkMatchSource = "filename" | "ai";
export type BulkMatchStatus = "attached" | "review" | "unmatched" | "error";

export interface BulkUploadResult {
  filename: string;
  ok: boolean;
  source?: BulkMatchSource;
  status: BulkMatchStatus;
  productId?: string;
  productTitle?: string;
  score?: number;
  duplicate?: boolean;
  error?: string;
}

// --- Import log (settings-backed) ---

export const BULK_IMPORT_LOG_KEY = "bulkImageImportLog";
const MAX_LOG_ENTRIES = 500;

export interface BulkImportLogEntry {
  id: string;
  filename: string;
  uploadedAt: string;
  source: BulkMatchSource;
  status: BulkMatchStatus;
  productId?: string;
  productTitle?: string;
  score?: number;
  error?: string;
  /** What AI vision saw in the image (junk-name path only). */
  aiSummary?: string;
  /** Which filename tokens matched (filename path only). */
  matchedTokens?: string[];
}

export async function getBulkImportLog(): Promise<BulkImportLogEntry[]> {
  const stored = await getSettings<BulkImportLogEntry[]>(BULK_IMPORT_LOG_KEY);
  return Array.isArray(stored) ? stored : [];
}

/** Appends entries (newest first) and trims the log to MAX_LOG_ENTRIES. */
export async function appendBulkImportLog(entries: BulkImportLogEntry[]): Promise<void> {
  if (!entries.length) return;
  const existing = await getBulkImportLog();
  const next = [...entries, ...existing].slice(0, MAX_LOG_ENTRIES);
  await setSettings(BULK_IMPORT_LOG_KEY, next);
}

// The bulk importer only looks at an image when its FILENAME carries no product
// information, so its thresholds are intentionally looser than the review-flow
// importer (whose 85/60 auto/review cutoffs assume rich product descriptions
// and specs). Here a modest absolute score is enough, BUT the winner must win by
// a clear margin over the next product — otherwise we refuse to guess.
export const BULK_VISION_MIN_SCORE = 45;
export const BULK_VISION_REVIEW_SCORE = 10;
export const BULK_VISION_MARGIN = 20;

/** Wait between retries when the vision provider rate-limits us (429). */
const RETRY_DELAY_MS = 4000;
const MAX_RETRIES = 3;

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const msg = (e as Error).message;
      if (/429|rate limit/i.test(msg)) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
}

/**
 * Pixel-level fallback for junk filenames (camera names, timestamps, "IMG-*",
 * etc.). Runs AI vision on the image, then scores every product in the catalog:
 *  - clear winner (score + margin) -> attached automatically
 *  - plausible winner             -> listed as a review candidate (not attached)
 *  - otherwise                    -> unmatched
 *
 * Throws when AI is not configured/unreachable so the caller can surface the
 * error instead of guessing.
 */
export async function matchByVision(dataUrl: string, products: Product[]): Promise<{
  analysis: AiImageAnalysis;
  best: ScoredCandidate | null;
  runnerUp: ScoredCandidate | null;
  status: BulkMatchStatus;
}> {
  const analysis = await withRetry(() => analyzeImage(dataUrl));
  const ranked = products
    .map((p) => scoreCandidate(analysis, p))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
  const best = ranked[0] || null;
  const runnerUp = ranked[1] || null;

  if (!best) return { analysis, best: null, runnerUp: null, status: "unmatched" };
  const margin = best.score - (runnerUp?.score || 0);
  if (best.score >= BULK_VISION_MIN_SCORE && margin >= BULK_VISION_MARGIN) {
    return { analysis, best, runnerUp, status: "attached" };
  }
  if (best.score >= BULK_VISION_REVIEW_SCORE && margin >= BULK_VISION_MARGIN / 2) {
    return { analysis, best, runnerUp, status: "review" };
  }
  return { analysis, best, runnerUp, status: "unmatched" };
}

/**
 * Attaches one image (as a base64 data URL) to a matched product's gallery and
 * primary image when the product has no real primary image yet.
 */
export async function attachDataUrlImage(productId: string, dataUrl: string): Promise<Product> {
  if (!dataUrl.startsWith("data:image/")) throw new Error("Not a valid base64 image");
  const totalLen = dataUrl.length;
  const approxBytes = Math.round((totalLen - dataUrl.indexOf(",") - 1) * 0.75);
  if (approxBytes > MAX_FILE_BYTES) throw new Error("Image exceeds 10MB after base64 decode");

  // Decode the base64 payload and validate magic bytes.
  const comma = dataUrl.indexOf(",");
  const b64 = dataUrl.slice(comma + 1);
  const buffer = Buffer.from(b64, "base64");
  const validation = validateImage(new Uint8Array(buffer));
  if (!validation.ok) throw new Error(validation.error || "Invalid image content");

  const product = await getProduct(productId);
  if (!product) throw new Error(`Product not found: ${productId}`);

  const gallery = Array.isArray(product.gallery)
    ? product.gallery.filter((g) => g !== dataUrl).slice(0, 9)
    : [];

  const isPlaceholder = !product.image || product.image.includes("placeholder");
  const updated: Product = {
    ...product,
    image: isPlaceholder || gallery.length === 0 ? dataUrl : product.image,
    gallery: [...gallery, dataUrl].slice(0, 10),
    updatedAt: new Date().toISOString()
  };
  return upsertProduct(updated);
}