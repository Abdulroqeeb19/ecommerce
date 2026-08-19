import { NextResponse } from "next/server";
import { currentUser, requireRole } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/rateLimit";
import { listImageImportJobs, createImageImportJob } from "@/lib/server/store";
import { uid } from "@/lib/utils";
import { DEFAULT_AUTO_MATCH_THRESHOLD, DEFAULT_REVIEW_THRESHOLD } from "@/lib/server/imageImport";
import type { ImageImportJob } from "@/lib/types";

export async function GET(req: Request) {
  const user = await currentUser();
  const denied = requireRole(user, ["admin"]);
  if (denied) return denied;
  const rl = await rateLimit(req, 60);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  const jobs = await listImageImportJobs();
  return NextResponse.json(jobs);
}

export async function POST(req: Request) {
  const user = await currentUser();
  const denied = requireRole(user, ["admin"]);
  if (denied) return denied;
  const rl = await rateLimit(req, 30);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });

  const now = new Date().toISOString();
  const job: ImageImportJob = {
    id: uid("impjob"),
    adminId: user!.id,
    totalImages: 0,
    processedImages: 0,
    matchedImages: 0,
    reviewImages: 0,
    unmatchedImages: 0,
    failedImages: 0,
    status: "pending",
    autoMatchThreshold: DEFAULT_AUTO_MATCH_THRESHOLD,
    reviewThreshold: DEFAULT_REVIEW_THRESHOLD,
    createdAt: now
  };
  const saved = await createImageImportJob(job);
  return NextResponse.json(saved);
}
