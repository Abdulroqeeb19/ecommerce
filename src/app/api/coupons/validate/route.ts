import { NextResponse } from "next/server";
import { validateCoupon } from "@/lib/server/store";
import { rateLimit } from "@/lib/server/rateLimit";

export async function POST(req: Request) {
  const rl = await rateLimit(req, 20);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const b = (body ?? {}) as Record<string, unknown>;
  const code = typeof b.code === "string" ? b.code.trim().toUpperCase().slice(0, 40) : "";
  if (!code) return NextResponse.json({ error: "Coupon code is required" }, { status: 400 });

  const subtotal = Number(b.subtotal);
  if (!Number.isFinite(subtotal) || subtotal < 0) {
    return NextResponse.json({ error: "Invalid subtotal" }, { status: 400 });
  }

  const result = await validateCoupon(code, subtotal);
  if (!result) {
    return NextResponse.json({ error: "Coupon is invalid, expired, or does not apply to this order" }, { status: 400 });
  }

  return NextResponse.json({
    code: result.coupon.code,
    discount: result.discount,
    description: result.coupon.description
  });
}
