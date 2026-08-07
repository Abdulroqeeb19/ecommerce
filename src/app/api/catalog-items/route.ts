import { NextResponse } from "next/server";
import { listCatalogItems, upsertCatalogItem } from "@/lib/server/store";
import { currentUser, requireRole } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/rateLimit";
import { validateCatalogItemInput } from "@/lib/server/contentValidation";

export async function GET() {
  const items = await listCatalogItems();
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const user = await currentUser();
  const denied = requireRole(user, ["admin"]);
  if (denied) return denied;

  const rl = rateLimit(req, 60);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { value, error } = validateCatalogItemInput(body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const item = {
    ...value,
    id: value.id || `cat_${Date.now().toString(36)}`
  };
  try {
    return NextResponse.json(await upsertCatalogItem(item));
  } catch (e) {
    console.error("Failed to save catalog item:", e);
    return NextResponse.json({ error: "Catalog item could not be saved" }, { status: 500 });
  }
}