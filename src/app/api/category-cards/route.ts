import { NextResponse } from "next/server";
import { listCategoryCards, upsertCategoryCard } from "@/lib/server/store";
import { currentUser, requireRole } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/rateLimit";
import { validateCategoryCardInput } from "@/lib/server/contentValidation";

export async function GET() {
  const cards = await listCategoryCards();
  return NextResponse.json(cards);
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

  const { value, error } = validateCategoryCardInput(body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const card = {
    ...value,
    id: value.id || `card_${Date.now().toString(36)}`
  };
  try {
    return NextResponse.json(await upsertCategoryCard(card));
  } catch (e) {
    console.error("Failed to save category card:", e);
    return NextResponse.json({ error: "Category card could not be saved" }, { status: 500 });
  }
}