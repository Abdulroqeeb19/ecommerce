import { NextResponse } from "next/server";
import { currentUser, requireRole } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/rateLimit";
import { getImageImportJob, listImageImportItems, deleteImageImportJob } from "@/lib/server/store";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Ctx) {
  const user = await currentUser();
  const denied = requireRole(user, ["admin"]);
  if (denied) return denied;
  const rl = rateLimit(req, 60);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });

  const { id } = await params;
  const job = await getImageImportJob(id);
  if (!job) return NextResponse.json({ error: "Import job not found" }, { status: 404 });
  const items = await listImageImportItems(id);
  return NextResponse.json({ job, items });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const user = await currentUser();
  const denied = requireRole(user, ["admin"]);
  if (denied) return denied;
  const rl = rateLimit(req, 30);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });

  const { id } = await params;
  const ok = await deleteImageImportJob(id);
  if (!ok) return NextResponse.json({ error: "Import job not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
