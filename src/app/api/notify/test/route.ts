import { NextResponse } from "next/server";
import { sendTestNotification } from "@/lib/server/notify";
import { currentUser, requireRole } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/rateLimit";

export async function POST(req: Request) {
  const user = await currentUser();
  const denied = requireRole(user, ["admin"]);
  if (denied) return denied;

  const rl = await rateLimit(req, 5);
  if (!rl.ok) return NextResponse.json({ error: "Too many test notifications. Try again later." }, { status: 429 });

  const body = await req.json().catch(() => ({}));
  const result = await sendTestNotification(body.channel);
  return NextResponse.json(result);
}
