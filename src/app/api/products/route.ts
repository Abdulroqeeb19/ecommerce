import { NextResponse } from "next/server";
import { listProducts, upsertProduct } from "@/lib/server/store";
import { currentUser, requireRole } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/rateLimit";
import { validateProductInput } from "@/lib/server/productValidation";
import type { Product } from "@/lib/types";

export async function GET() {
  return NextResponse.json(listProducts());
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

  const { value, error } = validateProductInput(body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  try {
    const product = upsertProduct(value as Product);
    return NextResponse.json(product, { status: 200 });
  } catch (e) {
    console.error("Failed to save product:", e);
    return NextResponse.json({ error: "Product could not be saved" }, { status: 500 });
  }
}
