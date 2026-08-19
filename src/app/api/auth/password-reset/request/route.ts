import { NextResponse } from "next/server";
import { findUserByEmail, createPasswordReset } from "@/lib/server/store";
import { notifyPasswordReset } from "@/lib/server/notify";
import { rateLimit } from "@/lib/server/rateLimit";

export async function POST(req: Request) {
  const rl = await rateLimit(req, 5);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });

  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = String(body?.email || "").toLowerCase().trim();
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }

  // Always 200: never reveal whether an account exists.
  const user = await findUserByEmail(email);
  let emailSent = false;

  if (user && user.passwordHash) {
    try {
      const token = await createPasswordReset(user.id);
      const origin = process.env.APP_URL || new URL(req.url).origin;
      const resetUrl = `${origin}/reset-password?token=${encodeURIComponent(token)}`;
      emailSent = await notifyPasswordReset(user.email, resetUrl);
    } catch {
      emailSent = false;
    }
  }

  return NextResponse.json({
    ok: true,
    emailSent,
    message: "If that email exists, a reset link has been sent. It expires in 20 minutes."
  });
}