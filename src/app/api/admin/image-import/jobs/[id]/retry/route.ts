import { NextResponse } from "next/server";
import { currentUser, requireRole } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/rateLimit";
import { getImageImportJob } from "@/lib/server/store";
import { retryJobItems } from "@/lib/server/imageImport";

type Ctx = { params: Promise<{ id: string }> };

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request, { params }: Ctx) {
  const user = await currentUser();
  const denied = requireRole(user, ["admin"]);
  if (denied) return denied;
  const rl = await rateLimit(req, 20);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });

  const { id } = await params;
  const job = await getImageImportJob(id);
  if (!job) return NextResponse.json({ error: "Import job not found" }, { status: 404 });

  const reprocessed = await retryJobItems(id);
  return NextResponse.json({ reprocessed });
}
