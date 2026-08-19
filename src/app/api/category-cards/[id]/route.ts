import { NextResponse } from "next/server";
import { upsertCategoryCard, deleteCategoryCard } from "@/lib/server/store";
import { currentUser, requireRole } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/rateLimit";
import { validateCategoryCardInput } from "@/lib/server/contentValidation";

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

  const { value, error } = validateCategoryCardInput(body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  try {
    return NextResponse.json(await upsertCategoryCard({ ...value, id }));
  } catch (e) {
    console.error("Failed to update category card:", e);
    return NextResponse.json({ error: "Category card could not be updated" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  const user = await currentUser();
  const denied = requireRole(user, ["admin"]);
  if (denied) return denied;

  const rl = await rateLimit(req, 60);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });

  const { id } = await params;
  const ok = await deleteCategoryCard(id);
  if (!ok) return NextResponse.json({ error: "Category card not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}