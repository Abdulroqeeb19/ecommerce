import { NextResponse } from "next/server";
import { upsertCatalogItem, deleteCatalogItem } from "@/lib/server/store";
import { currentUser, requireRole } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/rateLimit";
import { validateCatalogItemInput } from "@/lib/server/contentValidation";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const user = await currentUser();
  const denied = requireRole(user, ["admin"]);
  if (denied) return denied;

  const rl = await rateLimit(req, 60);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });

  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { value, error } = validateCatalogItemInput(body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  try {
    return NextResponse.json(await upsertCatalogItem({ ...value, id }));
  } catch (e) {
    console.error("Failed to update catalog item:", e);
    return NextResponse.json({ error: "Catalog item could not be updated" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  const user = await currentUser();
  const denied = requireRole(user, ["admin"]);
  if (denied) return denied;

  const rl = await rateLimit(req, 60);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });

  const { id } = await params;
  const ok = await deleteCatalogItem(id);
  if (!ok) return NextResponse.json({ error: "Catalog item not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}