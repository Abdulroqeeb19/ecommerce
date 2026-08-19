import { NextResponse } from "next/server";
import { updateStock } from "@/lib/server/store";
import { currentUser, requireRole } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/rateLimit";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const user = await currentUser();
  const denied = requireRole(user, ["admin", "manager"]);
  if (denied) return denied;

  const rl = await rateLimit(req, 60);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });

  const { id } = await params;
  let body: { stock?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const stock = Number(body?.stock);
  if (Number.isNaN(stock) || stock < 0 || !Number.isInteger(stock)) {
    return NextResponse.json({ error: "Invalid stock value" }, { status: 400 });
  }

  const product = await updateStock(id, stock);
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  return NextResponse.json(product);
}
