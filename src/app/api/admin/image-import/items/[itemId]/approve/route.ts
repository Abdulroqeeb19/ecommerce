import { NextResponse } from "next/server";
import { currentUser, requireRole } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/rateLimit";
import { getImageImportItem, getImageImportJob, listImageImportItems, updateImageImportJob } from "@/lib/server/store";
import { approveImageItem } from "@/lib/server/imageImport";

type Ctx = { params: Promise<{ itemId: string }> };

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request, { params }: Ctx) {
  const user = await currentUser();
  const denied = requireRole(user, ["admin"]);
  if (denied) return denied;
  const rl = await rateLimit(req, 60);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });

  const { itemId } = await params;
  const item = await getImageImportItem(itemId);
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
  if (item.status === "rejected") return NextResponse.json({ error: "Item was rejected" }, { status: 409 });

  const body = (await req.json().catch(() => ({}))) as { productId?: string };
  const productId = body.productId || item.candidateProductId;
  if (!productId) return NextResponse.json({ error: "No candidate product to attach" }, { status: 400 });

  const product = await approveImageItem(item, productId);

  const job = await getImageImportJob(item.jobId);
  if (job) {
    const items = await listImageImportItems(item.jobId);
    await updateImageImportJob({
      ...job,
      matchedImages: items.filter((i) => i.status === "matched").length,
      reviewImages: items.filter((i) => i.status === "review").length,
      unmatchedImages: items.filter((i) => i.status === "unmatched").length
    });
  }

  return NextResponse.json({ item: { ...item, status: "matched", candidateProductId: productId }, product });
}
