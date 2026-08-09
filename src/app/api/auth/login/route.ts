import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findUserByEmail, createSession } from "@/lib/server/store";
import { publicUser, setSessionCookie } from "@/lib/server/auth";
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

  const user = await findUserByEmail(String(email).toLowerCase());
  if (!user || !user.passwordHash || !bcrypt.compareSync(password, user.passwordHash)) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const token = await createSession(user.id);
  await setSessionCookie(token);

  return NextResponse.json({ user: publicUser(user) });
}
