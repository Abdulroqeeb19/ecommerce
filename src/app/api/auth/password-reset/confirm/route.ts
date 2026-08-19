import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { consumePasswordReset, updateUser, revokeAllSessions } from "@/lib/server/store";
import { validatePassword } from "@/lib/server/passwordPolicy";
import { rateLimit } from "@/lib/server/rateLimit";

export async function POST(req: Request) {
  const rl = await rateLimit(req, 10);
  if (!rl.ok) return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });

  let body: { token?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const token = typeof body?.token === "string" ? body.token : "";
  if (!token) return NextResponse.json({ error: "The reset link is missing or invalid." }, { status: 400 });

  const pass = validatePassword(body?.password);
  if (!pass.ok) return NextResponse.json({ error: pass.error }, { status: 400 });

  const user = await consumePasswordReset(token);
  if (!user || !user.id) {
    return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
  }

  await updateUser(user.id, { passwordHash: bcrypt.hashSync(body.password as string, 12) });
  // Revoke every existing session (including any in-progress MFA) so an old
  // login cannot survive the password change.
  await revokeAllSessions(user.id);

  return NextResponse.json({ ok: true, message: "Password updated. You can now log in with your new password." });
}