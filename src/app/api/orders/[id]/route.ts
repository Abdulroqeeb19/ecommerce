import { NextResponse } from "next/server";
import { updateOrderStatus } from "@/lib/server/store";
import { currentUser, requireRole } from "@/lib/server/auth";
import { isValidOrderStatus } from "@/lib/server/orderValidation";
import { rateLimit } from "@/lib/server/rateLimit";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const user = await currentUser();
  const denied = requireRole(user, ["admin", "manager"]);
  if (denied) return denied;

  const rl = await rateLimit(req, 60);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });

  const { id } = await params;

  let body: { status?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body?.status) return NextResponse.json({ error: "status is required" }, { status: 400 });
  if (!isValidOrderStatus(body.status)) {
    return NextResponse.json({ error: "Invalid order status" }, { status: 400 });
  }

  const updated = await updateOrderStatus(id, body.status);
  if (!updated) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json(updated);
}
