import { NextResponse } from "next/server";
import { currentUser, requireRole } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/rateLimit";
import { getImageImportJob, listImageImportItems, listProducts, updateImageImportJob } from "@/lib/server/store";
import { processImageItem } from "@/lib/server/imageImport";

type Ctx = { params: Promise<{ id: string }> };

export const runtime = "nodejs";
export const maxDuration = 300;

const CONCURRENCY = 5;

export async function POST(req: Request, { params }: Ctx) {
  const user = await currentUser();
  const denied = requireRole(user, ["admin"]);
  if (denied) return denied;
  const rl = await rateLimit(req, 20);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });

  const { id } = await params;
  const job = await getImageImportJob(id);
  if (!job) return NextResponse.json({ error: "Import job not found" }, { status: 404 });
  if (job.status === "completed") return NextResponse.json({ error: "Job already completed" }, { status: 409 });

  const items = await listImageImportItems(id);
  const pending = items.filter((i) => i.status === "uploaded" || i.status === "failed" || i.status === "unmatched" || i.status === "rejected");
  if (!pending.length) {
    return NextResponse.json({ error: "No images left to process" }, { status: 409 });
  }

  const products = await listProducts();
  await updateImageImportJob({ ...job, status: "processing" });

  let index = 0;
  const processNext = async (): Promise<void> => {
    while (index < pending.length) {
      const item = pending[index++];
      await processImageItem(item, products);
    }
  };
  const workers = Array.from({ length: Math.min(CONCURRENCY, pending.length) }, () => processNext());
  await Promise.all(workers);

  const freshItems = await listImageImportItems(id);
  const processed = freshItems.filter((i) => ["matched", "review", "unmatched", "failed"].includes(i.status));
  const counts = {
    processedImages: processed.length,
    matchedImages: freshItems.filter((i) => i.status === "matched").length,
    reviewImages: freshItems.filter((i) => i.status === "review").length,
    unmatchedImages: freshItems.filter((i) => i.status === "unmatched").length,
    failedImages: freshItems.filter((i) => i.status === "failed").length
  };
  const done = counts.processedImages >= job.totalImages;
  await updateImageImportJob({
    ...job,
    ...counts,
    status: done ? "completed" : "processing",
    completedAt: done ? new Date().toISOString() : undefined
  });

  const summary = await getImageImportJob(id);
  return NextResponse.json({ job: summary, items: freshItems });
}
