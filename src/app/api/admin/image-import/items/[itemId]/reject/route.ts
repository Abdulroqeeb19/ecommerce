import { NextResponse } from "next/server";
import { currentUser, requireRole } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/rateLimit";
import { getImageImportItem, getImageImportJob, listImageImportItems, updateImageImportJob } from "@/lib/server/store";
import { rejectImageItem } from "@/lib/server/imageImport";

type Ctx = { params: Promise<{ itemId: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const user = await currentUser();
  const denied = requireRole(user, ["admin"]);
  if (denied) return denied;
  const rl = rateLimit(req, 60);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });

  const { itemId } = await params;
  const item = await getImageImportItem(itemId);
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  await rejectImageItem(item);

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

  return NextResponse.json({ item: { ...item, status: "rejected" } });
}
