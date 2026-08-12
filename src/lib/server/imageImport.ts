import crypto from "node:crypto";
import type { AiImageAnalysis, ImageImportItem, ImageImportJob, Product } from "../types";
import { getProduct, listProducts, updateImageImportItem, updateImageImportJob, getImageImportItemByHash, getImageImportJob, upsertProduct, createImageImportItem, listImageImportItems } from "./store";
import * as sb from "./supabase";
import { analyzeImage } from "./aiVision";
import { uid } from "../utils";

/**
 * AI Bulk Product Image Matching Engine (Phase 5-16).
 * Pure matching/scoring helpers are exported separately so they are unit
 * testable without a database or network.
 */

export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB per image (Phase 4)
export const DEFAULT_CONCURRENCY = 5; // Phase 19
export const DEFAULT_AUTO_MATCH_THRESHOLD = 85;
export const DEFAULT_REVIEW_THRESHOLD = 60;

const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

// --- Validation (Phase 11) ---

/** Detects the true image type from magic bytes (never trusts the client MIME). */
export function detectImageMime(buffer: Uint8Array): string | null {
  if (buffer.length < 12) return null;
  const b = buffer;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  // WEBP: RIFF....WEBP
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) {
    return "image/webp";
  }
  return null;
}

export interface ValidationResult {
  ok: boolean;
  mime?: string;
  ext?: string;
  error?: string;
}

/** Validates size, magic bytes, and MIME type of an uploaded image. */
export function validateImage(buffer: Uint8Array, declaredMime?: string): ValidationResult {
  if (buffer.length === 0) return { ok: false, error: "Empty file" };
  if (buffer.length > MAX_FILE_BYTES) return { ok: false, error: "File exceeds 10MB limit" };
  const detected = detectImageMime(buffer);
  if (!detected) return { ok: false, error: "Unsupported image format (JPG, PNG, WEBP only)" };
  if (declaredMime && ALLOWED_MIME[declaredMime] && declaredMime !== detected) {
    return { ok: false, error: "File content does not match its declared type" };
  }
  return { ok: true, mime: detected, ext: ALLOWED_MIME[detected] };
}

export function sha256(buffer: Uint8Array): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

// --- Auto naming + alt text (Phase 13-14) ---

export function slugifyName(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export function generateFilename(analysis: AiImageAnalysis | undefined, ext: string, index = 0): string {
  const base =
    [analysis?.brand, analysis?.model || analysis?.product_type, analysis?.color]
      .filter((x): x is string => Boolean(x))
      .map(slugifyName)
      .filter(Boolean)
      .join("-") || `product-${Date.now().toString(36)}`;
  return `${base}${index > 0 ? `-${index}` : ""}.${ext}`;
}

export function generateAltText(analysis: AiImageAnalysis | undefined, productTitle?: string): string {
  if (analysis) {
    const parts = [analysis.brand, analysis.model, analysis.product_type, analysis.color].filter((x): x is string => Boolean(x));
    if (parts.length) return parts.join(" ").toLowerCase();
  }
  return productTitle ? productTitle.toLowerCase() : "product image";
}

// --- Matching engine (Phase 6-8) ---

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "of", "in", "on", "for", "with", "to", "from", "at", "by", "as", "is", "are", "was", "were",
  "be", "been", "it", "its", "this", "that", "these", "those", "new", "mini", "store", "black", "white", "red", "blue", "grey", "gray"
]);

