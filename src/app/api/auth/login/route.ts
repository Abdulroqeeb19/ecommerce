import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findUserByEmail, createSession, SESSION_TTL_MS } from "@/lib/server/store";
import { cookies } from "next/headers";
import { authCookieName } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/rateLimit";

export async function POST(req: Request) {
  const rl = rateLimit(req, 10);
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

  const user = findUserByEmail(String(email).toLowerCase());
  if (!user || !user.passwordHash || !bcrypt.compareSync(password, user.passwordHash)) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const token = createSession(user.id);
  (await cookies()).set(authCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000)
  });

  const { passwordHash, ...safe } = user;
  return NextResponse.json({ user: safe });
}
