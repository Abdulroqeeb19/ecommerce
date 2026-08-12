import { NextResponse } from "next/server";
import { currentUser, requireRole } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/rateLimit";
import { getImageImportJob } from "@/lib/server/store";
import { stageUploadedImage } from "@/lib/server/imageImport";

type Ctx = { params: Promise<{ id: string }> };

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request, { params }: Ctx) {
  const user = await currentUser();
  const denied = requireRole(user, ["admin"]);
  if (denied) return denied;
  const rl = rateLimit(req, 120);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });

  const { id } = await params;
  const job = await getImageImportJob(id);
  if (!job) return NextResponse.json({ error: "Import job not found" }, { status: 404 });
  if (job.status === "processing" || job.status === "completed") {
    return NextResponse.json({ error: `Cannot upload to a ${job.status} job` }, { status: 409 });
  }

  const form = await req.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (!files.length) return NextResponse.json({ error: "No files provided" }, { status: 400 });
  if (files.length > 100) return NextResponse.json({ error: "Max 100 files per request" }, { status: 400 });

  const results: { filename: string; ok: boolean; itemId?: string; error?: string }[] = [];
  for (const file of files) {
    try {
      const buffer = new Uint8Array(await file.arrayBuffer());
      const item = await stageUploadedImage(job, buffer, file.name, file.type);
      results.push({ filename: file.name, ok: true, itemId: item.id });
    } catch (e) {
      results.push({ filename: file.name, ok: false, error: (e as Error).message });
    }
  }

  const failed = results.filter((r) => !r.ok).length;
  return NextResponse.json({ results, failed, uploaded: results.length - failed });
}
