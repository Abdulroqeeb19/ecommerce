import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findUserByEmail, createSession } from "@/lib/server/store";
import { publicUser, setSessionCookie } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/rateLimit";
import { getLoginLock, registerLoginFailure, clearLoginFailures } from "@/lib/server/loginGuard";

export async function POST(req: Request) {
  const rl = await rateLimit(req, 10);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter ?? 60) } }
    );
  }

  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { email, password } = body ?? {};
  if (!email || !password) return NextResponse.json({ error: "Email and password are required" }, { status: 400 });

  const normalizedEmail = String(email).toLowerCase();

  // Account lockout: after 5 consecutive failures the account is locked for 15 minutes.
  const lock = await getLoginLock(normalizedEmail);
  if (lock.locked) {
    return NextResponse.json(
      { error: "Too many failed attempts. Account is temporarily locked. Try again later." },
      { status: 429, headers: { "Retry-After": String(lock.retryAfter ?? 900) } }
    );
  }

  const user = await findUserByEmail(normalizedEmail);
  if (!user || !user.passwordHash || !bcrypt.compareSync(password, user.passwordHash)) {
    await registerLoginFailure(normalizedEmail);
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  await clearLoginFailures(normalizedEmail);

  const token = await createSession(user.id);
  await setSessionCookie(token);

  return NextResponse.json({ user: publicUser(user) });
}