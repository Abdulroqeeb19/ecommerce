import { NextResponse } from "next/server";
import { getProduct, upsertProductIfFresh, deleteProduct } from "@/lib/server/store";
import { currentUser, requireRole } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/rateLimit";
import { validateProductInput } from "@/lib/server/productValidation";
import type { Product } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(req: Request, { params }: Ctx) {
  const user = await currentUser();
  const denied = requireRole(user, ["admin", "manager"]);
  if (denied) return denied;

  const rl = rateLimit(req, 60);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });

  const { id } = await params;
  const existingProduct = await getProduct(id);
  if (!existingProduct) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  if (user?.role === "manager" && !existingProduct.miniStore) {
    return NextResponse.json({ error: "Managers can only manage mini-store products" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { value, error } = validateProductInput(body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  if (user?.role === "manager" && !(value as Product).miniStore) {
    return NextResponse.json({ error: "Managers can only manage mini-store products" }, { status: 403 });
  }

  const result = await upsertProductIfFresh({ ...(value as Product), id });
  if (!result.ok) {
    return NextResponse.json({ error: result.error, existing: result.existing }, { status: 409 });
  }
  return NextResponse.json(result.product);
}

export async function DELETE(req: Request, { params }: Ctx) {
  const user = await currentUser();
  const denied = requireRole(user, ["admin", "manager"]);
  if (denied) return denied;

  const rl = rateLimit(req, 60);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });

  const { id } = await params;
  const existingProduct = await getProduct(id);
  if (!existingProduct) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  if (user?.role === "manager" && !existingProduct.miniStore) {
    return NextResponse.json({ error: "Managers can only manage mini-store products" }, { status: 403 });
  }

  const ok = await deleteProduct(id);
  if (!ok) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
