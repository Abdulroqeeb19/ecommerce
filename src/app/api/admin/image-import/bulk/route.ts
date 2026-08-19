import { NextResponse } from "next/server";
import { currentUser, requireRole } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/rateLimit";
import { listProducts } from "@/lib/server/store";
import { matchByFilename, matchByVision, attachDataUrlImage, appendBulkImportLog, getBulkImportLog, DEFAULT_NAME_MATCH_MIN_SCORE, type BulkUploadResult, type BulkImportLogEntry } from "@/lib/server/bulkImageImport";
import { MAX_FILE_BYTES } from "@/lib/server/imageImport";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Returns the recent bulk import log: which images were uploaded, when, via
 * which path (filename or AI vision), and what each matched.
 */
export async function GET(req: Request) {
  const user = await currentUser();
  const denied = requireRole(user, ["admin"]);
  if (denied) return denied;
  const rl = await rateLimit(req, 60);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });

  const log = await getBulkImportLog();
  return NextResponse.json({ log });
}

/**
 * Temporary bulk uploader. Body: multipart/form-data with one or more `files`
 * (any count). Each image is matched to a product and stored immediately:
 *   1. best-effort by FILENAME (e.g. "logitech-m185-mouse.jpg" -> Logitech M185)
 *   2. AI VISION fallback for "junk" names that carry no product info
 *      (camera names, "IMG-*", timestamps) — analyzed from the pixels.
 *
 * Returns per-file results: matched products, scores, review candidates, errors.
 */
export async function POST(req: Request) {
  const user = await currentUser();
  const denied = requireRole(user, ["admin"]);
  if (denied) return denied;
  const rl = await rateLimit(req, 30);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });

  const form = await req.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (!files.length) return NextResponse.json({ error: "No files provided" }, { status: 400 });

  const products = await listProducts();
  const results: BulkUploadResult[] = [];
  const logEntries: BulkImportLogEntry[] = [];
  let matched = 0;
  let review = 0;

  for (const file of files) {
    const filename = file.name.replace(/[\\/]/g, "");
    const entry: BulkImportLogEntry = {
      id: `bulk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      filename,
      uploadedAt: new Date().toISOString(),
      source: "filename",
      status: "error"
    };
    try {
      const buffer = new Uint8Array(await file.arrayBuffer());
      if (buffer.length > MAX_FILE_BYTES) throw new Error("Exceeds 10MB limit");
      const mime = file.type && file.type.startsWith("image/") ? file.type : "image/jpeg";
      const dataUrl = `data:${mime};base64,${Buffer.from(buffer).toString("base64")}`;

      // 1) Filename matching (free, no AI credits).
      const fileNameMatch = matchByFilename(filename, products);
      if (fileNameMatch && fileNameMatch.score >= DEFAULT_NAME_MATCH_MIN_SCORE) {
        const product = await attachDataUrlImage(fileNameMatch.product.id, dataUrl);
        matched += 1;
        entry.source = "filename";
        entry.status = "attached";
        entry.productId = product.id;
        entry.productTitle = product.title;
        entry.score = fileNameMatch.score;
        entry.matchedTokens = fileNameMatch.matchedTokens;
        results.push({
          filename,
          ok: true,
          source: "filename",
          status: "attached",
          productId: product.id,
          productTitle: product.title,
          score: fileNameMatch.score
        });
        logEntries.push(entry);
        continue;
      }

      // 2) Junk filename: nothing useful in the name, so inspect the pixels.
      let vision;
      try {
        vision = await matchByVision(dataUrl, products);
      } catch (e) {
        entry.source = "ai";
        entry.status = "error";
        entry.error = (e as Error).message;
        logEntries.push(entry);
        results.push({
          filename,
          ok: false,
          status: "error",
          error: `AI vision unavailable (${(e as Error).message}). Rename the file with the product name, or match it manually.`
        });
        continue;
      }

      entry.source = "ai";
      entry.aiSummary = [
        vision.analysis.product_type,
        vision.analysis.brand,
        vision.analysis.model,
        vision.analysis.category,
        vision.analysis.visible_text.length ? `visible: ${vision.analysis.visible_text.slice(0, 4).join(", ")}` : ""
      ].filter(Boolean).join(" · ");

      if (vision.status === "attached" && vision.best) {
        const product = await attachDataUrlImage(vision.best.product.id, dataUrl);
        matched += 1;
        entry.status = "attached";
        entry.productId = product.id;
        entry.productTitle = product.title;
        entry.score = vision.best.score;
        results.push({
          filename,
          ok: true,
          source: "ai",
          status: "attached",
          productId: product.id,
          productTitle: product.title,
          score: vision.best.score
        });
      } else if (vision.status === "review" && vision.best) {
        review += 1;
        entry.status = "review";
        entry.productId = vision.best.product.id;
        entry.productTitle = vision.best.product.title;
        entry.score = vision.best.score;
        entry.error = `AI suggests “${vision.best.product.title}” (${vision.best.score}%) — not attached, verify it matches.`;
        results.push({
          filename,
          ok: false,
          source: "ai",
          status: "review",
          productId: vision.best.product.id,
          productTitle: vision.best.product.title,
          score: vision.best.score,
          error: entry.error
        });
      } else {
        entry.status = "unmatched";
        results.push({
          filename,
          ok: false,
          status: "unmatched",
          error: "Could not match to any product (low AI confidence)"
        });
      }
      logEntries.push(entry);
    } catch (e) {
      entry.error = (e as Error).message;
      logEntries.push(entry);
      results.push({ filename, ok: false, status: "error", error: (e as Error).message });
    }
  }

  try {
    await appendBulkImportLog(logEntries);
  } catch (e) {
    console.error("Failed to write bulk import log:", e);
  }

  return NextResponse.json({ results, matched, review, total: files.length, source: "filename+ai" });
}