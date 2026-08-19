import { NextResponse } from "next/server";
import { currentUser, requireRole } from "@/lib/server/auth";
import { updateUser } from "@/lib/server/store";
import { generateToptSecret, otpauthUri } from "@/lib/server/totp";
import { rateLimit } from "@/lib/server/rateLimit";

export async function POST(req: Request) {
  const rl = await rateLimit(req, 20);
  if (!rl.ok) return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });

  const user = await currentUser();
  const denied = requireRole(user, ["admin", "manager"]);
  if (denied) return denied;

  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (user.mfaEnabled) {
    return NextResponse.json({ error: "Two-factor authentication is already enabled." }, { status: 400 });
  }

  const secret = generateToptSecret();
  await updateUser(user.id, { mfaSecret: secret });
  const uri = otpauthUri(secret, user.email, "AYINDEDUNNY ENTERPRISE");

  return NextResponse.json({
    ok: true,
    secret,
    uri,
    account: user.email,
    issuer: "AYINDEDUNNY ENTERPRISE"
  });
}