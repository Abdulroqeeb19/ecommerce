import { NextResponse } from "next/server";
import { currentUser, requireRole } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/rateLimit";
import * as sb from "@/lib/server/supabase";

/**
 * Serves stored image bytes to the admin panel without exposing bucket paths.
 * Admin-only; reads bytes from Supabase Storage and streams them back.
 */
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: Request) {
  const user = await currentUser();
  const denied = requireRole(user, ["admin"]);
  if (denied) return denied;
  const rl = rateLimit(req, 300);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });

  const url = new URL(req.url);
  const path = url.searchParams.get("path");
  if (!path) return NextResponse.json({ error: "Missing path" }, { status: 400 });
  // Prevent path traversal / arbitrary reads.
  if (!/^[a-zA-Z0-9/_-]+\.(jpe?g|png|webp)$/.test(path) || path.includes("..")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  try {
    const bytes = await sb.sbDownloadFile(path);
    const ext = path.split(".").pop()?.toLowerCase();
    const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
    return new NextResponse(Buffer.from(bytes), { headers: { "Content-Type": mime, "Cache-Control": "public, max-age=3600" } });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "Not found" }, { status: 404 });
  }
}
