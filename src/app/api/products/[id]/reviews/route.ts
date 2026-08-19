import { NextResponse } from "next/server";
import { getProduct, listReviews, addReview, hasReviewed } from "@/lib/server/store";
import { currentUser } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/rateLimit";
import { validateReviewInput } from "@/lib/server/reviewValidation";
import { uid } from "@/lib/utils";
import type { Review } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!(await getProduct(id))) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  return NextResponse.json(await listReviews(id));
}

export async function POST(req: Request, { params }: Ctx) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const rl = await rateLimit(req, 10);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });

  const { id } = await params;
  if (!(await getProduct(id))) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  if (await hasReviewed(id, user.id)) {
    return NextResponse.json({ error: "You have already reviewed this product" }, { status: 409 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { value, error } = validateReviewInput(body);
  if (error || !value) return NextResponse.json({ error: error || "Invalid review" }, { status: 400 });

  const review: Review = {
    id: uid("rev"),
    productId: id,
    userId: user.id,
    author: user.name,
    rating: value.rating,
    title: value.title,
    comment: value.comment,
    verified: true,
    createdAt: new Date().toISOString()
  };

  const saved = await addReview(review);
  return NextResponse.json(saved, { status: 201 });
}