export function tokenize(text: string): string[] {
  const cleaned = (text || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ");
  return cleaned.split(/\s+/).filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

function overlap(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;
  const setB = new Set(b);
  const matched = a.filter((t) => setB.has(t)).length;
  return matched / Math.max(a.length, b.length);
}

export interface ScoredCandidate {
  product: Product;
  score: number;
  reasons: string[];
}

const WEIGHTS = {
  brand: 20,
  model: 20,
  title: 25,
  category: 15,
  colorVariant: 10,
  text: 10,
  productType: 10
};

/** Scores a single product against the AI analysis (0-100). */
export function scoreCandidate(analysis: AiImageAnalysis, product: Product): ScoredCandidate {
  let score = 0;
  const reasons: string[] = [];
  const titleTokens = tokenize(product.title);
  const allTokens = tokenize([product.title, product.brand, product.description, (product.tags || []).join(" ")].join(" "));
  const specTokens = tokenize((product.specs || []).map((s) => `${s.label} ${s.value}`).join(" "));
  const searchableTokens = [...allTokens, ...specTokens];

  const aiTokens = tokenize([analysis.product_type, analysis.model, analysis.brand, analysis.variant, analysis.category].join(" "));
  const textTokens = (analysis.visible_text || []).map((t) => tokenize(t)).flat();

  if (analysis.brand && tokenize(product.brand).some((t) => tokenize(analysis.brand!).includes(t))) {
    score += WEIGHTS.brand;
    reasons.push("brand");
  }

  if (analysis.model && titleTokens.some((t) => tokenize(analysis.model!).includes(t))) {
    score += WEIGHTS.model;
    reasons.push("model");
  }

  const titleSim = overlap(aiTokens, titleTokens);
  score += Math.round(titleSim * WEIGHTS.title);
  if (titleSim > 0.2) reasons.push("title");

  const catSim = analysis.category ? overlap(tokenize(analysis.category), tokenize(product.category)) : 0;
  score += Math.round(catSim * WEIGHTS.category);
  if (catSim > 0.4) reasons.push("category");

  const colorSim = analysis.color ? overlap(tokenize(analysis.color), allTokens) : 0;
  score += Math.round(colorSim * WEIGHTS.colorVariant);
  if (colorSim > 0.4) reasons.push("color");

  const specSim = overlap(aiTokens, specTokens);
  score += Math.round(specSim * WEIGHTS.text);
  if (specSim > 0.4) reasons.push("specs");

  const typeSim = analysis.product_type ? overlap(tokenize(analysis.product_type), titleTokens) : 0;
  score += Math.round(typeSim * WEIGHTS.productType);
  if (typeSim > 0.4) reasons.push("product type");

  const visibleSim = textTokens.length ? overlap(textTokens, searchableTokens) : 0;
  if (visibleSim > 0.5) {
    score += Math.round(visibleSim * 10);
    reasons.push("visible text");
  }

  return { product, score: Math.max(0, Math.min(100, score)), reasons };
}

/** Ranks all products, returning the best candidate (or null when nothing is close). */
export function findBestMatch(analysis: AiImageAnalysis, products: Product[]): ScoredCandidate | null {
  let best: ScoredCandidate | null = null;
  for (const product of products) {
    const scored = scoreCandidate(analysis, product);
    if (!best || scored.score > best.score) best = scored;
  }
  return best && best.score > 0 ? best : null;
}

// --- Confidence levels (Phase 8) ---

export type MatchLevel = "matched" | "review" | "unmatched";

export function confidenceLevel(score: number, autoMatchThreshold = DEFAULT_AUTO_MATCH_THRESHOLD, reviewThreshold = DEFAULT_REVIEW_THRESHOLD): MatchLevel {
  if (score >= autoMatchThreshold) return "matched";
  if (score >= reviewThreshold) return "review";
  return "unmatched";
}

// --- Job + item processing ---

function itemStoragePath(jobId: string, itemId: string, ext: string): string {
  return `imports/${jobId}/${itemId}.${ext}`;
}

function productStoragePath(productId: string, filename: string): string {
  return `products/${productId}/${filename}`;
}

/**
 * Attaches an uploaded image to an import job. Validates, hashes for
 * duplicate detection (Phase 10), and stages it in storage.
 */
export async function stageUploadedImage(job: ImageImportJob, buffer: Uint8Array, originalFilename: string, declaredMime?: string): Promise<ImageImportItem> {
  const validated = validateImage(buffer, declaredMime);
  if (!validated.ok || !validated.mime || !validated.ext) {
    throw new Error(validated.error || "Invalid image");
  }

  const hash = sha256(buffer);
  const existing = await getImageImportItemByHash(hash);
  if (existing && existing.status !== "failed" && existing.status !== "rejected") {
    throw new Error(existing.jobId === job.id ? "Duplicate image (already in this job)" : `Duplicate image (already exists in job ${existing.jobId})`);
  }

  const item: ImageImportItem = {
    id: uid("imgi"),
    jobId: job.id,
    originalFilename,
    storagePath: itemStoragePath(job.id, uid("stg"), validated.ext),
    fileHash: hash,
    mime: validated.mime,
    size: buffer.length,
    status: "uploaded",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await sb.sbUploadFile(item.storagePath, buffer, validated.mime);
  const saved = await createImageImportItem(item);
  await bumpJobCounts(job.id, { totalImages: +1 });
  return saved;
}

async function bumpJobCounts(jobId: string, delta: Partial<Pick<ImageImportJob, "totalImages" | "processedImages" | "matchedImages" | "reviewImages" | "unmatchedImages" | "failedImages">>) {
  const job = await getImageImportJob(jobId);
  if (!job) return;
  const next: ImageImportJob = { ...job };
  for (const [k, v] of Object.entries(delta)) {
    (next as unknown as Record<string, number>)[k] = Math.max(0, ((next as unknown as Record<string, number>)[k] || 0) + (v as number));
  }
  await updateImageImportJob(next);
}

/**
 * Runs AI vision + matching for a single item. Marks it matched / review /
 * unmatched / failed. Does NOT mutate products (approval is separate).
 */
export async function processImageItem(item: ImageImportItem, products: Product[]): Promise<ImageImportItem> {
  const updated = { ...item, status: "processing" as const, updatedAt: new Date().toISOString() };
  await updateImageImportItem(updated);
  try {
    const bytes = await sb.sbDownloadFile(item.storagePath);
    const mime = item.mime || "image/jpeg";
    const dataUrl = `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`;
    const analysis = await analyzeImage(dataUrl);
    const best = findBestMatch(analysis, products);
    if (!best) {
      return saveProcessed(item, { analysis, status: "unmatched", candidateProductId: undefined, confidence: 0 });
    }
    const level = confidenceLevel(best.score, DEFAULT_AUTO_MATCH_THRESHOLD, DEFAULT_REVIEW_THRESHOLD);
    return saveProcessed(item, {
      analysis,
      status: level === "matched" ? "matched" : level,
      candidateProductId: best.product.id,
      confidence: best.score,
      altText: generateAltText(analysis, best.product.title)
    });
  } catch (e) {
    const failed = {
      ...item,
      status: "failed" as const,
      errorMessage: (e as Error).message,
      updatedAt: new Date().toISOString()
    };
    await updateImageImportItem(failed);
    return failed;
  }
}

interface ProcessedResult {
  analysis: AiImageAnalysis;
  status: ImageImportItem["status"];
  candidateProductId?: string;
  confidence?: number;
  altText?: string;
}

async function saveProcessed(item: ImageImportItem, result: ProcessedResult): Promise<ImageImportItem> {
  const saved = {
    ...item,
    status: result.status,
    candidateProductId: result.candidateProductId,
    confidenceScore: result.confidence,
    altText: result.altText,
    aiAnalysis: result.analysis,
    errorMessage: undefined,
    updatedAt: new Date().toISOString()
  };
  await updateImageImportItem(saved);
  return saved;
}

/** Attaches the approved image to a product (image + gallery) (Phase 15-17). */
export async function applyImageToProduct(item: ImageImportItem, productId: string): Promise<Product> {
  const product = await getProduct(productId);
  if (!product) throw new Error(`Product not found: ${productId}`);

  const bytes = await sb.sbDownloadFile(item.storagePath);
  const ext = item.mime === "image/png" ? "png" : item.mime === "image/webp" ? "webp" : "jpg";
  const filename = generateFilename(item.aiAnalysis, ext);
  const finalPath = productStoragePath(productId, filename);

  await sb.sbUploadFile(finalPath, bytes, item.mime);
  const publicUrl = sb.sbStoragePublicUrl(finalPath);

  const gallery = Array.isArray(product.gallery) ? product.gallery.slice(0, 9) : [];
  const primary = product.image && product.image.startsWith("/images/") ? product.image : product.image || publicUrl;
  const updated: Product = {
    ...product,
    image: primary || publicUrl,
    gallery: gallery.includes(publicUrl) ? gallery : [...gallery, publicUrl],
    updatedAt: new Date().toISOString()
  };
  await upsertProduct(updated);

  await updateImageImportItem({
    ...item,
    status: "matched",
    candidateProductId: productId,
    altText: generateAltText(item.aiAnalysis, product.title),
    storagePath: finalPath,
    updatedAt: new Date().toISOString()
  });
  return updated;
}

/** Approves an item (after admin review or auto-match) and attaches the image. */
export async function approveImageItem(item: ImageImportItem, productId: string): Promise<Product> {
  return applyImageToProduct(item, productId);
}

export async function rejectImageItem(item: ImageImportItem): Promise<ImageImportItem> {
  const updated = { ...item, status: "rejected" as const, updatedAt: new Date().toISOString() };
  await updateImageImportItem(updated);
  return updated;
}

/** Re-processes previously failed / unmatched / rejected items of a job. */
export async function retryJobItems(jobId: string): Promise<number> {
  const items = (await listImageImportItems(jobId)).filter((i) => ["failed", "unmatched", "rejected"].includes(i.status));
  const products = await listProducts();
  let done = 0;
  for (const item of items) {
    const result = await processImageItem(item, products);
    if (result.status !== "failed") done += 1;
  }
  return done;
}
