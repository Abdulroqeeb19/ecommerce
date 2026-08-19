import { NextResponse } from "next/server";
import { currentUser, requireRole } from "@/lib/server/auth";
import { updateUser } from "@/lib/server/store";
import { verifyTotp } from "@/lib/server/totp";
import { rateLimit } from "@/lib/server/rateLimit";

export async function POST(req: Request) {
  const rl = await rateLimit(req, 20);
  if (!rl.ok) return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });

  const user = await currentUser();
  const denied = requireRole(user, ["admin", "manager"]);
  if (denied) return denied;

  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (user.mfaEnabled) return NextResponse.json({ error: "Two-factor authentication is already enabled." }, { status: 400 });

  let body: { code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const code = body?.code;
  if (typeof code !== "string" || !/^\d{6}$/.test(code.trim())) {
    return NextResponse.json({ error: "Enter the 6-digit code from your authenticator app" }, { status: 400 });
  }
  if (!user.mfaSecret || !verifyTotp(user.mfaSecret, code)) {
    return NextResponse.json({ error: "Incorrect code. The code changes every 30 seconds — check the one currently shown." }, { status: 400 });
  }

  await updateUser(user.id, { mfaEnabled: true });
  return NextResponse.json({ ok: true, mfaEnabled: true });
}