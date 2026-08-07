import { NextResponse } from "next/server";
import { getWishlistForUser, setWishlistForUser } from "@/lib/server/store";
import { currentUser } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/rateLimit";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  return NextResponse.json({ ids: await getWishlistForUser(user.id) });
}

export async function PUT(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const rl = rateLimit(req, 60);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const b = (body ?? {}) as Record<string, unknown>;
  const ids = Array.isArray(b.ids)
    ? (b.ids as unknown[]).filter((x): x is string => typeof x === "string").map((x) => x.slice(0, 64))
    : [];
  if (ids.length > 500) return NextResponse.json({ error: "Wishlist is too large" }, { status: 400 });

  await setWishlistForUser(user.id, ids);
  return NextResponse.json({ ids: await getWishlistForUser(user.id) });
}
